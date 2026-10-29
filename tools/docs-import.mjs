#!/usr/bin/env node
// Imports the BasicSwap docs (basicswap/basicswap-docs, a Docusaurus site)
// into the site's docs collection, src/content/docs.
//
//   node tools/docs-import.mjs [path-to-docs-repo] [--force]
//
// Each docs/<path>.md becomes src/content/docs/<path>.mdx, served at
// /docs/<path> (intro is the docs home, /docs). Docusaurus specifics are
// translated: admonitions (:::info Title) become <Callout>, @theme imports
// go (Tabs and TabItem are provided to every page), /img/ images move to
// src/content/docs/images and render through <Img>, and links to
// /docs/intro or the docs subdomain stay on the site. A heading the page
// sets in its body (# Title) becomes its title, as Docusaurus showed it,
// and the old sidebar title stays as the sidebar label. "Last updated"
// comes from the docs repository's git history.
//
// Pages that already exist here are skipped (they may have been edited
// since), unless --force is passed. Empty pages are not imported. Page
// order lives in src/lib/docs.ts, not here.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const repo = resolve(args.find((a) => !a.startsWith('--')) ?? '../basicswap-docs');
const SRC = join(repo, 'docs');
if (!existsSync(SRC)) {
  console.error(`No docs at ${SRC}`);
  process.exit(1);
}
const OUT = 'src/content/docs';
const IMAGES = join(OUT, 'images');
mkdirSync(IMAGES, { recursive: true });

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []));

const yaml = (s) => JSON.stringify(s);
const TITLES = { info: 'Info', note: 'Note', tip: 'Tip', warning: 'Warning', caution: 'Caution', danger: 'Danger' };

function frontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  const data = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { data, body: m ? src.slice(m[0].length) : src };
}

const images = new Set();

function convert(body) {
  let s = body;
  let heading;

  // Docusaurus imports
  s = s.replace(/^import .*$\n?/gm, '');

  // A title set in the body, centred or plain: it becomes the page title.
  s = s.replace(/<div style=\{\{textAlign: 'center'\}\}>\s*#\s+(.+?)\s*<\/div>\n?/, (_, t) => ((heading = t), ''));
  if (!heading) {
    let fenced = false;
    s = s
      .split('\n')
      .filter((line) => {
        if (/^(```|~~~)/.test(line)) fenced = !fenced;
        if (!fenced && !heading && /^# /.test(line)) {
          heading = line.slice(2).trim();
          return false;
        }
        return true;
      })
      .join('\n');
  }

  // Admonitions: ":::type Title" ... ":::" -> <Callout>
  s = s.replace(/^(\s*):::(\w+)(?:[ \t]+(.+))?$/gm, (_, indent, type, title) => {
    const t = title?.trim() || TITLES[type] || type;
    return `${indent}<Callout type="${type}" title=${yaml(t)}>\n`;
  });
  s = s.replace(/^(\s*):::\s*$/gm, (_, indent) => `\n${indent}</Callout>\n`);

  // Images from Docusaurus's static folder
  s = s.replace(/<img\s+src="\/img\/(?:images\/)?([^"]+)"\s+alt="([^"]*)"[^>]*\/>/g, (_, file, alt) => {
    images.add(file);
    return `<Img src="./images/${basename(file)}" alt=${yaml(alt)} />`;
  });
  s = s.replace(/!\[([^\]]*)\]\(\/img\/(?:images\/)?([^)]+)\)/g, (_, alt, file) => {
    images.add(file);
    return `![${alt}](./images/${basename(file)})`;
  });

  // Links stay on the site; the intro is the docs home.
  s = s.replace(/https:\/\/docs\.basicswapdex\.com\/docs\/intro\/?/g, '/docs');
  s = s.replace(/https:\/\/docs\.basicswapdex\.com\/docs\//g, '/docs/');
  s = s.replace(/(\]\(|href=")\/docs\/intro(?=[)#"])/g, '$1/docs');

  s = s.replace(/\bclassName=/g, 'class=');
  return { heading, body: s.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n') };
}

let imported = 0;
let skipped = 0;
for (const file of walk(SRC)) {
  const id = relative(SRC, file).replace(/\.md$/, '');
  const src = readFileSync(file, 'utf8');
  if (!src.trim()) continue; // empty page (resources)
  const out = join(OUT, `${id}.mdx`);
  if (existsSync(out) && !force) {
    skipped++;
    continue;
  }
  const { data, body } = frontmatter(src);
  const { heading, body: mdx } = convert(body);
  const updated = execFileSync('git', ['-C', repo, 'log', '-1', '--format=%cs', '--', relative(repo, file)], { encoding: 'utf8' }).trim();
  const title = heading ?? data.title;
  const front = [
    '---',
    `title: ${yaml(title)}`,
    ...(data.title && data.title !== title ? [`sidebar: ${yaml(data.title)}`] : []),
    `description: ${yaml(data.description ?? '')}`,
    ...(updated ? [`lastUpdated: ${updated}`] : []),
    '---',
    '',
  ].join('\n');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, front + mdx);
  imported++;
}

for (const file of images) {
  const from = join(repo, 'static/img', file.includes('/') ? file : `images/${file}`);
  const alt = join(repo, 'static/img', file);
  const src = existsSync(from) ? from : alt;
  if (existsSync(src)) copyFileSync(src, join(IMAGES, basename(file)));
  else console.warn(`missing image: ${file}`);
}

console.log(`imported ${imported} pages, skipped ${skipped} existing, ${images.size} images`);
