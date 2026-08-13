#!/usr/bin/env python3
"""Serve the site locally with GitHub Pages' URL semantics.

Internal links are extensionless (`/faq`, not `/faq.html`), which GitHub Pages
resolves but `python3 -m http.server` does not — under the plain server every
nav link 404s. This mirrors production:

  /            -> index.html
  /faq         -> faq.html
  /faq/        -> faq/index.html, else faq.html
  anything else-> 404.html, served with a real 404 status

Usage:
    python3 tools/serve.py            # http://localhost:8000, or the next free port
    python3 tools/serve.py 3000       # pick a port
"""

import errno
import functools
import http.server
import os
import pathlib
import socketserver
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class GitHubPagesHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        local = pathlib.Path(super().translate_path(path))

        # Directory request: prefer its index.html, else the sibling .html file
        # (GitHub Pages serves /faq/ from faq.html when no faq/ directory exists).
        if local.is_dir():
            index = local / "index.html"
            if index.exists():
                return str(index)
            sibling = local.with_suffix(".html")
            if sibling.is_file():
                return str(sibling)

        # Extensionless request: /faq -> faq.html
        if not local.exists() and not local.suffix:
            candidate = local.with_suffix(".html")
            if candidate.is_file():
                return str(candidate)

        return str(local)

    def send_error(self, code, message=None, explain=None):
        """Serve the real 404 page, like GitHub Pages does."""
        if code == 404:
            page = ROOT / "404.html"
            if page.is_file():
                body = page.read_bytes()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


DEFAULT_PORT = 8000
FALLBACKS = 20  # ports to try past the default before giving up


class Server(socketserver.TCPServer):
    allow_reuse_address = True


def serve(port: int, chosen_by_user: bool) -> int:
    os.chdir(ROOT)
    handler = functools.partial(GitHubPagesHandler, directory=str(ROOT))

    # An explicit port is honoured exactly; the default may drift past whatever
    # else on the machine already holds 8000.
    candidates = [port] if chosen_by_user else range(port, port + FALLBACKS + 1)

    for candidate in candidates:
        try:
            httpd = Server(("", candidate), handler)
        except OSError as exc:
            if exc.errno != errno.EADDRINUSE:
                raise
            continue

        with httpd:
            if candidate != port:
                print(f"Port {port} was busy, using {candidate} instead.")
            print(f"Serving {ROOT} at http://localhost:{candidate}  (Ctrl-C to stop)")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nStopped.")
        return 0

    if chosen_by_user:
        print(
            f"Port {port} is already in use. Try a different one:\n"
            f"    python3 tools/serve.py {port + 1}\n"
            f"To see what is holding it:\n"
            f"    lsof -i tcp:{port}",
            file=sys.stderr,
        )
    else:
        print(
            f"Ports {port}-{port + FALLBACKS} are all in use. "
            f"Pass a free port, e.g. python3 tools/serve.py 9000",
            file=sys.stderr,
        )
    return 1


def main() -> int:
    if len(sys.argv) > 1:
        try:
            return serve(int(sys.argv[1]), chosen_by_user=True)
        except ValueError:
            print(f"Not a port number: {sys.argv[1]}", file=sys.stderr)
            return 2
    return serve(DEFAULT_PORT, chosen_by_user=False)


if __name__ == "__main__":
    raise SystemExit(main())
