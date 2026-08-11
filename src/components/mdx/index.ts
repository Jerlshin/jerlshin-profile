/**
 * src/components/mdx/index.ts — the component map handed to every <Content />.
 *
 * HOW THE AUTO-IMPORT WORKS. MDX compiles an undefined capitalised tag such as
 * `<Callout>` into a lookup on the `components` prop rather than a module-scope
 * identifier. Passing this map to `<Content components={mdxComponents} />` is
 * therefore all it takes for authors to use these six without an import line at
 * the top of every file — and no extra integration or dependency is involved.
 *
 * The failure mode is loud, which is the point: an MDX file that references a
 * component NOT in this map fails the build with "Expected component `X` to be
 * defined", naming the file. It cannot silently render nothing.
 *
 * Adding a component here makes it available to every MDX file on the site, so
 * the map is the reviewable list of what the content layer is allowed to use.
 */
import Aside from './Aside.astro';
import Callout from './Callout.astro';
import Details from './Details.astro';
import Diagram from './Diagram.astro';
import Figure from './Figure.astro';
import Video from './Video.astro';

export const mdxComponents = {
  Aside,
  Callout,
  Details,
  Diagram,
  Figure,
  Video,
};
