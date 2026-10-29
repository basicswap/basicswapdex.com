import type { ImageMetadata } from 'astro';

// Blog and docs images, for components that take a path as a prop (Img,
// Gallery). Markdown images resolve on their own; these are looked up here by
// the same "./images/<file>" path the page uses. File names are unique across
// both folders.
const files = import.meta.glob<{ default: ImageMetadata }>(['../content/blog/images/*', '../content/docs/images/*'], { eager: true });
const byName = new Map(Object.entries(files).map(([path, mod]) => [path.split('/').pop()!, mod.default]));

export function postImage(src: string): ImageMetadata {
  const image = byName.get(src.split('/').pop()!);
  if (!image) throw new Error(`Blog image not found: ${src} (expected in src/content/blog/images or src/content/docs/images)`);
  return image;
}
