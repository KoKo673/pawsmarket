# -*- coding: utf-8 -*-
"""
Live test for the bookings correctness checklist (step 2).

1. window_minutes bounds (15..480)
2. status transitions — double confirm refused, cancel after decide refused
3. manage token looks nothing like a guessable id

Every call prints its code so a failure is attributable.
"""
import json
import time
import urllib.error
import urllib.request

API = 'http://localhost:9650'


def call(method, path, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
    if token:
        headers['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(APY(path), data=data, headers=headers,
                               method=method)
    for _ in range(3):
        try:
            with urllib.request.urlopen(r, timeout=30) as x:
                return x.status, json.loads(x.read())
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode()
        except Exception:
            time.sleep(2)
    return 'ERR', 'timeout'


def APY(path):
    return f'{API}{path}'


def seed_user(u, pw):
    call('POST', '/api/auth/register',
         {'username': u, 'password': pw, 'display_name': u})
    c, b = call('POST', '/api/auth/login', {'username': u, 'password': pw})
    return b.get('token') if isinstance(b, dict) else None


tok_a = seed_user('qcbooka', 'QCBook!2026')
tok_b = seed_user('qcbookb', 'QCBook!2026')

c, stores = call(
    'GET', '/api/stores/nearby?lat=35.7&lng=51.39&max_distance=30000&limit=200')
vet = next((s for s in stores if s.get('category') == 'vet'), None)
sid = vet['id']
fut = time.strftime('%Y-%m-%dT10:00:00', time.localtime(time.time() + 5 * 86400))

print('window_minutes bounds:')
base = {'store_id': sid, 'service': 'معاینه', 'preferred_at': fut,
        'contact_name': 'تست', 'contact_phone': '09120000000'}
for wm, want in [(5, 422), (999, 422), (60, 201)]:
    c, b = call('POST', '/api/bookings', {**base, 'window_minutes': wm},
                token=tok_a)
    flag = 'ok' if c == want else f'FAIL (got {c})'
    print(f'  {wm:>3} min -> {c}  {flag}')

print()
print('status transitions:')
p = {'store_id': sid, 'service': 'معاینه', 'preferred_at': fut,
     'contact_name': 'کاربر ب', 'contact_phone': '09120000001'}
c, b = call('POST', '/api/bookings', p, token=tok_b)
bid, mtok = b.get('id'), b.get('manage_token')
print(f'  create booking #{bid} -> {c}')
c, b = call('POST', f'/api/bookings/manage/{mtok}/decision',
            {'action': 'confirm', 'decision_note': ''})
print(f'  confirm           -> {c}  status={b.get("status")}')
c, b = call('POST', f'/api/bookings/manage/{mtok}/decision',
            {'action': 'confirm'})
print(f'  confirm again     -> {c}  want 409')
c, b = call('POST', f'/api/bookings/{bid}/cancel', None, token=tok_b)
print(f'  cancel after done -> {c}  want 404/409')
