# -*- coding: utf-8 -*-
"""AdoptionPage: public list, owner inbox, request dialog, loading/empty/error."""
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
    skeletons: document.querySelectorAll('[class*=animate-pulse], .animate-pulse').length,
    cards: document.querySelectorAll('article').length,
    petNames: [...document.querySelectorAll('article h3')].map(h=>h.innerText).slice(0,6),
    availableBadges: (txt.match(/\\u0622\\u0645\\u0627\\u062f\\u0647\\u200c\\u06cc \\u0633\\u0631\\u067e\\u0631\\u0633\\u062a\\u06cc/g)||[]).length,
    requestButtons: [...document.querySelectorAll('button')]
      .filter(b=>b.innerText.includes('\\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a \\u0633\\u0631\\u067e\\u0631\\u0633\\u062a\\u06cc')).length,
    inboxVisible: txt.includes('\\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a\\u200c\\u0647\\u0627\\u06cc \\u062f\\u0631\\u06cc\\u0627\\u0641\\u062a\\u06cc'),
    emptyBlock: txt.includes('\\u0641\\u0639\\u0644\\u0627\\u064b \\u062d\\u06cc\\u0648\\u0627\\u0646\\u06cc \\u062f\\u0631 \\u0648\\u0636\\u0639\\u06cc\\u062a'),
    tail: txt.slice(0,150),
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
    const md=localStorage.getItem('__ad');
    if(u.indexOf('/discover/pets')!==-1){
      if(md==='delay') return new Promise(r=>setTimeout(r,3000)).then(()=>of.call(window,i,n));
      if(md==='fail') return Promise.reject(new TypeError('simulated'));
      if(md==='empty') return Promise.resolve(new Response(
        JSON.stringify({items:[],next_before:null}),
        {status:200,headers:{'Content-Type':'application/json'}}));
    }
    return of.call(window,i,n);
  };return 1})()"""


def main():
    p = fresh_target()
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': SHIM})
    time.sleep(0.5)

    # ── anonymous visitor ───────────────────────────────────────────
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.removeItem('pawsmarket-auth-token')")
    p.eval("localStorage.setItem('__ad','')")
    p.goto(BASE + '/adoption', wait=4.5)
    show('ANONYMOUS LOADED', p.eval(STATE))

    # open the request dialog — only signed-in visitors get a dialog; a guest
    # is sent to /login instead, so this runs after the authed navigation below.
    time.sleep(0.5)
    show('DIALOG OPEN', p.eval("""(()=>{
      const d=document.querySelector('[data-state=open][role=dialog], [data-state=open]');
      const anyDlg=document.querySelector('[data-radix-dialog-content], [role=dialog]');
      const box=d||anyDlg;
      return {
        dialog: !!box,
        textarea: !!(box&&box.querySelector('textarea')),
        submit: box ? [...box.querySelectorAll('button')]
          .filter(b=>b.innerText.includes('\\u062b\\u0628\\u062a')).length : 0,
        snippet: box ? box.innerText.replace(/\\s+/g,' ').slice(0,90) : '',
      };
    })()"""))

    # ── signed in: inbox appears ────────────────────────────────────
    p.goto(BASE + '/', wait=2.0)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % TOKEN)
    p.goto(BASE + '/adoption', wait=4.5)
    show('AUTHED LOADED', p.eval(STATE))

    # open the request dialog now that a session exists
    opened = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u062f\\u0631\\u062e\\u0648\\u0627\\u0633\\u062a \\u0633\\u0631\\u067e\\u0631\\u0633\\u062a\\u06cc'));
      if(!b) return 'no-button'; b.click(); return 'clicked'})()""")
    print('\ndialog open:', opened)
    time.sleep(1.3)
    show('DIALOG OPEN (authed)', p.eval("""(()=>{
      const box=document.querySelector('[data-state=open][role=dialog]')
        || document.querySelector('[role=dialog]');
      return {
        dialog: !!box,
        textarea: !!(box&&box.querySelector('textarea')),
        submit: box ? [...box.querySelectorAll('button')]
          .filter(b=>b.innerText.includes('\\u062b\\u0628\\u062a')).length : 0,
        title: box ? (box.querySelector('h2')||{}).innerText || '' : '',
      };
    })()"""))

    # ── loading ─────────────────────────────────────────────────────
    p.eval("localStorage.setItem('__ad','delay')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/adoption', wait=1.0)
    show('LOADING', p.eval(STATE))
    time.sleep(3.5)

    # ── empty ───────────────────────────────────────────────────────
    p.eval("localStorage.setItem('__ad','empty')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/adoption', wait=2.5)
    show('EMPTY', p.eval(STATE))

    # ── error ───────────────────────────────────────────────────────
    p.eval("localStorage.setItem('__ad','fail')")
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/adoption', wait=3.0)
    show('ERROR', p.eval(STATE))

    p.eval("localStorage.removeItem('__ad')")
    return 0


if __name__ == '__main__':
    sys.exit(main())
