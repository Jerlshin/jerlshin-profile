/**
 * src/lib/dates.ts — every date string on the site is formatted here.
 *
 * Two failure modes this file exists to prevent (risk #14):
 *
 * 1. TIMEZONE OFF-BY-ONE. A frontmatter date like `2026-03-01` is parsed by
 *    `z.coerce.date()` as UTC midnight. Formatting that with the runtime's
 *    local zone renders "28 February" for any build machine west of Greenwich.
 *    Every formatter below pins `timeZone: 'UTC'`.
 *
 * 2. NON-DETERMINISTIC BUILDS. `toLocaleDateString()` with no locale uses the
 *    build machine's locale, so the same commit produces different HTML on a
 *    laptop and on CI. The locale is pinned to a constant.
 *
 * Never call `toLocaleDateString` anywhere else. If a new format is needed, it
 * gets a named export here.
 */

const LOCALE = 'en-GB';
const UTC = 'UTC';

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: UTC });

const full = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = fmt({ month: 'long', year: 'numeric' });
const shortMonthYear = fmt({ month: 'short', year: 'numeric' });

/** "11 August 2026" — post and paper datelines. */
export const formatDate = (date: Date): string => full.format(date);

/** "August 2026" — venue years, education periods. */
export const formatMonthYear = (date: Date): string => monthYear.format(date);

/** "Aug 2026" — dense timeline rows and card metadata. */
export const formatShortMonthYear = (date: Date): string => shortMonthYear.format(date);

/**
 * "May 2025 – Oct 2025", or "Oct 2024 – Present" when `end` is null.
 *
 * `null` meaning "ongoing" is the schema's convention for `experience.end`,
 * `education.end`, and `projects.end` (§4.3, §4.5) — not a missing value.
 */
export const formatRange = (start: Date, end: Date | null): string =>
  `${formatShortMonthYear(start)} – ${end ? formatShortMonthYear(end) : 'Present'}`;

/** `YYYY-MM-DD` for a <time datetime="…"> attribute and for JSON-LD. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * The year the build ran, in UTC. Used for the footer copyright, which would
 * otherwise tick over a day early or late depending on where it was built.
 */
export const buildYear = (): number => new Date().getUTCFullYear();
