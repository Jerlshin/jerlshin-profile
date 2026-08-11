/**
 * /rss.xml — the blog feed.
 *
 * A feed is the one piece of a personal site that keeps working when the
 * platforms change, so it is worth getting the details right:
 *
 *  - DRAFTS CANNOT LEAK. `posts()` already filters `draft` under PROD and the
 *    loader's `[^_]` glob excludes underscore-prefixed files outright, so the
 *    two guards in risk #13 apply here for free — precisely because this file
 *    does not call getCollection itself.
 *  - LINKS ARE ABSOLUTE. A feed is read outside the site, where a root-relative
 *    href resolves against the reader's own host and 404s. `site` is set in
 *    astro.config.mjs, and @astrojs/rss resolves `link` against it.
 *  - THE DESCRIPTION IS THE SCHEMA'S, not a truncated body. §4.4 already bounds
 *    it to 50–180 characters for exactly this kind of reuse, so no ellipsis
 *    logic is needed and the feed entry matches the meta description.
 *
 * The body is deliberately NOT inlined as `content`. Rendering MDX to a
 * standalone HTML string drops the components, the KaTeX markup, and the
 * Expressive Code frames, which produces a worse copy of the post in a place
 * the author never looks at. A title, a summary, and a link are honest.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { posts } from '../lib/collections.ts';
import { site } from '../config/site.ts';

export const GET: APIRoute = async (context) => {
  const all = await posts();

  return rss({
    title: `${site.name} — Blog`,
    description: site.tagline,
    // `context.site` comes from astro.config.mjs. Trailing slash is trimmed to
    // match the canonical policy every other URL on the site follows (risk #8).
    site: context.site ?? site.url,
    trailingSlash: false,
    items: all.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}`,
      categories: post.data.tags,
    })),
    // Makes the raw XML readable in a browser instead of prompting a download.
    stylesheet: false,
    customData: '<language>en-gb</language>',
  });
};
