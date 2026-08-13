# basicswapdex.com

The BasicSwap DEX marketing site. Static HTML + Tailwind, published with GitHub Pages
from the repository root.

## Run it locally

```bash
python3 tools/serve.py          # http://localhost:8000
python3 tools/serve.py 3000     # or pick a port
```

No dependencies, no build step — edit an `.html` file and refresh. If port 8000 is
taken it moves to the next free one and prints the URL it settled on; a port you pass
explicitly is honoured exactly, and it tells you what to run if that one is busy.

**Use this instead of `python3 -m http.server`.** Internal links are extensionless
(`/faq`, not `/faq.html`). GitHub Pages resolves those; the plain Python server does
not, so under it every nav link 404s. `tools/serve.py` mirrors production: it maps
`/faq` to `faq.html`, and serves `404.html` with a real 404 status for unknown paths.

## Layout

| Path | What it is |
| --- | --- |
| `*.html` | One file per page. `index.html` is the homepage; `404.html` is the error page. |
| `css/tailwind.min.css` | Vendored Tailwind build, tree-shaken by PurgeCSS. |
| `css/content.css`, `css/home.css` | Hand-written styles; `home.css` is homepage-only. |
| `js/main.js` | Mobile menu and the latest-release lookup. |
| `images/`, `site-meta.png` | Assets. `site-meta.png` is the default social card; `images/og-home.png` is the homepage's. |
| `sitemap.xml`, `robots.txt` | Search-engine files. |
| `tools/` | Maintenance scripts (below). |

Fonts are the OS system stack — the site loads no webfonts.

## Editing pages

Each page is standalone, so the nav, footer, and `<head>` are duplicated across all
of them. **A change to shared markup has to be applied to every `.html` file.**

When adding a page:

1. Create `<slug>.html`, copying the `<head>` and nav/footer from an existing page.
2. Set a unique `<title>`, `<meta name="description">`, `<link rel="canonical">`,
   `og:*`, and `twitter:*` — canonicals use the extensionless URL
   (`https://basicswapdex.com/<slug>`).
3. Add a `BreadcrumbList` JSON-LD block (copy one from another page).
4. Add a `<url>` entry to `sitemap.xml`, then run `tools/update-sitemap.py`.
5. Link it from the nav and footer of every other page.

## Tools

```bash
python3 tools/update-sitemap.py    # refresh <lastmod> from git dates
npx purgecss -c purgecss.config.cjs
```

Run `update-sitemap.py` before publishing; it reads each page's last commit date and
falls back to today for files with uncommitted edits, so `lastmod` stays truthful.

Run PurgeCSS only after adding Tailwind classes that weren't used anywhere before.
It rewrites `css/tailwind.min.css` in place — check the diff and reload the site
afterwards, since an over-aggressive purge shows up as missing styles. Classes applied
from JavaScript rather than markup must be listed in the config's `safelist`.

## Deploying

Push to `main`. GitHub Pages serves the repository root; `CNAME` holds the custom
domain and `.nojekyll` disables Jekyll processing.

## Related repositories

| Site | Repository |
| --- | --- |
| blog.basicswapdex.com | `basicswap/basicswap-blog` (Next.js) |
| docs.basicswapdex.com | `basicswap/basicswap-docs` (Docusaurus) |
| The DEX itself | `basicswap/basicswap` |
