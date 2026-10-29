import type { APIRoute, GetStaticPaths } from 'astro';
import { RIBBONS, ribbonSvg, type RibbonName } from '../../lib/ribbon';

// Emits /ribbon/<name>.svg at build time. Pages use these as CSS backgrounds,
// so only the active theme's file downloads and it caches across pages.
export const getStaticPaths = (() => Object.keys(RIBBONS).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(ribbonSvg(RIBBONS[params.name as RibbonName]), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
