# -*- coding: utf-8 -*-
"""
Regression test: a file claiming image/* with non-image bytes must be
rejected with 422 — the content-type header alone must not be enough.

Also proves the happy path still works for a real PNG.
"""
import io
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', 'serverdash'))
API = 'http://localhost:9650'

PNG = (b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)     # real PNG signature
HTML = b'<!DOCTYPE html><script>alert(1)</script>'  # fake, served as png
JPEG = (b'\xff\xd8\xff\xe0' + b'\x00' * 100)


def get_token():
    import urllib.request
    r = urllib.request.Request(
        API + '/api/auth/register',
        data=json.dumps({'username': 'mediaqc', 'password': 'MediaQC!2026',
                         'display_name': 'q'}).encode(),
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(r, timeout=20) as x:
            return json.loads(x.read())['token']
    except Exception:
        r = urllib.request.Request(
            API + '/api/auth/login',
            data=json.dumps({'username': 'mediaqc',
                             'password': 'MediaQC!2026'}).encode(),
            headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(r, timeout=20) as x:
            return json.loads(x.read())['token']


def upload(token, filename, content_type, data):
    boundary = 'xXx'
    body = io.BytesIO()
    body.write(f'--{boundary}\r\n'.encode())
    body.write(f'Content-Disposition: form-data; name="file"; '
               f'filename="{filename}"\r\n'.encode())
    body.write(f'Content-Type: {content_type}\r\n\r\n'.encode())
    body.write(data)
    body.write(f'\r\n--{boundary}--\r\n'.encode())
    r = urllib.request.Request(
        API + '/api/media', data=body.getvalue(),
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}',
        }, method='POST')
    try:
        with urllib.request.urlopen(r, timeout=25) as x:
            return x.status, json.loads(x.read())
    except Exception as e:
        return getattr(e, 'code', 'ERR'), {'detail': str(e)[:100]}


if __name__ == '__main__':
    tok = get_token()
    print('token  :', tok[:20], '…')
    print()
    cases = [
        ('HTML claimed as PNG  ', 'fake.png', 'image/png', HTML, 422),
        ('Real PNG             ', 'ok.png', 'image/png', PNG, 201),
        ('Real JPEG signature  ', 'ok.jpg', 'image/jpeg', JPEG, 201),
        ('HTML claimed as JPEG ', 'fake.jpg', 'image/jpeg', HTML, 422),
    ]
    fails = []
    for label, fn, ct, data, want in cases:
        code, body = upload(tok, fn, ct, data)
        ok = code == want
        # ASCII flags only: this console is cp1252 on Windows and a check
        # mark inside an f-string raises UnicodeEncodeError before the run
        # can report anything.
        flag = 'ok  ' if ok else 'FAIL'
        print(f'  {flag}  {label:22} got {code}, wanted {want}')
        if not ok:
            fails.append(label)
    print()
    if fails:
        print('FAILS:', fails)
        sys.exit(1)
    print('ALL PASS - fake bytes rejected, real images accepted')