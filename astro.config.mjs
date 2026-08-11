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
    // REQUIRED in v7 to keep remark/rehype working — see §2.2. Plugins are
    // passed into unified({...}) itself: passing them as sibling `markdown.*`
    // keys still works in 7.2.0 but is deprecated and prints a build warning.
    processor: unified({
      remarkPlugins: [remarkMath, remarkReadingTime],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['anchor'] } }],
      ],
    }),
  },

  // Two self-hosted faces only; UI text uses the system sans stack (--ff-sans
  // in global.css), which costs nothing to download and never shifts.
  //
  // `cssVariable` is --ff-* rather than the --font-* the plan sketched: Tailwind
  // v4 owns the --font-* theme namespace and already defines --font-mono, so the
  // two would fight over :root depending on stylesheet order. global.css §4
  // aliases --ff-* back onto Tailwind's --font-* names via `@theme inline`.
  //
  // `optimizedFallbacks` defaults to true and is what buys CLS ≈ 0 (risk #6):
  // because each `fallbacks` array ends in a generic family, Astro measures the
  // real face and emits a metric-matched @font-face over the local fallback, so
  // the swap does not change line box height.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Source Serif 4',
      cssVariable: '--ff-display',
      weights: [400, 600],
      styles: ['normal'], // default is normal+italic; headings never slant
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--ff-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'monospace'],
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
      // A sitemap must not advertise a URL the site then tells crawlers to
      // ignore — Search Console reports that contradiction as an error.
      // Everything excluded here carries `noindex` in its <head> AND a
      // Disallow in public/robots.txt, so all three agree:
      //   /og/…       generated PNGs, not pages
      //   /styleguide a maintenance page for token changes
      //   /search     a search box; every page it finds is indexed on its own
      // (/404 is never emitted as a route, so it needs no clause.)
      filter: (page) =>
        !page.includes('/og/') && !page.includes('/styleguide') && !page.includes('/search'),
      serialize: (item) => ({ ...item, url: item.url.replace(/\/$/, '') }), // match canonicals
    }),
    pagefind(), // must run last — indexes the emitted HTML
  ],

  vite: { plugins: [tailwind()] },
});
