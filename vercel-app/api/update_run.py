"""
PATCH /api/update_run
Body: { run_id, user_role_selected?, report_exported?, session_duration_seconds? }

Called by the frontend to record post-run metadata:
  - which role the user selected on the report page
  - whether they exported a report
  - how long the session lasted
This data feeds the learning cycle analysis.
"""

import sys
import os
import json
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))

UPDATABLE_FIELDS = {'user_role_selected', 'report_exported', 'session_duration_seconds'}


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_PATCH(self):
        try:
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
            supabase = create_client(
                os.environ['SUPABASE_URL'],
                os.environ['SUPABASE_SERVICE_KEY'],
            )
            supabase.table('simulation_runs').update(update_data).eq('id', run_id).execute()
            self._send_json(200, {'ok': True})

        except Exception as exc:
            self._send_error(500, str(exc))

    def _send_json(self, status: int, data: dict):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {'error': message})

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, fmt, *args):
        pass
