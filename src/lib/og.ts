/**
 * src/lib/og.ts — the social card template, rendered at BUILD TIME.
 *
 * satori lays out a small flexbox tree and emits SVG; resvg rasterises it to
 * PNG. Both run inside `astro build`, so the emitted files land in `dist/og/`
 * and are served from the CDN like any other static asset (§2.6, §7.3). There
 * is no serverless function, which is the whole reason the free tier stays
 * free — a request-time OG endpoint is the single easiest way to turn this
 * site into a billable one.
 *
 * WHY THE CARD IS ALWAYS GENERATED, NEVER THE COVER IMAGE. A `cover` is a
 * content figure: it has whatever aspect ratio the source had, and cropping it
 * to 1200×630 puts the subject somewhere unpredictable. A generated card is
 * 1200×630 by construction and always contains the title, so a paper can never
 * ship a social preview that is blank, letterboxed, or wrong-shaped. That makes
 * checklist item #9 a property of the build rather than something to remember.
 *
 * FONTS ARE READ FROM node_modules, NOT FROM THE FONTS API CACHE. Astro's Fonts
 * API emits woff2, and satori's font parser cannot read woff2 (it is Brotli-
 * compressed; the parser handles the zlib of woff1 only). The @fontsource
 * packages ship the same faces as woff1 alongside, so the card renders in the
 * same two families the site itself uses rather than in a lookalike.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '../config/site.ts';

const require = createRequire(import.meta.url);

/** Card geometry. 1200×630 is what every card debugger expects. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * Colours are the LIGHT theme's literals from global.css §1, copied rather than
 * read. An SVG rasterised on a build machine has no `<html>` to carry
 * `[data-theme]` and no cascade to resolve `var()` through, so the one place on
 * this site that may hold colour literals is this file. They are the light
 * palette because a social card is composited onto someone else's timeline, not
 * onto our page — it has no theme to match.
 */
const INK = '#1b1916'; // --w-900
const INK_2 = '#46413a'; // --w-600
const INK_3 = '#5f594f'; // --w-500
const LINE = '#e6e2da'; // --w-200
const BG = '#fbfaf8'; // --w-25
const ACCENT = '#0f5b8f'; // --a-light

const font = (pkg: string, file: string) => readFileSync(require.resolve(`${pkg}/files/${file}`));

/**
 * Loaded once per build, not once per card. There are as many cards as there
 * are content entries, and re-reading four font files for each of them is pure
 * waste in the hottest part of the build.
 */
const fonts = [
  {
    name: 'Source Serif 4',
    data: font('@fontsource/source-serif-4', 'source-serif-4-latin-600-normal.woff'),
    weight: 600 as const,
    style: 'normal' as const,
  },
  {
    name: 'Source Serif 4',
    data: font('@fontsource/source-serif-4', 'source-serif-4-latin-400-normal.woff'),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'JetBrains Mono',
    data: font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff'),
    weight: 500 as const,
    style: 'normal' as const,
  },
  {
    name: 'JetBrains Mono',
    data: font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
    weight: 400 as const,
    style: 'normal' as const,
  },
];

/**
 * satori consumes React-element-shaped objects. It does not need React, and
 * this file deliberately does not import it — pulling a UI framework into the
 * build for four calls to `createElement` is how risk #15 starts.
 */
interface El {
  type: string;
  props: Record<string, unknown>;
}

const h = (type: string, style: Record<string, unknown>, ...children: (El | string)[]): El => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

/**
 * Hard character caps, applied before layout.
 *
 * satori supports `lineClamp`, but a clamp decides what to drop from a measured
 * box, so the same title renders a different number of words depending on the
 * glyphs in it. Truncating on a word boundary at a fixed budget means the card
 * for a long title is boring in a predictable way instead of surprising in an
 * unpredictable one. The ellipsis is the real character, not three dots.
 */
const clamp = (text: string, max: number): string => {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.]+$/, '')}…`;
};

export interface OgCard {
  /** The overline: "Research", "Project", "Writing", "Profile". */
  kind: string;
  title: string;
  /** tldr / summary / description — whichever field the schema already requires. */
  summary: string;
  /** One line of context: a venue, a date, a stack. Optional. */
  meta?: string;
}

/** The site host, shown as the card's signature. No scheme, no trailing slash. */
const host = new URL(site.url).host;

const template = (card: OgCard): El =>
  h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: BG,
      // The one piece of colour on the card, and it is structural rather than
      // decorative — the same rule §6.4 applies to the site itself.
      borderTop: `12px solid ${ACCENT}`,
      padding: '64px 72px 56px',
      fontFamily: 'Source Serif 4',
    },

    // ── Overline: what kind of thing this is ───────────────────────────────
    h(
      'div',
      {
        display: 'flex',
        fontFamily: 'JetBrains Mono',
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: ACCENT,
      },
      card.kind.toUpperCase(),
    ),

    // ── Title ──────────────────────────────────────────────────────────────
    h(
      'div',
      {
        display: 'flex',
        marginTop: 28,
        fontSize: 64,
        fontWeight: 600,
        lineHeight: 1.14,
        letterSpacing: -1.2,
        color: INK,
      },
      clamp(card.title, 110),
    ),

    // ── Summary ────────────────────────────────────────────────────────────
    h(
      'div',
      {
        display: 'flex',
        marginTop: 24,
        fontSize: 30,
        fontWeight: 400,
        lineHeight: 1.45,
        color: INK_2,
      },
      clamp(card.summary, 170),
    ),

    // `flexGrow` on a spacer rather than `justifyContent: space-between`, so a
    // short card keeps its header at the top instead of drifting to the middle.
    h('div', { display: 'flex', flexGrow: 1, minHeight: 24 }),

    // ── Signature ──────────────────────────────────────────────────────────
    h(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `2px solid ${LINE}`,
        paddingTop: 28,
        fontFamily: 'JetBrains Mono',
        fontSize: 24,
      },
      h(
        'div',
        { display: 'flex', flexDirection: 'column' },
        h('div', { display: 'flex', fontWeight: 500, color: INK }, site.name),
        card.meta
          ? h(
              'div',
              { display: 'flex', marginTop: 8, fontSize: 21, color: INK_3 },
              clamp(card.meta, 72),
            )
          : h('div', { display: 'flex' }),
      ),
      h('div', { display: 'flex', color: INK_3 }, host),
    ),
  );

/**
 * Render one card to PNG bytes.
 *
 * `fitTo: 'original'` because the satori SVG is already 1200×630 — rescaling
 * here would resample text that was laid out at the target size.
 */
export async function renderOgPng(card: OgCard): Promise<Buffer> {
  const svg = await satori(template(card) as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } })
      .render()
      .asPng(),
  );
}

/**
 * The URL of a generated card, and the ONLY place that shape is written.
 *
 * `route` is the endpoint's `[...route]` param, so this helper and
 * `src/pages/og/[...route].png.ts` cannot disagree about where a card lives —
 * the failure mode that produces a social preview 404 nobody notices, because
 * nobody views their own page's card debugger after every content edit.
 */
export const ogPath = (route: string): string => `/og/${route}.png`;

/** The card every page without a more specific one falls back to. */
export const OG_DEFAULT_ROUTE = 'default';
