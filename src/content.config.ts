// src/content.config.ts
// The single readable contract describing what content this site can hold.
// Astro generates TypeScript types from this file — a typo in a frontmatter
// key fails the build with a file path and line number, not a silent gap.
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// ── Shared primitives (§4.1) ───────────────────────────────────────────────

// Tags are slugs, always. This single rule keeps /blog/tags/[tag] URLs stable
// forever and makes tag equality a string compare, not a fuzzy match.
const tag = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'tags must be lowercase kebab-case');

const url = z.url();
const path = z.string().startsWith('/'); // an asset served from public/

const author = z.object({
  name: z.string(),
  affiliation: z.string().optional(),
  url: url.optional(),
  isMe: z.boolean().default(false), // drives bolding in <AuthorList />
});

const venue = z.object({
  name: z.string(), // "Expert Systems with Applications"
  short: z.string().optional(), // "ESWA"
  kind: z.enum(['journal', 'conference', 'workshop', 'preprint', 'thesis']),
  year: z.number().int().min(2015).max(2100),
  volume: z.string().optional(),
  pages: z.string().optional(),
  publisher: z.string().optional(),
});

const metric = z.object({
  label: z.string(), // "Latency reduction"
  value: z.string(), // "63%" — string, so "5x" and "SOTA" work
  detail: z.string().optional(),
});

// ── research (§4.2) ─────────────────────────────────────────────────────────

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(200),
        authors: z.array(author).min(1),
        /**
         * True when `authors` is a prefix of the real author list rather than
         * the whole of it — <AuthorList /> then renders a real "et al.".
         *
         * This field exists so that an incomplete author list is a DECLARED
         * state instead of an invisible one. Listing two of five authors with
         * no marker asserts sole/joint authorship that the data does not
         * support; the v1 source only ever stored "Jerlshin J. G., et al.", so
         * for most entries the tail genuinely is unknown until supplied.
         */
        authorsTruncated: z.boolean().default(false),
        venue,
        status: z.enum(['published', 'accepted', 'under-review', 'preprint', 'in-preparation']),
        date: z.coerce.date(), // sorting key, independent of venue.year
        abstract: z.string().min(80),
        tldr: z.string().max(240), // the one line on cards and OG images
        topics: z.array(tag).min(1).max(8),
        links: z
          .object({
            arxiv: url.optional(),
            doi: url.optional(),
            code: url.optional(),
            dataset: url.optional(),
            video: url.optional(),
            pdf: path.optional(),
            slides: path.optional(),
            poster: path.optional(),
          })
          .default({}),
        bibtex: z.string().optional(), // raw @article{...}; rendered copyable
        metrics: z.array(metric).default([]),
        related: z.array(reference('projects')).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        order: z.number().int().default(999),
      })
      // ── REFINE 1: accessibility enforced at build time, not by discipline ──
      .refine((d) => !d.cover || Boolean(d.coverAlt), {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      })
      // ── REFINE 2: a published paper with no DOI or arXiv link is a mistake ──
      .refine((d) => d.status !== 'published' || Boolean(d.links.doi || d.links.arxiv), {
        message: 'published papers must have links.doi or links.arxiv',
        path: ['links'],
      })
      // ── REFINE 3: exactly one author must be flagged as the site owner ──
      .refine((d) => d.authors.filter((a) => a.isMe).length === 1, {
        message: 'exactly one author must have isMe: true',
        path: ['authors'],
      }),
});

// ── projects (§4.3) ──────────────────────────────────────────────────────

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(120),
        summary: z.string().min(40).max(200), // card text AND meta description
        category: z.enum(['research', 'engineering', 'systems', 'tooling', 'demo']),
        status: z.enum(['active', 'shipped', 'prototype', 'archived']),
        role: z.string().optional(), // "Lead, 4-person team"
        start: z.coerce.date(),
        end: z.coerce.date().nullable().default(null), // null = ongoing
        stack: z.array(z.string()).min(1), // display strings: "PyTorch"
        tags: z.array(tag).default([]), // slugs: filtering + cross-linking
        links: z
          .object({
            repo: url.optional(),
            live: url.optional(),
            demo: url.optional(),
            docs: url.optional(),
            video: url.optional(),
          })
          .default({}),
        metrics: z.array(metric).default([]),
        architecture: z
          .object({
            diagram: image(),
            alt: z.string(), // required — no .optional() here
            caption: z.string().optional(),
          })
          .optional(),
        related: z.array(reference('research')).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        order: z.number().int().default(999),
      })
      .refine((d) => !d.cover || Boolean(d.coverAlt), {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      })
      .refine((d) => !d.end || d.end >= d.start, {
        message: 'end must not precede start',
        path: ['end'],
      })
      .refine((d) => d.status !== 'shipped' || Boolean(d.links.repo || d.links.live), {
        message: 'shipped projects need links.repo or links.live',
        path: ['links'],
      }),
});

// ── blog (§4.4) ───────────────────────────────────────────────────────────

const blog = defineCollection({
  // The [^_] prefix means _draft-post.mdx is invisible to the loader entirely.
  loader: glob({ base: './src/content/blog', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(120),
        description: z.string().min(50).max(180), // enforced meta-description length
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        draft: z.boolean().default(false), // visible in dev, filtered in prod
        tags: z.array(tag).min(1).max(6),
        series: z
          .object({
            id: z.string(),
            order: z.number().int().positive(),
          })
          .optional(),
        math: z.boolean().default(false), // gates the KaTeX stylesheet
        toc: z.boolean().default(true),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        canonical: url.optional(), // if cross-posted elsewhere first
      })
      .refine((d) => !d.cover || Boolean(d.coverAlt), {
        message: 'coverAlt is required when cover is set',
        path: ['coverAlt'],
      })
      .refine((d) => !d.updatedDate || d.updatedDate >= d.pubDate, {
        message: 'updatedDate must not precede pubDate',
        path: ['updatedDate'],
      }),
});

// ── pages (standalone long-form bodies) ───────────────────────────────────

/**
 * Long-form page bodies that are neither an archive entry nor a post — today
 * just `about.mdx`.
 *
 * It needs a collection at all because a loose file under src/content/ that no
 * loader globs is loaded by nothing, validated by nothing, and rendered by
 * nothing: exactly audit finding #3, reproduced in the new architecture. With
 * this collection the file is typed, its frontmatter is checked, and deleting
 * it breaks the build instead of quietly emptying a page.
 *
 * The pattern is an explicit allow-list rather than `*.mdx` so that a stray
 * file dropped into src/content/ becomes a build error, not a silent new route.
 */
const pages = defineCollection({
  loader: glob({ base: './src/content', pattern: 'about.mdx' }),
  schema: z.object({
    title: z.string().max(120),
    // Same 50–180 bound as blog: it is the meta description either way.
    description: z.string().min(50).max(180),
    lede: z.string().max(240).optional(),
  }),
});

// ── experience, education, achievements, skills (§4.5 — YAML via file()) ──

const experience = defineCollection({
  loader: file('./src/content/experience.yaml'),
  schema: ({ image }) =>
    z
      .object({
        id: z.string(),
        role: z.string(),
        organization: z.string(),
        orgUrl: url.optional(),
        logo: image().optional(),
        location: z.string(),
        mode: z.enum(['onsite', 'remote', 'hybrid']).optional(),
        kind: z.enum(['research', 'industry', 'internship', 'teaching', 'fellowship']),
        start: z.coerce.date(),
        end: z.coerce.date().nullable().default(null), // null renders as "Present"
        summary: z.string().max(240),
        highlights: z.array(z.string()).min(1).max(6), // cap forces editing
        stack: z.array(z.string()).default([]),
        links: z.object({ paper: url.optional(), repo: url.optional() }).default({}),
        featured: z.boolean().default(false),
      })
      .refine((d) => !d.end || d.end >= d.start, {
        message: 'end must not precede start',
        path: ['end'],
      }),
});

const education = defineCollection({
  loader: file('./src/content/education.yaml'),
  schema: z.object({
    id: z.string(),
    degree: z.string(),
    specialization: z.string().optional(),
    institution: z.string(),
    location: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().nullable().default(null),
    grade: z.string().optional(),
    thesis: z
      .object({
        title: z.string(),
        advisor: z.string().optional(),
        url: url.optional(),
        entry: reference('research').optional(), // links thesis → paper page
      })
      .optional(),
    coursework: z.array(z.string()).default([]),
  }),
});

const achievements = defineCollection({
  loader: file('./src/content/achievements.yaml'),
  schema: z
    .object({
      id: z.string(),
      title: z.string(),
      issuer: z.string(),
      date: z.coerce.date(),
      kind: z.enum([
        'award',
        'hackathon',
        'competition',
        'scholarship',
        'leadership',
        'certification',
      ]),
      standing: z
        .object({
          rank: z.number().int().positive().optional(), // 1 → "Winner", 5 → "5th"
          label: z.string().optional(), // "Finalist"
          outOf: z.number().int().positive().optional(), // 2500 → "of 2,500"
        })
        .optional(),
      description: z.string().max(300),
      verification: url.optional(), // certificate / results page
      credentialId: z.string().optional(),
      tags: z.array(tag).default([]),
      featured: z.boolean().default(false),
    })
    // Certifications without proof are unverifiable claims — block them at build.
    .refine((d) => d.kind !== 'certification' || Boolean(d.verification || d.credentialId), {
      message: 'certifications need a verification link or a credentialId',
      path: ['verification'],
    }),
});

const skills = defineCollection({
  loader: file('./src/content/skills.yaml'),
  schema: z.object({
    id: z.string(), // "languages-core"
    category: z.string(), // "Languages & Core"
    order: z.number().int(),
    items: z.array(z.string()).min(1),
  }),
});

export const collections = {
  research,
  projects,
  blog,
  pages,
  experience,
  education,
  achievements,
  skills,
};
