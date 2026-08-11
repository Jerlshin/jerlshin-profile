/**
 * src/lib/kinds.ts — what kind of thing a page is, written down once.
 *
 * The same word appears in three places: the overline on a generated social
 * card, the `kind` facet in the Pagefind index, and the badge on a search
 * result. Three literals in three files is how "Post" and "Writing" end up
 * meaning the same thing on the same site — the drift in audit finding #2, at
 * a smaller scale. One map, imported by all three.
 *
 * The values are the reader-facing labels, so they are also what a Pagefind
 * filter is keyed on: `data-pagefind-filter="kind:Research"` produces the facet
 * `Research`, which is exactly what the filter chip has to say. Deriving the
 * chip label from the facet value means the two cannot disagree.
 */

export const KIND = {
  profile: 'Profile',
  research: 'Research',
  project: 'Project',
  post: 'Writing',
  experience: 'Experience',
  achievement: 'Achievement',
  page: 'Page',
} as const;

export type KindKey = keyof typeof KIND;
export type KindLabel = (typeof KIND)[KindKey];

/**
 * The order facet chips appear in, most-substantial first, rather than the
 * count order Pagefind returns. Counts reorder themselves as content is added,
 * which would move a chip out from under the cursor between two searches.
 */
export const KIND_ORDER: readonly KindLabel[] = [
  KIND.research,
  KIND.project,
  KIND.post,
  KIND.experience,
  KIND.achievement,
  KIND.page,
  KIND.profile,
];
