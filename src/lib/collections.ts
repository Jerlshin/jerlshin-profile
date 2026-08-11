// src/lib/collections.ts — the only place getCollection is called.
//
// Every ordering and every visibility rule the site has lives in this file.
// A page that sorts its own entries is a page that will disagree with the next
// page to sort the same entries, and a page that filters its own drafts is a
// page that will one day forget to.
import { getCollection, type CollectionEntry } from 'astro:content';

// Drafts are visible while writing, invisible in production. One rule, one place.
export const posts = async (): Promise<CollectionEntry<'blog'>[]> =>
  (await getCollection('blog', ({ data }) => (import.meta.env.PROD ? !data.draft : true))).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

export const papers = async () =>
  (await getCollection('research')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

/**
 * Newest first, by start date. `order` is the tiebreak so two projects that
 * began the same month do not swap places between builds.
 */
export const projects = async () =>
  (await getCollection('projects')).sort(
    (a, b) => b.data.start.valueOf() - a.data.start.valueOf() || a.data.order - b.data.order,
  );

export const roles = async () =>
  (await getCollection('experience')).sort(
    (a, b) => b.data.start.valueOf() - a.data.start.valueOf(),
  );

export const degrees = async () =>
  (await getCollection('education')).sort(
    (a, b) => b.data.start.valueOf() - a.data.start.valueOf(),
  );

export const awards = async () =>
  (await getCollection('achievements')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

/** Ordered by the explicit `order` field — the categories have a designed sequence. */
export const skills = async () =>
  (await getCollection('skills')).sort((a, b) => a.data.order - b.data.order);

/**
 * Blog pagination, declared here so /blog and /blog/page/[page] cannot disagree
 * about page size — which would silently drop or duplicate a post at the seam.
 *
 * PAGE 1 IS /blog, NOT /blog/page/1. Two URLs serving the same list is the
 * duplicate-content problem of risk #8 in another form, so there is exactly one
 * function that maps a page number to a URL and both routes use it.
 */
export const POSTS_PER_PAGE = 8;

export const blogPageUrl = (n: number): string => (n <= 1 ? '/blog' : `/blog/page/${n}`);

// `featured` curates the homepage; `order` breaks ties deterministically.
export const featured = <T extends { data: { featured: boolean; order: number } }>(
  items: T[],
  n: number,
) =>
  items
    .filter((i) => i.data.featured)
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, n);

// Tag counts computed once at build time and baked into labels.
export const tagCounts = (items: { data: { tags: string[] } }[]) =>
  items
    .flatMap((i) => i.data.tags)
    .reduce<Record<string, number>>((acc, t) => ((acc[t] = (acc[t] ?? 0) + 1), acc), {});

/**
 * Every post in a series, ascending by `series.order`.
 *
 * Returns [] for a post with no series, so a caller can pass the result
 * straight to <SeriesNav /> without a null check — the component already
 * declines to render fewer than two parts.
 */
export const seriesOf = (
  all: CollectionEntry<'blog'>[],
  post: CollectionEntry<'blog'>,
): CollectionEntry<'blog'>[] => {
  const id = post.data.series?.id;
  if (!id) return [];
  return all
    .filter((p) => p.data.series?.id === id)
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0));
};

/**
 * The posts either side of `post` in the reverse-chronological list.
 *
 * Named `newer`/`older` rather than `prev`/`next` because "next" is genuinely
 * ambiguous in a reverse-chronological archive — next in the list is older,
 * next in time is newer — and the ambiguity is exactly the kind that survives
 * code review and then renders backwards. <PrevNext /> uses the same words.
 */
export const neighbours = (all: CollectionEntry<'blog'>[], post: CollectionEntry<'blog'>) => {
  const i = all.findIndex((p) => p.id === post.id);
  return {
    newer: i > 0 ? all[i - 1] : undefined,
    older: i >= 0 && i < all.length - 1 ? all[i + 1] : undefined,
  };
};
