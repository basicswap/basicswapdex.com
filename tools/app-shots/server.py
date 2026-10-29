#!/usr/bin/env python3
"""A stand-in BasicSwap backend for capturing the app's real UI.

Renders BasicSwap's own templates (Jinja2) with the example data in mock.py,
serves its static CSS/JS untouched, and answers the page scripts' /json/*
calls with the same example data. Nothing here talks to a coin or a network.

    python3 server.py BASICSWAP_SRC [PORT]

BASICSWAP_SRC is a BasicSwap checkout (the folder holding basicswap/templates).
Needs Jinja2 (pass its folder in PYTHONPATH if it isn't installed).
"""
import json
import mimetypes
import os
import sys
import time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from jinja2 import ChainableUndefined, Environment, FileSystemLoader, select_autoescape

sys.path.insert(0, os.path.dirname(__file__))
import mock  # noqa: E402

SRC = os.path.abspath(sys.argv[1])
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 12799
TEMPLATES = os.path.join(SRC, "basicswap", "templates")
STATIC = os.path.join(SRC, "basicswap", "static")
VERSION = "0.19.0"


def formatts(ts, with_ago=True, is_expired=False):
    try:
        diff = int(time.time()) - int(ts)
    except (TypeError, ValueError):
        return ""
    d = abs(diff)
    h, m = d // 3600, (d % 3600) // 60
    s = f"{h} hrs {m} mins" if h else f"{m} mins"
    if diff < 0:  # in the future
        return f"in {s}"
    return f"{s} ago" if with_ago and not is_expired else s


env = Environment(
    loader=FileSystemLoader(TEMPLATES),
    autoescape=select_autoescape(["html", "xml"]),
    undefined=ChainableUndefined,
)
env.filters["formatts"] = formatts

BASE = {
    "title": "BasicSwap",
    "h2": "BasicSwap",
    "form_id": "demo",
    "version": VERSION,
    "gui_version": "3.3.0",
    "amm_version": "1.0.0",
    "static_v": VERSION,
    "ws_port": "11700",
    "current_status": "running",
    "amm_active_count": 3,
    "encrypted": True,
    "locked": False,
    "use_tor_proxy": True,
    "tor_established": True,
    "shutdown_token": "demo",
    "notifications": [],
    "summary": mock.SUMMARY,
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, body: bytes, ctype: str, code: int = 200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def page(self, name, rest, query):
        tpl, ctx = mock.PAGES[name](rest, query)
        args = {**BASE, **ctx, "current_page": name}
        for k in ("messages", "err_messages"):
            args[k] = list(enumerate(args.get(k, [])))
        html = env.get_template(tpl).render(**args)
        self.send(html.encode(), "text/html; charset=utf-8")

    def route(self, method):
        url = urlparse(self.path)
        path = url.path
        query = {k: v[0] for k, v in parse_qs(url.query).items()}
        if path.startswith("/static/"):
            f = os.path.normpath(os.path.join(STATIC, path[len("/static/"):]))
            if not f.startswith(STATIC) or not os.path.isfile(f):
                return self.send(b"", "text/plain", 404)
            ctype = mimetypes.guess_type(f)[0] or "application/octet-stream"
            return self.send(open(f, "rb").read(), ctype)
        if path == "/json" or path.startswith(("/json/", "/amm/", "/mock/")):
            body = self.rfile.read(int(self.headers.get("Content-Length") or 0)) if method == "POST" else b""
            data = mock.api(path, body)
            return self.send(json.dumps(data).encode(), "application/json")
        name, *rest = path.strip("/").split("/")
        if name in mock.PAGES:
            return self.page(name, rest, query)
        self.send(b"not mocked", "text/plain", 404)

    def do_GET(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")


if __name__ == "__main__":
    print(f"mock BasicSwap {VERSION} on http://127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
