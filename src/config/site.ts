export const SITE_URL = 'https://basicswapdex.com';
export const SITE_NAME = 'BasicSwap DEX';

// The blog and the docs are part of the site (src/content/blog, src/content/docs).
export const BLOG_URL = '/blog';
export const DOCS_URL = '/docs';
export const MARKETS_URL = 'https://markets.basicswapdex.com';

export const SOCIAL = {
  x: 'https://x.com/BasicSwapDEX',
  matrix: 'https://matrix.to/#/#basicswap:matrix.org',
  github: 'https://github.com/basicswap/basicswap',
  githubOrg: 'https://github.com/basicswap',
} as const;

export type NavLink = {
  label: string;
  href: string;
  /** Drawn in the brand red with a heart, as the old site drew Donations. */
  highlight?: boolean;
  /** Not on the legacy site: left out of the parity check. */
  fresh?: boolean;
};

/** One of the products in the header's Products menu. */
export type ProductLink = NavLink & {
  /** One line under the name in the menu. */
  blurb: string;
  icon: 'monitor' | 'phone' | 'globe';
  /** Not released yet: tagged "soon" in the menu. */
  soon?: boolean;
};

/** A header entry that opens a menu instead of linking. */
export type NavGroup = { label: string; items: ProductLink[] };

export const PRODUCTS: ProductLink[] = [
  { label: 'Desktop', href: '/desktop', icon: 'monitor', blurb: 'The full protocol on your own computer' },
  { label: 'Mobile', href: '/mobile', icon: 'phone', blurb: 'Swaps built into wallet apps on your phone' },
  { label: 'Web', href: '/web', icon: 'globe', blurb: 'Swaps built into websites you already use', soon: true, fresh: true },
];

export const isGroup = (entry: NavLink | NavGroup): entry is NavGroup => 'items' in entry;

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Attributes for a link: external links open in a new tab without leaking the referrer. */
export const linkAttrs = (href: string) =>
  isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

// Top navigation, in the order the current site uses.
export const NAV: (NavLink | NavGroup)[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', items: PRODUCTS },
  { label: 'Markets', href: MARKETS_URL },
  { label: 'Protocol', href: '/protocol' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: BLOG_URL },
  { label: 'Docs', href: DOCS_URL },
  { label: 'Donations', href: '/donations', highlight: true },
];

export const FOOTER_TAGLINE =
  'A decentralized protocol for cross-chain atomic swaps. No custodian, no account, no protocol fees.';

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Desktop', href: '/desktop' },
      { label: 'Mobile', href: '/mobile' },
      { label: 'Web', href: '/web', fresh: true },
      { label: 'Bitcoin to Monero', href: '/bitcoin-to-monero' },
      { label: 'Markets', href: MARKETS_URL },
    ],
  },
  {
    title: 'Protocol',
    links: [
      { label: 'Protocol', href: '/protocol' },
      { label: 'Terms', href: '/terms' },
      { label: 'Docs', href: DOCS_URL },
      { label: 'Whitepaper', href: SOCIAL.githubOrg },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Donations', href: '/donations' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Links', href: '/links' },
      { label: 'GitHub', href: SOCIAL.githubOrg },
      { label: 'Matrix', href: SOCIAL.matrix },
      { label: 'Blog', href: BLOG_URL },
    ],
  },
];

export const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  description: 'A cross-chain DEX for atomic swaps, without a middleman',
  url: SITE_URL,
  logo: `${SITE_URL}/images/basicswap-logo.svg`,
  sameAs: [SOCIAL.x, SOCIAL.github, SOCIAL.matrix],
};

export const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
};
