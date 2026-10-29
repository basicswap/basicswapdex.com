import { getCollection, type CollectionEntry } from 'astro:content';
import type { IconName } from '../components/Icon.astro';
import { gitDate } from './git-date';

export type Doc = CollectionEntry<'docs'>;

export const DOCS_TITLE = 'BasicSwap Docs';
export const DOCS_REPO_EDIT = 'https://github.com/basicswap/basicswapdex.com/edit/main/src/content/docs';

export interface DocSection {
  title: string;
  /** The section page's <title>. */
  seoTitle?: string;
  icon: IconName;
  /** The section's own page (/docs/<slug>), listing its pages. */
  slug?: string;
  description?: string;
  /** Page ids in order: src/content/docs/<id>.mdx */
  items: string[];
}

// The sidebar, in reading order. A page that is not listed here still
// builds, but has no place in the sidebar or in previous/next.
export const DOC_SECTIONS: DocSection[] = [
  { title: 'Overview', icon: 'book', items: ['intro'] },
  {
    title: 'About BasicSwap',
    seoTitle: 'About BasicSwap: How the DEX Works',
    icon: 'nodes',
    slug: 'about',
    description:
      'How BasicSwap works, with its two atomic swap protocols and the message networks that carry offers and swaps, and how it compares with other exchanges.',
    items: ['about/under-the-hood', 'about/dex-comparison'],
  },
  {
    title: 'User Guides',
    seoTitle: 'BasicSwap User Guides: Install and Trade',
    icon: 'download',
    slug: 'user-guides',
    description:
      'Guides for running BasicSwap: installing, updating and backing it up, choosing coins and networks, Tor, making and taking offers, Smart Buy and market making.',
    items: [
      'user-guides/install',
      'user-guides/prepare-options',
      'user-guides/update',
      'user-guides/backup-and-restore',
      'user-guides/enable-disable-coins',
      'user-guides/manage-enabled-coins',
      'user-guides/lightweight-modes',
      'user-guides/tor',
      'user-guides/message-networks',
      'user-guides/web-ui-authentication',
      'user-guides/price-data',
      'user-guides/make-offer',
      'user-guides/take-offer',
      'user-guides/smart-buy',
      'user-guides/market-making',
      'user-guides/troubleshooting',
      'user-guides/integrate-coin',
    ],
  },
  { title: 'Reference', icon: 'blocks', items: ['api', 'resources'] },
];

/** The docs home is the intro; every other page sits at /docs/<id>. */
export const docPath = (id: string) => (id === 'intro' ? '/docs' : `/docs/${id}`);

export async function getDocs() {
  const docs = await getCollection('docs');
  return new Map(docs.map((d) => [d.id, d]));
}

export const navLabel = (doc: Doc) => doc.data.sidebar ?? doc.data.title;

/** The page's source file, for its git date and "Edit this page". */
export const docFile = (id: string) => `src/content/docs/${id}.mdx`;

/** A docs page's share card, made by tools/docs-cards.mjs into public/og/docs. */
export const cardPath = (pagePath: string) => `/og${pagePath === '/docs' ? '/docs/index' : pagePath}.jpg`;

/** One date for the visible "last updated", JSON-LD, og and the sitemap. */
export const docUpdated = (doc: Doc) => gitDate(docFile(doc.id)) ?? doc.data.lastUpdated;

export type NavLink = { id: string; title: string; href: string; section: string };

/** Every listed page in reading order. */
export function readingOrder(docs: Map<string, Doc>): NavLink[] {
  return DOC_SECTIONS.flatMap((section) =>
    section.items.flatMap((id) => {
      const doc = docs.get(id);
      return doc ? [{ id, title: navLabel(doc), href: docPath(id), section: section.title }] : [];
    }),
  );
}

export function prevNext(id: string, docs: Map<string, Doc>) {
  const order = readingOrder(docs);
  const i = order.findIndex((l) => l.id === id);
  return { prev: i > 0 ? order[i - 1] : undefined, next: i >= 0 && i < order.length - 1 ? order[i + 1] : undefined };
}

export const sectionOf = (id: string) => DOC_SECTIONS.find((s) => s.items.includes(id));

/** Docs > Section > Page; the section links to its own page when it has one. */
export function breadcrumbs(id: string, docs: Map<string, Doc>): { label: string; href?: string }[] {
  const section = sectionOf(id);
  const doc = docs.get(id);
  const crumbs: { label: string; href?: string }[] = [];
  if (section?.slug) crumbs.push({ label: section.title, href: `/docs/${section.slug}` });
  if (doc) crumbs.push({ label: navLabel(doc) });
  return crumbs;
}

export const formatUpdated = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);

/** A docs page's Markdown copy, for /llms.txt and AI tools (src/pages/docs/[...slug].md.ts). */
export const markdownPath = (id: string) => (id === 'intro' ? '/docs/index.md' : `/docs/${id}.md`);

/**
 * The page's MDX as plain Markdown: components become their text (a tab's
 * label, a callout's title, a card's title and text), images their alt text,
 * and site links absolute.
 */
export function toMarkdown(doc: Doc, siteUrl: string): string {
  const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  const body = (doc.body ?? '')
    .replace(/<Img\s[^>]*?alt="([^"]*)"[^>]*\/>/g, '[Image: $1]')
    .replace(/<(Card|Feature)\b([^>]*)>([\s\S]*?)<\/\1>/g, (_, _t, attrs, text) => {
      const title = attr(attrs, 'title');
      const clean = text.replace(/\*\*([^*]+):\*\*\s*/, '').trim();
      return `- ${title ? `**${title}**: ` : ''}${clean}`;
    })
    .replace(/<(Callout|Panel)\b[^>]*?title="([^"]*)"[^>]*>/g, '**$2**')
    .replace(/<TabItem\b[^>]*?label="([^"]*)"[^>]*>/g, '**$1**')
    .replace(/<([A-Z][A-Za-z]*)\b[^>]*\/>/g, `(The table on ${siteUrl}${docPath(doc.id)} is generated from live data.)`)
    .replace(/^\s*<\/?[A-Z][A-Za-z]*\b[^>]*>\s*$/gm, '')
    .replace(/\]\(\/(?!\/)/g, `](${siteUrl}/`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `# ${doc.data.title}\n\n> ${doc.data.description}\n\n${body}\n`;
}
