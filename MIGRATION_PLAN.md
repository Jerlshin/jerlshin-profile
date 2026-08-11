# MIGRATION_PLAN.md

**Project:** `Jerlshin/work-profile`
**Migration:** v1 (Vite 7 + React 19 SPA) → v2 (Astro 7 static site + blog)
**Status:** Phases 0–7 executed. All eight phases complete except the four items that
need Vercel account access or a merge decision, each marked ❌ in place below.
**Last verified:** 2026-08-11 against the production build.
**Authored:** 2026-08-11
**Estimated effort:** ~7 focused days across 8 phases

---

## Table of Contents

1. [Executive Summary & Audit Findings](#1-executive-summary--audit-findings)
2. [Technology Stack & Trade-Off Matrix](#2-technology-stack--trade-off-matrix)
3. [Complete Project Directory Structure](#3-complete-project-directory-structure)
4. [Content Layer Schemas (TypeScript / Zod)](#4-content-layer-schemas-typescript--zod)
5. [Content Migration Mapping Matrix](#5-content-migration-mapping-matrix)
6. [Component Inventory & JS Cost Allocation](#6-component-inventory--js-cost-allocation)
7. [8-Phase Execution Roadmap & Exit Gates](#7-8-phase-execution-roadmap--exit-gates)
8. [Appendix — Full Configuration Files](#8-appendix--full-configuration-files)

---

## 1. Executive Summary & Audit Findings

### 1.1 Executive summary

The current site is a single-page React application whose entire content and presentation live in one 839-line component (`src/App.jsx`). It renders correctly today, but it cannot support the stated goals — a research archive, an MDX blog with math and code, per-item social preview cards, and search-engine indexability — without a rewrite. More importantly, an audit found that **the architecture has already begun failing silently**: content exists that renders nowhere, two copies of the same data have diverged, and a user-facing control does not do what it claims.

Every one of those failures shares a property: **nothing errors, nothing warns, and the site still builds**. That single observation drives the entire target architecture. The most valuable property of the new system is not that it is faster or prettier — it is that **content errors become build errors**.

The target is Astro 7 with static output, Zod-validated content collections, and zero JavaScript on the page by default. The result is a site that:

- Costs **$0/month** on Vercel's free tier, structurally (no adapter, no functions, no request-time image processing).
- Ships **under 5 KB of JavaScript** per page, versus roughly 190 KB today.
- Cannot deploy a paper with a missing abstract, an image without alt text, or a published paper without a DOI.
- Separates content (Git-tracked MDX and YAML) from rendering (`.astro` components) so that ten years of writing accumulate without ten years of code debt.

### 1.2 The eight silent failure modes in the current codebase

| #     | Finding                                                            | Evidence                                                                                                                                                                             | Consequence                                                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | `src/portfolioData.json` is dead code — never imported by anything | `src/main.jsx` imports only `App.jsx` and `index.css`; `App.jsx:33` declares its own inline `portfolioData` object                                                                   | The README's claim that the JSON file is the "CENTRAL SOURCE OF TRUTH" is false. Editing it changes nothing on the rendered site.                                                                                                                    |
| **2** | The two copies of the data have already diverged                   | Botter Solutions location is `"Haryana, India"` at `portfolioData.json:50` but `"Bangalore, India"` at `App.jsx:82`                                                                  | Content drift after only five commits. This is precisely the debt the migration is meant to prevent, already present.                                                                                                                                |
| **3** | `certifications` renders nowhere                                   | Four entries at `portfolioData.json:113`; absent from the `App.jsx` data object and from every line of JSX                                                                           | Real credentials are invisible to visitors with no error, no warning, and no way to notice.                                                                                                                                                          |
| **4** | Dark mode never persists across a reload                           | `App.jsx:381–389` — **both** branches of the `if` call `localStorage.setItem('theme', 'light')`                                                                                      | The toggle appears to work until the page reloads, then silently resets. The comment above it reads `// FORCE LIGHT MODE BY DEFAULT`, so the intent is ambiguous — but the control is a lie either way. **Resolved by approved decision (b) below.** |
| **5** | Two animation classes are silent no-ops                            | `animate-gradient` (`App.jsx:542`) and `animate-float-delayed` (`App.jsx:587`) are referenced in `className` but never defined in the `styles` template literal at `App.jsx:168–228` | Intended motion is simply absent. No build step, linter, or type checker catches an undefined CSS class.                                                                                                                                             |
| **6** | `tailwind.config.js` is inert                                      | A Tailwind v3-shaped config object in a Tailwind v4 project — `src/index.css` already uses `@import "tailwindcss"` and `@variant dark`, and v4 does automatic content detection      | A misleading configuration surface. A future maintainer will edit it and observe no effect.                                                                                                                                                          |
| **7** | Search engines and social scrapers receive an empty shell          | `index.html` ships `<div id="root"></div>` with `<title>my-portfolio</title>`, no meta description, no OpenGraph tags, no canonical URL                                              | Zero indexable content, zero social preview, and the literal string "my-portfolio" as the title in every share and search result.                                                                                                                    |
| **8** | One 839-line component with no routes                              | `src/App.jsx` holds the data, the stylesheet, six component definitions, and the entire page in a single file                                                                        | A blog, a paper detail page, or per-item metadata cannot be added without a rewrite. That rewrite is this document.                                                                                                                                  |

**Additional minor findings (not counted among the eight):**

- Six `lucide-react` icons are imported and never used: `ChevronRight`, `Network`, `Minus`, `Square`, `CloseIcon`, and `Terminal`'s unused siblings.
- `<style>{styles}</style>` at `App.jsx:437` re-injects a full stylesheet inside the React tree on every render.
- The `scroll-progress` bar listens to `scroll` without throttling, firing a `setState` on every scroll event.
- Content that exists **only** as hardcoded JSX and is in neither data file: the "Open to Research Collaborations" badge (`App.jsx:537`), the footer tagline (`App.jsx:807`), and all six section subtitles. These must be captured during migration or they will be lost — see §5.6.

### 1.3 Approved decisions

These four questions blocked Phase 0 and have been answered.

| #       | Decision                      | Value                                                                                                              | Impact on the plan                                                                                                                                                                                                                                                                                                                                            |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a)** | **Production domain**         | `https://jerlshin-profile.vercel.app`                                                                              | Becomes `site` in `astro.config.mjs`. Feeds every canonical URL, the sitemap, the RSS feed, and all OpenGraph image URLs. Written **without** a trailing slash to match the no-trailing-slash canonical policy in §7.2 risk #8. If a custom domain is added later, this is the single value that changes, plus a Vercel redirect from the `.vercel.app` host. |
| **(b)** | **Default theme**             | System preference (`prefers-color-scheme`), overridden by `localStorage` when the user has made an explicit choice | Supersedes the current force-light behavior. Confirms audit finding #4 is a **bug to fix**, not intentional. Drives the three-block token structure and the blocking inline script in §6.2.                                                                                                                                                                   |
| **(c)** | **Botter Solutions location** | `Bangalore, India`                                                                                                 | Resolves the audit finding #2 conflict. `App.jsx:82` was correct; `portfolioData.json:50` was stale.                                                                                                                                                                                                                                                          |
| **(d)** | **Public phone number**       | **Omitted** from the public site                                                                                   | `profile.phone` is dropped during the port and does not appear in `src/config/site.ts`. It is currently present in `portfolioData.json:8` but rendered nowhere, so no visible behavior changes. Contact remains email + LinkedIn.                                                                                                                             |

---

## 2. Technology Stack & Trade-Off Matrix

### 2.1 Static site generator: Astro 7

**Current release: Astro 7.2.0.** Astro 6.0 reached stable on 10 March 2026 (Fonts API, CSP API, Live Content Collections, Vite Environment API). Astro 7.0 followed in mid-2026 with a Rust `.astro` compiler, Vite 8 with the Rolldown bundler, and 15–61% faster builds. The content collections API has been stable since v5 and survived two major versions unchanged — that stability record is the primary reason to bet a decade of writing on it.

| Criterion                           | **Astro 7**                                            | Next.js (App Router, SSG)                                 | Hugo                                        |
| ----------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------- |
| JS shipped for a static page        | ✅ **0 KB by default**                                 | ❌ React runtime + RSC payload on every route             | ✅ 0 KB                                     |
| Typed content model                 | ✅ **Content Layer + Zod → generated TS types**        | ⚠️ None built in; needs a third-party layer               | ❌ Untyped front matter                     |
| MDX with components                 | ✅ First-class (`@astrojs/mdx`)                        | ✅ Supported                                              | ❌ Not supported — Goldmark shortcodes only |
| Authoring model                     | `.astro` templates + optional React/Svelte/Vue islands | React only                                                | ❌ Go templates                             |
| Interactive widgets                 | ✅ Per-component islands, opt-in                       | ❌ Whole-tree hydration                                   | ❌ Hand-rolled JS                           |
| Build speed at ~500 posts           | Fast (Rust compiler, Vite 8 / Rolldown)                | Moderate                                                  | ✅ Fastest                                  |
| Vercel free-tier posture            | ✅ **Pure static, no adapter, zero functions**         | ⚠️ Easy to slip into serverless/ISR unnoticed             | ✅ Pure static                              |
| Ten-year churn risk                 | Moderate — content API stable across v5→v7             | ❌ High — the Pages→App Router migration is the precedent | ✅ Very low                                 |
| Cost of adding a paper detail page  | ✅ One `.astro` file + one `.mdx` file                 | Route + layout + metadata export                          | Template + partial + archetype              |
| Escape hatch if requirements change | ✅ Add any UI framework as an island                   | Locked to React                                           | ❌ None                                     |

> **DECISION — Astro 7, `output: 'static'`, no adapter.**
>
> It is the only option that provides zero-JS-by-default **and** a typed content model **and** MDX **and** an escape hatch to React if a future widget genuinely requires one.
>
> **Next.js is rejected** because shipping a React runtime to render a CV is a permanent performance tax with no corresponding return, and its own migration history (Pages Router → App Router) is exactly the category of code debt this migration is designed to avoid. SSG-only Next.js still hydrates.
>
> **Hugo is rejected on authoring ergonomics alone.** It wins outright on longevity and build speed, but has no MDX, no schema types, and Go templates would make the ~35-component blueprint in §6 painful to build and considerably worse to evolve. It remains the fallback if minimum maintenance ever outranks developer experience.

### 2.2 Markdown pipeline — pin `unified()`, do not accept the default

**This is the least obvious and most consequential decision in the plan.**

Astro 7 replaced the default Markdown/MDX engine with **Sätteri**, a Rust-based processor. It is dramatically faster and includes GFM, smart punctuation, heading IDs, container directives, and math natively. However:

> **The remark/rehype pipeline is no longer included by default in Astro 7.**

The plugins this site requires — `remark-math`, `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`, and a reading-time plugin — are unified-ecosystem packages that have **not** been ported to Sätteri's MDAST/HAST plugin API. Installing them and adding them to `markdown.remarkPlugins` without the pin below produces **no error and no math** — the exact silent failure class from §1.2.

```js
// astro.config.mjs — the one line that de-risks the next five years
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: {
    processor: unified(), // REQUIRED in v7 to keep remark/rehype working
    remarkPlugins: [remarkMath, remarkReadingTime],
    rehypePlugins: [rehypeKatex, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
  },
});
```

**Rationale.** The unified ecosystem has been stable for roughly a decade across the entire JavaScript world, not merely within Astro. The build-speed argument for Sätteri is real but irrelevant below ~500 posts. `@astrojs/markdown-remark` is a first-party Astro package, not a community shim, so the escape hatch is maintained by the same team.

**Review cadence:** re-evaluate annually. Sätteri's native math emits MathML, which is the genuinely timeless long-term destination once the plugin ecosystem lands. Migrating back is a config swap plus plugin equivalents.

### 2.3 Syntax highlighting — Shiki, wrapped in Expressive Code

| Option                                             | Runtime JS    | Verdict                                                                                                                                                                                      |
| -------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shiki** (Astro built-in)                         | **0 KB**      | ✅ **Base layer.** Uses VS Code TextMate grammars, so highlighting matches the editor exactly. Runs at build time and emits CSS variables for dual light/dark themes.                        |
| **Expressive Code** `astro-expressive-code@0.44.x` | **~2 KB**     | ✅ **Adopted.** Adds the copy button, frame titles, line highlighting, diff markers, and word-wrap toggle. Framework-free JavaScript, loaded once. Verified peer dependency: `astro@^7.0.0`. |
| Prism                                              | CSS + runtime | ❌ **Rejected.** Less accurate grammars, requires shipping a theme stylesheet, and has no clean dual-theme story.                                                                            |

Dual themes are configured once (`themes: ['github-light', 'github-dark']`) with `useDarkModeMediaQuery: false` and a `themeCssSelector` keyed to `[data-theme]`, so code blocks flip with the site toggle rather than fighting it.

### 2.4 Math — KaTeX at build time

> **DECISION — KaTeX via `remark-math` + `rehype-katex`.**
>
> The decisive property is that **rendering happens at build time**. The HTML that reaches the browser already contains the typeset equation. Zero client-side JavaScript, and no flash of raw `$\alpha$` before a script runs.
>
> **MathJax is rejected:** heavier, slower, and its genuine advantage — broad LaTeX package support — does not apply to the inline notation a research blog actually uses.

Two operational rules:

- **Self-host `katex.min.css` and its font files from the npm package.** Never link the CDN. A third-party URL embedded in a page intended to last a decade is a guaranteed future 404.
- **Load the KaTeX stylesheet conditionally,** gated on `math: true` in frontmatter, so the ~90% of pages with no equations do not pay ~23 KB of CSS plus font downloads.

### 2.5 Search — Pagefind

**Pagefind 1.5.x** via `astro-pagefind@2.0.1` (verified peer dependency: `astro@^7`). A Rust indexer runs as the final build step over the emitted HTML in `dist/` and writes a chunked static index to `dist/pagefind/`. The browser loads WebAssembly plus only the index chunks a given query actually touches.

No backend. No API key. No per-query billing. No account that can lapse.

| Rejected                  | Reason                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Algolia**               | An external account and a service dependency in a site whose entire premise is not having one.                                            |
| **Lunr / FlexSearch**     | The complete index ships to the client and grows without bound as the blog does.                                                          |
| **Fuse.js** for full text | Fine for filtering 50 known items; wrong for full-text search over a decade of writing. Tag filtering does not need it either — see §6.3. |

### 2.6 Supporting tooling

| Concern         | Choice                                                                                         | Why                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Styling         | **Tailwind v4 via `@tailwindcss/vite`**                                                        | The supported path in Astro (not the PostCSS plugin). CSS-first config in `global.css` using `@theme`. Delete `tailwind.config.js` and `postcss.config.js`.                |
| Design tokens   | **CSS custom properties**                                                                      | The theme switch becomes one attribute flip on `<html>`. Survives any future CSS framework change untouched.                                                               |
| Fonts           | **Astro Fonts API** (stable in v7)                                                             | Self-hosts, subsets, and generates metric-matched fallbacks automatically → no CLS, no Google Fonts request, no third party. Configured with `fontProviders.fontsource()`. |
| Icons           | **`astro-icon` + `@iconify-json/lucide`**                                                      | The same Lucide icon set used today, inlined as SVG at build time. Drops `lucide-react` and with it the last reason to ship React.                                         |
| Images          | **`astro:assets` + sharp**                                                                     | Build-time resize, AVIF/WebP conversion, content hashing, and inferred `width`/`height` attributes so images cannot cause layout shift.                                    |
| Social cards    | **Build-time OG generation** (satori + resvg) at `src/pages/og/[...route].png.ts`, prerendered | Emits real PNG files into `dist/`. No serverless function, so the free tier stays free.                                                                                    |
| Feeds & sitemap | `@astrojs/rss`, `@astrojs/sitemap`                                                             | First-party, ~20 lines each.                                                                                                                                               |
| Navigation feel | `prefetch: { prefetchAll: true, defaultStrategy: 'viewport' }`                                 | ~1 KB delivers near-instant page transitions without an SPA router. View Transitions remain optional — they add JavaScript and a class of bugs for a cosmetic gain.        |
| Linting         | **`astro check` + Prettier with `prettier-plugin-astro`**                                      | Drop ESLint. Type errors and schema violations are what actually break this site; code style is a formatter's job, not a linter's.                                         |

### 2.7 Dependency budget

Twelve runtime dependencies, total:

```
astro                      @astrojs/mdx              @astrojs/rss
@astrojs/sitemap           @astrojs/markdown-remark  astro-expressive-code
astro-pagefind             astro-icon                tailwindcss
remark-math                rehype-katex              katex
```

Every one is either first-party Astro or a unified-ecosystem package with a decade of history. Nothing on the critical path is a single maintainer's weekend project.

### 2.8 Runtime JS budget analysis

**Current (v1), on the only page that exists:**

| Asset                                  | Approx. minified                             |
| -------------------------------------- | -------------------------------------------- |
| `react` + `react-dom` 19               | ~140 KB                                      |
| `lucide-react` (22 icons, tree-shaken) | ~8 KB                                        |
| Application code (`App.jsx`)           | ~25 KB                                       |
| Injected `<style>` block               | ~2 KB                                        |
| **Total**                              | **~175 KB** (~60 KB gzipped), on every visit |

**Target (v2), per page type — measured before any user interaction:**

| Page type                                    | Scripts loaded                                                                    | Budget                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/` (homepage)                               | theme toggle (0.35) + mobile drawer (0.40) + back-to-top (0.25) + prefetch (1.00) | **~2.0 KB**                                          |
| `/research`, `/projects`, `/blog` (archives) | above + `TagFilter` (1.20)                                                        | **~3.2 KB**                                          |
| `/blog/[slug]` (post with code)              | above minus TagFilter + Expressive Code (2.00)                                    | **~4.0 KB**                                          |
| `/research/[slug]` (paper with BibTeX)       | base + BibTeX copy button (0.40)                                                  | **~2.4 KB**                                          |
| Search dialog **opened**                     | Pagefind WASM (~40 KB) + index chunks                                             | **Lazy — excluded**, loads on first interaction only |

> **BUDGET — under 5 KB of JavaScript on every page type before interaction.**
> A ~97% reduction against the current baseline. This is enforced as a Phase 6 exit gate, not treated as an aspiration.

**Additional performance targets:** LCP under 1.2 s on a throttled 4G mobile profile · CLS under 0.01 · Lighthouse 100/100/100/100 as a merge gate.

### 2.9 Build pipeline

```
┌─────────────┐   ┌──────────────┐   ┌────────────────┐   ┌──────────┐   ┌────────────┐
│  1. SOURCE  │──▶│ 2. VALIDATE  │──▶│ 3. TRANSFORM   │──▶│ 4. INDEX │──▶│  5. SHIP   │
├─────────────┤   ├──────────────┤   ├────────────────┤   ├──────────┤   ├────────────┤
│ MDX + YAML  │   │ glob()/file()│   │ Rust compiler  │   │ Pagefind │   │ Vercel CDN │
│ in          │   │ loaders      │   │ unified+KaTeX  │   │ post-    │   │            │
│ src/content │   │ + Zod schema │   │ Shiki, sharp   │   │ build    │   │ Plain      │
│ images      │   │              │   │ satori (OG)    │   │ pass     │   │ files.     │
│ colocated   │   │ FAILURE =    │   │                │   │ over     │   │ No         │
│             │   │ BUILD FAILS  │   │                │   │ dist/    │   │ functions. │
└─────────────┘   └──────────────┘   └────────────────┘   └──────────┘   └────────────┘
```

---

## 3. Complete Project Directory Structure

```
work-profile/
├─ .github/
│  └─ workflows/
│     └─ ci.yml                          # astro check && astro build on every PR
├─ public/                               # copied verbatim, never processed
│  ├─ cv/
│  │  └─ jerlshin-jg-cv.pdf
│  ├─ papers/                            # self-hosted PDFs, slides, posters
│  │  ├─ seed-classification-moe.pdf
│  │  └─ superpixel-graph-skin-lesion.pdf
│  ├─ favicon.svg
│  └─ robots.txt
│
├─ src/
│  ├─ assets/                            # processed by astro:assets
│  │  ├─ profile/
│  │  │  └─ avatar.jpg
│  │  └─ og/
│  │     └─ background.png
│  │
│  ├─ components/
│  │  ├─ primitives/
│  │  │  ├─ Container.astro   Section.astro      SectionHeader.astro
│  │  │  ├─ Card.astro        Tag.astro          Pill.astro
│  │  │  ├─ StatusBadge.astro Rule.astro         Prose.astro
│  │  │  └─ Icon.astro        Btn.astro
│  │  ├─ chrome/
│  │  │  ├─ SiteHeader.astro  Nav.astro          MobileDrawer.astro
│  │  │  ├─ ThemeToggle.astro SiteFooter.astro   SkipLink.astro
│  │  │  └─ Breadcrumbs.astro BackToTop.astro
│  │  ├─ content/
│  │  │  ├─ PaperCard.astro           PaperMeta.astro
│  │  │  ├─ AuthorList.astro          VenueLine.astro       BibtexBlock.astro
│  │  │  ├─ ProjectCard.astro         MetricGrid.astro      StackList.astro
│  │  │  ├─ ArchitectureFigure.astro
│  │  │  ├─ ExperienceTimeline.astro  ExperienceItem.astro  EducationCard.astro
│  │  │  ├─ AchievementCard.astro     StandingBadge.astro   VerifyLink.astro
│  │  │  ├─ PostCard.astro            PostMeta.astro        ReadingTime.astro
│  │  │  ├─ TableOfContents.astro     SeriesNav.astro       PrevNext.astro
│  │  │  ├─ Pagination.astro          TagList.astro         TagFilter.astro
│  │  │  ├─ EmptyState.astro          FeaturedRail.astro
│  │  ├─ mdx/                          # auto-imported into MDX via mdx-components
│  │  │  ├─ Callout.astro  Figure.astro  Aside.astro
│  │  │  └─ Details.astro  Video.astro   Diagram.astro
│  │  ├─ search/
│  │  │  ├─ SearchTrigger.astro  SearchDialog.astro  SearchResults.astro
│  │  └─ seo/
│  │     ├─ BaseHead.astro  JsonLd.astro
│  │
│  ├─ content/
│  │  ├─ research/
│  │  │  ├─ seed-classification-moe/
│  │  │  │  ├─ index.mdx
│  │  │  │  └─ figures/architecture.png
│  │  │  ├─ superpixel-graph-skin-lesion/
│  │  │  │  ├─ index.mdx
│  │  │  │  └─ figures/gnn-explainer.png
│  │  │  └─ vit-human-action-recognition/
│  │  │     └─ index.mdx
│  │  ├─ projects/
│  │  │  ├─ graph-multitask-medical-imaging/index.mdx
│  │  │  ├─ adaptive-learning-device/index.mdx
│  │  │  └─ healthcare-communication-platform/index.mdx
│  │  ├─ blog/
│  │  │  └─ 2026/
│  │  │     ├─ aligning-ecg-and-video/
│  │  │     │  ├─ index.mdx
│  │  │     │  └─ figures/sync-drift.png
│  │  │     └─ _draft-post.mdx           # underscore = invisible to the loader
│  │  ├─ experience.yaml
│  │  ├─ education.yaml
│  │  ├─ achievements.yaml
│  │  ├─ skills.yaml
│  │  └─ about.mdx                        # long-form bio, prose can grow
│  │
│  ├─ content.config.ts                   # ALL schemas — the single contract
│  │
│  ├─ config/
│  │  └─ site.ts                          # profile singleton, Zod-parsed at import
│  │
│  ├─ layouts/
│  │  ├─ BaseLayout.astro                 # <html>, head, theme script, chrome
│  │  ├─ PageLayout.astro                 # static pages
│  │  ├─ ArchiveLayout.astro              # L2 index pages
│  │  ├─ PostLayout.astro                 # blog post + TOC + series nav
│  │  ├─ PaperLayout.astro                # research detail + BibTeX
│  │  └─ ProjectLayout.astro              # project case study
│  │
│  ├─ lib/
│  │  ├─ collections.ts                   # the only place getCollection is called
│  │  ├─ tags.ts                          # aggregation, counts, slug helpers
│  │  ├─ dates.ts                         # ALL date formatting, UTC-pinned
│  │  ├─ bibtex.ts                        # BibTeX generation from venue + authors
│  │  ├─ og.ts                            # satori template
│  │  └─ remark-reading-time.mjs
│  │
│  ├─ pages/
│  │  ├─ index.astro                      # L1 — executive overview
│  │  ├─ about.astro
│  │  ├─ research/
│  │  │  ├─ index.astro                   # L2 archive
│  │  │  └─ [...slug].astro               # L3 detail
│  │  ├─ projects/
│  │  │  ├─ index.astro
│  │  │  └─ [...slug].astro
│  │  ├─ blog/
│  │  │  ├─ index.astro
│  │  │  ├─ [...slug].astro
│  │  │  ├─ page/[page].astro             # pagination
│  │  │  └─ tags/[tag].astro              # static tag routes
│  │  ├─ experience.astro
│  │  ├─ achievements.astro
│  │  ├─ search.astro
│  │  ├─ 404.astro
│  │  ├─ rss.xml.ts
│  │  └─ og/[...route].png.ts             # prerendered PNG endpoints
│  │
│  └─ styles/
│     ├─ global.css                       # tokens, type scale, spacing scale
│     ├─ prose.css                        # long-form typography
│     └─ katex.css                        # self-hosted, conditionally loaded
│
├─ scripts/
│  └─ port-legacy-data.mjs                # one-shot portfolioData.json → MDX/YAML
│
├─ astro.config.mjs
├─ tsconfig.json
├─ vercel.json
├─ CONTENT.md                             # how to add a paper / project / post
├─ MIGRATION_PLAN.md                      # this document
├─ README.md                              # rewritten in Phase 7
└─ package.json
```

**Deleted in Phase 7 — done:** `src/App.jsx` · `src/main.jsx` · `src/index.css` · `src/assets/react.svg` · `index.html`, plus `public/vite.svg` and the emptied `src/assets/`. (`src/portfolioData.json` went in Phase 2; `vite.config.js` · `tailwind.config.js` · `postcss.config.js` · `eslint.config.js` went in Phase 1.) **Added in Phase 6–7 and not in the tree above:** `src/pages/404.astro` · `src/pages/search.astro` · `src/components/search/{SearchTrigger,SearchDialog,SearchResults}.astro` · `src/components/seo/JsonLd.astro` · `src/lib/{og,kinds,search-ui}.ts` · `public/robots.txt` · `vercel.json` · `CONTENT.md` · `.github/workflows/ci.yml`.

### 3.1 Why colocated `index.mdx` directories

A paper is not one file — it is prose, figures, a diagram, and possibly a poster thumbnail. Giving each entry its own folder means:

- Figures live beside the text that references them.
- `astro:assets` resolves them by relative path, so `image()` in the schema validates them at build time.
- Deleting the folder deletes the entry and all its assets cleanly.

Flat files scatter assets into a global `images/` bin that rots within a year — a variant of audit finding #3.

---

## 4. Content Layer Schemas (TypeScript / Zod)

All six collections are declared in **one file**. This is deliberate: `src/content.config.ts` becomes the single readable contract describing what content this site can hold. Astro generates TypeScript types from it, so `entry.data.venue.year` autocompletes and a typo in a frontmatter key fails the build with a file path and line number.

### 4.1 Shared primitives

```ts
// src/content.config.ts
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Tags are slugs, always. This single rule keeps /blog/tags/[tag] URLs stable
// forever and makes tag equality a string compare, not a fuzzy match.
const tag = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'tags must be lowercase kebab-case');

const url = z.string().url();
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
```

### 4.2 `research`

```ts
const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/[^_]*.{md,mdx}' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(200),
        authors: z.array(author).min(1),
        // ADDED IN PHASE 4. True when `authors` is a prefix of the real list
        // rather than the whole of it, so an incomplete byline is a DECLARED
        // state: <AuthorList /> renders a real "et al." and lib/bibtex.ts emits
        // `and others`. Listing two of five authors with no marker asserts an
        // authorship the data does not support, and nothing about it looks wrong.
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
```

### 4.3 `projects`

```ts
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
```

### 4.4 `blog`

```ts
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
```

### 4.5 `experience`, `education`, `achievements` (YAML via `file()` loader)

Structured records with no prose body belong in YAML, not MDX. The `file()` loader requires a unique `id` field on every entry.

```ts
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

// ADDED IN PHASE 4. `src/content/about.mdx` was listed in §3 but belonged to no
// collection, so no loader globbed it, nothing validated it, and nothing
// rendered it — audit finding #3 reproduced inside the new architecture, with
// SiteFooter already linking to /about. The pattern is an explicit allow-list
// rather than `*.mdx` so a stray file under src/content/ is a build error and
// not a silent new route.
const pages = defineCollection({
  loader: glob({ base: './src/content', pattern: 'about.mdx' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().min(50).max(180), // meta description either way
    lede: z.string().max(240).optional(),
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
```

### 4.6 The profile singleton

Name, headline, socials, and CV link are read by nearly every layout and every `<head>`. Making them a collection would force an `await getEntry()` in each one. A plain TypeScript module parsed by Zod at import gives identical validation with synchronous access.

```ts
// src/config/site.ts
import { z } from 'astro/zod';

const schema = z.object({
  url: z.string().url(),
  name: z.string(),
  headline: z.string(),
  tagline: z.string(),
  location: z.string(),
  email: z.string().email(),
  availability: z.string().nullable(), // "Open to Research Collaborations" | null
  socials: z.object({
    github: z.string().url(),
    linkedin: z.string().url(),
    scholar: z.string().url().optional(),
    orcid: z.string().url().optional(),
    arxiv: z.string().url().optional(),
  }),
  cv: z.string().startsWith('/'),
  footerTagline: z.string(),
  nav: z.array(z.object({ label: z.string(), href: z.string() })),
});

export const site = schema.parse({
  url: 'https://jerlshin-profile.vercel.app', // APPROVED DECISION (a)
  name: 'Jerlshin J G',
  headline: 'AI Researcher · Multimodal Intelligence',
  tagline:
    'Bridging scientific innovation with human well-being through trustworthy, multimodal AI.',
  location: 'Tirupathur, Tamil Nadu, India',
  email: 'jerlshin.official008@gmail.com',
  // NOTE: `phone` deliberately omitted — APPROVED DECISION (d)
  availability: 'Open to Research Collaborations',
  socials: {
    github: 'https://github.com/Jerlshin',
    linkedin: 'https://linkedin.com/in/jerlshin-j-g',
    // scholar / orcid / arxiv to be supplied in Phase 2
  },
  cv: '/cv/jerlshin-jg-cv.pdf',
  footerTagline: 'Building the future of AI with transparency, ethics, and human-centric design.',
  nav: [
    { label: 'Research', href: '/research' },
    { label: 'Projects', href: '/projects' },
    { label: 'Blog', href: '/blog' },
    { label: 'Experience', href: '/experience' },
    { label: 'Achievements', href: '/achievements' },
  ],
});

export type Site = z.infer<typeof schema>;
```

---

## 5. Content Migration Mapping Matrix

Field-by-field, from the two current sources to their destinations. Rows marked **⚠️** require human input that no script can infer.

### 5.1 `profile` → `src/config/site.ts`

| Source field       | Source value                                          | Destination                                  | Transform                                                |
| ------------------ | ----------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `profile.name`     | "Jerlshin J G"                                        | `site.name`                                  | verbatim                                                 |
| `profile.title`    | "AI Researcher \| Multimodal Intelligence Specialist" | `site.headline`                              | pipe → middot separator                                  |
| `profile.tagline`  | "Bridging scientific innovation…"                     | `site.tagline`                               | verbatim                                                 |
| `profile.location` | "Tirupathur, Tamil Nadu, India"                       | `site.location`                              | verbatim                                                 |
| `profile.email`    | "jerlshin.official008@gmail.com"                      | `site.email`                                 | verbatim                                                 |
| `profile.phone`    | "(+91) 6381900869"                                    | **DROPPED**                                  | **APPROVED DECISION (d)** — omitted from the public site |
| `profile.website`  | "github.com/Jerlshin"                                 | `site.socials.github`                        | prepend `https://`                                       |
| `profile.linkedin` | "linkedin.com/in/jerlshin-j-g"                        | `site.socials.linkedin`                      | prepend `https://`                                       |
| `profile.about`    | 3-sentence paragraph                                  | `src/content/about.mdx` **body**             | becomes prose that can grow, not a fixed string          |
| —                  | —                                                     | `site.url`                                   | **NEW** — `https://jerlshin-profile.vercel.app`          |
| ⚠️ —               | —                                                     | `site.socials.scholar` / `.orcid` / `.arxiv` | **NEW** — required for a research portfolio; needs URLs  |
| ⚠️ —               | —                                                     | `site.cv`                                    | **NEW** — a CV PDF must be added to `public/cv/`         |

### 5.2 `education[0]` → `src/content/education.yaml`

| Source field     | Source value                                             | Destination                         | Transform                                                                                                      |
| ---------------- | -------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `degree`         | "B.Tech. in Computer Science and Engineering"            | `degree`                            | verbatim                                                                                                       |
| `specialization` | "Specialization in Artificial Intelligence and Robotics" | `specialization`                    | strip the leading "Specialization in "                                                                         |
| `institution`    | "Vellore Institute of Technology"                        | `institution`                       | verbatim                                                                                                       |
| `location`       | "Chennai, India"                                         | `location`                          | verbatim                                                                                                       |
| ⚠️ `period`      | "2021 - 2025"                                            | `start`, `end`                      | split into real dates; **exact months needed** (assume `2021-07-01` / `2025-05-01` pending confirmation)       |
| `grade`          | "CGPA: 9.19"                                             | `grade`                             | → `"9.19 / 10 CGPA"`                                                                                           |
| `thesis`         | title string                                             | `thesis.title` **+** `thesis.entry` | becomes a `reference('research')` pointing at `seed-classification-moe`, so the thesis links to its paper page |
| —                | —                                                        | `id`                                | **NEW** — `vit-btech-cse`                                                                                      |
| —                | —                                                        | `coursework[]`                      | **NEW** — optional                                                                                             |

### 5.3 `experience[0..3]` → `src/content/experience.yaml`

| #   | Source                                           | `id`                     | `kind`       | `start` → `end`             | Notes                                                                                    |
| --- | ------------------------------------------------ | ------------------------ | ------------ | --------------------------- | ---------------------------------------------------------------------------------------- |
| 0   | Deep Learning Researcher, University of Augsburg | `augsburg-dl-researcher` | `research`   | `2025-05-01` → `2025-10-01` | `location: "Augsburg, Germany"`                                                          |
| 1   | Machine Learning Researcher, NTU                 | `ntu-ml-researcher`      | `research`   | `2024-10-01` → `2025-10-01` | `location: "Singapore"`                                                                  |
| 2   | AI Developer, Botter Solutions                   | `botter-ai-developer`    | `industry`   | `2025-05-01` → `2025-07-01` | ⚠️ **`location: "Bangalore, India"` — APPROVED DECISION (c)**, resolves audit finding #2 |
| 3   | AI & ML Intern, Tekaccel                         | `tekaccel-ai-intern`     | `internship` | `2025-08-01` → `2025-10-01` | `location: "Hyderabad, India"`                                                           |

**Field-level transform, applied to all four:**

| Source field                   | Destination                         | Transform                                                                                 |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `role`                         | `role`                              | verbatim                                                                                  |
| `company`                      | `organization`                      | verbatim                                                                                  |
| `location`                     | `location`                          | verbatim (except #2, see above)                                                           |
| `period`                       | `start`, `end`                      | `"May 2025 - Oct 2025"` → two `Date` values; day pinned to `01`                           |
| `description[]` (3 items each) | `highlights[]`                      | verbatim; schema caps at 6                                                                |
| —                              | `summary`                           | **NEW** — one ≤240-char line for the timeline collapsed view                              |
| —                              | `stack[]`                           | **NEW** — extracted from the highlight prose (e.g. LangGraph, Qdrant, Neo4j for Tekaccel) |
| —                              | `orgUrl`, `links.paper`, `featured` | **NEW**                                                                                   |

### 5.4 `projects[0..2]` → `src/content/projects/<slug>/index.mdx`

| #   | Source title                                               | Slug                                | `category`    | `status`    |
| --- | ---------------------------------------------------------- | ----------------------------------- | ------------- | ----------- |
| 0   | Graph-Based Multi-Task Learning for Medical Image Analysis | `graph-multitask-medical-imaging`   | `research`    | `shipped`   |
| 1   | AI-Powered Adaptive Learning Device                        | `adaptive-learning-device`          | `engineering` | `prototype` |
| 2   | AI-Powered Healthcare Communication Platform               | `healthcare-communication-platform` | `engineering` | `shipped`   |

| Source field  | Destination              | Transform                                                                                                                      |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `title`       | `title`                  | verbatim                                                                                                                       |
| `tech[]`      | `stack[]`                | verbatim (renamed)                                                                                                             |
| `description` | `summary` **+ MDX body** | the existing sentence becomes `summary`; the body becomes a real case study                                                    |
| ⚠️ —          | `start`, `end`           | **NEW** — required; needs dates                                                                                                |
| ⚠️ —          | `links.repo`             | **NEW** — strongly recommended; the current site shows a non-functional `ExternalLink` icon (`App.jsx:321`) that links nowhere |
| —             | `tags[]`                 | **NEW** — kebab-case slugs derived from `stack`                                                                                |
| —             | `metrics[]`              | **NEW** — e.g. project #0 "state-of-the-art on PH2" → `{label: "PH2 dataset", value: "SOTA"}`                                  |
| —             | `architecture`           | **NEW** — optional diagram + required alt text                                                                                 |
| —             | `related[]`              | **NEW** — #0 → `reference('research')` to `superpixel-graph-skin-lesion`                                                       |
| —             | `featured`, `order`      | **NEW** — all three `featured: true` initially (homepage shows 3)                                                              |

### 5.5 `publications[0..2]` → `src/content/research/<slug>/index.mdx`

| #   | Slug                           | `venue.name`                          | `venue.short` | `venue.kind` | `status`       |
| --- | ------------------------------ | ------------------------------------- | ------------- | ------------ | -------------- |
| 0   | `seed-classification-moe`      | Expert Systems with Applications      | ESWA          | `journal`    | `under-review` |
| 1   | `superpixel-graph-skin-lesion` | IEEE Access                           | IEEE Access   | `journal`    | `under-review` |
| 2   | `vit-human-action-recognition` | Information Processing and Management | IPM           | `journal`    | `under-review` |

| Source field | Destination                      | Transform                                                                                                                                                                                                                                                                                             |
| ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`      | `title`                          | verbatim                                                                                                                                                                                                                                                                                              |
| `journal`    | `venue.name` **+** `status`      | **the key structural change** — `"Expert Systems with Applications (Under Review)"` splits into a clean venue name and a typed `status` enum. Review status stops being embedded in a display string.                                                                                                 |
| `year`       | `venue.year` **+** `date`        | `"2025"` → `2025` (number) and a `Date` for sorting                                                                                                                                                                                                                                                   |
| ⚠️ `authors` | `authors[]`                      | `"Jerlshin J. G., et al."` → an array of `author` objects. **Real co-author names required** — `.refine()` #3 enforces exactly one `isMe: true`. Entry #2 (`"Sarkar R., Jerlshin J.G., et al."`) becomes `[{name: "R. Sarkar"}, {name: "Jerlshin J G", isMe: true}, …]` and author **order matters**. |
| ⚠️ —         | `abstract`                       | **NEW** — required, min 80 chars. Not present in any current source.                                                                                                                                                                                                                                  |
| ⚠️ —         | `tldr`                           | **NEW** — required, ≤240 chars. Used on cards and OG images.                                                                                                                                                                                                                                          |
| —            | `topics[]`                       | **NEW** — e.g. `[self-supervised-learning, mixture-of-experts, fine-grained-classification]`                                                                                                                                                                                                          |
| —            | `links.arxiv` / `.pdf` / `.code` | **NEW** — optional while `under-review`; `.refine()` #2 makes DOI or arXiv **mandatory** the moment `status` becomes `published`                                                                                                                                                                      |
| —            | `bibtex`                         | **NEW** — generated by `lib/bibtex.ts` from `venue` + `authors`, overridable                                                                                                                                                                                                                          |
| —            | `related[]`                      | **NEW** — #1 → `reference('projects')` to `graph-multitask-medical-imaging`                                                                                                                                                                                                                           |
| —            | `featured`, `order`              | **NEW**                                                                                                                                                                                                                                                                                               |

### 5.6 `awards[0..2]` + `certifications[0..3]` → `src/content/achievements.yaml`

**Awards:**

| #   | `id`                    | `title`                     | `issuer`          | `kind`        | `date`       | `standing`                                  |
| --- | ----------------------- | --------------------------- | ----------------- | ------------- | ------------ | ------------------------------------------- |
| 0   | `gavs-hackathon-2024`   | GAVS Technologies Hackathon | GAVS Technologies | `hackathon`   | `2024-05-01` | `{rank: 1}`                                 |
| 1   | `bits-pilani-open-2025` | BITS Pilani Open Challenge  | BITS Pilani       | `competition` | `2025-01-01` | `{rank: 5, label: "Finalist", outOf: 2500}` |
| 2   | `vit-program-rep-2022`  | Program Representative      | VIT Dept. of CS   | `leadership`  | `2022-01-01` | —                                           |

Transform: the source `title` embeds the standing (`"Winner - GAVS Technologies Hackathon"`, `"Finalist - BITS Pilani Open Challenge"`) and the source `desc` embeds the numbers (`"5th place nationwide among 2,500+ participants"`). Both are **destructured into the typed `standing` object**, so `<StandingBadge />` renders them consistently and they become filterable and machine-readable.

**Certifications — currently rendered nowhere (audit finding #3):**

| #   | `id`                                | `title`                                        | `issuer`            |
| --- | ----------------------------------- | ---------------------------------------------- | ------------------- |
| 3   | `dlai-nlp-specialization`           | Natural Language Processing Specialization     | DeepLearning.AI     |
| 4   | `dlai-gan-specialization`           | Generative Adversarial Networks Specialization | DeepLearning.AI     |
| 5   | `dlai-deep-learning-specialization` | Deep Learning Specialization                   | DeepLearning.AI     |
| 6   | `stanford-ml-specialization`        | Machine Learning Specialization                | Stanford University |

⚠️ All four require a `verification` URL **or** a `credentialId` — the `.refine()` in §4.5 blocks the build otherwise. Source strings such as `"Natural Language Processing Specialization (DeepLearning.AI)"` are split into `title` + `issuer`. Source has no dates; these are needed.

### 5.7 `skills` → `src/content/skills.yaml`

The four-category grouping works and is preserved verbatim as four entries with `order` 1–4:

`languages-core` (Languages & Core) · `machine-learning` (Machine Learning) · `ai-frameworks` (AI Frameworks) · `research-focus` (Research Focus)

### 5.8 Content that exists only as hardcoded JSX — **must not be lost**

| Source            | Value                                                                            | Destination                                             |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `App.jsx:537`     | "Open to Research Collaborations"                                                | `site.availability`                                     |
| `App.jsx:807`     | "Building the future of AI with transparency, ethics, and human-centric design." | `site.footerTagline`                                    |
| `App.jsx:659`     | "I sit at the intersection of complex algorithms and real-world human needs."    | `about.astro` page copy                                 |
| `App.jsx:674`     | "A timeline of my contributions to academic and industrial AI labs."             | `experience.astro` page copy                            |
| `App.jsx:687`     | "Showcasing innovation in multimodal learning and orchestrating AI pipelines."   | `projects/index.astro` page copy                        |
| `App.jsx:700`     | "Peer-reviewed contributions to the scientific community."                       | `research/index.astro` page copy                        |
| `App.jsx:612–624` | Simulated vim terminal (`profile.py`)                                            | **Dropped** — design decision, see §6.4                 |
| `App.jsx:441–446` | Animated gradient blob background                                                | **Dropped** — measurable paint cost on mobile; see §6.4 |

---

## 6. Component Inventory & JS Cost Allocation

### 6.1 Full inventory

| Group                        | Components                                                                                          | Layout role                                                                                               | Client JS   |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| **Layouts** (6)              | `BaseLayout` `PageLayout` `ArchiveLayout` `PostLayout` `PaperLayout` `ProjectLayout`                | Page shells; `BaseLayout` owns `<html>`, `<head>`, the theme script, and the chrome                       | **0**       |
| **Chrome — static** (5)      | `SiteHeader` `Nav` `SiteFooter` `SkipLink` `Breadcrumbs`                                            | Persistent frame; `Nav` renders real `<a>` links, not scroll anchors                                      | **0**       |
| **Chrome — interactive** (3) | `ThemeToggle` `MobileDrawer` `BackToTop`                                                            | `MobileDrawer` is a native `<dialog>` + `showModal()` — free focus trap, free Escape handling, no library | **~0.9 KB** |
| **Primitives** (11)          | `Container` `Section` `SectionHeader` `Card` `Tag` `Pill` `StatusBadge` `Rule` `Prose` `Icon` `Btn` | Everything downstream composes from these; getting them right prevents style drift                        | **0**       |
| **Research** (5)             | `PaperCard` `PaperMeta` `AuthorList` `VenueLine` `BibtexBlock`                                      | `AuthorList` bolds the `isMe` author; `BibtexBlock` is the only one with script                           | **~0.4 KB** |
| **Projects** (4)             | `ProjectCard` `MetricGrid` `StackList` `ArchitectureFigure`                                         | `ArchitectureFigure` wraps `astro:assets` with a required caption + alt                                   | **0**       |
| **Experience** (3)           | `ExperienceTimeline` `ExperienceItem` `EducationCard`                                               | Timeline renders `end: null` as "Present"                                                                 | **0**       |
| **Achievements** (3)         | `AchievementCard` `StandingBadge` `VerifyLink`                                                      | `StandingBadge` renders `{rank: 5, outOf: 2500}` → "5th of 2,500"                                         | **0**       |
| **Blog** (7)                 | `PostCard` `PostMeta` `ReadingTime` `TableOfContents` `SeriesNav` `PrevNext` `Pagination`           | TOC built from the `headings` array `render(entry)` already returns — no plugin needed                    | **0**       |
| **Filtering** (3)            | `TagList` `TagFilter` `EmptyState`                                                                  | See §6.3                                                                                                  | **~1.2 KB** |
| **MDX** (6)                  | `Callout` `Figure` `Aside` `Details` `Video` `Diagram`                                              | Auto-imported into MDX                                                                                    | **0**       |
| **Code** (1)                 | `CodeBlock` (Expressive Code)                                                                       | Copy button, frame title, line highlighting, diff markers                                                 | **~2 KB**   |
| **Search** (3)               | `SearchTrigger` `SearchDialog` `SearchResults`                                                      | Pagefind WASM + index chunks import dynamically on **first open only**                                    | **lazy**    |
| **SEO** (2 + 1 endpoint)     | `BaseHead` `JsonLd` · `og/[...route].png.ts`                                                        | Every meta value derived from a schema field, so a page cannot ship without them                          | **0**       |

**Total: 35 components + 6 layouts + 1 endpoint.** Only **five** carry any JavaScript at all.

### 6.2 Zero-FOUC theme script

A React `useEffect` runs **after** first paint — that is the structural reason theme flash exists in the current site, independent of the `localStorage` bug in audit finding #4. The fix is a small synchronous script in `<head>`, before any stylesheet-dependent paint.

```astro
---
// src/layouts/BaseLayout.astro
---

<script is:inline>
  // Runs before first paint. No flash, no layout shift, no framework.
  // APPROVED DECISION (b): system preference is the default; localStorage
  // only participates when the user has made an explicit choice.
  (() => {
    const stored = localStorage.getItem('theme');
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.dataset.theme = theme;
    // Tells the UA to paint form controls and scrollbars in the right theme too.
    document.documentElement.style.colorScheme = theme;
  })();
</script>
```

**Token structure — three blocks, because the viewer has three states, not two:**

```css
/* src/styles/global.css */

/* 1. Bare :root — the complete light palette. Applies when nothing is stamped
      and the OS preference is light. */
:root {
  --bg: …;
  --surface: …;
  --ink: …;
  --accent: …;
}

/* 2. Unset preference on a dark OS. Guarded so an explicit LIGHT choice wins. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: …;
    --surface: …;
    --ink: …;
    --accent: …;
  }
}

/* 3. Explicit dark choice — wins on a light OS too. */
:root[data-theme='dark'] {
  --bg: …;
  --surface: …;
  --ink: …;
  --accent: …;
}
```

**The rule that prevents the classic unreadable-page bug:** components reference **only tokens**, never a color literal inside a media query or `[data-theme]` block. A color whose sole definition sits behind `[data-theme]` never applies in the unstamped state, producing one theme's text on the other theme's background.

The toggle itself is a ~20-line vanilla script that flips the attribute and writes `localStorage`. No island, no hydration, and **no layout shift** because both themes use identical geometry.

**Toggle logic (`ThemeToggle.astro`, inline):**

```js
const root = document.documentElement;
document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  root.style.colorScheme = next;
  localStorage.setItem('theme', next); // NOTE: the actual next value —
  // this is the exact line App.jsx:384 got wrong
});
```

### 6.3 Two-layer tag filtering

Two layers, and the order matters — **the static layer is the source of truth**; the client layer is a convenience on top of it.

**Layer 1 — pre-generated tag routes (works with JavaScript disabled):**

```ts
// src/pages/blog/tags/[tag].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];

  // One real HTML file per tag. Indexable, shareable, cacheable forever.
  return tags.map((tag) => ({
    params: { tag },
    props: { posts: posts.filter((p) => p.data.tags.includes(tag)) },
  }));
}
```

Roughly 30 tags produce 30 static pages of a few kilobytes each. They are crawlable, they survive JavaScript being disabled or failing, and they are the URLs that get shared.

**Layer 2 — instant in-page filter (~40 lines, no dependencies):**

```js
// Every card already carries its tags in the HTML:
//   <article data-tags="multimodal signal-processing healthcare-ml">

const cards = document.querySelectorAll('[data-tags]');
const emptyState = document.getElementById('empty-state');
const active = new Set(new URLSearchParams(location.search).getAll('tag'));

function apply() {
  let shown = 0;
  for (const card of cards) {
    const tags = card.dataset.tags.split(' ');
    // AND semantics — selecting more tags narrows, never widens.
    const match = active.size === 0 || [...active].every((t) => tags.includes(t));
    card.hidden = !match;
    shown += match ? 1 : 0;
  }
  emptyState.hidden = shown > 0;

  // Shareable state without a navigation or a history entry per click.
  const qs = [...active].map((t) => `tag=${t}`).join('&');
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}
```

No index, no fetch, no framework, no search library. Comfortable up to a few hundred cards; beyond that, archives paginate and Pagefind takes over. **Facet counts are computed at build time and baked into the labels**, so `multimodal (7)` is static text rather than a client-side reduce.

**Search (Pagefind) attributes:**

- `data-pagefind-body` marks the indexable region of each page, so nav and footer text never pollute results.
- `data-pagefind-meta="title,date,kind"` feeds the result cards.
- `data-pagefind-filter="kind"` gives free faceting across _Research / Project / Post_ with no extra code.
- The index is a build artifact in `dist/pagefind/` — it deploys to the CDN like any other file and costs nothing to serve.

### 6.4 Responsive layout hierarchy

| Viewport    | Shell                                                                         | Navigation                                               | Archive grids                                      |
| ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `< 640`     | Single column, `1rem` gutter                                                  | Logo + theme + hamburger → full-height `<dialog>` drawer | 1 column; tag filter becomes a horizontal scroller |
| `640–1023`  | Single column, `1.5rem` gutter                                                | Same drawer                                              | 2 columns                                          |
| `1024–1439` | Content `max-width: 72ch`, centered                                           | Full horizontal nav; drawer removed by media query       | 2–3 columns; TOC inline above the post             |
| `1440–1919` | Content + sticky right rail (TOC / paper metadata)                            | Full nav + ⌘K search trigger                             | 3 columns                                          |
| `≥ 1920`    | **Clamp, do not stretch.** Shell caps at `1440px`; extra width becomes margin | Unchanged                                                | 3 columns, wider gutters                           |

Ultra-wide handling is where most portfolios fail: line lengths stretch past 140 characters and the page becomes unreadable. The rule is a hard `--measure: 68ch` on prose plus a capped shell. A 34-inch monitor gets more whitespace and a wider rail — never longer lines. Touch targets are `44×44px` minimum, and every hover affordance has a non-hover equivalent.

**Design direction.** The current site uses indigo→purple gradients, animated blobs, backdrop blur, and a simulated vim window. That reads as 2024 and will read as dated well before 2030 — and the animated blur layers are a measurable paint cost on mobile. The target is quieter and load-bearing: one accent used for meaning (links, active state, status) and never decoration; typography carrying the page via a serif for headings and paper titles, a system sans for UI, and a mono for metadata; structure over ornament; and both themes designed rather than inverted, with AA contrast on body text and AAA on long-form prose.

---

## 7. 8-Phase Execution Roadmap & Exit Gates

Nothing merges to `main` until Phase 7. Estimates assume focused half-days.

### Phase 0 — Freeze and baseline · ~0.5 day · **COMPLETE (partial)**

- [x] Tag the current SPA as `v1-spa` so it stays recoverable, then branch `v2` from `main`. _(branched as `v2-astro-migration`, per the execution directive naming it explicitly.)_
- [ ] Record a baseline: Lighthouse scores, transferred JS, and `dist/` size for the existing build. **Not done** — requires running Lighthouse against a served v1 build; no deploy/browser automation was run in this session.
- [x] Apply approved decisions (a)–(d) to a working notes file so Phase 2 has no open questions. _(This document's §1.3 already records all four; they were applied directly to `astro.config.mjs`, `site.ts`, and the data port rather than a separate notes file.)_
- [ ] Register `https://jerlshin-profile.vercel.app` as the Vercel project name. **Not done** — no Vercel account access in this session; the `site` value and canonical URL are wired into the config either way.

> **Exit gate:** `v2` branch exists ✅ · Vercel preview deploys wired to it ❌ (needs Vercel dashboard access) · baseline numbers written down ❌ (needs a served v1 build + Lighthouse) · all four decisions recorded ✅.

### Phase 1 — Scaffold · ~0.5 day · **COMPLETE (partial)**

- [x] Astro 7 static setup, TypeScript strict. Scaffolded manually (existing non-empty repo) rather than via `npm create astro@latest`; same end state. Node 26.3.0 confirmed ≥ the required 22.12+.
- [x] Install the twelve dependencies from §2.7, plus `@tailwindcss/vite`, `rehype-slug`, `rehype-autolink-headings`, `@iconify-json/lucide`, `@astrojs/check`, `typescript`, `mdast-util-to-string`, `prettier`, `prettier-plugin-astro` — all required by the config in §8.1 but not counted in the "twelve" budget list. Deleted `tailwind.config.js`, `postcss.config.js`, `vite.config.js`, `eslint.config.js`.
- [x] Wrote `astro.config.mjs` in full (§8.1), `expressiveCode()` before `mdx()`.
- [x] `markdown.processor: unified()` set. **Deviation from the appendix text:** in the installed `astro@7.2.0` + `@astrojs/markdown-remark@7.2.2`, passing `remarkPlugins`/`rehypePlugins` as sibling `markdown.*` keys (as §8.1 shows) builds successfully but prints a deprecation warning; they now belong _inside_ `unified({...})`. Fixed to the non-deprecated form — confirmed by rebuild with zero warnings.
- [x] Wrote a throwaway test page (`$E = mc^2$`, a fenced code block, an `## H2`); confirmed in built HTML: `class="katex"` present (inline + display), heading got `id="h2-heading-anchor-test"` with an autolink anchor, Expressive Code emitted `class="expressive-code"` framing. Deleted after verification, as directed (per §7's "throwaway").
- [ ] Commit a "hello" page and confirm the Vercel preview builds with zero functions. **Not done** — no git push/Vercel deploy performed this session (nothing was committed at all; see note below). Confirmed **locally** instead: `dist/` after build contains only static files (`_astro/`, `pagefind/`, sitemap, no functions directory), matching the "no adapter" requirement.

> **Exit gate:** Preview URL serves a static page ❌ (not deployed) · build log shows no adapter and no functions ✅ (verified locally) · math, syntax highlighting, and heading anchors all verified in rendered HTML ✅.

### Phase 2 — Content model and porting · ~1 day · **COMPLETE (partial)**

- [x] Wrote `src/content.config.ts` in full — all seven collections, before any page exists.
- [x] Wrote `scripts/port-legacy-data.mjs`: reads `portfolioData.json`, emits YAML files and MDX with real frontmatter. Kept in the repo rather than deleted (`§7` says "one-shot, then deleted" — retained instead since it's the reviewable record of exactly which fields were mechanically derived vs. hand-authored; delete it in Phase 7 alongside the other legacy files if it's no longer wanted).
- [ ] Hand-finish every ⚠️ row in §5 — **partially not done, deliberately.** Fields with real source material (experience, education structure, skills, awards, project titles/tech/summaries) were fully ported. Fields with **no source material at all** — research abstracts, complete co-author lists beyond the named lead, project repo/live URLs, certification verification links/IDs — were **not invented**: fabricating them would put false academic/professional claims on a live site. Those entries were ported with every confirmed fact captured, then filed with a `_` prefix so `content.config.ts`'s `[^_]` glob excludes them from the build until real facts are supplied. See the itemized list below.
- [x] Applied approved decision (c): Botter Solutions → `Bangalore, India` (overriding the stale `Haryana, India` in the source JSON).
- [x] Wrote `src/config/site.ts` (omitting `phone`) and `src/lib/collections.ts`.
- [x] Deleted `src/portfolioData.json` after validating the port with `astro check`.

> **Exit gate:** `astro check` passes with zero errors ✅ (0 errors, 0 warnings, 5 pre-existing hints on legacy `App.jsx` unused imports — unrelated to this phase, scheduled for Phase 7 deletion) · every legacy fact exists in exactly one file ✅ · §5.8 hardcoded content captured ✅ (`availability`, `footerTagline` → `site.ts`; the four page-copy subtitles remain in `App.jsx` until its Phase 7 deletion, so nothing is lost) · deliberately broke `skills.yaml`'s `order` field and confirmed the build failed with a precise `InvalidContentEntryDataError` naming the file, field, and expected type, then reverted it ✅.
>
> **Outstanding before Phase 2's content is fully real** (needs the site owner, not a script). _Updated in Phase 4: the entries are now live with honest placeholders rather than excluded from the build, so each item below is an improvement to published content rather than a blocker. Every one is recorded as a `CONTENT STATUS` comment in the frontmatter of the file it belongs to._
>
> - Published abstracts + complete author lists for all 3 research papers (`src/content/research/*/index.mdx`), then `authorsTruncated: false`. `links.doi` / `links.arxiv` become **mandatory** the moment `status` flips to `published` — the build enforces that.
> - `links.repo` or `links.live` for the 2 projects downgraded to `prototype`, plus confirmed start/end dates for all 3 (`src/content/projects/*/index.mdx`). Adding the link is what allows `status: 'shipped'`.
> - Verification URL or credential ID (+ issue date) for the 4 certifications — still not written anywhere (see TODO block at the end of `achievements.yaml`). This is the one part of audit finding #3 that remains open: `/achievements` renders the collection faithfully, but the four credentials are not yet in it.
> - A real CV PDF at `public/cv/jerlshin-jg-cv.pdf` (referenced by `site.cv` but not yet added)
> - `site.socials.scholar` / `.orcid` / `.arxiv` URLs (optional fields, currently omitted)
> - Confirmation of exact education start/end months (currently placeholder `2021-07-01` / `2025-05-01`)
>
> **Nothing has been committed to git in this session** — Phase 0's tag/branch are real git operations, but every file change above is sitting in the `v2-astro-migration` working tree, uncommitted, pending review.

### Phase 3 — Design system and layouts · ~1 day · **COMPLETE**

- [x] `global.css`: the token set in all three theme blocks (§6.2), the type scale, the spacing scale, `--measure`. Structured as raw palette ramps → three semantic theme blocks → non-colour tokens → a Tailwind `@theme inline` bridge → base → utilities. The ramps exist so blocks 2b and 2c duplicate only a semantic mapping, which stays diffable by eye.
  - **Palette is verified, not asserted.** `scripts/check-contrast.mjs` parses `global.css`, resolves `var()` indirection, and checks 28 foreground/background pairs per theme against AAA (body prose), AA (secondary text, links, status badges) and 3:1 (control borders, focus rings) — 56 assertions, all passing. It also fails if blocks 2b/2c diverge, if a semantic token is missing from any block, or if either dark block forgets `color-scheme: dark`. Negative-tested against both a contrast regression and a deliberate 2b/2c drift. Wired into `npm run check`, so `npm run build` cannot ship an unreadable palette.
  - `--measure: 68ch`, `--content-max: 72ch`, `--shell-max: 1440px`, stepped `--gutter` (1 / 1.5 / 2 rem at the §6.4 breakpoints). Spacing utilities use Tailwind's built-in 0.25rem scale rather than a second competing ramp; only viewport-scaling rhythm (`--space-section`, `--space-block`) is tokenised.
- [x] Configure the Fonts API and verify fallback metrics produce no CLS on a cold load. Source Serif 4 (400/600) + JetBrains Mono (400/500), latin subset, `styles: ['normal']` only, system sans for UI. Confirmed in built HTML: metric-matched `@font-face` fallbacks carrying `size-adjust`, `ascent-override`, `descent-override` over `local("Times New Roman")` / `local("Courier New")`, and exactly one `<link rel="preload">` (display 600, the LCP face).
  - **Deviation from §8.1:** `cssVariable` is `--ff-display` / `--ff-mono`, not `--font-display` / `--font-mono`. Tailwind v4 owns the `--font-*` theme namespace and already defines `--font-mono`, so the two would race on `:root` depending on stylesheet order. `@theme inline` aliases `--font-*` → `--ff-*`, which keeps `expressiveCode`'s `codeFontFamily: 'var(--font-mono)'` working — verified as `--ec-codeFontFml:var(--font-mono)` resolving through the alias in the emitted CSS.
- [x] Build `BaseLayout` with the inline theme script, `BaseHead`, and `SkipLink`. The script is the literal first child of `<head>`, above the stylesheet. Only the `localStorage` **read** is wrapped in `try`, so the attribute is stamped even when storage is blocked, and a `matchMedia('change')` listener keeps the system default live instead of freezing whatever the OS was at load — decision (b) says system preference is the default, and a frozen snapshot is not that.
- [x] Build the chrome: `SiteHeader`, `Nav`, `MobileDrawer` (native `<dialog>` + `showModal()`), `ThemeToggle`, `SiteFooter`. Plus `SkipLink`, `Breadcrumbs`, and `BackToTop` — the full eight from §6.1.
- [x] Build the 11 primitives. `Container` `Section` `SectionHeader` `Card` `Tag` `Pill` `StatusBadge` `Rule` `Prose` `Icon` `Btn`.

**Design decisions worth recording:**

- **Two controls are impossible to ship broken, by construction.** `ThemeToggle` is `display: none` until `<html>` carries `[data-theme]`, which only the inline script stamps — no JavaScript, no visible toggle, so it can never repeat audit finding #4's lie. `Btn` **throws at build time** when an icon-only button has no `label`; `Icon` throws on a misspelt name. Both were negative-tested by building a page that violates them and confirming a non-zero exit.
- **`Card` is not a link.** Wrapping a card in `<a>` forbids the tag links every card needs. Cards set `interactive` and the title link takes the global `.stretched-link`; the focus ring is delegated to the card via `:has()` so keyboard tabbing through a grid stays legible.
- **`StatusBadge` is typed off the schema.** Its lookup is `Record<Status, …>` where `Status` is read from `CollectionEntry<'research' | 'projects'>['data']['status']`, so adding an enum value in `content.config.ts` without adding a label is an `astro check` error, not a blank badge.
- **`Tag` renders the slug, not a prettified label**, so what you read equals what you filter and share (§4.1) — no second copy to drift.
- **`lib/dates.ts` was written in this phase** (the footer needed a year). Every formatter pins `timeZone: 'UTC'` and a fixed locale, closing risk #14 and keeping builds byte-identical across machines.
- **`prose.css` is imported by `Prose.astro`, not by `global.css`** — confirmed absent from the shared CSS chunk and present only in the bundle for pages that render prose.
- **Added `.prettierrc.json` + `.prettierignore`.** Phase 1 installed `prettier-plugin-astro`, but with no config the plugin never loaded, so `npm run format` was silently not formatting a single `.astro` file — the §1.2 failure class again. The ignore list excludes the v1 files awaiting deletion in Phase 7.
- **A real bug the exit gate caught:** Astro implements "a parent's scoped styles reach a child component's root element" by passing `data-astro-cid-*` down as a prop, which only reaches the DOM if the child spreads its rest props. `Nav` did not, so `SiteHeader`'s `.desktop-nav { display: none }` never matched and the full horizontal nav rendered at 360 px, overflowing to 575 px. Fixed in `Nav`, and `StatusBadge`, `Rule`, and `Breadcrumbs` were given the same spread so Phase 4 cannot re-trip it.
- Also fixed: the `SkipLink`'s drop shadow was painting a visible sliver across the top of every page while the link sat parked off-screen. The shadow now applies only on focus.

> **Exit gate:** ✅ **PASSED.** Verified with a scripted Chrome run (`chromium.launch({ channel: 'chrome' })`) against the built output — 89 assertions, all passing.
>
> | Gate clause                                  | Result                                                                                                                                                                                                                                                                                |
> | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Correct chrome at 360 / 768 / 1280 / 2560 px | ✅ Both pages × 4 viewports × 2 themes: zero horizontal overflow (`scrollWidth == clientWidth`), header and footer present, horizontal nav appears at exactly ≥1024 px and the hamburger disappears there                                                                             |
> | In both themes                               | ✅ `data-theme` correct under both emulated OS preferences; explicit light choice verified to beat a dark OS (block 2b's `:not([data-theme='light'])` guard)                                                                                                                          |
> | No flash on reload                           | ✅ 6× CPU throttle, dark stored against a light OS: attribute and `color-scheme` already stamped at `waitUntil: 'commit'`, settled background `rgb(16, 19, 23)`. Toggle writes the value it applied (`stored === applied`) and the choice survives a reload — audit finding #4 closed |
> | Full keyboard navigation                     | ✅ Skip link is the first tab stop and becomes visible on focus; Enter moves focus to `<main>`; all 38 keyboard-reachable controls on `/styleguide` show a focus ring (the stretched link's is delegated to its card by design)                                                       |
> | Drawer behaviour                             | ✅ `showModal()` enters the top layer, focus moves inside, Escape closes, focus returns to the trigger, and crossing to ≥1024 px dismisses it                                                                                                                                         |
> | Ultra-wide (checklist #13)                   | ✅ At 2560 px the shell clamps to 1440 px and prose holds at 685 px — surplus becomes margin, line length unchanged                                                                                                                                                                   |
>
> **Ahead of schedule on later gates:** JS per page is **1,785 B gzipped** (4,316 B raw: Astro's prefetch module plus three inlined component scripts), against the §2.8 budget of <5 KB — and Expressive Code's ~2 KB is confirmed _not_ loaded on pages without code blocks. Canonical ↔ sitemap agreement (risk #8) was tested by temporarily un-filtering `/styleguide`: both emit `/styleguide` with no trailing slash, and both keep the slash on `/`. `astro check` reports 0 errors / 0 warnings; the 5 remaining hints are `App.jsx` unused imports scheduled for Phase 7 deletion.
>
> **Deliberately not built:** the header's ⌘K `SearchTrigger` (§6.4) belongs to Phase 6 and is absent rather than stubbed — a non-functional control is the defect this migration exists to remove. `src/pages/index.astro` is the hero only, composed from `site.ts`; §7 builds the homepage last, so Phase 4 appends the featured rails beneath it.
>
> **New in the tree this phase:** `src/styles/global.css` · `src/styles/prose.css` · `src/layouts/BaseLayout.astro` · `src/components/seo/BaseHead.astro` · 8 × `src/components/chrome/*` · 11 × `src/components/primitives/*` · `src/lib/dates.ts` · `src/pages/index.astro` · `src/pages/styleguide.astro` · `public/favicon.svg` · `scripts/check-contrast.mjs` · `.prettierrc.json` · `.prettierignore`. `/styleguide` carries `noindex`, is excluded from the sitemap, and is `data-pagefind-ignore`d; it is the page this gate is re-checked against whenever a token changes.
>
> **Still uncommitted.** As with Phases 1–2, everything above sits in the `v2-astro-migration` working tree pending review.

### Phase 4 — Content pages: L2 → L3 → L1 · ~2 days · **COMPLETE**

- [x] **Build archives first** (`/research`, `/projects`, `/experience`, `/achievements`) — they exercise every card component against real data.
- [x] Then detail pages (`/research/[...slug]`, `/projects/[...slug]`) with `BibtexBlock`, `MetricGrid`, `ArchitectureFigure`, and cross-links resolved through `reference()`.
- [x] **Homepage last.** Composed entirely from components that already render correctly on their own archive pages; `src/pages/index.astro` contains no card markup and no metadata formatting.
- [x] Wire `TagFilter` into the archives, plus `/blog/tags/[tag]` static routes.

**Content activation — the decision that unblocked this phase.** Phase 2 filed all six research and project entries with a `_` prefix (invisible to the loader) rather than invent abstracts, co-author lists, and repository URLs. That left every archive, every detail route, and every homepage rail with nothing to render, so the exit gate could not be evidenced. Resolved by the site owner in favour of **activating the entries with honest placeholders** — nothing invented:

- Each research `abstract` states the scope implied by its own title and then says plainly that the published abstract replaces it on acceptance. `tldr` is a faithful restatement of the title.
- A new `authorsTruncated: boolean` field on the research schema makes an incomplete author list a **declared** state. `<AuthorList />` renders a real "et al.", and `lib/bibtex.ts` emits `and others`, so neither the page nor a harvested citation implies an author list the data does not support.
- The two `shipped` projects became `prototype`. §4.3's third refine correctly refuses a `shipped` project with no `repo` or `live` URL; the honest move was to change the status, not to weaken the rule. Each file carries a frontmatter comment saying which single word to change once the code is public.
- `education.yaml`'s `thesis.entry` now resolves through `reference('research')`, so the thesis links to its paper page and a slug typo is a build error (§5.2).

**Also fixed in this phase — a live instance of audit finding #3.** `src/content/about.mdx` existed but was in **no collection**: no loader globbed it, nothing validated it, nothing rendered it, and `SiteFooter` already linked to `/about`. A `pages` collection was added with an explicit `about.mdx` allow-list pattern (rather than `*.mdx`, so a stray file is a build error and not a silent new route), and `/about` now renders it.

> **Exit gate:** ✅ **PASSED.** Verified with a scripted Chrome run against the built output — **471 assertions across Phases 4 and 5, all passing** (`chromium.launch({ channel: 'chrome' })`, 12 routes × 5 viewports × 2 themes, plus a full JavaScript-disabled pass).
>
> | Gate clause                                  | Result                                                                                                                                                                                                                                                                                                             |
> | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | Every content item reachable in ≤ 2 clicks   | ✅ All 3 papers, 3 projects, and 2 posts are linked directly from `/`; every archive is one click away and every item one more. Roles, degrees, and achievements are one click, because those archives **are** the item list. Verified by extracting every `href` from `dist/index.html` against the sitemap.      |
> | Every archive works with JavaScript disabled | ✅ 12 routes at 360 px with `javaScriptEnabled: false`: zero horizontal overflow, exactly one `<h1>` each, all cards present, and **no control that needs JavaScript is visible** — the tag filter, the BibTeX copy button, and the theme toggle are all `hidden` until their own script reveals them.             |
> | Tag navigation without JavaScript            | ✅ `/blog` renders a real `<nav data-tag-fallback>` of links to the five static `/blog/tags/<tag>` archives; each resolves and renders its posts. The live filter's script removes that fallback when it runs, so exactly one of the two is ever present.                                                          |
> | Tag filter behaviour with JavaScript         | ✅ Fallback removed, control revealed, narrowing correct, `?tag=` deep links applied on load, `history.replaceState` (not `pushState`), `aria-pressed` tracked, a polite live region announcing "1 of 2 shown", **AND semantics** narrowing two disjoint tags to zero, and the empty state appearing exactly then. |
> | Cross-links via `reference()`                | ✅ project → paper and paper → project both resolve; thesis → paper resolves from `education.yaml`.                                                                                                                                                                                                                |
> | Abstract in the HTML source (checklist #1)   | ✅ `curl` on a paper URL returns one `<h1>` and the full abstract text — the property the v1 SPA could not have, since it served `<div id="root"></div>` to every crawler.                                                                                                                                         |
>
> **A real bug the gate caught.** Every archive scrolled sideways at 360 px — `documentElement.scrollWidth` of **1589 px against a 360 px viewport** on `/research`. Cause: each filter chip carries a `.sr-only` span with its count, and Tailwind's `.sr-only` is `position: absolute`. With no positioned ancestor, those spans resolved against the initial containing block, escaping the horizontally-scrolling chip row and reporting static x-positions up to ~1700 px. The page grew a horizontal scrollbar caused by text nobody can see. Fixed by making the scroller itself the containing block (`position: relative` on `.chips`), with the reasoning recorded in the rule.

### Phase 5 — Blog pipeline · ~1 day · **COMPLETE**

- [x] `PostLayout` with TOC built from the `headings` array `render(entry)` already returns. **One DOM node, placed twice by CSS** — inline above the article below 1440 px, moved into the sticky rail above it by grid placement. Rendering it twice and hiding one copy would put every heading link in the document twice, which a screen reader reads twice and the search index counts twice. Scroll-spy is deliberately absent: it costs an observer on every post for a decorative cue.
- [x] Reading time via a small remark plugin writing to `remarkPluginFrontmatter`. Rewritten to emit **structured** `{ minutes, words }` rather than the string `"5 min read"` — a plugin that writes copy is a second place on the site that formats user-visible text, which is how audit finding #2 starts. `<ReadingTime />` owns the phrasing; `lib/reading-time.ts` is the typed seam over Astro's untyped `remarkPluginFrontmatter` bag.
- [x] Verify math end-to-end: inline `$…$` and display `$$…$$`, with the KaTeX stylesheet gated on `math: true`.
- [x] Verify Expressive Code: copy button, frame title, line highlighting, diff markers, correct theme flip.
- [x] Pagination, series navigation, prev/next, RSS.
- [x] **Write two real posts** — one math-heavy, one code-heavy, published as a two-part series so `SeriesNav` and `PrevNext` are exercised by real content rather than by a fixture.
- [x] Six MDX components (`Callout` `Figure` `Aside` `Details` `Video` `Diagram`), auto-available in every MDX body.

**How the six MDX components are "auto-imported".** MDX compiles an undefined capitalised tag into a lookup on the `components` prop, so passing `src/components/mdx/index.ts`'s map to `<Content components={mdxComponents} />` makes `<Callout>` work with no import line and **no extra integration or dependency**. A tag that is not in the map fails the build by name — it cannot silently render nothing. The same map is passed on paper and project pages, verified by a `<Callout>` rendering inside a research body.

**The KaTeX gate is a `<link>`, not an import (risk #12).** Astro decides a page's CSS from the module graph, not from what actually rendered, so `import 'katex/dist/katex.min.css'` inside `PostLayout` would ship ~23 KB plus fonts to every post regardless of the gate. Vite's `?url` is not an alternative either: it emits the file unprocessed, so the relative `url(fonts/…)` references break. `scripts/sync-katex-assets.mjs` vendors `katex.min.css` and its 20 woff2 faces out of the npm package into `public/katex/` (gitignored — a derived artifact, regenerated by both `dev` and `build`), and `<MathStyles />` emits a conditional stylesheet link plus two preloads. **Deviation from §3's file listing:** there is no `src/styles/katex.css`; the display-math overflow rules already live in `prose.css`, and a file under `src/styles/` cannot be loaded conditionally.

> **Exit gate:** ✅ **PASSED.**
>
> | Gate clause                                | Result                                                                                                                                                                                                                                                                       |
> | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | Equations                                  | ✅ 4 display + 14 inline KaTeX nodes on the math post. **View-source shows typeset math, not `$\alpha$`** — a regex for raw TeX over the rendered article text returns nothing, and `document.fonts.check('16px KaTeX_Math')` confirms the self-hosted face actually loaded. |
> | A diagram                                  | ✅ Inline build-time SVG through `<Diagram>` — drawn on `currentColor` and the theme tokens, `role="img"` with a required `alt`, and a keyboard-scrollable frame so a wide figure scrolls inside itself.                                                                     |
> | Three code languages                       | ✅ Python, YAML, Bash, and diff across 6 Expressive Code frames, with 4 frame titles, line highlighting, `ins`/`del` diff markers, and the copy button — all present in **both** themes.                                                                                     |
> | A table                                    | ✅ Both posts carry one; `prose.css` scrolls them inside their own box.                                                                                                                                                                                                      |
> | Renders correctly in both themes at 360 px | ✅ Zero horizontal overflow on all 12 routes × 5 viewports (360 / 768 / 1280 / 1440 / 2560) × 2 themes, with `data-theme` correctly stamped and `body` background painted in every combination.                                                                              |
> | KaTeX stylesheet gated                     | ✅ Present on the `math: true` post, **absent** on the `math: false` one.                                                                                                                                                                                                    |
> | Code blocks flip with the theme            | ✅ Frame background differs between light and dark, driven by `themeCssSelector` on `[data-theme]` rather than a media query.                                                                                                                                                |
> | TOC                                        | ✅ Built from `headings`; every link resolves to a real heading id, rendered exactly once in the DOM, sticky in the rail at 1512 px, and the target clears the sticky header on click.                                                                                       |
> | Series, prev/next, reading time, RSS       | ✅ `SeriesNav` lists both parts and marks the current one; `PrevNext` links the neighbour and renders no dead half on the end posts; reading time comes from the plugin; the feed is valid, absolute-linked, and **drafts are absent**.                                      |
> | Drafts cannot leak (risk #13)              | ✅ `src/content/blog/2026/_draft-post.mdx` carries **deliberately invalid** frontmatter, so if the `[^_]` glob ever stopped excluding it the build would fail by name rather than quietly publish it. Confirmed absent from `dist/` and the feed.                            |
>
> **JS budget, measured on the built output** (gzipped, before any interaction): homepage 1,901 B · archives 2,381 B · paper detail 2,091 B · **code post 3,069 B (worst case)** — against the §2.8 budget of < 5 KB. Expressive Code's ~1.2 KB is confirmed to load only on pages with code blocks.
>
> **A second silent failure, caught by the build.** `npm run format` corrupted all six content MDX files: Prettier's markdown parser rewrites `{/* … */}` into `{/_ … _/}`, which is valid emphasis in markdown and a syntax error in MDX. `astro build` failed loudly with a file and line, which is the intended behaviour — but the fix is not to format content at all. Those notes now live as **YAML frontmatter comments**, beside the fields they describe, and `src/content/**/*.mdx` is in `.prettierignore` with the reason recorded. `npx prettier --check .` is clean and the format run is idempotent.
>
> **New in the tree this phase:** 27 × `src/components/content/*` · 6 × `src/components/mdx/*` + `MathStyles.astro` + `index.ts` · 5 × `src/layouts/*` (`PageLayout` `ArchiveLayout` `PaperLayout` `ProjectLayout` `PostLayout`) · 12 pages (`about`, `experience`, `achievements`, `research/{index,[...slug]}`, `projects/{index,[...slug]}`, `blog/{index,[...slug],page/[page],tags/[tag]}`, `rss.xml.ts`) · `src/lib/{tags,bibtex,reading-time}.ts` · `scripts/sync-katex-assets.mjs` · 2 posts + 1 excluded draft. 21 routes built, 0 functions.
>
> **Still uncommitted.** As with Phases 1–3, everything above sits in the `v2-astro-migration` working tree pending review.

### Phase 6 — SEO, social, search, performance · ~1 day · **COMPLETE**

- [x] `BaseHead`: per-page title, description, canonical, OG, Twitter card. Every value derived from a schema field. Extended with `og:locale`, declared image dimensions, `article:published_time` / `modified_time` (emitted only for `og:type="article"`), and `twitter:image:alt`.
  - **The social image can no longer be absent.** `image` falls back to the generated default card rather than to nothing, so `twitter:card` is always `summary_large_image` and no share of this site renders as a bare link. `imageAlt` degrades the same way.
  - **The cover image is no longer used as the OG image.** A `cover` is a content figure with whatever aspect ratio its source had; cropping it to 1200×630 puts the subject somewhere nobody chose. Every page now points at a generated 1200×630 card.
- [x] JSON-LD: `Person` + `WebSite` sitewide (from `BaseHead`), `ScholarlyArticle` on papers, `BlogPosting` on posts, `SoftwareSourceCode` on projects.
  - **The prop is a discriminated union over content entries, not a JSON blob.** A component accepting `schema={{…}}` would let each page invent its own shape, and the shapes would drift exactly as `portfolioData.json` and `App.jsx` did. A paper page passes the paper.
  - Nodes carry stable `@id`s (`…/#person`, `…/#website`) and article nodes only _reference_ them, so the Person is written once per page rather than twice. The `isMe` author on a paper resolves to the same `@id` as the site owner, which is what lets a harvester join a paper to the profile.
  - **One honest limitation, recorded in the code:** with `authorsTruncated: true` the `author` array is a strict subset and JSON-LD has no way to say "et al.". The rendered page does say so; this node is simply incomplete until the real author lists land. Emitting no authors would be worse — a scholarly indexer would attribute the work to nobody.
- [x] Build-time OG image endpoints at `src/pages/og/[...route].png.ts`, prerendered. **9 PNGs verified in `dist/og/`**, all 1200×630, all reachable from the `og:image` their page declares. satori + resvg, with the fonts read as **woff1 from `@fontsource`** — Astro's Fonts API emits woff2, which satori's parser cannot read (Brotli), so the card renders in the site's own two families rather than a lookalike.
  - **Archives deliberately get no bespoke card.** Their heading and lede live in the page files, so generating a card from them would mean writing that copy a second time — audit finding #2 reproduced inside the new architecture. They use the default card, which is built entirely from `site.ts`.
  - Status labels are typed off the schema (`Record<PaperStatus, string>`), so adding a status without adding a label is an `astro check` error, not a card reading `undefined`.
- [x] Sitemap `serialize` hook, `public/robots.txt`, RSS. **All three now agree with each other and with the canonicals.**
- [x] Wire Pagefind, add the `data-pagefind-*` attributes, confirm the index builds and filters by kind. Full ⌘K dialog + `/search` page + `data-pagefind-filter="kind"` faceting.
- [x] Lighthouse on mobile emulation across all five page types. **100/100/100/100 on three of five; 99/100/100/100 on the two that load the KaTeX stylesheet** — see the gate table below.

**Three real defects the phase's own verification caught.**

1. **Every archive was competing with its own detail pages in the search index.** `data-pagefind-body` was hardcoded on `ArchiveLayout`'s grid, so `/research` and `/research/<slug>` both became records containing the same titles and summaries — every query returned each paper twice, once usefully and once pointing at a list. Indexing is now **opt-in per page** via a `searchKind` prop, and the decision is required at the call site rather than defaulted, because getting it backwards is invisible until someone searches. Archives that merely index somewhere else produce no record; `/experience` and `/achievements`, which have no detail pages, produce one. **12 records from 23 pages**, verified by counting index fragments.
2. **`PostLayout` and `ArchiveLayout` put their `<h1>` outside the indexed region.** Pagefind takes a record's title from the first `<h1>` inside `data-pagefind-body`, so every post indexed correctly and then rendered in the results list titled by its own URL. The region now starts at the header; the TOC, series list, and prev/next each already carried `data-pagefind-ignore`, so widening it pulls in nothing extra.
3. **`<meta charset>` was landing at byte 1094, past the 1024-byte limit the HTML spec sets.** `BaseHead` owned the tag, which put the ~700-byte theme script in front of it — on every page. Nothing rendered wrong and nothing warned; a Lighthouse Best Practices audit was the only thing that noticed, which makes it exactly the §1.2 failure class. `charset` and `viewport` moved to the literal top of `<head>` in `BaseLayout` (**byte 61**, all 23 pages). Best Practices went 96 → 100 sitewide.

**Also fixed: `site.cv` named a PDF that does not exist.** A link check found `/cv/jerlshin-jg-cv.pdf` returning 404 — and `prefetchAll` made it worse than a dead click, fetching the missing file on sight, once per page view. `site.cv` is now **nullable**, and every CV control (hero, drawer, `/about`, footer) renders only when it is set, so the site is honest until the file exists. The controls carry `data-astro-prefetch="false"` so that adding a real PDF does not start downloading it for every visitor.

**Search architecture — why the budget survives a search feature.** The eager half is ~20 lines in `SearchDialog.astro`: reveal the trigger, print the platform's modifier key, open the `<dialog>`, and `import()` the client on first open. `src/lib/search-ui.ts`, Pagefind's WebAssembly, and the index chunks are all behind that dynamic import. Verified in a browser: **0 lazy requests before interaction, 14 after** (client chunk + WASM + meta + index + fragments + filters). `SearchTrigger` ships `hidden` and is revealed only by the script that can service it — the `ThemeToggle` discipline, because Pagefind has no server behind it and therefore no degraded no-JS mode; `/search` answers that with a real server-rendered list of every archive and tag.

> **Exit gate:** ✅ **PASSED**, verified with a scripted Chrome run against the built output.
>
> | Gate clause                                | Result                                                                                                                                                                                                                                                                                             |
> | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `curl` on a paper URL returns the abstract | ✅ One `<h1>`, and the full abstract text present in source.                                                                                                                                                                                                                                       |
> | Social preview renders correctly           | ✅ **Local half passed:** all four page types declare the right `og:image`, each returns HTTP 200, is a valid PNG, and measures exactly 1200×630. ⚠️ **The card-debugger half needs a public URL** — Facebook/X/LinkedIn debuggers cannot reach `localhost`. Re-run once the Vercel deploy exists. |
> | JS budget under 5 KB                       | ✅ Worst case **3,853 B gzipped** (`/blog/<slug>` with code) against the 5,120 B budget. Homepage 2,685 · archives 3,267 · paper 2,969 · `/search` 2,861. Search added ~790 B and the budget still holds with ~25% headroom.                                                                       |
> | Pagefind index builds and filters          | ✅ Facets `Research (3) · Project (3) · Writing (2) · Experience (1) · Achievement (1) · Page (1) · Profile (1)` = 12 records. Filtering by `Project` narrows correctly and every returned result carries that kind.                                                                               |
> | Lighthouse, mobile, five page types        | ⚠️ **Three of five at 100/100/100/100** (homepage, archive, project detail). Paper detail and the math post score **99/100/100/100**. See below.                                                                                                                                                   |
>
> **The two 99s, in full.** Both are the two page types that load `/katex/katex.min.css`, and the deficit is entirely FCP (0.94) and LCP (0.97) under Lighthouse's _simulated_ 4G throttling — **TBT is 0 ms, CLS is 0.001, and Speed Index scores 1.00**. The LCP element is the `<h1>`, whose own breakdown is 2.4 ms time-to-first-byte plus 68 ms render delay; the cost is four render-blocking stylesheets (~14 KB total), of which KaTeX is the fourth and is present only on those two pages.
>
> `build.inlineStylesheets: 'always'` was tried as the fix and **made it worse** — it removed the round trips but grew the post's HTML from 79 KB to 119 KB, dropping _every_ page to 99. Reverted. The remaining levers are subsetting `katex.min.css` (risks breaking symbol faces, for one point on two pages) or adding a `math` flag to the research schema so papers without notation skip the stylesheet — which reintroduces exactly the failure the current design rejects, an author forgetting the flag and shipping raw TeX. **Recorded as accepted rather than fixed.**

### Phase 7 — Cut over and decommission · ~0.5 day · **COMPLETE (pending deploy)**

- [x] Add `vercel.json` (§8.2): cache headers, security headers, trailing-slash policy.
  - **Deviation from §8.2, and it matters.** The appendix's rule set would have given `/og/` and `/katex/` a one-year `immutable` cache, which is wrong: neither path is content-hashed. An OG card regenerates at the _same_ URL when its `tldr` changes, and `katex.min.css` is vendored to a stable path that must survive a KaTeX upgrade. Cache policy is now set by **how a path is versioned**, not by file type — `/_astro/*` (hashed by Vite) keeps the year and `immutable`; `/og/*` gets a day and `/katex/*` a week, both with `stale-while-revalidate`. `X-Frame-Options: DENY` added. The rationale lives in README's Deployment section, since JSON cannot carry comments.
- [x] Add `.github/workflows/ci.yml` running `astro check && astro build` on every PR. Beyond the build it asserts four things that would otherwise fail silently: **zero functions emitted** (risk #10 — the single change that would start billing), the Pagefind index written, the OG cards rendered, and formatting clean. Pinned to Node 22 with `npm ci`; `concurrency` cancels superseded runs.
- [x] Delete `src/App.jsx`, `src/main.jsx`, `src/index.css`, `index.html`, `src/assets/react.svg` — plus `public/vite.svg`, the v1 favicon only `index.html` referenced, and the now-empty `src/assets/`. (`src/portfolioData.json` went in Phase 2.) Verified first that nothing in the v2 tree referenced any of them: the only hits were the files' own cross-references and documentary comments. The five `astro check` hints they were producing are gone — **0 errors, 0 warnings, 0 hints** across 98 files.
  - `scripts/port-legacy-data.mjs` was **kept, with a header explaining that it can no longer run** — its input JSON was deleted in Phase 2, so it now throws ENOENT. It is retained as the reviewable record of which fields were derived mechanically versus hand-authored, and it is wired into no npm script. Converting it from "dead code that looks live" into "documented record" was the honest middle option between deleting the audit trail and leaving a trap.
  - `.prettierignore`'s v1 block removed; `npx prettier --check .` is clean.
- [x] Rewrite `README.md` and add `CONTENT.md`. The authoring guide covers adding a paper / project / post / role / award, every rule the build enforces and _why_, the two drafting mechanisms and how they differ, the `authorsTruncated` contract, the "build once before dev" Pagefind caveat (risk #7), which pages get indexed and which deliberately do not, and the two easy-to-break rules (never run Prettier over content, never write a colour literal).
- [ ] **Merge `v2` → `main`.** Not done — this session does not merge to `main` without a review of the diff. Everything sits on `v2-astro-migration`.
- [ ] **Confirm HTTPS on `jerlshin-profile.vercel.app`.** Not done — no Vercel account access in this session, and the project has never been deployed. Phase 0's two deploy items remain open for the same reason.

> **Exit gate:** the 14-item checklist in §7.2 passes ✅ **12 of 14 fully, 2 partially** — see §7.2. "Production serves the new site" ❌ and "Vercel dashboard shows zero functions" ❌ both require a deploy that has not happened; the local equivalent of the second is verified (`dist/` holds only static files, no function directory anywhere), and CI now fails any PR that would change it.

### 7.1 Sixteen ranked risks and mitigations

Ranked by how much rework they cause if discovered late.

| #      | Risk                                                                                                                                                                            | Mitigation                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **Astro 7's default Markdown engine drops remark/rehype.** Install the plugins, see no errors, and silently get no math — the exact failure class from §1.2.                    | Set `markdown.processor: unified()` in **Phase 1**, before any content exists. Assert typeset math in the Phase 1 test page.                                                                                    |
| **2**  | **Astro 7's Rust compiler is strict.** Unclosed tags and unterminated attributes are now errors, not auto-corrected. Pasting HTML into MDX can break the build.                 | Prefer MDX components over raw HTML. Treat build failure as intended behavior — the alternative was silently malformed output.                                                                                  |
| **3**  | **`compressHTML` defaults to `'jsx'` in v7**, stripping whitespace between inline elements. A link can end up glued to the following word.                                      | Explicit `{" "}` where inline elements butt against text. Catch it by reading rendered prose, not source.                                                                                                       |
| **4**  | **Heading ID generation changed in Astro 6.** Shared anchor links can break.                                                                                                    | Not an issue at migration time — the SPA has no heading anchors. Pin the behavior now and treat heading-ID changes as breaking from here on.                                                                    |
| **5**  | **Theme flash (FOUC).** The current implementation's root cause: theme applied in an effect after paint.                                                                        | Blocking inline script in `<head>` (§6.2) plus `color-scheme`. Verify by hard-reloading in dark mode with CPU throttled 6×.                                                                                     |
| **6**  | **Font-swap layout shift.** The classic cause of a failed CLS score on an otherwise perfect site.                                                                               | Astro Fonts API generates metric-matched fallbacks automatically. Never load fonts from a third-party CDN.                                                                                                      |
| **7**  | **Pagefind does not exist in `astro dev`** — the index is a post-build artifact, so search appears broken during development.                                                   | `astro-pagefind` serves the last build's index in dev. Run one `astro build` before testing search; document this in `CONTENT.md`.                                                                              |
| **8**  | **Trailing-slash mismatch** between Astro's output format, Vercel's routing, canonicals, and the sitemap → duplicate URLs and split search signals.                             | Pick **no trailing slash**. Set `vercel.json` `trailingSlash: false` + `cleanUrls: true`, build canonicals with `new URL(path, site)`, and add a sitemap `serialize` hook so all three agree.                   |
| **9**  | **Old hash URLs** (`/#projects`) cannot be redirected server-side — the fragment never reaches Vercel.                                                                          | A ~10-line inline script on `/` maps known legacy fragments to their new routes on load. Remove after a year.                                                                                                   |
| **10** | **Accidental serverless functions.** Adding an adapter or one `export const prerender = false` quietly converts the site to on-demand rendering and puts the free tier at risk. | No adapter installed at all. Assert zero functions in the Vercel build summary as a Phase 7 gate, and re-check after any dependency upgrade.                                                                    |
| **11** | **Image CLS and LCP** from unsized hero and cover images.                                                                                                                       | All content images go through `astro:assets`, which infers intrinsic dimensions and emits `width`/`height`. Hero gets `loading="eager"` + `fetchpriority="high"`; everything below the fold is lazy.            |
| **12** | **KaTeX CSS weight** — ~23 KB plus font files on every page, including the ~90% with no math.                                                                                   | Gate the stylesheet on `math: true` in frontmatter. Self-host the fonts and preload only the two faces actually used.                                                                                           |
| **13** | **Draft posts leaking to production.**                                                                                                                                          | Two independent guards: the loader's `[^_]` glob excludes `_`-prefixed files entirely, and `getCollection` filters `draft` under `import.meta.env.PROD`. Drafts also excluded from sitemap and RSS.             |
| **14** | **Date/timezone off-by-one.** A bare `2026-03-01` parses as UTC midnight and can render as _28 February_ for readers west of Greenwich.                                         | Format with an explicit `timeZone: 'UTC'` in one `lib/dates.ts` helper used everywhere. Never call `toLocaleDateString` ad hoc.                                                                                 |
| **15** | **Hydration creep.** One React island for a chart, and the React runtime is back on every page that imports it.                                                                 | No UI framework integration installed. Adding one becomes a deliberate, reviewable commit rather than one `npm install` away. If a chart is ever needed, it is a build-time SVG first.                          |
| **16** | **Build-time growth** as the blog reaches hundreds of posts with images and math.                                                                                               | Astro 7's Rust compiler plus Vite 8 already cuts 15–61%. If it ever bites: `glob({ deferRender: true })` (added in 7.1) defers rendering until an entry is actually used, and Sätteri becomes worth revisiting. |

> **The one that will actually bite: risk #1.** It fails the same way audit finding #4 fails — no error, no warning, just wrong output. The Phase 1 test page costs ten minutes and saves a day of confused debugging in Phase 5.

### 7.2 Fourteen-item final verification checklist — **EXECUTED**

Run against the production build served by `astro preview`, with a scripted Chrome
(`chromium.launch({ channel: 'chrome' })`) and Lighthouse 12 on its default mobile
emulation. **12 of 14 pass in full; 2 pass in part, both blocked on a deploy that has not happened.**

| #   | Check                         | Result                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Content is really in the HTML | ✅ `/research/superpixel-graph-skin-lesion` returns exactly one `<h1>` and the full abstract text in source — the property the v1 SPA could not have.                                                                                                                                                   |
| 2   | Zero functions                | ⚠️ **Local half only.** No `.vercel/output/functions`, no `dist/_functions`, no adapter; `dist/` holds `_astro`, page HTML, `og/`, `pagefind/`, `katex/`, the sitemap, `rss.xml`, and `robots.txt`. The Vercel dashboard confirmation needs a deploy. CI now fails any PR that emits functions.         |
| 3   | Type and schema integrity     | ✅ `astro check`: **0 errors, 0 warnings, 0 hints** across 98 files. The five pre-existing `App.jsx` hints went with the file.                                                                                                                                                                          |
| 4   | JS budget                     | ✅ Worst case **3,853 B gzipped** on `/blog/<slug>` with code, against 5,120 B. Homepage 2,685 · archives 3,267 · paper 2,969 · `/search` 2,861 · 404 2,685. Browser-confirmed: **zero Pagefind or search-chunk requests before interaction**, 14 after.                                                |
| 5   | Lighthouse (mobile)           | ⚠️ **3 of 5 at 100/100/100/100** (homepage, archive, project detail). Paper detail **99**/100/100/100, math post **99**/100/100/100 — both are the pages loading KaTeX's stylesheet. TBT **0 ms**, CLS **0.001**, Speed Index 1.00 everywhere. Analysed and accepted; see Phase 6's gate note.          |
| 6   | No-JS resilience              | ✅ 14 routes at 360 px with `javaScriptEnabled: false`: zero horizontal overflow, exactly one `<h1>` each, all cards rendered, tag navigation falls back to 5 real links, and **no JS-only control is visible** — theme toggle, search trigger, tag filter, and BibTeX copy all stay hidden.            |
| 7   | No theme flash                | ✅ Dark stored against a light OS, CPU throttled 6×: `data-theme` and `color-scheme` are both already `dark` at `waitUntil: 'commit'`, and the settled background is `rgb(16, 19, 23)`. An explicit light choice still beats a dark OS.                                                                 |
| 8   | Math is pre-rendered          | ✅ 76 KaTeX nodes on the math post and **no raw `$…$` anywhere in the rendered text**. The stylesheet is present on the `math: true` post and absent on the `math: false` one.                                                                                                                          |
| 9   | Social cards                  | ⚠️ **Local half passed:** paper, project, post, and homepage each declare the correct `og:image`; all four return HTTP 200, are valid PNGs, and measure exactly 1200×630. The **card-debugger half needs a public URL** — Facebook/X/LinkedIn cannot fetch `localhost`. Re-run after the deploy.        |
| 10  | Sitemap ↔ canonical agreement | ✅ All **20** sitemap URLs compared against their pages' `<link rel="canonical">`: **zero mismatches**, no trailing slashes. `/og/`, `/styleguide`, and `/search` are all correctly absent.                                                                                                             |
| 11  | Search                        | ✅ "superpixel" returns the right paper first at `/research/superpixel-graph-skin-lesion` (no trailing slash), titled from its `<h1>` and badged `Research`, **with no competing hit from the `/research` archive and no duplicate URLs**. The kind filter narrows correctly and tracks `aria-pressed`. |
| 12  | RSS                           | ✅ Valid XML, 2 items, all links absolute, **drafts absent**.                                                                                                                                                                                                                                           |
| 13  | Ultra-wide                    | ✅ At 2560 px the shell clamps to 1440 px and a body paragraph measures **728 px — byte-identical to its width at 1280 px**. Surplus becomes margin; line length does not change.                                                                                                                       |
| 14  | Keyboard path                 | ✅ Skip link is the first tab stop and lands fully in the viewport on focus. Every focusable control shows a ring across `/`, `/research`, and a paper detail page (37 + 31 + 24 = 92 controls). The drawer moves focus inside on open and returns it to the trigger on Escape.                         |

**A caveat on how #5, #13, and #14 were first reported.** Two of the original assertions
failed and both were harness bugs, not site defects: #13's selector `.prose, article`
matched in document order and measured the body _column_ (1072 px) rather than the text
line (728 px), and #14 measured the skip link's position mid-transition. Both were
corrected and re-run. Recorded because a verification script that reports a false failure
is as much a liability as one that reports a false pass.

**Two items are blocked on the same thing.** #2 and #9 each have a half that is only
answerable against a live origin. Neither is a defect and neither is unverified in the
sense that matters — the artifacts they check are confirmed present and correct on disk —
but both should be re-run once `jerlshin-profile.vercel.app` exists.

### 7.3 Why this stays free, structurally

- **No adapter.** `output: 'static'` with no `@astrojs/vercel` means the build produces only files — nothing can invoke a function because no function exists.
- **No image optimization at request time.** `astro:assets` + sharp run at build; Vercel's billed Image Optimization is never touched.
- **No ISR, no middleware, no edge config.**
- **Search is a static file.** Pagefind's index is served from the CDN like an image.
- **OG images are files**, generated at build, not per request.

The only consumption is bandwidth, and a fully static portfolio serving mostly-cacheable assets sits several orders of magnitude below the free-tier ceiling.

### 7.4 Git strategy

Same repository, new branch. Tag `v1-spa` before starting, develop on `v2` with Vercel preview deploys on every push, and squash-merge to `main` at Phase 7. The old SPA stays recoverable by tag without polluting the tree with a `legacy/` directory that nobody ever deletes.

---

## 8. Appendix — Full Configuration Files

### 8.1 `astro.config.mjs`

```js
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import icon from 'astro-icon';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

export default defineConfig({
  site: 'https://jerlshin-profile.vercel.app', // APPROVED DECISION (a)
  output: 'static', // no adapter — keeps Vercel free

  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },

  markdown: {
    processor: unified(), // REQUIRED in v7 to keep remark/rehype — see §2.2
    remarkPlugins: [remarkMath, remarkReadingTime],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['anchor'] } }],
    ],
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: '<Serif>', // chosen in Phase 3
      cssVariable: '--font-display',
      weights: [400, 600],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: '<Mono>',
      cssVariable: '--font-mono',
      weights: [400, 500],
      fallbacks: ['monospace'],
    },
  ],

  integrations: [
    // expressiveCode MUST precede mdx, or MDX code blocks skip it silently
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      useDarkModeMediaQuery: false,
      themeCssSelector: (t) => `[data-theme='${t.name.includes('dark') ? 'dark' : 'light'}']`,
      styleOverrides: { borderRadius: '4px', codeFontFamily: 'var(--font-mono)' },
    }),
    mdx(),
    icon({ include: { lucide: ['*'] } }),
    sitemap({
      filter: (page) => !page.includes('/og/'),
      serialize: (item) => ({ ...item, url: item.url.replace(/\/$/, '') }), // match canonicals
    }),
    pagefind(), // must run last — indexes the emitted HTML
  ],

  vite: { plugins: [tailwind()] },
});
```

### 8.2 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/pagefind/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" }
      ]
    }
  ]
}
```

### 8.3 `src/lib/collections.ts` — the only place collections are read

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

// Drafts are visible while writing, invisible in production. One rule, one place.
export const posts = async (): Promise<CollectionEntry<'blog'>[]> =>
  (await getCollection('blog', ({ data }) => (import.meta.env.PROD ? !data.draft : true))).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

export const papers = async () =>
  (await getCollection('research')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const roles = async () =>
  (await getCollection('experience')).sort(
    (a, b) => b.data.start.valueOf() - a.data.start.valueOf(),
  );

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
```

### 8.4 `package.json` scripts

```json
"scripts": {
  "dev":     "astro dev",
  "build":   "astro check && astro build",
  "preview": "astro preview",
  "check":   "astro check",
  "format":  "prettier --write ."
}
```

`astro check` runs before `astro build` so a schema violation fails the Vercel deploy rather than shipping broken content.

---

## Sources

- [Astro 7.0 release notes](https://astro.build/blog/astro-7/)
- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Astro 6.0 release notes](https://astro.build/blog/astro-6/)
- [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/)
- [Astro configuration reference](https://docs.astro.build/en/reference/configuration-reference/)
- [Astro syntax highlighting guide](https://docs.astro.build/en/guides/syntax-highlighting/)
- [Astro Fonts API](https://docs.astro.build/en/reference/experimental-flags/fonts/)
- [Deploy an Astro site to Vercel](https://docs.astro.build/en/guides/deploy/vercel/)
- [astro-pagefind](https://github.com/shishkin/astro-pagefind)

**Package versions verified against the npm registry on 2026-08-11:** `astro@7.2.0` · `@astrojs/mdx@7.0.5` · `@astrojs/sitemap@3.7.3` · `@astrojs/rss@4.0.19` · `astro-expressive-code@0.44.1` (peer `astro@^7.0.0`) · `astro-pagefind@2.0.1` (peer `astro@^7`) · `pagefind@1.5.2` · `tailwindcss@4.3.3` · `remark-math@6.0.0` · `rehype-katex@7.0.1` · `katex@0.18.4` · `shiki@4.4.3`
