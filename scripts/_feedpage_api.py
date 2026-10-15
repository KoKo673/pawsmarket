# -*- coding: utf-8 -*-
"""Feed pagination over the API: page 1, page 2 via cursor, duplicate check.

The reported NOT_TESTED was only a data shortage: the server sets
next_before when len(rows) == limit, and the database had fewer posts than
the default limit of 20. With 30 posts the cursor appears, so the second
page can actually be exercised.
"""
import io
import json
import urllib.request

API = 'http://127.0.0.1:9650'


def login() -> str:
    req = urllib.request.Request(
        f'{API}/api/auth/login', method='POST',
        data=json.dumps({'username': 'bk_12821',
                         'password': 'testpass123'}).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)['token']


def feed(token: str, before: str | None = None) -> dict:
    url = f'{API}/api/feed' + (f'?before={before}' if before else '')
    req = urllib.request.Request(
        url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def main() -> int:
    token = login()

    p1 = feed(token)
    ids1 = [i['id'] for i in p1['items']]
    print('PAGE 1')
    print('  items      :', len(p1['items']))
    print('  next_before:', p1['next_before'])
    print('  first id   :', ids1[0], '| last id:', ids1[-1])
    print('  newest ts  :', p1['items'][0]['created_at'])
    print('  oldest ts  :', p1['items'][-1]['created_at'])

    if not p1['next_before']:
        print('\nFAIL: page 1 returned no cursor — pagination unreachable')
        return 1

    p2 = feed(token, p1['next_before'])
    ids2 = [i['id'] for i in p2['items']]
    print('\nPAGE 2 (before = cursor)')
    print('  items      :', len(p2['items']))
    print('  next_before:', p2['next_before'])
    print('  first id   :', ids2[0] if ids2 else None,
          '| last id:', ids2[-1] if ids2 else None)
    print('  newest ts  :', p2['items'][0]['created_at'] if p2['items'] else None)

    overlap = set(ids1) & set(ids2)
    print('\nCHECKS')
    print('  total unique ids      :', len(set(ids1) | set(ids2)))
    print('  sum of pages          :', len(ids1) + len(ids2))
    print('  duplicates across page:', sorted(overlap) if overlap else 'none')
    print('  page2 strictly older  :',
          all(i['created_at'] < p1['items'][-1]['created_at']
              for i in p2['items']) if p2['items'] else 'n/a')

    # A third call with the same cursor must be stable (no shifting window).
    p2b = feed(token, p1['next_before'])
    print('  page 2 repeatable     :', [i['id'] for i in p2b['items']] == ids2)

    ok = (len(p1['items']) == 20
          and len(ids2) > 0
          and not overlap)
    print('\nRESULT:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
