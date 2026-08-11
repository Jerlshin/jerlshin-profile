/**
 * src/lib/bibtex.ts — generates a BibTeX record from `venue` + `authors`.
 *
 * WHY GENERATE RATHER THAN STORE. A hand-written `bibtex` string in frontmatter
 * is a second copy of the title, the authors, the venue, and the year. Copies
 * diverge — that is audit finding #2, and a citation that disagrees with the
 * page it sits on is worse than no citation at all. So the record is derived
 * from the same fields the page renders, and `data.bibtex` exists only as an
 * override for the case that actually needs one: a publisher-issued entry with
 * a real DOI and page numbers, which is authoritative and must be used verbatim.
 *
 * Two correctness details that are easy to get wrong:
 *
 *  - NAMES ARE BRACE-PROTECTED. BibTeX parses `Jerlshin J G` as First=Jerlshin,
 *    von="J", Last=G and will render it as "J. G. Jerlshin". Wrapping each name
 *    in braces tells BibTeX to reproduce it exactly. The schema stores display
 *    names, not structured Family/Given parts, so guessing which token is the
 *    surname would silently mangle names — non-Western orders most of all.
 *  - THE TITLE IS BRACE-PROTECTED TOO, or most styles lowercase "Transformer"
 *    and "Mixture-of-Experts" on the way out.
 */
import type { CollectionEntry } from 'astro:content';

type Paper = CollectionEntry<'research'>;

/** BibTeX entry type for each `venue.kind` in the schema. */
const ENTRY_TYPE: Record<Paper['data']['venue']['kind'], string> = {
  journal: 'article',
  conference: 'inproceedings',
  workshop: 'inproceedings',
  preprint: 'misc',
  thesis: 'phdthesis',
};

/** The venue field name BibTeX expects for each entry type. */
const VENUE_FIELD: Record<string, string> = {
  article: 'journal',
  inproceedings: 'booktitle',
  misc: 'howpublished',
  phdthesis: 'school',
};

/** Characters that begin a control sequence or a mode switch in TeX. */
const escapeTex = (value: string): string =>
  value.replace(/([&%$#_{}])/g, '\\$1').replace(/~/g, '\\textasciitilde{}');

/**
 * A stable, human-readable citation key derived from the entry's own slug.
 *
 * Derived from the slug rather than from the author surname because the slug
 * is unique by construction (it is the directory name) and never changes when
 * the author list is corrected — so a key already pasted into someone else's
 * .bib file keeps resolving.
 */
export const citeKey = (paper: Paper): string =>
  `${paper.id.replace(/[^a-z0-9]/gi, '').toLowerCase()}${paper.data.venue.year}`;

/** `{Author One} and {Author Two} and others` — `others` is BibTeX's "et al.". */
const authorField = (data: Paper['data']): string => {
  const names = data.authors.map((a) => `{${escapeTex(a.name)}}`);
  // `and others` is what BibTeX renders as "et al." — the same claim the page
  // makes via `authorsTruncated`, so the citation cannot imply a complete list
  // that the page itself marks as incomplete.
  if (data.authorsTruncated) names.push('others');
  return names.join(' and ');
};

/**
 * The rendered record for a paper: the frontmatter override when present,
 * otherwise one generated from the entry's own fields.
 */
export const toBibtex = (paper: Paper): string => {
  if (paper.data.bibtex) return paper.data.bibtex.trim();

  const { data } = paper;
  const type = ENTRY_TYPE[data.venue.kind];

  const fields: [string, string | undefined][] = [
    ['author', authorField(data)],
    ['title', `{${escapeTex(data.title)}}`],
    [VENUE_FIELD[type] ?? 'journal', `{${escapeTex(data.venue.name)}}`],
    ['year', String(data.venue.year)],
    ['volume', data.venue.volume && `{${escapeTex(data.venue.volume)}}`],
    ['pages', data.venue.pages && `{${escapeTex(data.venue.pages)}}`],
    ['publisher', data.venue.publisher && `{${escapeTex(data.venue.publisher)}}`],
    ['doi', data.links.doi && `{${escapeTex(data.links.doi)}}`],
    ['url', (data.links.arxiv ?? data.links.doi) && `{${data.links.arxiv ?? data.links.doi}}`],
    // Review status is a fact about the record, and belongs in the record —
    // otherwise a citation harvested from this page reads as published work.
    ['note', data.status !== 'published' ? `{${escapeTex(STATUS_NOTE[data.status])}}` : undefined],
  ];

  const body = fields
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `  ${key.padEnd(9)} = ${value},`)
    .join('\n');

  return `@${type}{${citeKey(paper)},\n${body}\n}`;
};

const STATUS_NOTE: Record<Paper['data']['status'], string> = {
  published: '',
  accepted: 'Accepted for publication',
  'under-review': 'Manuscript under review',
  preprint: 'Preprint',
  'in-preparation': 'Manuscript in preparation',
};
