# Authoring guide

How to add a paper, a project, or a post to this site — and what the build will refuse to let you ship.

This document is for future-you. The whole point of the v2 architecture is that **content mistakes are build errors, not silent omissions**: the v1 site had four real certifications that rendered nowhere, with no error and no warning, for months. You should never have to wonder whether something published correctly. Either `npm run build` succeeds, or it tells you the file, the field, and what was wrong with it.

---

## The one-minute version

| I want to add…   | Create                                      | Then            |
| ---------------- | ------------------------------------------- | --------------- |
| A paper          | `src/content/research/<slug>/index.mdx`     | `npm run build` |
| A project        | `src/content/projects/<slug>/index.mdx`     | `npm run build` |
| A blog post      | `src/content/blog/<year>/<slug>/index.mdx`  | `npm run build` |
| A role           | an entry in `src/content/experience.yaml`   | `npm run build` |
| A degree         | an entry in `src/content/education.yaml`    | `npm run build` |
| An award or cert | an entry in `src/content/achievements.yaml` | `npm run build` |
| A skill category | an entry in `src/content/skills.yaml`       | `npm run build` |

You never touch a component, a route, or a template. The archive page, the detail page, the social card, the sitemap entry, the RSS item, and the search record all follow from the file.

**The directory is the URL.** `src/content/research/superpixel-graph-skin-lesion/index.mdx` becomes `/research/superpixel-graph-skin-lesion`. Renaming the directory changes the URL, so treat a published slug as permanent.

**Put figures beside the text.** Each entry gets its own folder so its images live next to the prose that references them; `astro:assets` resolves them by relative path and validates them at build time. Deleting the folder deletes the entry and its assets cleanly.

---

## Every schema is in one file

`src/content.config.ts` is the complete, readable contract for what this site can hold. It is worth reading once. Everything below is a summary of it, and if the two ever disagree, **the schema is right and this document is stale**.

---

## Adding a paper

```
src/content/research/<slug>/
├─ index.mdx
└─ figures/            ← optional, colocated
```

```yaml
---
title: 'Seeing the Skin Deeper: Interpretable Multi-Task Framework…'
authors:
  - name: 'R. Sarkar'
  - name: 'Jerlshin J G'
    isMe: true # exactly one author must have this
authorsTruncated: false # true while the list is incomplete — see below
venue:
  name: 'IEEE Access'
  short: 'IEEE Access'
  kind: 'journal' # journal | conference | workshop | preprint | thesis
  year: 2025
status: 'under-review' # published | accepted | under-review | preprint | in-preparation
date: 2025-01-01 # sorting key, independent of venue.year
abstract: '…' # min 80 characters
tldr: '…' # max 240 — this is the card text AND the social card text
topics: ['graph-neural-networks', 'explainable-ai'] # 1–8 kebab-case slugs
links:
  doi: 'https://doi.org/…'
  arxiv: 'https://arxiv.org/abs/…'
  code: 'https://github.com/…'
  pdf: '/papers/….pdf' # a file in public/papers/
related: ['graph-multitask-medical-imaging'] # slugs from the projects collection
featured: true
order: 2
---
Body goes here. Markdown, MDX components, math, code.
```

### What the build will stop you from doing

| Rule                                                           | Why it exists                                                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A `published` paper must have `links.doi` **or** `links.arxiv` | A published paper a reader cannot get to is not published, it is a claim.                                            |
| Exactly one author must carry `isMe: true`                     | It drives the bolded name and the BibTeX. Zero or two is a formatting bug you would not see until someone cited you. |
| `abstract` at least 80 characters                              | A one-line abstract is the field being skipped rather than filled.                                                   |
| `coverAlt` is required whenever `cover` is set                 | An image with no alt text is invisible to part of your audience.                                                     |
| Every `topics` entry must be lowercase kebab-case              | Tags are URL slugs. `Graph NN` and `graph-nn` would be two different tags forever.                                   |
| Every `related` slug must resolve to a real project            | A typo becomes a build error instead of a 404 nobody clicks often enough to notice.                                  |

### On incomplete author lists

`authorsTruncated: true` is a **declared** state, not a workaround. It makes `<AuthorList />` render a real "et al." and makes the generated BibTeX emit `and others`. Listing two of five authors with no marker asserts an authorship the data does not support, and nothing about it looks wrong on the page.

Set it back to `false` the moment you have the full list in submission order.

### Citations

You do not need to write BibTeX. `src/lib/bibtex.ts` generates it from `venue` + `authors`, and the paper page renders it with a copy button. Set the `bibtex` field only if you need to override the generated entry verbatim.

---

## Adding a project

```yaml
---
title: 'AI-Powered Adaptive Learning Device'
summary: '…' # 40–200 chars. Card text, meta description, AND social card text.
category: 'engineering' # research | engineering | systems | tooling | demo
status: 'prototype' # active | shipped | prototype | archived
role: 'Team lead'
start: 2024-01-01
end: null # null means ongoing, and renders as "Present"
stack: ['LLMs', 'LangChain', 'Raspberry Pi'] # display strings
tags: ['llm', 'edge-inference'] # kebab-case slugs
links:
  repo: 'https://github.com/…'
  live: 'https://…'
architecture:
  diagram: './figures/architecture.png'
  alt: 'Required. Not optional here.'
  caption: 'Optional.'
related: ['superpixel-graph-skin-lesion'] # slugs from the research collection
featured: true
order: 2
---
```

**`status: 'shipped'` requires `links.repo` or `links.live`.** This one catches people out, and it is intentional: "shipped" promises a reader there is something to go and look at. If the code is not public yet, the honest status is `prototype` — change the word, do not weaken the rule.

---

## Adding a blog post

```
src/content/blog/2026/<slug>/index.mdx
```

```yaml
---
title: 'A preprocessing pipeline you can re-run'
description: '…' # 50–180 chars — enforced meta-description length
pubDate: 2026-04-02
updatedDate: 2026-05-01 # optional; must not precede pubDate
draft: false # visible in `astro dev`, filtered out of production
tags: ['signal-processing', 'reproducibility'] # 1–6 kebab-case slugs
series: # optional
  id: 'Notes on multimodal pipelines'
  order: 2
math: false # true loads the KaTeX stylesheet — see below
toc: true
---
```

### Two ways to keep a post unpublished

They are not equivalent, and you want to know which you are using:

1. **`draft: true`** — the post is built and visible in `astro dev`, and filtered out of the production build, the sitemap, and the RSS feed. Use this for something you are actively writing and want to preview.
2. **A `_` prefix on the filename** (`_draft-post.mdx`) — the collection loader's glob never sees the file at all. Nothing validates it, nothing renders it. Use this for a stub with frontmatter that is not finished yet.

`src/content/blog/2026/_draft-post.mdx` deliberately carries **invalid** frontmatter, so that if the `[^_]` exclusion ever stopped working the build would fail loudly by name rather than quietly publish a draft.

### Math

Set `math: true` in the frontmatter and use `$…$` inline or `$$…$$` display. It is rendered by KaTeX **at build time**, so the HTML that reaches the browser already contains the typeset equation — no client-side JavaScript, and no flash of raw `$\alpha$`.

The flag gates a ~23 KB stylesheet plus font downloads. Forgetting it does not produce an error; it produces raw TeX on the page. If your equations look like source code, that is the flag.

### Code

Fenced blocks go through Expressive Code. You get the copy button, frame titles, line highlighting, and diff markers:

````
```python title="preprocess.py" {3-5}
...
```
````

### Components available in any MDX body

No import line needed — `<Callout>`, `<Figure>`, `<Aside>`, `<Details>`, `<Video>`, `<Diagram>`. A capitalised tag that is **not** in `src/components/mdx/index.ts` fails the build by name, so a typo cannot silently render nothing.

---

## Adding a role, a degree, or an achievement

These are YAML, not MDX, because they are structured records with no prose body. Every entry needs a unique `id`.

`achievements.yaml` holds awards, competition placings, leadership roles, **and certifications** — all one collection, so the audit finding that hid four real credentials cannot recur. Note one rule:

> **A `kind: 'certification'` entry requires `verification` (a URL) or `credentialId`.** A certification nobody can check is an unverifiable claim, and the build refuses it.

Standings are structured rather than written into the title:

```yaml
standing:
  rank: 5
  label: 'Finalist'
  outOf: 2500 # renders as "5th of 2,500"
```

---

## Running the site

```bash
npm run dev      # dev server
npm run build    # sync KaTeX assets → astro check → contrast check → build
npm run preview  # serve dist/ exactly as it will deploy
npm run check    # types + schemas + colour contrast, without building
npm run format   # prettier
```

### Search does not work until you have built once

Pagefind's index is a **build artifact**: a Rust indexer runs over the emitted HTML in `dist/` as the final build step. It does not exist in a fresh clone, and `astro dev` serves whatever the _previous_ build produced.

So on a new machine, or after adding content you want to find:

```bash
npm run build && npm run dev
```

If search returns nothing or 404s on `/pagefind/pagefind.js`, this is why. It is not broken; it has not been built.

### What gets indexed

One record per page, and only pages that opt in. Detail pages (papers, projects, posts) index themselves. `/about`, `/experience`, and `/achievements` index themselves because they have no detail pages — the archive _is_ the item list. `/research`, `/projects`, `/blog`, and the tag routes deliberately produce **no** record: their text belongs to the detail pages they link to, and indexing both returns every item twice for one query.

If you add an archive page, decide which of those two it is and pass `searchKind` accordingly.

---

## Things that are generated for you

Do not hand-write any of these; they follow from the frontmatter.

- **Social cards.** A 1200×630 PNG per entry, rendered at build time into `dist/og/`. Check one with `open dist/og/research/<slug>.png`.
- **Structured data.** `Person` sitewide, plus `ScholarlyArticle` / `BlogPosting` / `SoftwareSourceCode` on detail pages.
- **BibTeX**, from `venue` + `authors`.
- **Reading time**, from a remark plugin.
- **The sitemap, the RSS feed, and the tag routes.**
- **Table of contents**, from the headings in your body.

---

## Two rules that are easy to break

**Never format content with Prettier.** `src/content/**/*.mdx` is in `.prettierignore` for a real reason: Prettier's markdown parser rewrites `{/* … */}` MDX comments into `{/_ … _/}`, which is valid emphasis in Markdown and a syntax error in MDX. It corrupted all six content files once already. Notes belong in YAML frontmatter comments, beside the field they describe.

**Never write a colour literal in a component.** Use the tokens in `src/styles/global.css`. `scripts/check-contrast.mjs` runs on every build and asserts WCAG ratios in both themes; a literal is invisible to it, and a colour defined only inside a `[data-theme]` block paints one theme's text on the other theme's background.

---

## When the build fails

That is the system working. The error names the file, the field, and the expectation:

```
[InvalidContentEntryDataError] blog → 2026/my-post
  description: String must contain at least 50 character(s)
```

Fix the frontmatter, not the schema — unless the rule itself is genuinely wrong, in which case change it in `src/content.config.ts` where every entry sees the change at once.
