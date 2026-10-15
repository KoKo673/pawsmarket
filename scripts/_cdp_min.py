# -*- coding: utf-8 -*-
"""Minimal CDP round-trip against the running Chrome to isolate the hang."""
import importlib.util
import os
import sys
import time

os.environ['CDP_PORT'] = '9777'
sys.path.insert(0, 'scripts')
spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

import json
import urllib.request

print('1. browser version')
with urllib.request.urlopen(f'http://127.0.0.1:{m.PORT}/json/version', timeout=5) as r:
    print('   ', json.load(r)['Browser'])

print('2. create target')
req = urllib.request.Request(
    f'http://127.0.0.1:{m.PORT}/json/new?about:blank', method='PUT')
with urllib.request.urlopen(req, timeout=15) as r:
    tgt = json.load(r)
print('    target id:', tgt['id'])

print('3. connect ws')
ws = m.WS(tgt['webSocketDebuggerUrl'])
print('    connected')

print('4. Page.enable')
print('    ->', ws.call('Page.enable', timeout=10))

print('5. Runtime.enable')
print('    ->', ws.call('Runtime.enable', timeout=10))

print('6. Runtime.evaluate 1+1')
print('    ->', ws.call('Runtime.evaluate',
                      {'expression': '1+1', 'returnByValue': True}, timeout=10))

print('7. navigate to app')
print('    ->', ws.call('Page.navigate', {'url': 'http://127.0.0.1:5173/'}, timeout=20))
time.sleep(3)

print('8. read location')
print('    ->', ws.call('Runtime.evaluate',
                      {'expression': 'location.href', 'returnByValue': True},
                      timeout=10))

print('9. close target')
with urllib.request.urlopen(f'http://127.0.0.1:{m.PORT}/json/close/{tgt["id"]}',
                            timeout=10) as r:
    print('    ->', r.read().decode())
