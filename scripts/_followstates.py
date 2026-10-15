# -*- coding: utf-8 -*-
"""FollowListPage: loading skeleton, error state, and retry-after-error.

Throttles only the followers call (bundle loads at full speed) by injecting a
fetch wrapper through Page.addScriptToEvaluateOnNewDocument, driven by a
localStorage flag so a retry can be exercised in the same document.
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

INJECT = """(()=>{
  const of = window.fetch;
  window.fetch = function(input, init){
    const url = String(input && input.url ? input.url : input);
    if (url.indexOf('/followers') !== -1 || url.indexOf('/following') !== -1) {
      const mode = localStorage.getItem('__followMode') || '';
      if (mode === 'fail') return Promise.reject(new TypeError('simulated network failure'));
      if (mode === 'delay') {
        return new Promise(r => setTimeout(r, 3000)).then(() => of.call(window, input, init));
      }
    }
    return of.call(window, input, init);
  };
  window.__fErrs = [];
  const oe = console.error;
  console.error = function(){ window.__fErrs.push([...arguments].map(String).join(' ').slice(0,160)); return oe.apply(console, arguments); };
  return 1;
})()"""

STATE = """(()=>{
  const main = document.querySelector('main') || document.body;
  const txt = main.innerText.replace(/\\s+/g,' ').trim();
  const retry = [...document.querySelectorAll('button')]
    .filter(b => b.innerText.includes('\\u062a\\u0644\\u0627\\u0634 \\u062f\\u0648\\u0628\\u0627\\u0631\\u0647'));
  return {
    skeletons: document.querySelectorAll('[class*=animate-pulse]').length,
    headerP: (document.querySelector('header p')||{}).innerText || '',
    errorBlock: txt.includes('\\u0628\\u0627\\u0631\\u06af\\u0630\\u0627\\u0631\\u06cc \\u0627\\u06cc\\u0646 \\u0641\\u0647\\u0631\\u0633\\u062a \\u0645\\u0645\\u06a9\\u0646 \\u0646\\u0634\\u062f'),
    retryButtons: retry.length,
    retryLabel: retry.length ? retry[0].innerText.replace(/\\s+/g,' ').trim() : '',
    emptyBlock: txt.includes('\\u062d\\u06cc\\u0686 \\u062f\\u0646\\u0628\\u0627\\u0644\\u200c\\u06a9\\u0646\\u0646\\u062f\\u0647\\u200c\\u0627\\u06cc'),
    rowText: (txt.match(/(\\u0628\\u0628\\u0631\\u06cc)[^]*?(\\u06af\\u0631\\u0628\\u0647)/)||[]).join(' '),
    tail: txt.slice(-90),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def main():
    p = m.new_page('about:blank')
    time.sleep(1)
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': INJECT})

    url = 'http://127.0.0.1:5173/pet/4/followers'

    # ── 1) loading skeleton ─────────────────────────────────────────
    p.goto('about:blank', wait=0.3)
    p.goto(url, wait=1.0)
    p.eval("localStorage.setItem('__followMode','delay')")
    p.ws.call('Page.reload')
    time.sleep(0.9)
    show('LOADING (followers call delayed 3s)', p.eval(STATE))
    time.sleep(3.4)
    show('AFTER DELAY — should be loaded', p.eval(STATE))

    # ── 2) error state ──────────────────────────────────────────────
    p.eval("localStorage.setItem('__followMode','fail')")
    p.ws.call('Page.reload')
    time.sleep(2.5)
    show('ERROR (followers call rejects)', p.eval(STATE))

    # ── 3) retry succeeds once the failure is lifted ────────────────
    p.eval("localStorage.setItem('__followMode','')")
    clicked = p.eval("""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.includes('\\u062a\\u0644\\u0627\\u0634 \\u062f\\u0648\\u0628\\u0627\\u0631\\u0647'));
      if(!b) return 'no-retry-button';
      b.click(); return 'clicked';
    })()""")
    print('\nretry click:', clicked)
    time.sleep(2.5)
    show('AFTER RETRY — should be loaded', p.eval(STATE))

    p.eval("localStorage.removeItem('__followMode')")
    print('\nconsole errors:', json.dumps(p.eval('window.__fErrs'), ensure_ascii=True))
    return 0


if __name__ == '__main__':
    sys.exit(main())
