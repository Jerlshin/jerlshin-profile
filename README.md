# jerlshin-profile

A research portfolio and blog for **Jerlshin J G** — AI Researcher, Multimodal Intelligence.

**Live:** https://jerlshin-profile.vercel.app

Astro 7, static output, no adapter. Zero JavaScript frameworks, under 4 KB of JS on the heaviest page, and content that is validated at build time rather than trusted.

---

## Why it is built this way

The v1 site was a single-page React application: 839 lines in one component, ~175 KB of JavaScript, and `<div id="root"></div>` served to every crawler and scholarly indexer that asked. It rendered fine. It was also failing silently in four separate ways at once — a data file that nothing imported, two copies of the same record that had already diverged, four real certifications that rendered nowhere, and a theme toggle that wrote `'light'` down both branches of its `if`.

Every one of those shares a property: **nothing errored, nothing warned, and the site still built**.

So the governing design rule of v2 is that content errors are build errors. A paper without an abstract, an image without alt text, a published paper without a DOI, a `shipped` project with nothing to link to, a certification nobody can verify, a tag that is not a valid URL slug — none of them can reach production, because `astro check` and the Zod schemas in `src/content.config.ts` refuse them by file name and field.

The full audit, the trade-off matrices, and the eight-phase execution record are in [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md).

---

## Stack

| Concern      | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| Framework    | Astro 7, `output: 'static'`, **no adapter**                    |
| Content      | Content Layer collections + Zod schemas                        |
| Styling      | Tailwind v4 (`@tailwindcss/vite`) + CSS custom-property tokens |
| Markdown     | `unified()` processor, pinned (see below)                      |
| Math         | KaTeX at build time, self-hosted                               |
| Code         | Shiki via Expressive Code                                      |
| Search       | Pagefind — a static index, no backend                          |
| Social cards | satori + resvg, prerendered to `dist/og/`                      |
| Icons        | `astro-icon` + Lucide, inlined as SVG                          |
| Fonts        | Astro Fonts API, self-hosted and metric-matched                |
| Hosting      | Vercel free tier, zero functions                               |

**One thing worth knowing before you upgrade anything:** `astro.config.mjs` sets `markdown.processor: unified()`. Astro 7 replaced the default Markdown engine with a Rust processor that does **not** run remark/rehype plugins. Without that line, `remark-math`, `rehype-katex`, `rehype-slug`, and the reading-time plugin all load without error and simply do nothing — no math, no heading anchors, no reading times, no warning. Do not remove it.

---

## Getting started

Requires Node 22.12 or newer.

```bash
npm install
npm run build     # build once first — see below
npm run dev
```

**Build before you dev.** Pagefind's search index is written into `dist/` as the final build step, so it does not exist in a fresh clone. `astro dev` serves the previous build's index; without one, search 404s.

### Scripts

| Command           | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `npm run dev`     | Dev server (syncs KaTeX assets first)                                  |
| `npm run build`   | KaTeX sync → `astro check` → contrast check → `astro build` → Pagefind |
| `npm run preview` | Serves `dist/` exactly as it deploys                                   |
| `npm run check`   | Types, content schemas, and colour contrast — without building         |
| `npm run format`  | Prettier                                                               |

`astro check` runs _before_ `astro build`, so a schema violation fails the deploy rather than shipping broken content.

---

## Adding content

**See [`CONTENT.md`](./CONTENT.md)** — how to add a paper, a project, a post, a role, or an award, and what the build will refuse.

The short version: create one `.mdx` file (or one YAML entry) and run the build. The archive page, the detail page, the social card, the sitemap entry, the RSS item, the BibTeX, and the search record all follow from it. You do not touch a component or a route.

---

## Project layout

```
src/
├─ content/            the site's actual content — MDX + YAML
├─ content.config.ts   ALL schemas. The single contract. Read this first.
├─ config/site.ts      name, headline, socials, nav — Zod-parsed at import
├─ components/
│  ├─ primitives/      Container, Card, Tag, Btn, Icon…  (0 JS)
│  ├─ chrome/          header, footer, nav, theme toggle, drawer
│  ├─ content/         paper/project/post cards, timelines, TOC, filters
│  ├─ mdx/             auto-available inside any MDX body
│  ├─ search/          ⌘K dialog + results (lazy)
│  └─ seo/             BaseHead, JsonLd
├─ layouts/            Base, Page, Archive, Post, Paper, Project
├─ lib/                collections, tags, dates, bibtex, og, kinds — the seams
├─ pages/              routes, including og/[...route].png.ts
└─ styles/             tokens, prose
```

Two conventions carry a lot of weight:

- **`src/lib/collections.ts` is the only place `getCollection` is called.** Every ordering and visibility rule the site has lives there. A page that sorts its own entries will one day disagree with the next page that sorts the same entries.
- **`src/lib/dates.ts` is the only place a date is formatted.** Every formatter pins `timeZone: 'UTC'` and a fixed locale, so a bare `2026-03-01` cannot render as _28 February_ for a reader west of Greenwich, and builds stay byte-identical across machines.

---

## Deployment

Pushes to `main` deploy to Vercel. Pull requests get a preview deploy, and [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs `astro check && astro build` plus four assertions that would otherwise fail silently: zero functions emitted, the Pagefind index written, the social cards rendered, and formatting clean.

### Why it stays free, structurally

- **No adapter.** `output: 'static'` produces only files; nothing can invoke a function because no function exists.
- **No request-time image processing.** `astro:assets` and the OG card generation both run at build time, so Vercel's billed Image Optimization is never touched.
- **Search is a static file.** Pagefind's index is served from the CDN like an image.
- **No ISR, no middleware, no edge config.**

The one thing that would quietly break this is adding an adapter or a single `export const prerender = false`. CI fails the PR that does.

### `vercel.json`

`cleanUrls: true` and `trailingSlash: false`. That policy has to agree in three places at once — the canonical tag, the sitemap's `serialize` hook, and Vercel's router — or search engines see two URLs per page and split the ranking signal between them.

Cache headers are set by how the path is versioned, not by file type:

| Path          | Policy                            | Because                                                            |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| `/_astro/*`   | 1 year, `immutable`               | Content-hashed by Vite; the name changes when the bytes do.        |
| `/og/*`       | 1 day + `stale-while-revalidate`  | Stable paths, regenerated content — a card must be able to update. |
| `/katex/*`    | 1 week + `stale-while-revalidate` | Vendored from npm at a stable path; survives a KaTeX upgrade.      |
| `/pagefind/*` | 1 hour                            | Rebuilt on every deploy.                                           |

Security headers (`nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `X-Frame-Options`) apply to everything.

---

## Known outstanding content

These need facts only the site owner has; they were deliberately **not** invented, because putting fabricated academic or professional claims on a live site is a worse failure than the one this rebuild exists to fix. Each is recorded as a `CONTENT STATUS` comment in the file it belongs to.

- Published abstracts and complete co-author lists for the three papers, then `authorsTruncated: false`.
- Repository or live URLs for the projects currently marked `prototype` (adding one is what allows `status: 'shipped'`).
- Verification URLs or credential IDs — plus issue dates — for the four DeepLearning.AI / Stanford certifications, which the schema requires before they can be listed.
- A CV PDF at `public/cv/jerlshin-jg-cv.pdf`. Until it exists, `site.cv` is `null` and every CV control is **absent rather than broken**; set the path in `src/config/site.ts` and they return.
- Google Scholar / ORCID / arXiv profile URLs for `site.socials`.
- Confirmation of the exact education start and end months (currently `2021-07-01` / `2025-05-01`).

---

## License

Content (`src/content/`, `public/`) © Jerlshin J G — all rights reserved. The site code is available for reference.
