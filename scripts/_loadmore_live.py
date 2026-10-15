# -*- coding: utf-8 -*-
"""FeedPage loadMore in a real browser — the path that was NOT_TESTED.

With 30 posts in the database the server returns a cursor, so the «بیشتر»
button finally renders and fetchNextPage can be exercised end to end. The
test records the card count before and after, and checks that no post id
appears twice — the exact failure a broken cursor would produce.
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


def login_token() -> str:
    req = urllib.request.Request(
        'http://127.0.0.1:9650/api/auth/login', method='POST',
        data=json.dumps({'username': 'bk_12821',
                         'password': 'testpass123'}).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)['token']


# Card identity is the post body text (unique per seeded post). The relative
# timestamp is NOT an identity — five older posts were created in the same
# second, so they legitimately share the same «۲۳ دقیقه پیش» label.
STATE = r"""(()=>{
  const cards=[...document.querySelectorAll('article')];
  const more=[...document.querySelectorAll('button')]
    .find(b=>b.innerText.trim()==='بیشتر');
  const busy=[...document.querySelectorAll('button')]
    .some(b=>b.innerText.indexOf('در حال بارگذاری')!==-1);
  return {
    cards: cards.length,
    texts: cards.map(a=>{
      const p=a.querySelector('p.px-4, p.pb-3');
      if(p) return p.innerText.trim();
      const anyP=[...a.querySelectorAll('p')]
        .map(x=>x.innerText.trim())
        .filter(t=>t && !/پیش$|همین حالا/.test(t));
      return anyP.length?anyP[0]:'(no-text)';
    }),
    moreButton: more ? (more.disabled ? 'disabled' : 'enabled') : 'absent',
    loadingMore: busy,
  };
})()"""


def show(tag, s):
    print('\n=== ' + tag + ' ===')
    if not isinstance(s, dict):
        print('  raw:', s)
        return
    for k, v in s.items():
        if k == 'texts':
            print(f'  {k}: ({len(v)})')
            for t in v[:4]:
                print('     ', json.dumps(t, ensure_ascii=True))
            if len(v) > 4:
                print('      ... +%d more' % (len(v) - 4))
        else:
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
    token = login_token()
    p = fresh_target()
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % token)

    # Watch what the page actually requests, so the cursor encoding is
    # proven from the wire rather than assumed from the client source.
    p.ws.call('Page.addScriptToEvaluateOnNewDocument', {'source': r"""(()=>{
      window.__feedReqs=[];
      const of=window.fetch;
      window.fetch=function(i,n){
        const u=String(i&&i.url?i.url:i);
        if(u.indexOf('/api/feed')!==-1) window.__feedReqs.push(u);
        return of.call(window,i,n);
      };return 1})()"""})
    time.sleep(0.4)

    p.goto(BASE + '/feed', wait=5.0)
    before = p.eval(STATE)
    show('PAGE 1', before)

    print('\nfeed URLs so far:')
    for u in (p.eval('window.__feedReqs') or [])[:4]:
        print('  ', u)

    if before.get('moreButton') != 'enabled':
        print('\nABORT: more-button did not render. state:',
              json.dumps(before, ensure_ascii=True))
        return 1

    clicked = p.eval(r"""(()=>{
      const b=[...document.querySelectorAll('button')]
        .find(x=>x.innerText.trim()==='بیشتر');
      if(!b) return 'no-button'; b.click(); return 'clicked'})()""")
    print('\nload-more click:', clicked)
    time.sleep(0.4)
    mid = p.eval(STATE)
    show('DURING FETCH (loadingMore should be true)', mid)
    time.sleep(4.0)
    after = p.eval(STATE)
    show('PAGE 2 APPENDED', after)

    print('\nfeed URLs total:')
    for u in (p.eval('window.__feedReqs') or []):
        print('  ', u)

    t1, t2 = before.get('texts', []), after.get('texts', [])
    dupes = sorted({x for x in t2 if t2.count(x) > 1})
    print('\nCHECKS')
    print('  page1 cards        :', before.get('cards'))
    print('  page2 cards        :', after.get('cards'))
    print('  cards added        :', after.get('cards', 0) - before.get('cards', 0))
    print('  more button after  :', after.get('moreButton'))
    print('  duplicate texts    :', json.dumps(dupes, ensure_ascii=True) if dupes else 'none')
    print('  page1 kept intact  :', t1 == t2[:len(t1)])

    ok = (after.get('cards', 0) > before.get('cards', 0)
          and not dupes
          and t1 == t2[:len(t1)])
    print('\nRESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
