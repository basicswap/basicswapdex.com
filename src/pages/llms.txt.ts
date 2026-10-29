import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';
import { DOC_SECTIONS, getDocs, markdownPath } from '../lib/docs';

// /llms.txt (llmstxt.org): what BasicSwap is, and every docs page as a
// Markdown link with its description, for AI tools that read developer docs.
export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const sections = DOC_SECTIONS.map((section) => {
    const lines = section.items.flatMap((id) => {
      const doc = docs.get(id);
      return doc ? [`- [${doc.data.title}](${SITE_URL}${markdownPath(id)}): ${doc.data.description}`] : [];
    });
    return `## ${section.title === 'Overview' ? 'Start here' : section.title}\n\n${lines.join('\n')}`;
  });
  const text = `# BasicSwap DEX

> BasicSwap is a non-custodial decentralized exchange for cross-chain atomic swaps between coins such as Bitcoin, Monero and Litecoin. It runs on your own computer, with no accounts and no trading fees.

These are the BasicSwap docs as Markdown. Each page is also on the web at the same path without ".md".

${sections.join('\n\n')}

## Elsewhere

- [Blog and release notes](${SITE_URL}/blog): every release's changes.
- [Source code](https://github.com/basicswap/basicswap): the BasicSwap repository.
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
