import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_URL } from '../config/site';

export type Post = CollectionEntry<'blog'>;

export const BLOG_TITLE = 'BasicSwap Blog';
export const BLOG_DESCRIPTION =
  'News, release notes and development reports from BasicSwap, the decentralized exchange for cross-chain atomic swaps between Bitcoin, Monero and more.';

/** Search descriptions for the tag pages, one per tag. */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  News: "Everything BasicSwap has announced, from new releases and security fixes to monthly development reports and the events the team attended, newest first.",
  Release: "Every BasicSwap release announcement, with what changed in each version, which coin cores it updated, and how to upgrade your own install.",
  Security: "BasicSwap releases and articles about security, covering fixes to the swap engine, hardening of the atomic swap protocol, and what to do after each one.",
  Report: "BasicSwap's monthly development reports, with what the team shipped each month across the swap engine, the web interface and the supported coins.",
  Story: "Longer reads on BasicSwap, from how atomic swaps and adaptor signatures work to why the DEX is built the way it is and how that design protects traders.",
  Event: "BasicSwap at conferences, including the Litecoin Summit and MoneroKon, with the talks and demos where the team presented the atomic swap DEX in person.",
  Hardfork: "BasicSwap releases timed for a coin's hard fork, with the node versions you need so your wallets follow the right chain and your swaps keep working.",
  "Coin Update": "BasicSwap releases that update the coin cores it runs, with the new node versions and what each one changes for your wallets and your atomic swaps.",
  Usability: "BasicSwap releases that make the DEX easier to use, such as the AMM tool built into the web interface for running automated market making strategies.",
};

/** Listed posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.unlisted);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postPath = (post: Post | string) => `/blog/${typeof post === 'string' ? post : post.id}`;
export const postUrl = (post: Post | string) => `${SITE_URL}${postPath(post)}`;

/** "Coin Update" -> "coin-update". */
export const tagSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const tagPath = (tag: string) => `/blog/tags/${tagSlug(tag)}`;

/** Every tag with its posts, most used first. */
export function tagIndex(posts: Post[]) {
  const map = new Map<string, Post[]>();
  for (const post of posts) for (const tag of post.data.tags) map.set(tag, [...(map.get(tag) ?? []), post]);
  return [...map].map(([tag, list]) => ({ tag, slug: tagSlug(tag), posts: list })).sort((a, b) => b.posts.length - a.posts.length || a.tag.localeCompare(b.tag));
}

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Minutes to read, at 230 words a minute, from the post's source. */
export function readingTime(body = '') {
  const text = body
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>[\]()!|-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** Posts sharing the most tags with this one, newest first among equals. */
export function relatedPosts(post: Post, posts: Post[], count = 3) {
  return posts
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, shared: p.data.tags.filter((t) => post.data.tags.includes(t)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.p.data.date.valueOf() - a.p.data.date.valueOf())
    .slice(0, count)
    .map(({ p }) => p);
}
