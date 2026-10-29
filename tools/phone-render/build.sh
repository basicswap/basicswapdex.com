#!/usr/bin/env bash
# Renders the Mobile hero phone and writes, from the repo root:
#   src/assets/mobile/phone-nexus.png      the phone, display cut out
#   src/components/mobile/phone-screen.json  where the live screen goes
# Needs Blender (4.x, with Cycles) and ImageMagick. Usage: build.sh [samples]
set -euo pipefail
cd "$(dirname "$0")"
root=../..
out=$(mktemp -d)/phone.png
blender -b --python render.py -- "$out" "${1:-384}" 1400 2300 >/dev/null
# Trim the transparent margin (keeping 24 px), and note the trim offset.
read -r ox oy < <(convert "$out" -trim -format '%X %Y\n' info: | tr -d '+')
convert "$out" -trim +repage -bordercolor none -border 24 -depth 8 "$root/src/assets/mobile/phone-nexus.png"
mkdir -p "$root/src/components/mobile"
python3 - "$out.json" "$ox" "$oy" "$root/src/components/mobile/phone-screen.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
dx, dy = 24 - float(sys.argv[2]), 24 - float(sys.argv[3])
(tlx, tly), (trx, try_), (blx, bly) = d['tl'], d['tr'], d['bl']
tlx += dx; tly += dy; trx += dx; try_ += dy; blx += dx; bly += dy
w, h = d['size']
# screen points (u, v) -> image px: x = a*u + c*v + e, y = b*u + d*v + f
matrix = [(trx - tlx) / w, (try_ - tly) / w, (blx - tlx) / h, (bly - tly) / h, tlx, tly]
json.dump({'size': d['size'], 'radius': round(d['radius_pt'], 2),
           'matrix': [round(m, 5) for m in matrix]}, open(sys.argv[4], 'w'), indent=2)
PY
echo done
