# -*- coding: utf-8 -*-
"""CommentsSheet inside a moment card: open, list, empty, post, error.

Selectors are class-based on purpose — the class names come from the
component source, so there is no Persian text to escape through the CDP
evaluation string.
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
TOKEN = open('_tok.tmp').read().strip()

STATE = r"""(()=>{
  const dlg=document.querySelector('[role=dialog]');
  const txt=dlg?dlg.innerText.replace(/\s+/g,' ').trim():'';
  const rows=dlg?dlg.querySelectorAll('div.flex.gap-3'):[];
  const title=dlg?dlg.querySelector('h2'):null;
  const input=dlg?dlg.querySelector('input'):null;
  return {
    dialog: !!dlg,
    title: title?title.innerText:'',
    spinner: dlg?dlg.querySelectorAll('.animate-spin').length:0,
    emptyMsg: txt.indexOf('هنوز کامنتی نیست') !== -1,
    rows: rows.length,
    texts: [...rows].map(r=>{
      const p=r.querySelector('p.break-words'); return p?p.innerText.slice(0,30):''}).filter(Boolean),
    hasInput: !!input,
    sendBtn: dlg?[...dlg.querySelectorAll('button')]
      .filter(b=>b.getAttribute('aria-label')==='ارسال کامنت').length:0,
    headerCount: (()=>{
      const b=[...document.querySelectorAll('button[aria-label]')]
        .filter(x=>x.getAttribute('aria-label')==='دیدن کامنت‌ها');
      return b.length?b[0].innerText.trim():'none'})(),
  };
})()"""

OPEN = r"""(()=>{
  const b=[...document.querySelectorAll('button[aria-label]')]
    .find(x=>x.getAttribute('aria-label')==='دیدن کامنت‌ها');
  if(!b) return 'no-comment-button'; b.click(); return 'clicked'})()"""


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
  window.fetch=function(i,n){
    const u=String(i&&i.url?i.url:i);
    const md=localStorage.getItem('__cm');
    if(/\/api\/posts\/\d+\/comments/.test(u)){
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
    p.eval("localStorage.setItem('__cm','')")

    p.goto(BASE + '/feed', wait=4.5)
    print('\nopen sheet:', p.eval(OPEN))
    time.sleep(2.5)
    show('SHEET LOADED (2 seeded comments)', p.eval(STATE))

    typed = p.eval(r"""(()=>{
      const d=document.querySelector('[role=dialog]');
      const i=d&&d.querySelector('input');
      if(!i) return 'no-input';
      const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      set.call(i,'چه پشمکی قشنگی');
      i.dispatchEvent(new Event('input',{bubbles:true}));
      return 'typed'})()""")
    print('type:', typed)
    clicked = p.eval(r"""(()=>{
      const d=document.querySelector('[role=dialog]');
      const b=d&&[...d.querySelectorAll('button')]
        .find(x=>x.getAttribute('aria-label')==='ارسال کامنت');
      if(!b) return 'no-send'; b.click(); return 'sent'})()""")
    print('send:', clicked)
    time.sleep(3.0)
    show('AFTER POST (count must rise to 3)', p.eval(STATE))

    p.eval("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
    time.sleep(1.0)

    # loading spinner
    p.eval("localStorage.setItem('__cm','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/feed', wait=4.0)
    print('\nopen (delayed):', p.eval(OPEN))
    time.sleep(0.7)
    show('SHEET LOADING', p.eval(STATE))
    time.sleep(3.4)
    show('SHEET AFTER DELAY', p.eval(STATE))

    # error
    p.eval("localStorage.setItem('__cm','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/feed', wait=4.0)
    print('\nopen (failing):', p.eval(OPEN))
    time.sleep(2.5)
    show('SHEET ERROR', p.eval(STATE))

    p.eval("localStorage.removeItem('__cm')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
