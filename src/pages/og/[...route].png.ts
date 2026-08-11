/**
 * src/pages/og/[...route].png.ts — the social cards, emitted as real files.
 *
 * PRERENDERED, WHICH IS THE ENTIRE POINT (§2.6, §7.3). With `output: 'static'`
 * and no adapter, every path `getStaticPaths` returns is rasterised during
 * `astro build` and written to `dist/og/…png`. Vercel then serves them as
 * static assets: no function is invoked, so nothing here can be billed. One
 * `export const prerender = false` in this file would quietly convert the site
 * to on-demand rendering — that is risk #10, and this is the file it would
 * happen in.
 *
 * WHICH ROUTES EXIST. One card per content entry, plus a single `default` card
 * for the homepage and every static page. Archives deliberately do NOT get
 * bespoke cards: their heading and lede live in the page files, so generating a
 * card from them would mean writing that copy a second time here — a second
 * copy that drifts, which is audit finding #2 reproduced inside the new
 * architecture. The default card is built entirely from `site.ts`, which is
 * already the single source for the site's own description.
 *
 * The sitemap `filter` in astro.config.mjs excludes `/og/`, so these never
 * appear as crawlable pages.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { papers, projects, posts } from '../../lib/collections.ts';
import { renderOgPng, OG_DEFAULT_ROUTE, type OgCard } from '../../lib/og.ts';
import { site } from '../../config/site.ts';
import { formatDate, formatShortMonthYear } from '../../lib/dates.ts';

/**
 * Status words for the meta line. Typed off the schema rather than written as
 * a loose string map, so adding a status to content.config.ts without adding a
 * label here is an `astro check` error instead of a card reading "undefined".
 */
type PaperStatus = Awaited<ReturnType<typeof papers>>[number]['data']['status'];
type ProjectStatus = Awaited<ReturnType<typeof projects>>[number]['data']['status'];

const PAPER_STATUS: Record<PaperStatus, string> = {
  published: 'Published',
  accepted: 'Accepted',
  'under-review': 'Under review',
  preprint: 'Preprint',
  'in-preparation': 'In preparation',
};

const PROJECT_STATUS: Record<ProjectStatus, string> = {
  active: 'Active',
  shipped: 'Shipped',
  prototype: 'Prototype',
  archived: 'Archived',
};

/** `a · b · c`, skipping anything absent. */
const line = (...parts: (string | undefined | false)[]): string =>
  parts.filter(Boolean).join(' · ');

export const getStaticPaths: GetStaticPaths = async () => {
  const [allPapers, allProjects, allPosts] = await Promise.all([papers(), projects(), posts()]);

  return [
    {
      params: { route: OG_DEFAULT_ROUTE },
      props: {
        card: {
          kind: 'Profile',
          title: site.name,
          summary: site.tagline,
          meta: line(site.headline, site.location),
        } satisfies OgCard,
      },
    },

    ...allPapers.map((paper) => ({
      params: { route: `research/${paper.id}` },
      props: {
        card: {
          kind: 'Research',
          title: paper.data.title,
          summary: paper.data.tldr,
          meta: line(
            paper.data.venue.short ?? paper.data.venue.name,
            String(paper.data.venue.year),
            PAPER_STATUS[paper.data.status],
          ),
        } satisfies OgCard,
      },
    })),

    ...allProjects.map((project) => ({
      params: { route: `projects/${project.id}` },
      props: {
        card: {
          kind: 'Project',
          title: project.data.title,
          summary: project.data.summary,
          meta: line(
            PROJECT_STATUS[project.data.status],
            // The first three of the stack: enough to say what it is built on
            // without the meta line wrapping into the signature.
            project.data.stack.slice(0, 3).join(', '),
          ),
        } satisfies OgCard,
      },
    })),

    ...allPosts.map((post) => ({
      params: { route: `blog/${post.id}` },
      props: {
        card: {
          kind: 'Writing',
          title: post.data.title,
          summary: post.data.description,
          meta: line(
            formatDate(post.data.pubDate),
            post.data.updatedDate && `updated ${formatShortMonthYear(post.data.updatedDate)}`,
          ),
        } satisfies OgCard,
      },
    })),
  ];
};

export const GET: APIRoute<{ card: OgCard }> = async ({ props }) =>
  new Response(new Uint8Array(await renderOgPng(props.card)), {
    headers: {
      'Content-Type': 'image/png',
      // Belt and braces: the file is immutable in `dist/`, and vercel.json sets
      // the real policy. This header is what `astro preview` serves.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
