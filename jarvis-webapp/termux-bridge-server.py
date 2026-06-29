#!/data/data/com.termux/files/usr/bin/env python3
"""
JARVIS Termux Bridge Server
===========================
Winziger lokaler HTTP-Server, der in Termux läuft, damit die JARVIS-Webapp
Befehle ausführen UND die Ausgabe gespiegelt anzeigen kann.

Start in Termux:
    python ~/jarvis-bridge.py
    # oder mit Token (empfohlen):
    BRIDGE_TOKEN=geheim python ~/jarvis-bridge.py
    # oder anderer Port:
    BRIDGE_PORT=8090 python ~/jarvis-bridge.py

Trage in der Webapp (Termux-Tab) dieselbe URL (http://localhost:8080) und
ggf. denselben Token ein, dann "Verbinden".

⚠️ SICHERHEIT: Der Server führt beliebige Shell-Befehle aus. Er lauscht nur
auf 127.0.0.1 (nicht im Netzwerk). Setze trotzdem einen BRIDGE_TOKEN — sonst
könnte jede im Browser geöffnete Seite Befehle an localhost:8080 senden.
"""

import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("BRIDGE_PORT", "8080"))
TOKEN = os.environ.get("BRIDGE_TOKEN", "")
TIMEOUT = int(os.environ.get("BRIDGE_TIMEOUT", "60"))


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _auth_ok(self):
        if not TOKEN:
            return True
        return self.headers.get("X-Token", "") == TOKEN

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/health"):
            self._json(200, {"ok": True, "service": "jarvis-bridge"})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/exec"):
            self._json(404, {"error": "not found"})
            return
        if not self._auth_ok():
            self._json(401, {"error": "unauthorized"})
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n) or b"{}")
            cmd = body.get("cmd", "")
        except Exception as e:
            self._json(400, {"error": "bad request: %s" % e})
            return
        if not cmd.strip():
            self._json(400, {"error": "empty command"})
            return
        try:
            p = subprocess.run(
                ["bash", "-lc", cmd],
                capture_output=True,
                text=True,
                timeout=TIMEOUT,
            )
            self._json(200, {"stdout": p.stdout, "stderr": p.stderr, "code": p.returncode})
        except subprocess.TimeoutExpired:
            self._json(200, {"stdout": "", "stderr": "Timeout nach %ds" % TIMEOUT, "code": 124})
        except Exception as e:
            self._json(200, {"stdout": "", "stderr": str(e), "code": 1})

    def log_message(self, *args):
        pass  # leise


if __name__ == "__main__":
    print("JARVIS Termux Bridge läuft auf http://127.0.0.1:%d" % PORT)
    print("Token:", "gesetzt" if TOKEN else "KEINER (mit BRIDGE_TOKEN absichern!)")
    print("Beenden mit Strg+C")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
