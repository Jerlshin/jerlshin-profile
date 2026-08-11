/**
 * scripts/sync-katex-assets.mjs
 *
 * Copies KaTeX's stylesheet and its woff2 faces out of the npm package and
 * into public/katex/, so the site self-hosts them (§2.4: "never link the CDN —
 * a third-party URL embedded in a page intended to last a decade is a
 * guaranteed future 404").
 *
 * WHY public/ AND NOT AN IMPORT. The stylesheet has to be loaded *conditionally*
 * — only on pages whose frontmatter says `math: true`, because it costs ~23 KB
 * plus font downloads and ~90% of pages have no equations (risk #12). Astro
 * decides which CSS a page gets from the module graph, not from what actually
 * rendered, so `import 'katex/dist/katex.min.css'` inside a layout ships it to
 * every post that uses that layout, gate or no gate. A file in public/ behind a
 * conditional <link> is the only form that is genuinely conditional.
 *
 * Vite's `?url` import is not an alternative: it emits the CSS as an opaque
 * asset without processing it, so the relative `url(fonts/…)` references inside
 * would resolve against a hashed path where no fonts exist.
 *
 * public/katex/ is a derived artifact, not source, and is gitignored. This
 * script runs before both `dev` and `build`.
 *
 * Only the woff2 faces are copied. katex.min.css lists woff2 first in every
 * `src`, so a browser that supports it — every browser that has for a decade —
 * never requests the .woff or .ttf alternatives. Copying all three formats
 * would triple the deployed size for bytes nobody downloads.
 */
import { cp, mkdir, readdir, rm, writeFile, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Resolving through the package rather than hard-coding node_modules/ means a
// pnpm or Yarn PnP layout works, and a missing dependency fails HERE with a
// clear message instead of producing a page of unstyled TeX.
let katexDist;
try {
  katexDist = dirname(require.resolve('katex/package.json'));
} catch {
  throw new Error(
    'sync-katex-assets: the `katex` package is not installed. Run `npm install` before `npm run dev`.',
  );
}

const src = join(katexDist, 'dist');
const dest = join(root, 'public', 'katex');

const css = await readFile(join(src, 'katex.min.css'), 'utf8');

// Start clean so a KaTeX upgrade that renames a face cannot leave the old one
// behind to be served forever.
await rm(dest, { recursive: true, force: true });
await mkdir(join(dest, 'fonts'), { recursive: true });

await writeFile(join(dest, 'katex.min.css'), css);

const fonts = (await readdir(join(src, 'fonts'))).filter((f) => f.endsWith('.woff2'));
if (fonts.length === 0) {
  throw new Error(`sync-katex-assets: no .woff2 faces found in ${join(src, 'fonts')}.`);
}
await Promise.all(fonts.map((f) => cp(join(src, 'fonts', f), join(dest, 'fonts', f))));

// A silent no-op here would surface as unstyled math three phases later, which
// is precisely the failure class this migration exists to remove.
const { version } = require('katex/package.json');
console.log(`katex ${version} → public/katex/ (katex.min.css + ${fonts.length} woff2 faces)`);
