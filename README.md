# basicswapdex.com

The BasicSwap DEX website. Astro, static output, deployed to GitHub Pages by GitHub Actions.

The blog (`src/content/blog`) and the docs (`src/content/docs`) live here too, so a push to `main` deploys all three. The site as it was before the redesign is kept in `legacy/` for reference.

## Run it locally

Requires Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321, live reload
npm run build      # production build into dist/
npm run preview    # serve dist/ the way Pages will
npm run check:links  # after a build: every internal link and #anchor resolves
```

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/` | One file per route. `index.astro` is `/`, `faq.astro` is `/faq`. |
| `src/content/blog/` | Blog posts, one `<slug>.mdx` each (served at `/blog/<slug>`), images in `images/`. |
| `src/content/docs/` | Docs pages, `<section>/<page>.mdx` (served at `/docs/<section>/<page>`; `intro.mdx` is `/docs`). Sidebar order in `src/lib/docs.ts`. |
| `src/layouts/BaseLayout.astro` | Page shell: head, header, footer. Written once, used everywhere. |
| `src/components/` | Header, footer, logo, icons, theme toggle, image helpers. |
| `src/config/site.ts` | Navigation, footer links, social links, Organization JSON-LD. |
| `src/config/fonts.mjs` | Font registry. Change one line to switch fonts. |
| `src/styles/tokens.css` | Colors, type scale, spacing, radii, motion. Mirrors the brand guidelines. |
| `src/styles/global.css` | Reset, base typography, buttons. |
| `src/scripts/` | Client scripts. `ribbon.ts` runs the release-animation shader behind the ribbons. |
| `src/dev/` | Pages that exist only under `npm run dev` (for example `/font-lab`). |
| `public/` | Files served as-is at fixed URLs (OG images, icons, mediakit, CNAME). |

## Conventions

- **URLs** are extensionless with no trailing slash (`/faq`). Link to `/faq`, never `/faq.html`.
- **JavaScript is limited to two progressive enhancements**: the inline script (theme toggle, copy buttons) and the ribbon shader (`src/scripts/ribbon.ts`, ~2 KB gzipped, WebGL2, static SVG fallback). Any future script is a deliberate, isolated island, and no content may depend on it.
- **Colors** come from tokens only. Do not add hex values outside `tokens.css`.
- **Mono font** (`code`, `.data`) is for data: amounts, addresses, hashes, versions, commands.
- **Images** that differ by theme use `<ThemedImage light={…} dark={…} alt="…" />`. A visual that does not exist yet uses `<Placeholder label="…" />` at its final aspect ratio.
- **Every page** passes `title`, `description` and `path` to `BaseLayout`. The canonical and social tags are built from them.

## Fonts

```bash
FONT_SANS=geist npm run dev                    # try a sans without editing anything
FONT_SANS=geist FONT_MONO=fira-code npm run build
```

Open `/font-lab` in the dev server to compare every candidate side by side. To make a choice permanent, set `ACTIVE_SANS` / `ACTIVE_MONO` in `src/config/fonts.mjs`. To add a candidate, run `npm i -D @fontsource-variable/<id>` and add a row to the registry.

## Writing for the blog and docs

- **A blog post** is a new `src/content/blog/<slug>.mdx`. Frontmatter: `title`, `date`, `author`, `tags`, `description`, `thumbnail` (1000x560) and optionally `banner` (1920x690), both as `./images/<file>`. Components such as `<Callout>`, `<Gallery>` and `<UrlPreviewCard>` need no import (list in `src/components/blog/mdx/index.ts`).
- **A docs page** is a new `src/content/docs/<section>/<page>.mdx` with `title`, a `description` of 120-165 characters, `published`, and optionally `sidebar` (a shorter label) and `seoTitle` (the `<title>`, when search needs more words than the heading), plus a line in `src/lib/docs.ts` to place it in the sidebar. "Last updated" comes from the file's git date. `<Callout>`, `<Tabs>`/`<TabItem>`, `<Cards>`, `<Features>`, `<Panel>`, `<Img>` and `<CoinTable>` need no import.
- **Docs share cards** are made in the style of the blog's release art: after a build, `npm run docs:cards` writes one per page to `public/og/docs/` (needs ImageMagick and DejaVu Sans). Commit them; `check:links` fails when a page's title no longer matches its card.
- **Docs screenshots** of the BasicSwap UI come from the mock server in `tools/app-shots/` (real templates, example data): start `server.py`, then `npm run docs:shots`.
- **The coin table** (`<CoinTable>`) reads each coin's core version from the basicswap repo at the latest release when the site builds, falling back to `src/data/coins.json`; refresh that with `node tools/coins-snapshot.mjs` after a release.

## Deploying

Push to `main`. `.github/workflows/deploy.yml` builds the whole site (pages, blog and docs), checks every internal link and the docs pages' metadata (`npm run check:links`), checks that every `basicswap-prepare` option and `bsx-*` command the docs name still exists (`npm run check:docs`), and publishes. It also runs daily and can be triggered from the Actions tab. Repository Settings → Pages → Source must be set to **GitHub Actions**.

## Related repositories

| Site | Repository |
| --- | --- |
| The DEX itself | `basicswap/basicswap` |
| blog.basicswapdex.com | `basicswap/basicswap-blog`: its posts now live here (`tools/blog-import.mjs` copies any new ones). After cutover it only serves redirects (`tools/blog-redirects.mjs`). |
| docs.basicswapdex.com | `basicswap/basicswap-docs`: its pages now live here (`tools/docs-import.mjs`). After cutover it only serves redirects (`tools/docs-redirects.mjs`). |
