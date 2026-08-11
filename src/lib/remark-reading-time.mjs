/**
 * src/lib/remark-reading-time.mjs
 *
 * Counts the words in a post's MDAST and writes the result to
 * `remarkPluginFrontmatter`, which `render(entry)` returns alongside the
 * validated frontmatter.
 *
 * It runs on the MDAST rather than on the rendered HTML, which is the whole
 * reason it is a remark plugin and not a string length on `entry.body`:
 * `mdast-util-to-string` walks the tree, so YAML frontmatter, JSX component
 * tags, image URLs, and link destinations are all excluded and only text a
 * human actually reads is counted.
 *
 * STRUCTURED OUTPUT, NOT A SENTENCE. It emits `{ minutes, words }` and lets
 * <ReadingTime /> phrase it. A plugin that wrote "5 min read" would be deciding
 * copy — and would then be the second place on the site that formats a
 * user-visible string, which is exactly how the two-copies-diverge problem in
 * audit finding #2 starts.
 *
 * This plugin is the reason `markdown.processor: unified()` is pinned in
 * astro.config.mjs (§2.2, risk #1): it is a unified-ecosystem plugin, and under
 * Astro 7's default Sätteri processor it would be accepted and never run.
 */
import { toString } from 'mdast-util-to-string';

/**
 * 200 wpm is the conventional figure for technical prose read for
 * comprehension. It is deliberately a single named constant: the estimate's
 * value is consistency across posts, not accuracy on any one of them.
 */
const WORDS_PER_MINUTE = 200;

export function remarkReadingTime() {
  return (tree, file) => {
    const words = toString(tree).split(/\s+/).filter(Boolean).length;

    file.data.astro.frontmatter.readingTime = {
      words,
      // A 30-second post reads as "1 min", never "0 min".
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
  };
}
