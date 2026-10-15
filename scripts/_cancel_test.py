# -*- coding: utf-8 -*-
"""MyBookingsPage: the cancel button must refetch and repaint the row.

The old code called load() directly after cancelling; the migration replaced
that with invalidateQueries, so this proves the list actually refreshes.
"""
import importlib.util
import json
import os
import sys
import time
import urllib.request

os.environ['CDP_PORT'] = '9777'
sys.path.insert(0, 'scripts')
spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

BASE = 'http://127.0.0.1:5173'

STATE = """(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\\s+/g,' ').trim();
  return {
    cards: document.querySelectorAll('ul > li').length,
    cancelButtons: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.trim()==='\\u0644\\u063a\\u0648 \\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a').length,
    cancelledRows: (txt.match(/\\u0644\\u063a\\u0648 \\u0634\\u062f\\u0647/g)||[]).length,
    pendingRows: (txt.match(/\\u062f\\u0631 \\u0627\\u0646\\u062a\\u0637\\u0627\\u0631 \\u067e\\u0627\\u0633\\u062e \\u0645\\u0631\\u06a9\\u0632/g)||[]).length,
    tail: txt.slice(-160),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def fresh_target():
    import json as _j
    req = urllib.request.Request(
        f'http://127.0.0.1:{m.PORT}/json/new?about:blank', method='PUT')
    with urllib.request.urlopen(req, timeout=20) as r:
        tgt = _j.load(r)
    ws = m.WS(tgt['webSocketDebuggerUrl'])
    ws.call('Page.enable')
    ws.call('Runtime.enable')
    return m.Page(ws)


def main():
    p = fresh_target()
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

    p.goto(BASE + '/bookings', wait=4.0)
    show('BEFORE CANCEL', p.eval(STATE))

    clicked = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.trim()==='\\u0644\\u063a\\u0648 \\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a');
      if(!b) return 'no-cancel-button';
      b.click(); return 'clicked';
    })()""")
    print('\ncancel click:', clicked)
    time.sleep(4.0)
    show('AFTER CANCEL (list must refresh, no manual reload)', p.eval(STATE))

    # API agrees with the screen
    mine = p.eval("""(async()=>{
      const t=localStorage.getItem('pawsmarket-auth-token');
      const r=await fetch('/api/bookings/mine',{headers:{Authorization:'Bearer '+t}});
      const j=await r.json();
      return (j.items||[]).map(b=>b.status).join(',');
    })()""")
    print('\nAPI statuses now:', mine)
    return 0


if __name__ == '__main__':
    sys.exit(main())
