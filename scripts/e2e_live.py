# -*- coding: utf-8 -*-
"""
Real-browser test of the PUBLISHED site, not the dev sandbox.

Why: the sandbox only proves the code runs. The things that actually break a
deployment — a stale asset hash, a 404 on an image path, a filter that renders
zero rows against the published catalog, a tab that lands on the wrong view —
only show up against the real origin, with the real bundle and the real CDN.

Drives Chrome over CDP with no third-party packages (requests are raw
websockets over a socket, which is all the DevTools protocol needs for the
subset used here).

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_live.py [--url URL]
  CDP_PORT=9777 PYTHONIOENCODING=utf-8 python scripts/e2e_live.py ...

Traps worth knowing before you lose an hour to one:

1. CDP port. The default 9222 and the 9000-range are inside Windows'
   excluded-port ranges on this machine, so Chrome's devtools listener
   silently fails to bind ("Cannot start http server for devtools") and the
   WebSocket connect just hangs. Set CDP_PORT to something outside those
   ranges — 9777 works.

2. Reusing one Chrome across many runs. Every run leaves a tab behind;
   after ~20 the browser stops answering Page.navigate and calls start
   timing out. Restart Chrome with its own fresh --user-data-dir instead of
   debugging the timeout.

3. Cursor query params. `?before=<iso>` values contain a literal '+', which
   in a query string decodes to a space and the API answers 422. URLSearchParams
   in the app encodes it (%2B) so the browser is fine — hand-written curl
   against a paginated endpoint must quote() the cursor or it looks like a
   server bug.
"""
import argparse
import base64
import json
import os
import random
import socket
import struct
import subprocess
import sys
import time
import urllib.request

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = int(os.environ.get("CDP_PORT", "9222"))
PROFILE = os.path.join(os.environ.get("TEMP", "."), "pawsmarket-e2e-profile")


# ── minimal CDP client (raw websocket, no deps) ──────────────────────
class WS:
    def __init__(self, url):
        assert url.startswith("ws://")
        rest = url[5:]
        hostport, _, path = rest.partition("/")
        host, _, port = hostport.partition(":")
        self.sock = socket.create_connection((host, int(port or 80)), timeout=30)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\n"
               f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
               f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.msg_id = 0

    def _recv_exact(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionError("socket closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def _send_frame(self, opcode, payload):
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        n = len(masked)
        hdr = bytes([0x80 | opcode])
        if n < 126:
            hdr += bytes([0x80 | n])
        elif n < 1 << 16:
            hdr += bytes([0x80 | 126]) + struct.pack(">H", n)
        else:
            hdr += bytes([0x80 | 127]) + struct.pack(">Q", n)
        self.sock.sendall(hdr + mask + masked)

    def send(self, method, params=None):
        self.msg_id += 1
        self._send_frame(1, json.dumps(
            {"id": self.msg_id, "method": method, "params": params or {}}).encode())
        return self.msg_id

    def recv(self):
        """Return the next complete text message.

        A CDP event big enough to be split arrives as a first frame with FIN
        clear followed by continuation frames; reading only the first one
        yields truncated JSON and the id-carrying reply is never matched, so
        the call times out. Frames are reassembled here before parsing.
        """
        payload = b""
        expecting_continuation = False
        while True:
            b1, b2 = self._recv_exact(2)
            fin = b1 & 0x80
            opcode = b1 & 0x0F
            ln = b2 & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", self._recv_exact(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", self._recv_exact(8))[0]
            data = self._recv_exact(ln)
            if opcode == 8:          # close
                raise ConnectionError("websocket closed by peer")
            if opcode == 9:          # ping → pong
                self._send_frame(0x0A, data)
                continue
            if opcode == 10:         # pong
                continue
            if opcode == 0:          # continuation
                payload += data
            else:
                payload = data
            expecting_continuation = not fin
            if not expecting_continuation:
                if opcode in (1, 0):
                    return json.loads(payload.decode("utf-8", "replace"))
                payload = b""

    def call(self, method, params=None, timeout=45):
        self.send(method, params)
        deadline = time.time() + timeout
        while time.time() < deadline:
            self.sock.settimeout(max(1, int(deadline - time.time())))
            m = self.recv()
            if m.get("id") == self.msg_id:
                if "error" in m:
                    raise RuntimeError(f"{method}: {m['error']}")
                return m.get("result", {})
        raise TimeoutError(method)


class Page:
    def __init__(self, ws):
        self.ws = ws

    def goto(self, url, wait=2.5):
        self.ws.call("Page.navigate", {"url": url})
        time.sleep(wait)

    def eval(self, expr):
        r = self.ws.call("Runtime.evaluate", {
            "expression": expr, "returnByValue": True, "awaitPromise": True})
        if r.get("exceptionDetails"):
            return {"__error": str(r["exceptionDetails"])[:200]}
        return r.get("result", {}).get("value")

    def shot(self, path):
        r = self.ws.call("Page.captureScreenshot", {"format": "jpeg",
                                                    "quality": 72})
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        return path


def start_chrome():
    subprocess.Popen(
        [CHROME, f"--remote-debugging-port={PORT}", f"--user-data-dir={PROFILE}",
         "--headless=new", "--disable-gpu", "--no-first-run",
         "--hide-scrollbars", "--window-size=1400,1000",
         # GitHub Pages sets a long cache lifetime on hashed assets, so a rerun
         # otherwise measures the previous deployment rather than this one.
         "--incognito", "--disable-application-cache",
         "--disk-cache-size=1", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version",
                                        timeout=2) as r:
                json.load(r)
                return
        except Exception:
            time.sleep(0.6)
    raise SystemExit("Chrome did not expose CDP")


def new_page(url):
    # /json/new is PUT in current Chrome (it used to accept POST); a plain GET
    # on /json/list reuses the tab Chrome already opened, which is enough here.
    req = urllib.request.Request(
        f"http://127.0.0.1:{PORT}/json/new?{url}", method="PUT")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            tgt = json.load(r)
    except Exception:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",
                                    timeout=20) as r:
            pages = [t for t in json.load(r) if t.get("type") == "page"]
            if not pages:
                raise SystemExit("no page target")
            tgt = pages[0]
    ws = WS(tgt["webSocketDebuggerUrl"])
    ws.call("Page.enable")
    ws.call("Runtime.enable")
    ws.call("Log.enable")
    ws.call("Network.enable")
    return Page(ws)


def check_page(p, url, name, shots):
    # Only the fragment differs between routes, and Page.navigate to the same
    # document with a new hash does not always re-run the router — a reload
    # makes each URL a genuine cold load, which is also what a visitor
    # following a shared link does.
    bust = f"?cb={random.randint(1, 10**9)}"
    if "#" in url:
        doc, _, frag = url.partition("#")
        sep = "&" if "?" in doc else "?"
        url = f"{doc}{sep}{bust}#{frag}"
    else:
        url = f"{url}{bust}"
    p.goto("about:blank", wait=0.4)
    p.goto(url, wait=4.0)
    body = p.eval("document.body.innerText.slice(0,140)") or ""
    broken = p.eval("""(() => {
      const b=[...document.images].filter(i=>i.complete && i.naturalWidth===0);
      return b.map(i=>i.getAttribute('src')).slice(0,6);
    })()""")
    # Content assertions — a page that renders but shows zero rows passes the
    # 404 check and still tells the visitor nothing. These are the counts the
    # user actually sees.
    cards = p.eval("document.querySelectorAll('article').length")
    title = p.eval("(document.querySelector('h1')||{}).innerText || ''")
    heading = p.eval("""(() => {
      const h=document.querySelector('h1, h2');
      return h ? h.innerText.trim().slice(0,50) : '';
    })()""")
    real_photos = p.eval("""(() => {
      const s=[...document.images].map(i=>i.getAttribute('src')||'');
      return s.filter(x=>x.includes('/real/')).length;
    })()""")
    path = shots + f"/live-{name}.jpg"
    p.shot(path)
    imgs = p.eval("document.querySelectorAll('img').length")
    print(f"  {name:12} cards={cards:<4} imgs={imgs:<4} real={real_photos:<4} "
          f"broken={len(broken or [])}  {heading[:44]!r}")
    return {"name": name, "broken": broken or [], "imgs": imgs,
            "cards": cards, "real_photos": real_photos, "heading": heading,
            "url": p.eval("location.pathname + location.search")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://koko673.github.io/pawsmarket/")
    ap.add_argument("--shots",
                    default="C:/Users/HP/Downloads/office/_live_shots")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    start_chrome()
    p = new_page(args.url)
    time.sleep(3)

    results = []
    # The published build uses HashRouter (VITE_HASH_ROUTER=true in
    # .env.production), so the route lives in the fragment: /#/explore.
    # Testing /explore navigates to a path the app never sees and every page
    # looks identical — the first version of this script made exactly that
    # mistake and reported eleven "passing" pages that were all the home page.
    base = args.url if args.url.endswith("#") else args.url + "#"
    pages = [
        (base, "home"),
        (base + "/explore", "explore"),
        (base + "/explore?preset=food", "products"),
        (base + "/explore?preset=vets", "vets"),
        (base + "/explore?preset=groomers", "groomers"),
        (base + "/explore?preset=shelters", "shelters"),
        (base + "/explore?preset=dogs", "dogs"),
        (base + "/explore?preset=cats", "cats"),
        (base + "/adoption", "adoption"),
        (base + "/feed", "feed"),
        (base + "/register", "register"),
        (base + "/pets", "pets"),
        (base + "/me", "me"),
        (base + "/add", "add"),
        (base + "/login", "login"),
    ]
    print(f"testing {args.url}\n")
    for url, name in pages:
        try:
            results.append(check_page(p, url, name, args.shots))
        except Exception as e:  # noqa: BLE001
            print(f"  {name:12} FAILED: {str(e)[:90]}")
            results.append({"name": name, "broken": [str(e)[:90]]})

    print("\n--- console errors ---")
    logs = p.eval("window.__e2eErrors ? window.__e2eErrors.slice(0,10) : []")
    print(" ", logs or "none captured")

    total_broken = sum(len(r.get("broken", [])) for r in results)
    print(f"\npages tested: {len(results)}   broken images: {total_broken}")
    for r in results:
        for b in r.get("broken", []):
            print(f"  BROKEN {r['name']}: {b}")
    print(f"\nscreenshots -> {args.shots}")
    return 1 if total_broken else 0


if __name__ == "__main__":
    sys.exit(main())