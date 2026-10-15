# -*- coding: utf-8 -*-
"""FeedPage: loading, loaded, load-more pagination, empty and error."""
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
TOKEN = open('_tok.tmp').read().strip()

STATE = """(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\\s+/g,' ').trim();
  const more=[...document.querySelectorAll('button')]
    .find(b=>b.innerText.trim()==='\\u0628\\u06cc\\u0634\\u062a\\u0631');
  const loadingMore=[...document.querySelectorAll('button')]
    .filter(b=>b.innerText.includes('\\u062f\\u0631 \\u062d\\u0627\\u0644 \\u0628\\u0627\\u0631\\u06af\\u0630\\u0627\\u0631\\u06cc')).length;
  return {
    h1: (document.querySelector('h1')||{}).innerText||'',
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    cards: document.querySelectorAll('article').length,
    texts: [...document.querySelectorAll('article')].map(a=>{
      const p=a.querySelector('p'); return p?p.innerText.slice(0,26):''}).filter(Boolean).slice(0,8),
    moreButton: more ? (more.disabled ? 'disabled' : 'enabled') : 'absent',
    loadingMore: loadingMore,
    emptyMsg: txt.includes('\\u0641\\u06cc\\u062f \\u0634\\u0645\\u0627 \\u062e\\u0627\\u0644\\u06cc \\u0627\\u0633\\u062a'),
    errorBlock: txt.includes('\\u0627\\u062a\\u0635\\u0627\\u0644 \\u0628\\u0631\\u0642\\u0631\\u0627\\u0631 \\u0646\\u0634\\u062f'),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
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


def main():
    p = fresh_target()
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': """(()=>{
      const of=window.fetch;
      window.fetch=function(i,n){
        const u=String(i&&i.url?i.url:i);
        if(u.indexOf('/api/feed')!==-1){
          const md=localStorage.getItem('__fd');
          if(md==='delay') return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
          if(md==='fail') return Promise.reject(new TypeError('simulated'));
          if(md==='empty') return Promise.resolve(new Response(
            JSON.stringify({items:[],next_before:null}),
            {status:200,headers:{'Content-Type':'application/json'}}));
        }
        return of.call(window,i,n);
      };return 1})()"""})
    time.sleep(0.5)
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % TOKEN)

    # loaded + pagination
    p.eval("localStorage.setItem('__fd','')")
    p.goto(BASE + '/feed', wait=4.5)
    show('LOADED', p.eval(STATE))

    clicked = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.trim()==='\\u0628\\u06cc\\u0634\\u062a\\u0631');
      if(!b) return 'no-more-button'; b.click(); return 'clicked'})()""")
    print('\nload-more click:', clicked)
    time.sleep(3.0)
    show('AFTER LOAD MORE', p.eval(STATE))

    # loading
    p.eval("localStorage.setItem('__fd','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/feed', wait=1.0)
    show('LOADING', p.eval(STATE))
    time.sleep(3.5)
    show('LOADED AFTER DELAY', p.eval(STATE))

    # empty
    p.eval("localStorage.setItem('__fd','empty')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/feed', wait=2.5)
    show('EMPTY', p.eval(STATE))

    # error
    p.eval("localStorage.setItem('__fd','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/feed', wait=3.0)
    show('ERROR', p.eval(STATE))

    p.eval("localStorage.removeItem('__fd')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
