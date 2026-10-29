#!/usr/bin/env node
// Fails when a built page links to an internal URL that does not exist, or
// to an anchor (#id) that is not on the target page. Run after a build:
//
//   npm run build && npm run check:links
//
// Covers every page in dist/, docs and blog included: their links are
// written by hand, so they are the ones that break. Links into a closed tab
// still count, since the anchor is on the page. Every problem is reported
// in one run.
//
// Docs pages are also checked for what search and sharing need: a
// description of 120-160 characters (the range search engines show in
// full), one H1 and no skipped heading levels, and a share card from
// tools/docs-cards.mjs whose title still matches the page.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
  console.error('No dist/: run the build first.');
  process.exit(1);
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));

/** The file a site path is served from, as GitHub Pages resolves it. */
function fileFor(path) {
  const clean = decodeURIComponent(path).replace(/\/$/, '') || '/';
  const candidates = clean === '/' ? ['index.html'] : [`${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`, clean.slice(1)];
  return candidates.map((c) => join(DIST, c)).find((f) => existsSync(f) && !f.endsWith('/'));
}

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};

const broken = [];
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  if (/http-equiv="refresh"/.test(html)) continue; // redirect pages
  const from = '/' + relative(DIST, page).replace(/(index)?\.html$/, '');
  for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    if (href.startsWith('//')) continue;
    const [path, hash] = href.split('#');
    const target = path ? fileFor(path.split('?')[0]) : page;
    if (!target) {
      broken.push(`${from}: ${href} (no such page)`);
      continue;
    }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) broken.push(`${from}: ${href} (no #${hash} on that page)`);
  }
}

// Docs pages
const docsProblems = [];
const docsDir = 'src/content/docs';
for (const file of walk(docsDir).filter((f) => f.endsWith('.mdx'))) {
  const d = readFileSync(file, 'utf8').match(/^description:\s*"?(.*?)"?\s*$/m)?.[1] ?? '';
  if (d.length < 120 || d.length > 160) docsProblems.push(`${relative(docsDir, file)}: description is ${d.length} characters (aim for 120-160)`);
}
const cards = JSON.parse(readFileSync('tools/docs-cards/cards.json', 'utf8'));
const docsPages = pages.filter((p) => /^dist\/docs(\.html|\/)/.test(p) && !/search-index/.test(p));
for (const page of docsPages) {
  const html = readFileSync(page, 'utf8');
  if (/http-equiv="refresh"/.test(html)) continue;
  const from = '/' + relative(DIST, page).replace(/\.html$/, '');
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  if (levels.filter((l) => l === 1).length !== 1) docsProblems.push(`${from}: ${levels.filter((l) => l === 1).length} H1 headings (want 1)`);
  levels.forEach((l, i) => {
    if (i > 0 && l > levels[i - 1] + 1) docsProblems.push(`${from}: heading jumps from h${levels[i - 1]} to h${l}`);
  });
  const card = html.match(/<meta property="og:image" content="https?:\/\/[^/"]+(\/og\/docs\/[^"]+)"/)?.[1];
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
  if (!card || !existsSync(join('public', card))) docsProblems.push(`${from}: no share card (run npm run docs:cards)`);
  else if (cards[card] !== h1) docsProblems.push(`${from}: share card says "${cards[card]}", page says "${h1}" (run npm run docs:cards)`);
}

if (docsProblems.length) console.error(`Docs pages (${docsProblems.length}):\n  ${docsProblems.join('\n  ')}\n`);
if (broken.length) console.error(`Broken internal links (${broken.length}):\n  ${[...new Set(broken)].join('\n  ')}`);
if (broken.length || docsProblems.length) process.exit(1);
console.log(`Links: ${pages.length} pages checked, no broken internal links. Docs: ${docsPages.length} pages checked.`);
