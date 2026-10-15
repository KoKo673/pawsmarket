# -*- coding: utf-8 -*-
"""Attach to the existing application tab and check whether navigate replies.

The freshly created target never answered Page.navigate, but a live tab that
already finished loading may behave differently. If that works, the harness
only needs a target list sorted so the app tab is chosen.
"""
import json
import sys
import time
import urllib.request

sys.path.insert(0, 'scripts')
import importlib.util  # noqa: E402

spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

with urllib.request.urlopen(f'http://127.0.0.1:{m.PORT}/json/list', timeout=10) as r:
    targets = [t for t in json.load(r) if t.get('type') == 'page']

print('page targets:', len(targets))
for t in targets:
    print('  ', t['id'][:12], t.get('url', '')[:60])

# Prefer a tab already on the dev origin, else the first page.
app = next((t for t in targets if '127.0.0.1:5173' in t.get('url', '')), targets[0])
print('\nattaching to:', app['id'][:12], app.get('url', '')[:60])

ws = m.WS(app['webSocketDebuggerUrl'])
print('Page.enable  ->', ws.call('Page.enable', timeout=10) is not None)
print('Runtime.eval ->', ws.call(
    'Runtime.evaluate', {'expression': 'location.href', 'returnByValue': True},
    timeout=10))

print('\nPage.navigate(/bookings) ->')
try:
    print('   ', ws.call('Page.navigate',
                         {'url': 'http://127.0.0.1:5173/bookings'}, timeout=15))
    time.sleep(2.5)
    print('href now:', ws.call('Runtime.evaluate',
                               {'expression': 'location.href', 'returnByValue': True},
                               timeout=10))
except Exception as e:
    print('    FAILED:', type(e).__name__, e)
