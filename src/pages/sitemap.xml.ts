import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';
import { getPosts, isoDate, postPath, tagIndex, tagPath } from '../lib/blog';
import { DOC_SECTIONS, docPath, docUpdated, getDocs } from '../lib/docs';
import { gitDate } from '../lib/git-date';

// /sitemap.xml, the same path Search Console already has. Same URLs,
// changefreq and priority as the legacy sitemap. lastmod is the date of the
// page source's last commit, or today when it has uncommitted edits, so it
// never claims a change that did not happen.
const PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/bitcoin-to-monero', changefreq: 'monthly', priority: '0.9' },
  { path: '/desktop', changefreq: 'monthly', priority: '0.8' },
  { path: '/mobile', changefreq: 'monthly', priority: '0.8' },
  { path: '/web', changefreq: 'monthly', priority: '0.7' },
  { path: '/protocol', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.7' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/donations', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/links', changefreq: 'monthly', priority: '0.5' },
];

const today = () => new Date().toISOString().slice(0, 10);

function lastmod(path: string): string {
  const date = gitDate(`src/pages/${path === '/' ? 'index' : path.slice(1)}.astro`);
  return date ? isoDate(date) : today();
}

type Entry = { path: string; lastmod: string; changefreq: string; priority: string };

/** The blog: its front page and tag pages change with the newest post. */
async function blogEntries(): Promise<Entry[]> {
  const posts = await getPosts();
  const newest = isoDate(posts[0].data.date);
  return [
    { path: '/blog', lastmod: newest, changefreq: 'weekly', priority: '0.8' },
    { path: '/blog/tags', lastmod: newest, changefreq: 'weekly', priority: '0.4' },
    ...tagIndex(posts).map(({ tag, posts: tagged }) => ({ path: tagPath(tag), lastmod: isoDate(tagged[0].data.date), changefreq: 'weekly', priority: '0.4' })),
    ...posts.map((post) => ({ path: postPath(post), lastmod: isoDate(post.data.date), changefreq: 'monthly', priority: '0.7' })),
  ];
}

/** The docs: each page dated by its "last updated", sections by their newest page. */
async function docsEntries(): Promise<Entry[]> {
  const docs = await getDocs();
  const updated = (id: string) => {
    const doc = docs.get(id);
    return doc && docUpdated(doc);
  };
  const newest = (ids: string[]) => isoDate(new Date(Math.max(...ids.map((id) => updated(id)?.valueOf() ?? 0))));
  return [
    ...[...docs.values()].map((doc) => ({
      path: docPath(doc.id),
      lastmod: updated(doc.id) ? isoDate(updated(doc.id)!) : today(),
      changefreq: 'monthly',
      priority: doc.id === 'intro' ? '0.8' : '0.6',
    })),
    ...DOC_SECTIONS.filter((s) => s.slug).map((s) => ({ path: `/docs/${s.slug}`, lastmod: newest(s.items), changefreq: 'monthly', priority: '0.5' })),
  ];
}

export const GET: APIRoute = async () => {
  const entries: Entry[] = [
    ...PAGES.map((page) => ({ ...page, lastmod: lastmod(page.path) })),
    ...(await blogEntries()),
    ...(await docsEntries()),
  ];
  const urls = entries
    .map(
      ({ path, lastmod, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
