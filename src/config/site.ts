// src/config/site.ts
// Name, headline, socials, and CV link, read by nearly every layout and
// every <head>. A plain module parsed by Zod at import gives synchronous
// access with the same validation a collection would give asynchronously.
import { z } from 'astro/zod';

const schema = z.object({
  url: z.url(),
  name: z.string(),
  headline: z.string(),
  tagline: z.string(),
  location: z.string(),
  email: z.email(),
  availability: z.string().nullable(), // "Open to Research Collaborations" | null
  socials: z.object({
    github: z.url(),
    linkedin: z.url(),
    scholar: z.url().optional(),
    orcid: z.url().optional(),
    arxiv: z.url().optional(),
  }),
  /**
   * NULLABLE, LIKE `availability`, AND FOR THE SAME REASON.
   *
   * The PDF at this path is one of the outstanding content items from Phase 2:
   * `site.cv` named a file that `public/cv/` does not contain, so every
   * "Curriculum vitae" control on the site — the hero, the drawer, /about, the
   * footer — was a visible button returning 404. Phase 6's link check caught it.
   * `prefetchAll` made it worse than a dead click: the browser fetched the
   * missing PDF on sight, once per page view.
   *
   * A nullable field turns "we do not have this yet" into a state the type
   * system carries, so the controls disappear until the file exists instead of
   * lying about it. Set it back to '/cv/jerlshin-jg-cv.pdf' the moment the PDF
   * is committed; nothing else needs to change.
   */
  cv: z.string().startsWith('/').nullable(),
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
    // scholar / orcid / arxiv: TODO — supply real profile URLs (plan §5.1 ⚠️)
  },
  // TODO — set to '/cv/jerlshin-jg-cv.pdf' once that file exists in public/cv/.
  // Until then every CV control is absent rather than broken (plan §5.1 ⚠️).
  cv: null,
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
