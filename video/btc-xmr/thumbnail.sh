#!/usr/bin/env bash
# Renders the thumbnail (scenes/thumbnail.js) to out/thumbnail.png.
# explainroo only reads files inside a project folder, so this builds a
# throwaway project from lib/, assets/ and look.json around that one scene.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
explainroo="${EXPLAINROO:-$HOME/Applications/explainroo/bin/explainroo.js}"
tmp="$here/build/thumbnail"
mkdir -p "$tmp/scenes" "$here/out"
cp -r "$here/lib" "$here/assets" "$here/look.json" "$tmp/"
cp "$here/scenes/thumbnail.js" "$tmp/scenes/"
cat > "$tmp/video.json" <<'EOF'
{"title":"BTC <> XMR Atomic Swaps Explained","theme":"look.json","size":"16:9","voice":"af_heart",
 "captions":false,"watermark":false,"lead":0,"hold":1,
 "fonts":[{"family":"Instrument Sans","src":"assets/fonts/InstrumentSans-wght.woff2","weight":"400 700"}]}
EOF
printf '# Thumbnail\n\n## thumbnail\nAtomic swaps explained.\n' > "$tmp/script.md"
printf "import thumbnail from './scenes/thumbnail.js';\nexport default { thumbnail };\n" > "$tmp/scenes.js"
node "$explainroo" voice "$tmp"
node "$explainroo" still "$tmp" "thumbnail@${1:-0.5}"
cp "$tmp/out/stills/thumbnail@${1:-0.5}.png" "$here/out/thumbnail.png"
echo "$here/out/thumbnail.png"
