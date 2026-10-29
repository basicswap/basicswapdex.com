#!/usr/bin/env node
// Builds the redirect site for docs.basicswapdex.com, for the cutover to
// basicswapdex.com/docs. Every old URL gets a page that sends readers (and
// search engines, through the canonical link) to its new address:
//
//   /docs/intro                   -> /docs
//   /docs/<section>/<page>        -> /docs/<section>/<page>
//   /docs/category/<section>      -> /docs/<section>
//   /docs/category/resources -> /docs/resources (Community tools)
//   / and anything else           -> /docs (404.html keeps the path when it can)
//
//   node tools/docs-redirects.mjs [out-dir]
//
// Publish the output as the docs repository's GitHub Pages site (its CNAME
// stays docs.basicswapdex.com). Run after a build: every target is checked
// against dist/ first.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const out = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'docs-redirects';
const SITE = 'https://basicswapdex.com';
if (!existsSync('dist/docs.html')) {
  console.error('No dist/docs.html: build the site first.');
  process.exit(1);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const page = (to, script = `location.replace(${JSON.stringify(to)} + location.hash)`) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BasicSwap Docs</title>
<link rel="canonical" href="${esc(to)}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>${script}</script>
</head>
<body>
<p>The BasicSwap docs have moved to <a href="${esc(to)}">${esc(to)}</a>.</p>
</body>
</html>
`;

// old path -> new path
const map = new Map([
  ['/', '/docs'],
  ['/docs', '/docs'],
  ['/docs/intro', '/docs'],
  ['/docs/category/about', '/docs/about'],
  ['/docs/category/user-guides', '/docs/user-guides'],
  ['/docs/category/resources', '/docs/resources'],
  ['/docs/resources', '/docs/resources'],
  ['/markdown-page', '/docs'],
]);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
for (const file of walk('src/content/docs').filter((f) => f.endsWith('.mdx'))) {
  const id = relative('src/content/docs', file).replace(/\.mdx$/, '');
  if (id !== 'intro') map.set(`/docs/${id}`, `/docs/${id}`);
}

// every target must exist in the build
const missing = [...new Set(map.values())].filter((to) => !existsSync(`dist${to}.html`));
if (missing.length) {
  console.error(`Targets missing from dist/: ${missing.join(', ')}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
for (const [from, to] of map) {
  const dir = join(out, from);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(`${SITE}${to}`));
}
// Unknown paths: keep /docs/<path> when it is one the site has, else /docs.
const known = JSON.stringify(Object.fromEntries([...map].map(([f, t]) => [f, t])));
writeFileSync(
  join(out, '404.html'),
  page(`${SITE}/docs`, `var m=${known};var p=location.pathname.replace(/\\/$/,'')||'/';location.replace(${JSON.stringify(SITE)}+(m[p]||'/docs')+location.hash)`),
);
writeFileSync(join(out, 'CNAME'), 'docs.basicswapdex.com\n');
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`${out}: ${map.size} redirects, all targets present in dist/`);
