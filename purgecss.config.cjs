// PurgeCSS config: tree-shakes css/tailwind.min.css to the classes actually used.
// Run: npx purgecss -c purgecss.config.cjs
module.exports = {
  content: ['*.html', 'js/**/*.js'],
  css: ['css/tailwind.min.css'],
  output: 'css/',

  // Broad extractor: capture whole Tailwind tokens that contain ":" "/" "." "-"
  // (e.g. md:w-1/4, hover:bg-coolGray-800, py-2.5) so they aren't split into pieces
  // and wrongly purged. Over-capturing only keeps extra classes (safe); under-
  // capturing would drop classes that are actually in use (breaks styling).
  defaultExtractor: (content) => content.match(/[A-Za-z0-9_:/.\-]+(?<!:)/g) || [],

  // Classes applied dynamically (not present as a literal class="" in markup):
  //   hidden            -> toggled by js/main.js (mobile menu show/hide)
  //   transform/rotate  -> added by Alpine :class on the FAQ accordion chevrons
  safelist: {
    standard: ['hidden', 'transform', 'rotate-180'],
  },
};
