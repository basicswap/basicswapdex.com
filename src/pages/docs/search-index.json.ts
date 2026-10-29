import type { APIRoute } from 'astro';
import { render } from 'astro:content';
import { DOC_SECTIONS, docPath, getDocs } from '../../lib/docs';

// /docs/search-index.json, read by the docs search dialog. One entry per
// page (its intro text), then one per ## or ### section, linking to that
// section's anchor. Anchors come from the rendered page, so they always
// match the ids on the page.
type Entry = { page: string; section: string; heading?: string; href: string; text: string };

/** Markdown and MDX source to plain text, keeping component props' words. */
function plain(src: string) {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[A-Z]\w*\s+([^>]*?)\/?>/g, (_, props: string) => [...props.matchAll(/\w+=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2]).join(' '))
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\s)[*_]([^*_]+)[*_]/g, '$1$2')
    .replace(/^\s*[-*+]\s+|^\s*\d+\.\s+|^\s*>\s?/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const norm = (s: string) => plain(s).toLowerCase();

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const out: Entry[] = [];
  for (const section of DOC_SECTIONS) {
    for (const id of section.items) {
      const doc = docs.get(id);
      if (!doc) continue;
      const { headings } = await render(doc);
      const anchors = headings.filter((h) => h.depth === 2 || h.depth === 3);
      const page = doc.data.title;
      const href = docPath(id);

      // split the source at its ## and ### headings (outside code)
      const parts: { heading?: string; lines: string[] }[] = [{ lines: [] }];
      let fenced = false;
      for (const line of (doc.body ?? '').split('\n')) {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        const h = !fenced && line.match(/^\s*#{2,3}\s+(.+)$/);
        if (h) parts.push({ heading: h[1].trim(), lines: [] });
        else parts[parts.length - 1].lines.push(line);
      }

      let next = 0;
      for (const part of parts) {
        const text = plain(part.lines.join('\n'));
        if (!part.heading) {
          out.push({ page, section: section.title, href, text: `${doc.data.description} ${text}`.trim() });
          continue;
        }
        const i = anchors.findIndex((a, k) => k >= next && norm(a.text) === norm(part.heading!));
        if (i >= 0) next = i + 1;
        out.push({ page, section: section.title, heading: plain(part.heading), href: i >= 0 ? `${href}#${anchors[i].slug}` : href, text });
      }
    }
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
};
