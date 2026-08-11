/**
 * src/lib/reading-time.ts — the type contract for the remark plugin's output.
 *
 * lib/remark-reading-time.mjs is plain JavaScript (remark plugins are loaded by
 * astro.config.mjs before TypeScript is in play), so its output shape has no
 * types of its own. `remarkPluginFrontmatter` is typed as `Record<string, any>`
 * by Astro, which means a rename in the plugin would flow into every component
 * as `undefined` at runtime with no type error anywhere.
 *
 * This file is the seam. Components import `ReadingTimeData` and pages narrow
 * `remarkPluginFrontmatter` through `readingTimeOf()` in exactly one place, so
 * the assumption about the plugin's output exists once and is named.
 */

export interface ReadingTimeData {
  /** Rounded up to a minimum of 1 by the plugin. */
  minutes: number;
  words: number;
}

/**
 * Narrows the untyped `remarkPluginFrontmatter` bag returned by `render()`.
 *
 * Returns undefined rather than a zero-valued default when the plugin did not
 * run: a missing estimate must render as *nothing*, not as "0 min read", which
 * looks like a measurement rather than an absence.
 */
export const readingTimeOf = (
  frontmatter: Record<string, unknown>,
): ReadingTimeData | undefined => {
  const value = frontmatter.readingTime;
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ReadingTimeData).minutes === 'number' &&
    typeof (value as ReadingTimeData).words === 'number'
  ) {
    return value as ReadingTimeData;
  }
  return undefined;
};
