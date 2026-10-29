import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts: src/content/blog/<slug>.mdx, served at /blog/<slug>. Images sit
// in src/content/blog/images and are referenced as ./images/<file>.
const blog = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** The <title>, when the post's title is too long for search results. */
      seoTitle: z.string().optional(),
      date: z.coerce.date(),
      author: z.string(),
      tags: z.array(z.string()),
      description: z.string(),
      /** The meta description, when `description` (shown on cards) is too long or short for search. */
      seoDescription: z.string().optional(),
      /** Card image, 1000 x 560. */
      thumbnail: image(),
      /** Wide header image, 1920 x 690. */
      banner: image().optional(),
      /** Kept out of the index, tags, feed and sitemap; the page itself still builds. */
      unlisted: z.boolean().default(false),
    }),
});

// Docs pages: src/content/docs/<section>/<page>.mdx, served at
// /docs/<section>/<page> (intro.mdx is /docs). Sidebar order and sections
// live in src/lib/docs.ts. Images sit in src/content/docs/images.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
  schema: z.object({
    /** The page's heading and title. */
    title: z.string(),
    /** A shorter name for the sidebar, when the title is long. */
    sidebar: z.string().optional(),
    /** The <title>, when search needs more words than the heading. */
    seoTitle: z.string().optional(),
    description: z.string(),
    /** When the page first appeared (in the old docs repo, for ported pages). */
    published: z.coerce.date().optional(),
    /** Only a fallback: the page's git date is its "last updated". */
    lastUpdated: z.coerce.date().optional(),
  }),
});

export const collections = { blog, docs };
