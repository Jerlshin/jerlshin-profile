/**
 * src/lib/tags.ts — tag aggregation, counts, and the tag→URL contract.
 *
 * Every tag on the site is a kebab-case slug, enforced by the `tag` primitive
 * in content.config.ts (§4.1). That single rule is what lets this module treat
 * tag equality as a string compare and build a URL by concatenation, with no
 * slugify step that could disagree with the one used at route-generation time.
 *
 * FACET COUNTS ARE BUILD-TIME VALUES (§6.3). `TagFilter`'s client script never
 * counts anything; it only shows and hides cards. Counts come from here, are
 * baked into the rendered label, and are therefore correct with JavaScript
 * disabled.
 */

/** Anything carrying a tag list — blog posts (`tags`) or papers (`topics`). */
export interface Tagged {
  data: { tags?: string[]; topics?: string[] };
}

/** Reads whichever tag field a collection uses. */
export const tagsOf = (item: Tagged): string[] => item.data.tags ?? item.data.topics ?? [];

/** `{ 'graph-neural-networks': 3, … }`, over whatever list is passed in. */
export const countTags = (items: Tagged[]): Record<string, number> =>
  items
    .flatMap(tagsOf)
    .reduce<Record<string, number>>((acc, t) => ((acc[t] = (acc[t] ?? 0) + 1), acc), {});

export interface TagFacet {
  tag: string;
  count: number;
  /** Set only for tags that have a static archive route. */
  href?: string;
}

/**
 * The full facet list for a set of items, ordered by count then alphabetically.
 *
 * The secondary alphabetical sort is not cosmetic: without it, two tags with
 * equal counts order by whichever happened to be encountered first, so an
 * unrelated content edit reshuffles the filter bar and produces a diff nobody
 * asked for. Deterministic output keeps builds byte-identical (the same
 * reasoning as the pinned locale in lib/dates.ts).
 */
export const facets = (items: Tagged[], hrefFor?: (tag: string) => string): TagFacet[] =>
  Object.entries(countTags(items))
    .map(([tag, count]) => ({ tag, count, href: hrefFor?.(tag) }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'en'));

/** The canonical URL of a blog tag archive. The only place this shape is written. */
export const blogTagHref = (tag: string): string => `/blog/tags/${tag}`;

/**
 * The `data-tags` attribute every filterable card carries (§6.3).
 *
 * Space-separated because the client filter splits on whitespace, and slugs
 * can never contain one — that is a property the schema regex guarantees, not
 * a convention this function hopes for.
 */
export const tagAttr = (tags: string[]): string => tags.join(' ');
