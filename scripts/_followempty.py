# -*- coding: utf-8 -*-
"""Empty state and kind toggle for FollowListPage."""
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

STATE = """(()=>{
  const main=document.querySelector('main')||document.body;
  const txt=main.innerText.replace(/\\s+/g,' ').trim();
  const h1=(document.querySelector('h1')||{}).innerText||'';
  const link=[...document.querySelectorAll('a')].find(a=>a.innerText.includes('\\u062a\\u0645\\u0627\\u0634\\u0627\\u06cc \\u062f\\u0646\\u0628\\u0627\\u0644\\u200c\\u06a9\\u0646\\u0646\\u062f\\u06af\\u0627\\u0646'));
  const back=[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/pet/4');
  return {
    h1: h1,
    countLine: (document.querySelector('header p')||{}).innerText||'',
    emptyMsgPresent: txt.includes('\\u0647\\u0646\\u0648\\u0632 \\u0647\\u06cc\\u0686 \\u062f\\u0646\\u0628\\u0627\\u0644\\u200c\\u06a9\\u0646\\u0646\\u062f\\u0647\\u200c\\u0627\\u06cc'),
    followEmptyMsgPresent: txt.includes('\\u062f\\u0646\\u0628\\u0627\\u0644 \\u0646\\u0645\\u06cc\\u200c\\u06a9\\u0646\\u062f'),
    rowPresent: txt.includes('\\u0628\\u0628\\u0631\\u06cc'),
    backLinkHref: back ? back.getAttribute('href') : null,
    tail: txt.slice(-120),
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    for k, v in s.items():
        print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')


def main():
    p = m.new_page('about:blank')
    time.sleep(1)

    # empty followers — pet 1 has none
    p.goto('http://127.0.0.1:5173/pet/1/followers', wait=4.5)
    show('EMPTY followers (pet 1)', p.eval(STATE))

    # empty following — pet 1 follows nobody
    p.goto('about:blank', wait=0.3)
    p.goto('http://127.0.0.1:5173/pet/1/followers?kind=following', wait=4.5)
    show('EMPTY following (pet 1)', p.eval(STATE))

    # loaded following — pet 5 follows pet 4
    p.goto('about:blank', wait=0.3)
    p.goto('http://127.0.0.1:5173/pet/5/followers?kind=following', wait=4.5)
    show('LOADED following (pet 5)', p.eval(STATE))

    # in-app toggle: from a loaded list, click the other tab if the UI has one
    p.goto('about:blank', wait=0.3)
    p.goto('http://127.0.0.1:5173/pet/4/followers', wait=4.5)
    toggle = p.eval("""(()=>{
      const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')
        && x.getAttribute('href').includes('/followers?kind=following'));
      if(!a) return 'no-toggle-link';
      a.click(); return a.getAttribute('href');
    })()""")
    print('\ntoggle link:', toggle)
    time.sleep(3.0)
    show('AFTER TOGGLE (if any)', p.eval(STATE))

    # back link must return to the profile
    show('BACK LINK CHECK', p.eval(STATE))
    return 0


if __name__ == '__main__':
    sys.exit(main())
