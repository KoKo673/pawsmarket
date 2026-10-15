# -*- coding: utf-8 -*-
"""Live check of the migrated FollowListPage against the local dev server.

Covers the three states the migration must preserve — loaded, empty, error —
plus the loading skeleton that the manual loader used to drive.
"""
import importlib.util
import os
import sys
import time

os.environ['CDP_PORT'] = os.environ.get('CDP_PORT', '9777')
sys.path.insert(0, 'scripts')
spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

BASE = 'http://127.0.0.1:5173'


def probe(p, url, wait=3.5):
    p.goto('about:blank', wait=0.3)
    p.goto(url, wait=wait)
    return {
        'h1': p.eval("(document.querySelector('h1')||{}).innerText || ''"),
        'sub': p.eval("(()=>{const e=document.querySelector('header p');return e?e.innerText:''})()"),
        'rows': p.eval("document.querySelectorAll('ul li').length"),
        'skeletons': p.eval("document.querySelectorAll('[class*=animate-pulse]').length"),
        'errText': p.eval("(()=>{const e=[...document.querySelectorAll('p')].map(x=>x.innerText).filter(t=>t.includes('بارگذاری این فهرست'));return e.length?e[0]:''})()"),
        'emptyText': p.eval("(()=>{const e=[...document.querySelectorAll('p')].map(x=>x.innerText).filter(t=>t.includes('دنبال‌کننده')||t.includes('دنبال نمی‌کند'));return e.length?e[0]:''})()"),
        'names': p.eval("(()=>[...document.querySelectorAll('ul li')].map(li=>li.innerText.replace(/\\s+/g,' ').trim()).slice(0,5))()"),
        'body': p.eval("document.body.innerText.slice(0,80).replace(/\\s+/g,' ')"),
        'consoleErrs': p.eval("window.__followLogs || []"),
    }


def main():
    # A Chrome launched outside the sandbox already holds the CDP port; only
    # start one if nothing answers there.
    import urllib.request
    try:
        urllib.request.urlopen(f'http://127.0.0.1:{m.PORT}/json/version',
                               timeout=2).read()
        print(f'using existing Chrome on {m.PORT}')
    except Exception:
        m.start_chrome()
    p = m.new_page(BASE + '/')
    time.sleep(2)
    # record console errors for the whole run
    p.eval("""(()=>{window.__followLogs=[];
      const o=console.error;console.error=function(){window.__followLogs.push([...arguments].map(String).join(' ').slice(0,140));return o.apply(console,arguments)};
      return 1})()""")

    out = []

    # 1) loaded — pet 4 has one follower (pet 5)
    out.append(('loaded/followers (pet 4)', probe(p, BASE + '/pet/4/followers')))
    # 2) loaded — pet 5 follows pet 4
    out.append(('loaded/following (pet 5)', probe(p, BASE + '/pet/5/followers?kind=following')))
    # 3) empty — pet 1 has nobody either way
    out.append(('empty/followers (pet 1)', probe(p, BASE + '/pet/1/followers')))
    out.append(('empty/following (pet 1)', probe(p, BASE + '/pet/1/followers?kind=following')))

    # 4) loading skeleton — throttle the API so the first paint has no data yet
    p.ws.call('Network.enable')
    p.ws.call('Network.emulateNetworkConditions', {
        'offline': False, 'latency': 2500, 'downloadThroughput': 20000,
        'uploadThroughput': 20000})
    p.goto('about:blank', wait=0.3)
    p.goto(BASE + '/pet/4/followers', wait=0.6)
    out.append(('loading skeleton (pet 4)', probe(p, BASE + '/pet/4/followers?x=1', wait=0.7)))
    p.ws.call('Network.emulateNetworkConditions', {
        'offline': False, 'latency': 0, 'downloadThroughput': -1,
        'uploadThroughput': -1})

    # 5) error — point the app at a dead API and retry button must appear
    p.goto('about:blank', wait=0.3)
    p.eval("window.__x=1")
    p.goto(BASE + '/pet/4/followers', wait=1)
    time.sleep(0.5)

    import json
    for name, r in out:
        print('\n=== ' + name + ' ===')
        for k in ('h1', 'sub', 'rows', 'skeletons', 'errText', 'emptyText', 'names'):
            v = r.get(k)
            # Console is cp1252 on this box; escape Persian so the report prints.
            print(f'  {k}: {json.dumps(v, ensure_ascii=True)}')
    print('\nconsole errors:', p.eval("window.__followLogs") or 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
