"""
PATCH /api/update_run
Body: { run_id, user_role_selected?, report_exported?, session_duration_seconds? }

Owner-gated. Same OTP session HMAC as lib/auth/session.ts and owner id as
lib/auth/run-identity.ts. Not a second door. No CORS *. Fail closed.
"""

import sys
import os
import json
import base64
import hashlib
import hmac
import time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))

UPDATABLE_FIELDS = {'user_role_selected', 'report_exported', 'session_duration_seconds'}
COOKIE_NAME = 'im_otp_session'
USER_ID_PREFIX = 'im-otp-uid:v1:'
MIN_SECRET = 32


def _service_key() -> str:
    return (
        os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
        or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
    )


def _supabase_url() -> str:
    return (
        os.environ.get('SUPABASE_URL', '').strip()
        or os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
    )


def _b64url_decode(value: str) -> bytes:
    pad = '=' * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + pad)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode('ascii').rstrip('=')


def _cookie_value(cookie_header: str, name: str) -> str | None:
    if not cookie_header:
        return None
    for part in cookie_header.split(';'):
        raw = part.strip()
        if raw.startswith(name + '='):
            return raw[len(name) + 1:]
    return None


def owner_from_request(headers) -> str | None:
    secret = os.environ.get('OTP_SESSION_SECRET', '')
    if len(secret) < MIN_SECRET:
        return None
    token = _cookie_value(headers.get('Cookie', ''), COOKIE_NAME)
    if not token or '.' not in token:
        return None
    body, sig = token.split('.', 1)
    expected = _b64url_encode(
        hmac.new(secret.encode('utf-8'), body.encode('utf-8'), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_b64url_decode(body).decode('utf-8'))
    except Exception:
        return None
    email = str(payload.get('email') or '').strip().lower()
    exp = payload.get('exp')
    if not email or not isinstance(exp, (int, float)):
        return None
    if exp < time.time():
        return None
    digest = hmac.new(
        secret.encode('utf-8'),
        (USER_ID_PREFIX + email).encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    h = digest[:32].ljust(32, '0')
    return f'{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}'


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_PATCH(self):
        try:
            owner = owner_from_request(self.headers)
            if not owner:
                self._send_error(401, 'Unauthorized')
                return

            url = _supabase_url()
            key = _service_key()
            if not url or not key:
                self._send_error(503, 'Service unavailable')
                return

            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length) or b'{}')

            run_id = body.get('run_id')
            if not run_id:
                self._send_error(400, 'Missing run_id')
                return

            update_data = {k: body[k] for k in UPDATABLE_FIELDS if k in body}
            if not update_data:
                self._send_error(400, 'No updatable fields provided')
                return

            from supabase import create_client
            supabase = create_client(url, key)
            result = (
                supabase.table('simulation_runs')
                .update(update_data)
                .eq('id', run_id)
                .eq('user_id', owner)
                .execute()
            )
            if not result.data:
                self._send_error(404, 'Not found')
                return
            self._send_json(200, {'ok': True})

        except Exception:
            self._send_error(500, 'Update failed')

    def _send_json(self, status: int, data: dict):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {'error': message})

    def log_message(self, fmt, *args):
        pass
