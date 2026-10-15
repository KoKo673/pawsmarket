# -*- coding: utf-8 -*-
"""BookingManagePage: loading, loaded, error, and confirm-then-repaint."""
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
TOKEN = open('_mgtok.tmp').read().strip()

STATE = """(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\\s+/g,' ').trim();
  return {
    h1: (document.querySelector('h1')||{}).innerText||'',
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    store: (txt.match(/\\u0628\\u0631\\u0627\\u06cc [^ ]+ [^ ]+/)||[''])[0],
    rows: document.querySelectorAll('div.space-y-3 > div').length,
    confirmBtn: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u062a\\u0623\\u06cc\\u06cc\\u062f \\u0646\\u0648\\u0628\\u062a')).length,
    declineBtn: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u0631\\u062f \\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a')).length,
    answered: txt.includes('\\u062a\\u0623\\u06cc\\u06cc\\u062f \\u06a9\\u0631\\u062f\\u0647\\u200c\\u0627\\u06cc\\u062f'),
    linkError: txt.includes('\\u0627\\u06cc\\u0646 \\u0644\\u06cc\\u0646\\u06a9 \\u0628\\u0627\\u0632 \\u0646\\u0634\\u062f'),
    noteField: !!document.querySelector('#decide-note'),
    tail: txt.slice(0,170),
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
        if(u.indexOf('/bookings/manage/')!==-1 && u.indexOf('/decision')===-1){
          const md=localStorage.getItem('__mg');
          if(md==='delay') return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
          if(md==='fail') return Promise.reject(new TypeError('simulated'));
        }
        return of.call(window,i,n);
      };return 1})()"""})
    time.sleep(0.5)
    p.goto(BASE + '/', wait=2.5)

    url = f'{BASE}/booking/manage/{TOKEN}'

    # 1) loading
    p.eval("localStorage.setItem('__mg','delay')")
    p.goto(url, wait=1.0)
    show('LOADING (view delayed)', p.eval(STATE))
    time.sleep(3.5)
    show('LOADED', p.eval(STATE))

    # 2) confirm → the page must repaint as answered
    p.eval("localStorage.setItem('__mg','')")
    typed = p.eval("""(()=>{
      const t=document.querySelector('#decide-note');
      if(!t) return 'no-note-field';
      const set=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
      set.call(t,'تأیید شد؛ ساعت ۱۴ بیایید');
      t.dispatchEvent(new Event('input',{bubbles:true}));
      return 'typed';
    })()""")
    print('\nnote:', typed)
    clicked = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u062a\\u0623\\u06cc\\u06cc\\u062f \\u0646\\u0648\\u0628\\u062a'));
      if(!b) return 'no-confirm'; b.click(); return 'clicked'})()""")
    print('confirm:', clicked)
    time.sleep(3.0)
    show('AFTER CONFIRM', p.eval(STATE))

    # 3) error state — bogus token
    p.goto('about:blank', wait=0.3)
    p.goto(f'{BASE}/booking/manage/not-a-real-token-at-all', wait=3.0)
    show('ERROR (bad token)', p.eval(STATE))

    p.eval("localStorage.removeItem('__mg')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
