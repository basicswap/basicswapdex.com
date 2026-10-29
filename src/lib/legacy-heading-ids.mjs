// Blog post headings keep the ids they had on blog.basicswapdex.com, so
// links to a section (#most-notable-updates) still land on it. The old blog
// slugged the text as lowercase words joined by hyphens; Astro's default
// slugger drops dots and keeps other characters ("v0.19.0" became "v0190").
// A repeated heading gets -1, -2, … so ids stay unique.
//
// Runs before Astro's own heading-id step, which keeps an id already set.
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const legacyHeadingIds = () => {
  const seen = new Map();
  return {
    name: 'legacy-heading-ids',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        if (!ctx.fileURL?.pathname.includes('/src/content/blog/')) return;
        if (typeof node.properties?.id === 'string') return;
        const base = slug(ctx.textContent(node)) || 'section';
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        ctx.setProperty(node, 'id', n ? `${base}-${n}` : base);
      },
    },
  };
};
