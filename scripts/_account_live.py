# -*- coding: utf-8 -*-
"""MyAccountPage: pet cards, loading, empty, and create-then-refresh."""
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


def login_token() -> str:
    req = urllib.request.Request(
        'http://127.0.0.1:9650/api/auth/login', method='POST',
        data=json.dumps({'username': 'bk_12821',
                         'password': 'testpass123'}).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)['token']


STATE = r"""(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\s+/g,' ').trim();
  const cards=[...document.querySelectorAll('article')];
  const nameHeaders=[...document.querySelectorAll('h3, h2')]
    .map(h=>h.innerText.trim()).filter(Boolean);
  const addBtn=[...document.querySelectorAll('button')]
    .find(b=>b.innerText.indexOf('افزودن حیوان')!==-1);
  return {
    h1: (document.querySelector('h1')||{}).innerText||'',
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    petCards: cards.length,
    headings: nameHeaders.slice(0,8),
    addButton: addBtn ? 'present' : 'absent',
    emptyMsg: txt.indexOf('هنوز حیوانی ثبت نکرده‌اید')!==-1,
    tail: txt.slice(0,150),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    if not isinstance(s, dict):
        print('  raw:', s)
        return
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def fresh_target():
    req = urllib.request.Request(
        f'http://127.0.0.1:{m.PORT}/json/new?about:blank', method='PUT')
    with urllib.request.urlopen(req, timeout=20) as r:
        tgt = json.load(r)
    ws = m.WS(tgt['webSocketDebuggerUrl'])
    ws.call('Page.enable')
    ws.call('Runtime.enable')
    return m.Page(ws)


SHIM = r"""(()=>{
  const of=window.fetch;
  window.__hits=[];
  window.fetch=function(i,n){
    const u=String(i&&i.url?i.url:i);
    if(u.indexOf('/api/discover/pets')!==-1||/\/api\/pets\/\d+/.test(u))
      window.__hits.push(u.replace('http://127.0.0.1:5173',''));
    const md=localStorage.getItem('__ma');
    if(u.indexOf('/api/discover/pets')!==-1){
      if(md==='delay') return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
      if(md==='fail') return Promise.reject(new TypeError('simulated'));
      if(md==='empty') return Promise.resolve(new Response(
        JSON.stringify({items:[]}),
        {status:200,headers:{'Content-Type':'application/json'}}));
    }
    return of.call(window,i,n);
  };return 1})()"""


def main():
    token = login_token()
    p = fresh_target()
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': SHIM})
    time.sleep(0.5)
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % token)
    p.eval("localStorage.setItem('__ma','')")

    p.goto(BASE + '/me', wait=5.0)
    show('LOADED', p.eval(STATE))
    hits = p.eval('window.__hits') or []
    print('\nAPI calls made:')
    for h in hits[:10]:
        print('  ', h)
    print('  total:', len(hits))

    # loading
    p.eval("localStorage.setItem('__ma','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/me', wait=1.0)
    show('LOADING', p.eval(STATE))
    time.sleep(3.6)
    show('LOADED AFTER DELAY', p.eval(STATE))

    # empty — discover returns nothing, so nobody is an owner
    p.eval("localStorage.setItem('__ma','empty')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/me', wait=3.0)
    show('EMPTY (no discoverable pets)', p.eval(STATE))

    # error — discover rejects
    p.eval("localStorage.setItem('__ma','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/me', wait=3.5)
    show('ERROR (discover rejects)', p.eval(STATE))

    p.eval("localStorage.removeItem('__ma')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
