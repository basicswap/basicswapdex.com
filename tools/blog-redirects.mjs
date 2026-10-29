#!/usr/bin/env node
// Builds the redirect site for blog.basicswapdex.com, for the cutover to
// basicswapdex.com/blog. Every old URL gets a page that sends readers (and
// search engines, through the canonical link) to its new address:
//
//   /<slug>/          -> /blog/<slug> (retired posts -> /blog)
//   /tags/<Tag>/      -> /blog/tags/<tag-slug>
//   /tags/, /         -> /blog/tags, /blog
//   anything else     -> /blog (404.html)
//
// Post images stay at their old /images/... paths, so embeds of them on
// other sites keep working.
//
//   node tools/blog-redirects.mjs [out-dir] [--images <blog-repo>/public/images]
//
// Publish the output as the blog repository's GitHub Pages site (its CNAME
// stays blog.basicswapdex.com).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const imagesAt = args.indexOf('--images');
const images = imagesAt >= 0 ? args[imagesAt + 1] : undefined;
const out = args.find((a, i) => !a.startsWith('--') && (imagesAt < 0 || i !== imagesAt + 1)) ?? 'blog-redirects';
const SITE = 'https://basicswapdex.com';
const tagSlug = (tag) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const page = (to, title = 'BasicSwap Blog') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</title>
<link rel="canonical" href="${to}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace(${JSON.stringify(to)} + location.hash)</script>
</head>
<body>
<p>The BasicSwap Blog has moved to <a href="${to}">${to}</a>.</p>
</body>
</html>
`;

const write = (path, to, title) => {
  mkdirSync(join(out, path), { recursive: true });
  writeFileSync(join(out, path, 'index.html'), page(to, title));
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const dir = 'src/content/blog';
const tags = new Set();
let posts = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
  const slug = file.slice(0, -4);
  const front = readFileSync(join(dir, file), 'utf8').split('---')[1];
  const title = JSON.parse(front.match(/^title: (.*)$/m)[1]);
  for (const t of JSON.parse(front.match(/^tags: (.*)$/m)[1])) tags.add(t);
  write(slug, `${SITE}/blog/${slug}`, title);
  posts++;
}
// Posts removed from the new blog keep a redirect to the blog's front page.
const RETIRED = ['mdx-showcase-post'];
for (const slug of RETIRED) write(slug, `${SITE}/blog`);
for (const tag of tags) write(join('tags', tag), `${SITE}/blog/tags/${tagSlug(tag)}`);
// Tags merged into another, old name first.
const MERGED = { 'Coin Updates': 'Coin Update' };
for (const [from, to] of Object.entries(MERGED)) write(join('tags', from), `${SITE}/blog/tags/${tagSlug(to)}`);
write('tags', `${SITE}/blog/tags`);
write('', `${SITE}/blog`);
writeFileSync(join(out, '404.html'), page(`${SITE}/blog`));
writeFileSync(join(out, 'CNAME'), 'blog.basicswapdex.com\n');
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

if (images) {
  if (!existsSync(images)) throw new Error(`No images at ${images}`);
  cpSync(images, join(out, 'images'), { recursive: true });
}

console.log(`${out}: ${posts} posts, ${tags.size} tags${images ? ', images copied' : ''}`);
