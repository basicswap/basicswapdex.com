import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { BLOG_DESCRIPTION, BLOG_TITLE, getPosts, postUrl } from '../../lib/blog';
import { SITE_URL } from '../../config/site';

// /blog/rss.xml: every listed post, newest first, with its description and
// card image. Readers follow the link for the full post.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const items = await Promise.all(
    posts.map(async (post) => {
      const { title, description, date, author, tags, thumbnail } = post.data;
      const image = await getImage({ src: thumbnail, format: 'jpg', width: thumbnail.width });
      return `    <item>
      <title>${esc(title)}</title>
      <link>${postUrl(post)}</link>
      <guid isPermaLink="true">${postUrl(post)}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      <dc:creator>${esc(author)}</dc:creator>
${tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
      <description>${esc(description)}</description>
      <enclosure url="${SITE_URL}${image.src}" type="image/jpeg" length="0" />
    </item>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(BLOG_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${esc(BLOG_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
