# -*- coding: utf-8 -*-
"""BookingPage name prefill — the derived-value fix, tested at the edges.

The old effect ran `setName(v => v || user.display_name || user.username)`
whenever the user object arrived. Replacing it with a derived value has to
keep three behaviours: the name appears for a signed-in visitor, it does NOT
come back after the visitor clears the field, and typing wins over it.
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


# The booking form lives on a store page; find one with a bookable category.
def bookable_store_id() -> str:
    with urllib.request.urlopen(
            'http://127.0.0.1:9650/api/stores/nearby'
            '?lat=35.6892&lng=51.389&max_distance=50000', timeout=15) as r:
        rows = json.load(r)
    for row in rows:
        if row.get('category') in ('vet', 'groomer', 'boarding', 'shelter'):
            return str(row['id'])
    raise SystemExit('no bookable store found')


NAME_FIELD = r"""(()=>{
  const el=document.querySelector('#bk-name');
  return el ? el.value : 'NO-FIELD';
})()"""

TYPE = r"""(v=>{
  const el=document.querySelector('#bk-name');
  if(!el) return 'NO-FIELD';
  const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  set.call(el, v);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  return el.value;
})"""


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
    store = bookable_store_id()
    url = f'{BASE}/booking/{store}'
    print('store:', store, '| url:', url)

    p = fresh_target()

    # ── 1) signed in: the account name is prefilled ─────────────────
    p.goto(BASE + '/', wait=2.5)
    p.eval("localStorage.setItem('pawsmarket-auth-token', %r)" % token)
    p.goto(url, wait=5.0)
    signed_in = p.eval(NAME_FIELD)
    print('\nsigned-in prefill  :', json.dumps(signed_in, ensure_ascii=True))

    # ── 2) typing wins ──────────────────────────────────────────────
    typed = p.eval(TYPE + "('سارا محمدی')")
    time.sleep(0.8)
    after_type = p.eval(NAME_FIELD)
    print('after typing       :', json.dumps(after_type, ensure_ascii=True))

    # ── 3) clearing stays cleared (the old `v ||` guard did this) ───
    cleared = p.eval(TYPE + "('')")
    time.sleep(0.8)
    after_clear = p.eval(NAME_FIELD)
    print('after clearing     :', json.dumps(after_clear, ensure_ascii=True))

    # a re-render must not refill it
    p.eval("window.dispatchEvent(new Event('resize'))")
    time.sleep(0.6)
    after_rerender = p.eval(NAME_FIELD)
    print('after re-render    :', json.dumps(after_rerender, ensure_ascii=True))

    # ── 4) signed out: field starts empty ───────────────────────────
    p.goto(BASE + '/', wait=2.0)
    p.eval("localStorage.removeItem('pawsmarket-auth-token')")
    p.goto(url, wait=4.5)
    guest = p.eval(NAME_FIELD)
    print('guest (no session) :', json.dumps(guest, ensure_ascii=True))

    print('\nCHECKS')
    ok_prefill = signed_in not in ('', 'NO-FIELD')
    ok_type = after_type == 'سارا محمدی'
    ok_clear = after_clear == ''
    ok_stable = after_rerender == ''
    ok_guest = guest == ''
    print('  prefilled from account :', ok_prefill)
    print('  typing replaces it     :', ok_type)
    print('  clearing stays cleared :', ok_clear)
    print('  re-render no refill    :', ok_stable)
    print('  guest starts empty     :', ok_guest)

    ok = all([ok_prefill, ok_type, ok_clear, ok_stable, ok_guest])
    print('\nRESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
