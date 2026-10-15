# -*- coding: utf-8 -*-
"""PetsDiscoverPage: loaded, loading, error and empty states."""
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
  const cards=[...document.querySelectorAll('a[href^="/pet/"]')];
  return {
    h1: (document.querySelector('h1')||{}).innerText||'',
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    petCards: cards.length,
    petNames: cards.map(a=>{
      const h=a.querySelector('h3'); return h?h.innerText:''}).filter(Boolean).slice(0,6),
    adoptionBadges: (txt.match(/\\u0622\\u0645\\u0627\\u062f\\u0647\\u200c\\u06cc \\u0633\\u0631\\u067e\\u0631\\u0633\\u062a\\u06cc/g)||[]).length,
    errorBlock: txt.includes('\\u0628\\u0627\\u0631\\u06af\\u0630\\u0627\\u0631\\u06cc \\u0627\\u0646\\u062c\\u0627\\u0645 \\u0646\\u0634\\u062f'),
    emptyBlock: txt.includes('\\u0647\\u0646\\u0648\\u0632 \\u067e\\u0631\\u0648\\u0641\\u0627\\u06cc\\u0644\\u06cc \\u062f\\u0631 \\u0627\\u06cc\\u0646 \\u0645\\u062d\\u062f\\u0648\\u062f\\u0647 \\u0646\\u06cc\\u0633\\u062a'),
    distances: (txt.match(/\\u06f0 \\u06a9\\u06cc\\u0644\\u0648\\u0645\\u062a\\u0631|\\d+[.,]?\\d* \\u06a9\\u06cc\\u0644\\u0648\\u0645\\u062a\\u0631/g)||[]).slice(0,4),
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
        if(u.indexOf('/discover/pets')!==-1){
          const md=localStorage.getItem('__pv');
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

    # loaded
    p.eval("localStorage.setItem('__pv','')")
    p.goto(BASE + '/pets', wait=4.0)
    show('LOADED', p.eval(STATE))

    # loading
    p.eval("localStorage.setItem('__pv','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pets', wait=1.0)
    show('LOADING', p.eval(STATE))
    time.sleep(3.4)
    show('LOADED AFTER DELAY', p.eval(STATE))

    # empty
    p.eval("localStorage.setItem('__pv','empty')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pets', wait=2.5)
    show('EMPTY', p.eval(STATE))

    # error
    p.eval("localStorage.setItem('__pv','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pets', wait=3.0)
    show('ERROR', p.eval(STATE))

    p.eval("localStorage.removeItem('__pv')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
