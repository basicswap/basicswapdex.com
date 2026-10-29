#!/usr/bin/env node
// Imports posts from the old Next.js blog (basicswap/basicswap-blog) into the
// site's blog collection, src/content/blog.
//
//   node tools/blog-import.mjs [path-to-blog-repo] [--force]
//
// Each post's src/app/<slug>/meta.ts becomes frontmatter, and its page.mdx
// loses the Next.js wrapper (imports, metadata export, Layout). Images move
// from public/images/blog to src/content/blog/images, so Astro optimizes
// them. Links to blog.basicswapdex.com become /blog/<slug>, and YouTube
// iframes become <YouTube>, and headings move down a level under the page's
// h1. The cached link previews and their images come
// along too.
//
// Posts that already exist here are skipped (they may have been edited
// since), unless --force is passed. Unpublished drafts are never imported.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const repo = resolve(args.find((a) => !a.startsWith('--')) ?? '../basicswap-blog/basicswap-blog');
const appDir = join(repo, 'src/app');
if (!existsSync(appDir)) {
  console.error(`No Next.js app at ${appDir}`);
  process.exit(1);
}

const OUT = 'src/content/blog';
const IMAGES = join(OUT, 'images');
const PREVIEWS = 'src/data/link-previews.json';
const PREVIEW_IMAGES = 'src/assets/link-previews';
mkdirSync(IMAGES, { recursive: true });
mkdirSync(PREVIEW_IMAGES, { recursive: true });

const OLD_BLOG = /https:\/\/blog\.basicswapdex\.com\/([a-z0-9_-]+)\/?/g;
const yaml = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars

/** The post's metadata: meta.ts holds one object literal (JSON or JS syntax). */
function readMeta(dir) {
  const src = readFileSync(join(dir, 'meta.ts'), 'utf8');
  const literal = src.slice(src.indexOf('{', src.indexOf('PostMetadata =')), src.lastIndexOf('}') + 1);
  return new Function(`return (${literal});`)();
}

const usedImages = new Set();
const image = (p) => {
  const name = basename(p);
  usedImages.add(name);
  return `./images/${name}`;
};

function convert(body) {
  let s = body;

  // The Next.js wrapper: imports, the metadata export and the Layout.
  s = s.replace(/^import .*$\n?/gm, '');
  s = s.replace(/^export \{ post \};\n?/m, '');
  s = s.replace(/^export const metadata = .*$\n?/m, '');
  s = s.replace(/^export default function Layout[\s\S]*?\n\}\n?/m, '');

  // YouTube iframes (in a padded wrapper) become the YouTube component.
  s = s.replace(
    /<div style=\{\{[^}]*\}\}>\s*<iframe\s+src="https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})[^"]*"[\s\S]*?<\/iframe>\s*<\/div>/g,
    '<YouTube videoId="$1" />',
  );

  // Raw <img> tags become <Img>, which resolves and optimizes the file.
  s = s.replace(/<img\s/g, '<Img ');

  // Images: /images/blog/x -> ./images/x, in markdown, JSX props and arrays.
  s = s.replace(/\/images\/blog\/([A-Za-z0-9_.-]+)/g, (_, f) => image(f));

  // Links to the old blog subdomain stay on the site, and links that were
  // relative to it (/<slug>) gain the /blog prefix.
  s = s.replace(OLD_BLOG, '/blog/$1');
  s = s.replace(/(\]\(|href=")\/([a-z0-9_-]+)\/?(?=[)#"])/g, (m, pre, slug) => (existsSync(join(appDir, slug, 'page.mdx')) ? `${pre}/blog/${slug}` : m));

  // JSX's className is class in Astro.
  s = s.replace(/\bclassName=/g, 'class=');

  // The page's title is its h1, so the post's own headings move down a
  // level: # sections become h2. Code fences are left alone.
  let fenced = false;
  s = s
    .split('\n')
    .map((line) => {
      if (/^(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced && /^#{1,5} /.test(line) ? `#${line}` : line;
    })
    .join('\n');

  return s.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
}

let imported = 0;
let skipped = 0;
for (const entry of readdirSync(appDir, { withFileTypes: true })) {
  const dir = join(appDir, entry.name);
  if (!entry.isDirectory() || !existsSync(join(dir, 'meta.ts')) || !existsSync(join(dir, 'page.mdx'))) continue;
  const meta = readMeta(dir);
  const out = join(OUT, `${meta.slug}.mdx`);
  if (existsSync(out) && !force) {
    skipped++;
    continue;
  }
  const front = [
    '---',
    `title: ${yaml(meta.title)}`,
    `date: ${meta.date}`,
    `author: ${yaml(meta.author)}`,
    `tags: [${meta.tags.map(yaml).join(', ')}]`,
    `description: ${yaml(meta.description)}`,
    `thumbnail: ${image(meta.thumbnail)}`,
    ...(meta.bannerImage ? [`banner: ${image(meta.bannerImage)}`] : []),
    '---',
    '',
  ].join('\n');
  writeFileSync(out, front + convert(readFileSync(join(dir, 'page.mdx'), 'utf8')));
  imported++;
}

// Images the imported posts use.
const publicBlog = join(repo, 'public/images/blog');
for (const name of usedImages) {
  const from = join(publicBlog, name);
  if (existsSync(from)) copyFileSync(from, join(IMAGES, name));
  else console.warn(`missing image: ${name}`);
}

// Author avatars.
mkdirSync('src/assets/authors', { recursive: true });
for (const name of readdirSync(join(repo, 'public/images/authors'))) {
  copyFileSync(join(repo, 'public/images/authors', name), join('src/assets/authors', name));
}

// Link previews: the old build's cache of each linked page's title,
// description and image. Previews of blog posts come from the posts.
const cachePath = join(repo, '.next-url-cache.json');
if (existsSync(cachePath)) {
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  const previews = existsSync(PREVIEWS) ? JSON.parse(readFileSync(PREVIEWS, 'utf8')) : {};
  for (const [url, { data }] of Object.entries(cache)) {
    if (url.startsWith('https://blog.basicswapdex.com/') || data.error) continue;
    let img;
    if (data.ogImage?.startsWith('/og-cache/')) {
      const file = basename(data.ogImage);
      const src = join(repo, 'public', data.ogImage);
      if (existsSync(src)) {
        img = `${file.slice(0, 16)}${extname(file)}`;
        copyFileSync(src, join(PREVIEW_IMAGES, img));
      }
    }
    previews[url] = {
      title: data.ogTitle || data.title || url,
      description: data.ogDescription || data.description || undefined,
      site: data.ogSiteName || undefined,
      image: img,
    };
  }
  writeFileSync(PREVIEWS, JSON.stringify(previews, null, 2) + '\n');
}

console.log(`imported ${imported} posts, skipped ${skipped} existing, ${usedImages.size} images`);
