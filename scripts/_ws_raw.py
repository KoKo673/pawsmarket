# -*- coding: utf-8 -*-
"""Dump raw websocket frames around Page.navigate to see what actually arrives."""
import base64
import json
import os
import socket
import struct
import sys
import time
import urllib.request

PORT = 9777

req = urllib.request.Request(f'http://127.0.0.1:{PORT}/json/new?about:blank',
                             method='PUT')
with urllib.request.urlopen(req, timeout=15) as r:
    tgt = json.load(r)
print('target:', tgt['id'])

url = tgt['webSocketDebuggerUrl']
rest = url[5:]
hostport, _, path = rest.partition('/')
host, _, port = hostport.partition(':')
sock = socket.create_connection((host, int(port or 80)), timeout=15)
key = base64.b64encode(os.urandom(16)).decode()
sock.sendall((f'GET /{path} HTTP/1.1\r\nHost: {hostport}\r\n'
              f'Upgrade: websocket\r\nConnection: Upgrade\r\n'
              f'Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
              ).encode())
buf = b''
while b'\r\n\r\n' not in buf:
    buf += sock.recv(4096)
buf = buf.split(b'\r\n\r\n', 1)[1]


def recv_exact(n):
    global buf
    while len(buf) < n:
        chunk = sock.recv(65536)
        if not chunk:
            raise ConnectionError('closed')
        buf += chunk
    out, buf = buf[:n], buf[n:]
    return out


def send_frame(opcode, payload):
    mask = os.urandom(4)
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
    n = len(masked)
    hdr = bytes([0x80 | opcode])
    if n < 126:
        hdr += bytes([0x80 | n])
    elif n < 1 << 16:
        hdr += bytes([0x80 | 126]) + struct.pack('>H', n)
    else:
        hdr += bytes([0x80 | 127]) + struct.pack('>Q', n)
    sock.sendall(hdr + mask + masked)


send_frame(1, json.dumps({'id': 1, 'method': 'Page.enable', 'params': {}}).encode())
send_frame(1, json.dumps({'id': 2, 'method': 'Runtime.enable', 'params': {}}).encode())
time.sleep(0.6)

# drain everything queued so far
sock.settimeout(0.4)
frames = 0
try:
    while True:
        b1, b2 = recv_exact(2)
        fin, opcode = b1 & 0x80, b1 & 0x0F
        ln = b2 & 0x7F
        if ln == 126:
            ln = struct.unpack('>H', recv_exact(2))[0]
        elif ln == 127:
            ln = struct.unpack('>Q', recv_exact(8))[0]
        data = recv_exact(ln)
        frames += 1
except socket.timeout:
    print('drained', frames, 'frames (enable replies included)')

print('--- sending Page.navigate ---')
send_frame(1, json.dumps({'id': 3, 'method': 'Page.navigate',
                          'params': {'url': 'http://127.0.0.1:5173/'}}).encode())

sock.settimeout(6)
seen = []
try:
    while True:
        b1, b2 = recv_exact(2)
        fin, opcode = b1 & 0x80, b1 & 0x0F
        ln = b2 & 0x7F
        if ln == 126:
            ln = struct.unpack('>H', recv_exact(2))[0]
        elif ln == 127:
            ln = struct.unpack('>Q', recv_exact(8))[0]
        data = recv_exact(ln)
        kind = {1: 'text', 2: 'binary', 8: 'close', 9: 'ping', 10: 'pong'}.get(opcode, opcode)
        head = data[:110].decode('utf-8', 'replace').replace('\n', ' ')
        seen.append(f'FIN={1 if fin else 0} op={kind} len={ln} :: {head}')
except socket.timeout:
    print('timed out waiting for more frames')
except Exception as e:
    print('exception:', e)

for s in seen[:25]:
    print('  ', s)
print('total frames after navigate:', len(seen))
