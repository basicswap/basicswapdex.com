// Share cards for the docs, in the style of the blog's release art
// (basicswap-blog scripts/generate-release-art.sh): the same template,
// fonts and ImageMagick render, with each page's title where a release has
// its version. Reads every built docs page in dist/ for its H1, its section
// (article:section) and the card path it links (og:image), and writes the
// 1200x630 JPEGs to public/og/docs/ and dist/og/docs/. Commit the results.
//
//   npm run build && npm run docs:cards
//
// Needs ImageMagick (convert) and the DejaVu Sans fonts, like the blog's
// script. tools/check-links.mjs fails the build when a card is missing or
// its title no longer matches the page.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const TEMPLATE = readFileSync(join(ROOT, 'tools/docs-cards/card.svg'), 'utf8');
const SHOTS = join(ROOT, 'src/content/docs/images');
const MANIFEST = join(ROOT, 'tools/docs-cards/cards.json');

// The UI screenshot in the card's panel: the page's own subject where there
// is one, the order book otherwise.
const PANEL = {
  '/docs/user-guides/make-offer': 'docs-new-offer-trade.webp',
  '/docs/user-guides/take-offer': 'docs-send-bid.webp',
  '/docs/user-guides/smart-buy': 'docs-smart-buy.webp',
  '/docs/user-guides/manage-enabled-coins': 'docs-wallets.webp',
  '/docs/user-guides/backup-and-restore': 'docs-wallets.webp',
};
const DEFAULT_PANEL = 'docs-order-book.webp';

const FONT = 'DejaVu-Sans-Bold';
const MAX_WIDTH = 700;
const LAST_BASELINE = 397;
const TITLE_TOP = 238; // below the eyebrow's bars
const SPACING = -0.045; // letter-spacing, in em, as the release art tightens its version

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' });
const widthCache = new Map();
/** Rendered width of `text` at 100pt in DejaVu Sans Bold, without letter-spacing. */
function width100(text) {
  if (!widthCache.has(text)) {
    widthCache.set(text, Number(sh('convert', ['-font', FONT, '-pointsize', '100', `label:${text}`, '-format', '%w', 'info:'])));
  }
  return widthCache.get(text);
}
const lineWidth = (line, size) => ((width100(line) + SPACING * 100 * (line.length - 1)) * size) / 100;

/** The largest size that fits the title in the space, and its lines. */
function layoutTitle(title) {
  const words = title.split(' ');
  for (let size = 132; size >= 44; size -= 2) {
    const lineHeight = size * 1.06;
    const maxLines = Math.max(1, Math.floor((LAST_BASELINE - TITLE_TOP - size * 0.74) / lineHeight) + 1);
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && lineWidth(next, size) > MAX_WIDTH) {
        lines.push(current);
        current = word;
      } else current = next;
    }
    lines.push(current);
    if (lines.length <= maxLines && lines.every((l) => lineWidth(l, size) <= MAX_WIDTH)) return { size, lines, lineHeight };
  }
  throw new Error(`Title too long for a card: ${title}`);
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

const tmp = mkdtempSync(join(tmpdir(), 'docs-cards-'));
const manifest = {};
try {
  const panels = new Map();
  const panelPng = (file) => {
    if (!panels.has(file)) {
      const out = join(tmp, file.replace(/\.webp$/, '.png'));
      sh('convert', [join(SHOTS, file), '-resize', '1008x', out]);
      panels.set(file, out);
    }
    return panels.get(file);
  };

  const pages = [join(DIST, 'docs.html'), ...htmlFiles(join(DIST, 'docs'))];
  for (const file of pages) {
    const doc = parse(readFileSync(file, 'utf8'));
    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';
    const card = image.match(/\/og\/docs\/.+\.jpg$/)?.[0];
    if (!card) continue;
    const pagePath = doc.querySelector('meta[property="og:url"]').getAttribute('content').replace(/^https?:\/\/[^/]+/, '');
    const title = doc.querySelector('h1').text.trim();
    const section = doc.querySelector('meta[property="article:section"]')?.getAttribute('content');
    const eyebrow = section ? `DOCS · ${section.toUpperCase()}` : 'DOCUMENTATION';

    const { size, lines, lineHeight } = layoutTitle(title);
    const first = LAST_BASELINE - (lines.length - 1) * lineHeight;
    const tspans = lines
      .map((line, i) => `<tspan x="${size > 100 ? 62 : 66}" y="${(first + i * lineHeight).toFixed(1)}">${xml(line)}</tspan>`)
      .join('');
    const svg = TEMPLATE.replace('__EYEBROW__', xml(eyebrow))
      .replace('__TITLE_SIZE__', String(size))
      .replace('__TITLE_SPACING__', (SPACING * size).toFixed(1))
      .replace('__TITLE_LINES__', tspans)
      .replace('__UI_ASSET__', panelPng(PANEL[pagePath] ?? DEFAULT_PANEL));
    const svgFile = join(tmp, 'card.svg');
    writeFileSync(svgFile, svg);

    for (const base of [join(ROOT, 'public'), DIST]) {
      const out = join(base, card);
      mkdirSync(dirname(out), { recursive: true });
      sh('convert', ['-background', '#111827', svgFile, '-resize', '1200x630!', '-strip', '-quality', '90', out]);
    }
    manifest[card] = title;
    console.log(`${card}  ${size}px, ${lines.length} line${lines.length > 1 ? 's' : ''}  ${title}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

writeFileSync(MANIFEST, `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)}\n`);
console.log(`${Object.keys(manifest).length} cards`);
