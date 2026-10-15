# -*- coding: utf-8 -*-
"""PetProfilePage: loaded profile+posts, loading, error, and adoption toggle."""
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
  return {
    h1: (document.querySelector('h1')||{}).innerText||'',
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    moments: document.querySelectorAll('article').length,
    followBtn: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u062f\\u0646\\u0628\\u0627\\u0644')).length,
    adoptBtn: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u0648\\u0627\\u06af\\u0630\\u0627\\u0631\\u06cc')).length,
    adoptOn: txt.includes('\\u0644\\u063a\\u0648 \\u0648\\u0627\\u06af\\u0630\\u0627\\u0631\\u06cc'),
    adoptOff: txt.includes('\\u0622\\u0645\\u0627\\u062f\\u0647\\u200c\\u06cc \\u0648\\u0627\\u06af\\u0630\\u0627\\u0631\\u06cc'),
    notFound: txt.includes('\\u067e\\u06cc\\u062f\\u0627 \\u0646\\u0634\\u062f') || txt.includes('\\u0628\\u0627\\u0631\\u06af\\u0630\\u0627\\u0631\\u06cc \\u0627\\u0646\\u062c\\u0627\\u0645 \\u0646\\u0634\\u062f'),
    galleyPhotos: document.querySelectorAll('img').length,
    tail: txt.slice(0,130),
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


SHIM = """(()=>{
  const of=window.fetch;
  window.fetch=function(i,n){
    const u=String(i&&i.url?i.url:i);
    const md=localStorage.getItem('__pp');
    const isProfile=/\\/api\\/pets\\/\\d+(\\?|$)/.test(u);
    if(isProfile){
      if(md==='delay') return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
      if(md==='fail') return Promise.reject(new TypeError('simulated'));
    }
    return of.call(window,i,n);
  };return 1})()"""


def main():
    p = fresh_target()
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': SHIM})
    time.sleep(0.5)
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % TOKEN)
    p.eval("localStorage.setItem('__pp','')")

    # pet 4 = آوا, has a profile and posts
    p.goto(BASE + '/pet/4', wait=4.5)
    show('LOADED (pet 4, owner)', p.eval(STATE))

    # adoption toggle on/off — proves invalidateQueries repaints
    toggled = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u0648\\u0627\\u06af\\u0630\\u0627\\u0631\\u06cc'));
      if(!b) return 'no-button'; b.click(); return b.innerText.trim()})()""")
    print('\ntoggled:', json.dumps(toggled, ensure_ascii=True))
    time.sleep(2.5)
    show('AFTER TOGGLE', p.eval(STATE))

    toggled2 = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u0648\\u0627\\u06af\\u0630\\u0627\\u0631\\u06cc'));
      if(!b) return 'no-button'; b.click(); return 'clicked'})()""")
    print('toggled back:', json.dumps(toggled2, ensure_ascii=True))
    time.sleep(2.5)
    show('AFTER TOGGLE BACK', p.eval(STATE))

    # loading
    p.eval("localStorage.setItem('__pp','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pet/4', wait=1.0)
    show('LOADING', p.eval(STATE))
    time.sleep(3.5)
    show('LOADED AFTER DELAY', p.eval(STATE))

    # error
    p.eval("localStorage.setItem('__pp','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pet/4', wait=3.0)
    show('ERROR', p.eval(STATE))

    p.eval("localStorage.removeItem('__pp')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
