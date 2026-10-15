# -*- coding: utf-8 -*-
"""Verify the ListingCard overlay: click opens the sheet, heart still works."""
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


def fresh_target():
    req = urllib.request.Request(
        f'http://127.0.0.1:{m.PORT}/json/new?about:blank', method='PUT')
    with urllib.request.urlopen(req, timeout=20) as r:
        tgt = json.load(r)
    ws = m.WS(tgt['webSocketDebuggerUrl'])
    ws.call('Page.enable')
    ws.call('Runtime.enable')
    return m.Page(ws)


STATE = r"""(()=>{
  const cards=[...document.querySelectorAll('article')];
  const first=cards[0];
  if(!first) return {cards:0};
  const btns=[...first.querySelectorAll('button')];
  const overlay=btns.find(b=>b.className.indexOf('inset-0')!==-1);
  const heart=btns.find(b=>b.getAttribute('aria-label')||''.length);
  const h=first.getBoundingClientRect();
  return {
    cards: cards.length,
    overlayPresent: !!overlay,
    overlayName: overlay?overlay.innerText.trim():'',
    buttonsInCard: btns.length,
    heartName: heart?heart.getAttribute('aria-label'):'',
    cardH: Math.round(h.height),
    cardW: Math.round(h.width),
    nested: (()=>{
      // any button inside a button, or interactive inside role=button?
      const interactive='a[href],button,input,select,textarea,[role=button],[role=link]';
      return [...first.querySelectorAll(interactive)]
        .some(el=>el.parentElement.closest(interactive) && el.parentElement.closest(interactive)!==el);
    })(),
    role: first.getAttribute('role'),
    ariaLabel: first.getAttribute('aria-label'),
    tabIndex: first.getAttribute('tabindex'),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    if not isinstance(s, dict):
        print('  raw:', s)
        return
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def main():
    p = fresh_target()
    p.goto(BASE + '/', wait=2.5)
    p.ws.call('Emulation.setDeviceMetricsOverride',
              {'width': 390, 'height': 844, 'deviceScaleFactor': 2, 'mobile': True})
    p.goto(BASE + '/explore', wait=5.0)

    show('CARD DOM', p.eval(STATE))

    # click the overlay → the detail sheet must open
    opened = p.eval(r"""(()=>{
      const cards=[...document.querySelectorAll('article')];
      const first=cards[0];
      if(!first) return 'no-card';
      const overlay=[...first.querySelectorAll('button')]
        .find(b=>b.className.indexOf('inset-0')!==-1);
      if(!overlay) return 'no-overlay';
      overlay.click(); return 'clicked'})()""")
    print('\noverlay click:', opened)
    time.sleep(2.0)
    sheet = p.eval(r"""(()=>{
      const d=document.querySelector('[role=dialog]');
      return { sheetOpen: !!d, title: d?(d.querySelector('h2')||{}).innerText||'':'' };
    })()""")
    show('AFTER OVERLAY CLICK', sheet)

    # close, then click the heart — it must NOT open the sheet
    p.eval("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
    time.sleep(1.0)
    heart = p.eval(r"""(()=>{
      const cards=[...document.querySelectorAll('article')];
      const first=cards[0];
      const b=[...first.querySelectorAll('button')]
        .find(x=>x.className.indexOf('inset-0')===-1);
      if(!b) return 'no-heart';
      b.click(); return 'heart-clicked'})()""")
    print('\nheart click:', heart)
    time.sleep(1.2)
    after_heart = p.eval(r"""(()=>{
      const d=document.querySelector('[role=dialog]');
      return {
        sheetStillClosed: !d,
        heartPressed: (()=>{
          const b=[...document.querySelectorAll('button[aria-label]')]
            .find(x=>x.getAttribute('aria-label').indexOf('ذخیره')!==-1);
          return b?b.getAttribute('aria-label'):'';
        })(),
      };
    })()""")
    show('AFTER HEART CLICK', after_heart)

    # keyboard: focus the overlay and press Enter
    kb = p.eval(r"""(()=>{
      const cards=[...document.querySelectorAll('article')];
      const o=[...cards[0].querySelectorAll('button')]
        .find(b=>b.className.indexOf('inset-0')!==-1);
      if(!o) return 'no-overlay';
      o.focus();
      return document.activeElement===o?'focused':'not-focused'})()""")
    print('\noverlay focus:', kb)
    time.sleep(0.5)
    p.eval(r"""(()=>{
      const el=document.activeElement;
      el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
      el.click();
      return 1})()""")
    time.sleep(1.8)
    show('AFTER ENTER KEY', p.eval(r"""(()=>{
      const d=document.querySelector('[role=dialog]');
      return {sheetOpen:!!d};
    })()"""))
    return 0


if __name__ == '__main__':
    sys.exit(main())
