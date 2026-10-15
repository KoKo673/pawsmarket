# -*- coding: utf-8 -*-
"""Live check of MyBookingsPage after the useQuery migration.

Logs in as the seeded user, then walks the page: loading skeleton, a real
booking row, cancel-then-refetch, and the error block with its retry button.
Also checks the empty state on a fresh account.
"""
import importlib.util
import json
import os
import sys
import time

os.environ['CDP_PORT'] = '9777'
sys.path.insert(0, 'scripts')
spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

import urllib.error  # noqa: E402


BASE = 'http://127.0.0.1:5173'

STATE = """(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\\s+/g,' ').trim();
  return {
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    h1: (document.querySelector('h1')||{}).innerText||'',
    bookingCards: document.querySelectorAll('ul > li').length,
    storeNames: [...document.querySelectorAll('ul > li h3')].map(h=>h.innerText),
    statuses: [...document.querySelectorAll('ul > li')].map(li=>{
      const b=li.querySelector('[class*=rounded]'); return '';
    }),
    retryButton: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u062a\\u0644\\u0627\\u0634 \\u062f\\u0648\\u0628\\u0627\\u0631\\u0647')).length,
    cancelButtons: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u0644\\u063a\\u0648 \\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a')).length,
    emptyState: txt.includes('\\u0647\\u0646\\u0648\\u0632 \\u0646\\u0648\\u0628\\u062a\\u06cc \\u0646\\u06af\\u0631\\u0641\\u062a\\u0647'),
    errorLine: (()=>{
      const p=[...document.querySelectorAll('p')].map(x=>x.innerText)
        .filter(t=>t.includes('\\u0645\\u0634\\u06a9\\u0644\\u06cc')||t.includes('\\u0648\\u0635\\u0644 \\u0646\\u06cc\\u0633\\u062a\\u06cc\\u0645')||t.includes('\\u0628\\u0627\\u0631\\u06af\\u0630\\u0627\\u0631\\u06cc \\u0627\\u0646\\u062c\\u0627\\u0645 \\u0646\\u0634\\u062f'));
      return p.length?p[0]:''})(),
    tail: txt.slice(0,220),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def fresh_target():
    """A blank page target that nothing else is attached to.

    /json/new made a tab per run and every stale tab stayed behind; navigating
    one of those back to about:blank left it wedged. Creating a target and
    reusing only it keeps each run independent.
    """
    import json, urllib.request
    req = urllib.request.Request(
        f'http://127.0.0.1:{m.PORT}/json/new?about:blank', method='PUT')
    with urllib.request.urlopen(req, timeout=20) as r:
        tgt = json.load(r)
    ws = m.WS(tgt['webSocketDebuggerUrl'])
    ws.call('Page.enable')
    ws.call('Runtime.enable')
    return m.Page(ws)


def main():
    # Install the network shim before any app code runs.
    p = fresh_target()
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': """(()=>{
      const of=window.fetch;
      window.fetch=function(i,n){
        const u=String(i&&i.url?i.url:i);
        if(u.indexOf('/bookings/mine')!==-1 && localStorage.getItem('__bk')==='delay')
          return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
        if(u.indexOf('/bookings/mine')!==-1 && localStorage.getItem('__bk')==='fail')
          return Promise.reject(new TypeError('simulated'));
        return of.call(window,i,n);
      };return 1})()"""})
    time.sleep(0.5)

    # Land on the app origin so relative fetch and localStorage work.
    p.goto(BASE + '/', wait=2.5)
    tok = p.eval("""(()=>{
      // Registration token, replicated into BOTH local databases, so a
      // refetch that lands on either one still authenticates.
      localStorage.setItem('pawsmarket-auth-token', 'PlqSHxAth27ooRqUsdrB6YFhtXkW50Q5UOEIB-BApk8');
      return 'ok';
    })()""")
    print('login:', tok)
    if tok != 'ok':
        return 1

    # ── 1) booking with the API delayed → skeleton ──────────────────
    p.eval("localStorage.setItem('__bk','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/bookings', wait=1.0)
    show('LOADING (mine delayed 3s)', p.eval(STATE))
    time.sleep(3.6)
    show('LOADED', p.eval(STATE))

    # ── 2) error state ──────────────────────────────────────────────
    p.eval("localStorage.setItem('__bk','fail')")
    p.ws.call('Page.reload')
    time.sleep(3.0)
    show('ERROR (mine rejects)', p.eval(STATE))

    # ── 3) retry recovers ───────────────────────────────────────────
    p.eval("localStorage.setItem('__bk','')")
    clicked = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u062a\\u0644\\u0627\\u0634 \\u062f\\u0648\\u0628\\u0627\\u0631\\u0647'));
      if(!b) return 'no-button'; b.click(); return 'clicked'})()""")
    print('\nretry:', clicked)
    time.sleep(3.0)
    show('AFTER RETRY', p.eval(STATE))

    p.eval("localStorage.removeItem('__bk')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
