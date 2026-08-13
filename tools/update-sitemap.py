#!/usr/bin/env python3
"""Refresh <lastmod> in sitemap.xml from real file dates.

Stale lastmod values teach Google to distrust the sitemap, so this derives each
date from git (the file's last commit) and falls back to today for files with
uncommitted edits. Run before publishing:

    python3 tools/update-sitemap.py

URLs are extensionless (https://basicswapdex.com/faq); the matching source file
is <slug>.html, and the bare domain maps to index.html.
"""

import datetime
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"
BASE = "https://basicswapdex.com/"


def source_file(loc: str) -> pathlib.Path:
    slug = loc[len(BASE):].strip("/")
    return ROOT / (f"{slug}.html" if slug else "index.html")


def last_modified(path: pathlib.Path) -> str:
    """Commit date of the file, or today if it has uncommitted changes."""
    rel = path.relative_to(ROOT).as_posix()
    try:
        dirty = subprocess.run(
            ["git", "status", "--porcelain", "--", rel],
            cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
        if not dirty:
            committed = subprocess.run(
                ["git", "log", "-1", "--format=%cs", "--", rel],
                cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
            if committed:
                return committed
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return datetime.date.today().isoformat()


def main() -> int:
    xml = SITEMAP.read_text()
    entries = re.findall(r"<url>.*?</url>", xml, re.S)
    missing = []

    for entry in entries:
        loc = re.search(r"<loc>([^<]+)</loc>", entry).group(1)
        path = source_file(loc)
        if not path.exists():
            missing.append(loc)
            continue
        updated = re.sub(r"<lastmod>[^<]*</lastmod>",
                         f"<lastmod>{last_modified(path)}</lastmod>", entry)
        xml = xml.replace(entry, updated)

    SITEMAP.write_text(xml)

    for loc, date in re.findall(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", xml):
        print(f"{date}  {loc}")
    if missing:
        print("\nNo source file for:", ", ".join(missing), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
