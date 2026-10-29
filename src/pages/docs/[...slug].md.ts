import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../../config/site';
import { type Doc, markdownPath, toMarkdown } from '../../lib/docs';

// /docs/<page>.md: each docs page as plain Markdown, listed in /llms.txt.
// The docs home is /docs/index.md.
export const getStaticPaths = (async () => {
  const docs = await getCollection('docs');
  return docs.map((doc) => ({ params: { slug: markdownPath(doc.id).slice('/docs/'.length, -'.md'.length) }, props: { doc } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(toMarkdown((props as { doc: Doc }).doc, SITE_URL), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
