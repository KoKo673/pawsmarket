/**
 * Cloudflare Worker — drives the catalogue refresh from outside the VPS.
 *
 * Why this exists
 * ---------------
 * The systemd timer on the VPS is the primary scheduler and needs no
 * help. This is the second path, for two situations the timer cannot
 * cover:
 *
 *   · The VPS is rebuilt or the timer is disabled by mistake, and prices
 *     would quietly age until someone notices.
 *   · A source has to be reached from a different network — the Torob
 *     block is per-IP, and a Worker has its own egress.
 *
 * It does not do the work itself. It calls one authenticated endpoint on
 * the shop's own API and reports what happened. Everything that touches
 * the database stays behind that endpoint.
 *
 * Cron: "17 *\/12 * * *" — twice a day at :17, offset from the hour on
 * purpose; see the volume argument in the systemd timer, same reasoning.
 *
 * Secrets (wrangler secret put, never in this file):
 *   API_BASE   e.g. https://pawsmarket.ir
 *   ADMIN_KEY  the same value as ADMIN_CATALOG_KEY on the server
 */

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSync(env, 'cron'));
  },

  // A manual trigger, so this can be tested without waiting for the cron.
  // Same shared secret: no public path to a job that hits rate limits.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/run') {
      return new Response('not found', { status: 404 });
    }
    if (request.headers.get('x-admin-key') !== env.ADMIN_KEY) {
      return new Response('forbidden', { status: 403 });
    }
    const result = await runSync(env, 'manual');
    return Response.json(result);
  },
};

async function runSync(env, via) {
  if (!env.API_BASE || !env.ADMIN_KEY) {
    // Loud rather than silent: a misconfigured worker that returns
    // "success" with nothing synced is worse than one that fails.
    console.error('worker misconfigured: API_BASE or ADMIN_KEY missing');
    return { ok: false, error: 'not configured' };
  }

  const endpoint = `${env.API_BASE.replace(/\/$/, '')}/api/admin/sync?limit=5`;
  const started = Date.now();

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-admin-key': env.ADMIN_KEY,
        'user-agent': 'pawsmarket-sync-worker/1',
      },
    });

    const body = await res.json().catch(() => null);
    const ms = Date.now() - started;

    if (!res.ok) {
      // 404 means the server has no ADMIN_CATALOG_KEY set - worth saying
      // out loud, because it looks like a routing bug otherwise.
      console.error(`sync failed: ${res.status}`, body);
      return { ok: false, via, status: res.status, body, ms };
    }

    if (!body?.ok) {
      // The API answered, but every source failed. Not an HTTP error, so
      // it has to be judged on the payload.
      console.error('sync ran but wrote no offers', body);
    } else {
      console.log(`sync ok: ${body.offers_written} offers, ` +
                  `${body.products_created} new, ${ms}ms`);
    }
    return { ok: !!body?.ok, via, ms, ...body };
  } catch (err) {
    console.error('sync unreachable', err);
    return { ok: false, via, error: String(err) };
  }
}
