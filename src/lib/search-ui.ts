/**
 * src/lib/search-ui.ts — the Pagefind client, in its own lazily-loaded chunk.
 *
 * NOTHING IN THIS FILE IS ON THE CRITICAL PATH. It is reached only through a
 * dynamic `import()` fired by the first search interaction, so none of it —
 * and none of the ~40 KB of Pagefind WebAssembly it then loads — counts against
 * the under-5-KB-per-page budget in §2.8. The eager half of search is the
 * twenty lines in SearchDialog.astro that listen for ⌘K and call into here.
 *
 * PAGEFIND IS A BUILD ARTIFACT, NOT A DEPENDENCY (risk #7). `/pagefind/…` does
 * not exist in `src/`; it is written into `dist/` by the indexer that runs as
 * the final build step. The import below is therefore deliberately opaque to
 * Vite — a static specifier would fail to resolve at build time. In `astro dev`
 * the integration serves the *previous* build's index, which is why a fresh
 * clone must run `astro build` once before search works locally.
 */
import { KIND_ORDER } from './kinds.ts';

/** The subset of Pagefind's API this file uses. */
interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: Record<string, string | undefined>;
}

interface PagefindApi {
  options(opts: Record<string, unknown>): Promise<void>;
  init(): Promise<void>;
  search(
    term: string,
    opts?: { filters?: Record<string, string[]> },
  ): Promise<{ results: { id: string; data: () => Promise<PagefindResultData> }[] }>;
  filters(): Promise<Record<string, Record<string, number>>>;
}

/** Results rendered per query. Beyond this the answer is "refine the query". */
const MAX_RESULTS = 20;

/** Loaded at most once per document, however many panels ask for it. */
let apiPromise: Promise<PagefindApi> | undefined;

const loadPagefind = (): Promise<PagefindApi> =>
  (apiPromise ??= (async () => {
    // Built as a runtime value so Vite cannot try to resolve it; the comment
    // suppresses the warning it would otherwise print about that.
    const url = `${import.meta.env.BASE_URL}pagefind/pagefind.js`.replace(/\/{2,}/g, '/');
    const api = (await import(/* @vite-ignore */ url)) as PagefindApi;
    await api.options({ excerptLength: 24 });
    await api.init();
    return api;
  })());

/**
 * Pagefind reports the URL of the file it indexed — `/research/x/index.html`
 * becomes `/research/x/`. The site's canonicals, sitemap, and every internal
 * link use no trailing slash (risk #8), so a result link has to be normalised
 * or clicking a search hit would land on the one URL shape the site otherwise
 * never emits, and Vercel would redirect on the way.
 */
const normaliseUrl = (url: string): string => {
  const clean = url.replace(/index\.html$/, '').replace(/\.html$/, '');
  return clean.replace(/\/+$/, '') || '/';
};

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};

export interface SearchPanel {
  /** Runs a query and renders it. Safe to call before Pagefind has loaded. */
  search(term: string): void;
  /** Puts the caret in the panel's input. */
  focus(): void;
}

/**
 * Wire one search panel: an input, a facet row, a status line, and a results
 * list, all located by data attribute rather than by id. Ids would collide the
 * moment two panels existed in one document — which they do on /search, where
 * the page's own panel and the sitewide ⌘K dialog are both present.
 */
export function mountSearch(root: HTMLElement): SearchPanel {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const facetsBox = root.querySelector<HTMLElement>('[data-search-facets]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const list = root.querySelector<HTMLElement>('[data-search-results]');

  if (!input || !facetsBox || !status || !list) {
    throw new Error('mountSearch: panel is missing one of input/facets/status/results');
  }

  /** Selected `kind` facet values. Empty means "every kind". */
  const active = new Set<string>();
  let term = '';
  let generation = 0;

  const setStatus = (text: string) => {
    status.textContent = text;
  };

  const render = async (results: Awaited<ReturnType<PagefindApi['search']>>['results']) => {
    const shown = results.slice(0, MAX_RESULTS);
    const data = await Promise.all(shown.map((r) => r.data()));

    list.replaceChildren(
      ...data.map((d) => {
        const item = el('li', 'result');
        const link = el('a', 'result-link');
        link.href = normaliseUrl(d.url);

        if (d.meta.kind) {
          const kind = el('span', 'result-kind');
          kind.textContent = d.meta.kind;
          link.append(kind);
        }

        const title = el('span', 'result-title');
        title.textContent = d.meta.title ?? normaliseUrl(d.url);
        link.append(title);

        const excerpt = el('p', 'result-excerpt');
        // Pagefind escapes the source text and wraps matches in <mark>; the
        // only markup in this string is its own highlighting.
        excerpt.innerHTML = d.excerpt;
        link.append(excerpt);

        item.append(link);
        return item;
      }),
    );

    const total = results.length;
    setStatus(
      total === 0
        ? `No results for “${term}”.`
        : total > shown.length
          ? `${shown.length} of ${total} results for “${term}”.`
          : `${total} result${total === 1 ? '' : 's'} for “${term}”.`,
    );
  };

  const run = async () => {
    const mine = ++generation;

    if (term.trim().length < 2) {
      list.replaceChildren();
      facetsBox.hidden = true;
      // Not an error state: it is the resting state of an empty search box.
      setStatus(term.length === 0 ? '' : 'Keep typing…');
      return;
    }

    setStatus('Searching…');

    const api = await loadPagefind();
    const filters = active.size > 0 ? { kind: [...active] } : undefined;
    const res = await api.search(term, { filters });

    // A slower earlier query must not overwrite a faster later one.
    if (mine !== generation) return;

    await render(res.results);
    if (mine !== generation) return;

    await renderFacets(api);
  };

  const renderFacets = async (api: PagefindApi) => {
    const all = await api.filters();
    const counts = all.kind ?? {};

    // KIND_ORDER first, so the row does not reshuffle between queries; any
    // value the index has that the map does not know about is appended rather
    // than dropped, so a new kind shows up as an unstyled chip instead of
    // vanishing silently.
    const known = KIND_ORDER.filter((k) => k in counts);
    const extra = Object.keys(counts).filter((k) => !known.includes(k as never));
    const values = [...known, ...extra];

    if (values.length < 2) {
      facetsBox.hidden = true;
      return;
    }

    facetsBox.hidden = false;
    facetsBox.replaceChildren(
      ...values.map((value) => {
        const chip = el('button', 'facet');
        chip.type = 'button';
        chip.dataset.value = value;
        const on = active.has(value);
        chip.setAttribute('aria-pressed', String(on));
        chip.textContent = `${value} (${counts[value] ?? 0})`;
        chip.addEventListener('click', () => {
          if (active.has(value)) active.delete(value);
          else active.add(value);
          void run();
        });
        return chip;
      }),
    );
  };

  let timer: number | undefined;
  input.addEventListener('input', () => {
    term = input.value;
    window.clearTimeout(timer);
    // Long enough that a fast typist issues one query per word, short enough
    // that the list feels attached to the keyboard.
    timer = window.setTimeout(() => void run(), 120);
  });

  // Enter must not submit and reload the page out from under the results.
  root.closest('form')?.addEventListener('submit', (e) => e.preventDefault());
  input.form?.addEventListener('submit', (e) => e.preventDefault());

  return {
    search(next: string) {
      term = next;
      input.value = next;
      void run();
    },
    focus() {
      input.focus();
      input.select();
    },
  };
}
