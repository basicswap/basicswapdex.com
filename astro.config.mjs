import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { legacyHeadingIds } from './src/lib/legacy-heading-ids.mjs';
import { fontFamilies } from './src/config/fonts.mjs';

const isDev = process.argv.includes('dev');

// Dev-only pages: routed by `astro dev`, never emitted by `astro build`.
const devPages = {
  name: 'dev-pages',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/font-lab', entrypoint: './src/dev/font-lab.astro' });
    },
  },
};

export default defineConfig({
  site: 'https://basicswapdex.com',

  // URLs are extensionless with no trailing slash: /faq, /blog/<slug>.
  // format: 'file' writes faq.html, which GitHub Pages serves at /faq with no
  // redirect, so the URLs Google already indexed keep working unchanged.
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },

  // Old docs URLs (docs.basicswapdex.com kept /docs/<path>, so the subdomain
  // redirect lands here): the intro is now /docs itself, Docusaurus's
  // category pages are the section pages, and the empty Resources pages go
  // to the docs home.
  redirects: {
    '/docs/intro': '/docs',
    '/docs/category/about': '/docs/about',
    '/docs/category/user-guides': '/docs/user-guides',
    '/docs/category/resources': '/docs/resources',
  },

  fonts: fontFamilies({ withLab: isDev }),

  markdown: {
    // Blog posts: headings keep their old anchors, and quotes and dashes
    // stay as written (the old blog had no smart punctuation).
    processor: satteri({
      hastPlugins: [legacyHeadingIds],
      features: { smartPunctuation: false },
    }),
    // Code takes the theme's colors: both palettes are emitted as CSS
    // variables and global.css picks one per theme.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      defaultColor: false,
    },
  },

  integrations: [mdx(), devPages],

  devToolbar: { enabled: false },
});
