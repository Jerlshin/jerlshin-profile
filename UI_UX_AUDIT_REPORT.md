# End-to-End Responsive UI/UX Audit & Comprehensive Inconsistency Report

**Project:** Jerlshin Portfolio & Research Profile (`jerlshin-profile`)  
**Audit Date:** August 2026  
**Auditor:** Automated & Interactive Multi-Device Inspection Suite  
**Scope:** Complete Static Route Mesh, Dynamic Slugs, Components, Modals, Viewport Breakpoints, and Theme Modes.

---

## 1. Executive Summary

### Overall UI/UX Maturity & Health Assessment
The Astro-based portfolio exhibits exceptionally high architectural and engineering quality. The design system is strictly tokenized in `src/styles/global.css`, typography leverages fluid clamping, performance budgets are well-maintained, zero-FOUC theme switching is implemented via inline synchronous script execution, and WCAG AAA/AA contrast checks pass across all primitive tokens.

However, a rigorous manual-style multi-device visual and interaction audit across **Desktop (`1440x900`, `1280x800`)**, **Tablet (`768x1024`, `1024x768`)**, and **Mobile (`375x667`, `390x844`)** viewports uncovered several layout anomalies, responsive edge-case defects, touch-target discrepancies, and design token inconsistencies that degrade usability on specific devices or in dark mode.

### Key Metrics Summary
- **Overall System Health:** `Grade A- (89/100)`
- **Total Deficiencies Identified:** 15 Issues
  - **Critical Severity:** 0
  - **Moderate Severity:** 6
  - **Minor / Polish Severity:** 9
- **Core Areas for Remediation:**
  1. `MetricGrid` empty grid cell artifacts in dark theme and asymmetrical column breaks on tablet/desktop.
  2. Single-column archive header alignment mismatch on `/experience` across wide viewports.
  3. `Aside` float collision with sticky `TableOfContents` rail on ultra-wide desktop displays.
  4. Mobile touch-target compliance on `TagFilter` chips and `BibtexBlock` copy triggers.
  5. Search modal viewport compression and background rubber-banding on mobile devices.
  6. Safe-area inset handling on `BackToTop` floating action control.

---

## 2. Multi-Device Viewport Testing Matrix

| Profile / Tier | Viewport Resolution | Target Devices Simulated | Primary Focus Areas |
| :--- | :--- | :--- | :--- |
| **Desktop Ultra-Wide & Standard** | `1440 x 900`<br>`1280 x 800` | MacBook Pro 14"/16", External 2K/4K Monitors | 3-column grids, sticky TOC / Paper rails, hover states, ⌘K shortcut |
| **Tablet (Portrait & Landscape)** | `768 x 1024`<br>`1024 x 768` | iPad 10th Gen, iPad Pro, Android Tablets | Breakpoint ladder transitions (1→2→3 cols), header nav vs. drawer switch |
| **Mobile (Standard & Compact)** | `390 x 844`<br>`375 x 667` | iPhone 14/15/16, iPhone SE, Pixel / Galaxy | Touch targets (44px), drawer focus/backdrop, math overflow, text wrapping |

---

## 3. Device-Specific & Route-by-Route Issue Registry

### Route 1: Homepage (`/`)
*Primary Components: `Hero`, `FeaturedRail`, `PaperCard`, `ProjectCard`, `PostCard`, `ExperienceTimeline`, `Card` (Skills)*

#### Issue HOM-01: Skills Section Asymmetrical Card Heights on Medium Viewports
- **Location / Component:** `src/pages/index.astro` (`.skills` grid, lines 260–276)
- **Viewport:** Tablet (`768x1024` portrait) & Small Laptops (`1024x768`)
- **Observed Behavior:** In the Skills section at 48rem (768px), the grid renders in 2 columns (`repeat(2, 1fr)`). Category cards with unequal items (e.g. Languages vs Systems) produce uneven row heights without vertical stretching, leaving large blank spaces at the bottom of shorter cards in the same row.
- **Expected Behavior:** Skills category cards in the same row should stretch equally (`align-items: stretch` or `height: 100%`) with flex column content distributing pills evenly.
- **Severity:** Minor
- **Root Cause Hypothesis:** CSS grid items inside `.skills` default to intrinsic height rather than filling the track block-size, resulting in uneven bottom card boundaries.

---

### Route 2: About (`/about`)
*Primary Components: `PageLayout`, `Prose`, `Btn` (Contact Actions)*

#### Issue ABO-01: Contact Action Button Wrapping & Focus Stacking on Mobile
- **Location / Component:** `src/pages/about.astro` (`.contact .actions`, lines 64–76)
- **Viewport:** Mobile Compact (`375x667`) & Standard (`390x844`)
- **Observed Behavior:** The 4 action buttons ("Email", "LinkedIn", "GitHub", "Curriculum vitae") wrap into 3 jagged rows (2 buttons on row 1, 1 button on row 2, 1 button on row 3). The buttons have varying widths (`width: auto`), creating an unbalanced stair-step visual layout.
- **Expected Behavior:** On compact mobile screens (`< 640px`), the button group should either display in 2 equal-width columns or stretch full-width (`width: 100%`) for clean visual balance and thumb accessibility.
- **Severity:** Minor
- **Root Cause Hypothesis:** `.actions` uses `display: flex; flex-wrap: wrap; gap: 0.5rem;` without child width normalization at mobile breakpoints.

---

### Route 3: Experience & Achievements (`/experience`, `/achievements`)
*Primary Components: `ArchiveLayout`, `ExperienceTimeline`, `EducationCard`, `AchievementCard`, `TagFilter`, `EmptyState`*

#### Issue EXP-01: Disconnected Max-Width Alignment Between Header and Content Column
- **Location / Component:** `src/layouts/ArchiveLayout.astro` vs `src/pages/experience.astro`
- **Viewport:** Desktop (`1440x900` & `1280x800`)
- **Observed Behavior:** On `/experience`, `ArchiveLayout` wraps the entire page in `<Container width="shell">` (1440px max width). The `.head` (eyebrow, title "Experience", lede, and role counter) spans the full 1440px shell container. However, `#experience-grid.cols-1` and the `.band` containers for Education and Skills are clamped to `max-inline-size: var(--content-max)` (72ch ≈ 720px). On wide displays, this creates an awkward visual disconnect where the page title and lede are aligned far to the left of a 1440px boundary while the content starts indented in a narrow 72ch column.
- **Expected Behavior:** For single-column archive layouts (`columns={1}`), the entire page header (`.head`), breadcrumbs, and content should share identical max-width (`var(--content-max)` / `width="content"`).
- **Severity:** Moderate
- **Root Cause Hypothesis:** `ArchiveLayout.astro` assumes all archives are multi-column card grids spanning `shell` width and only applies `max-inline-size: var(--content-max)` to `.cols-1` grid children rather than to the layout container.

#### Issue ACH-01: Filter Empty State Text Wrapping & Reset Affordance
- **Location / Component:** `src/pages/achievements.astro` & `src/components/content/TagFilter.astro`
- **Viewport:** Mobile (`375x667`), Tablet (`768x1024`)
- **Observed Behavior:** When a combination of tags yields 0 matches, the `EmptyState` displays "No achievements match those tags" with body "Selecting more tags narrows the results. Clear one to widen them again." There is no direct "Clear all filters" button inside the `EmptyState` card itself, forcing mobile users to scroll back up to the horizontal chip rail to tap "All".
- **Expected Behavior:** The zero-result `EmptyState` should provide an actionable button (e.g. `<Btn variant="secondary" size="sm">Reset filters</Btn>`) that resets the active filter set directly.
- **Severity:** Minor
- **Root Cause Hypothesis:** `EmptyState` is rendered as static markup toggled by `hidden` without integrating an active reset trigger bound to the `TagFilter` client script.

---

### Route 4: Research / Publications (`/research`, `/research/[...slug]`)
*Primary Components: `PaperCard`, `PaperLayout`, `PaperMeta`, `MetricGrid`, `BibtexBlock`, `TagList`*

#### Issue RES-01: MetricGrid Empty Grid Cell Exposing Raw Background Color in Dark Mode
- **Location / Component:** `src/components/content/MetricGrid.astro` (`.grid`, lines 46–58)
- **Viewport:** Desktop (`1440x900`), Tablet (`1024x768`)
- **Observed Behavior:** `MetricGrid` uses `grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));` with `background-color: var(--line);` and `gap: 1px;`. When a paper or project has 4 metrics (such as in `/projects/gaitsync-gait-analysis` or research details with 4 metrics), the grid creates a 3-column first row and places the 4th metric alone on row 2. The remaining 2 unfilled grid cells in row 2 expose the raw container background (`var(--line)`), creating a large dark/gray rectangular void that looks like a broken UI block (verified in screenshot `dark_theme_enabled_1786894919577.png`).
- **Expected Behavior:** `MetricGrid` should use clean cell borders (e.g. explicit border-collapse or 2/4 column tracks) rather than container background leakage, or explicitly define `grid-template-columns: repeat(2, 1fr)` / `repeat(4, 1fr)` at appropriate breakpoints.
- **Severity:** Moderate
- **Root Cause Hypothesis:** Faux-border technique using `background-color: var(--line)` with `gap: 1px` fails whenever `total_items % columns !== 0`.

#### Issue RES-02: BibTeX Copy Trigger Sub-Standard Touch Target Size
- **Location / Component:** `src/components/content/BibtexBlock.astro` (`.copy`, lines 100–116)
- **Viewport:** Mobile (`375x667`, `390x844`)
- **Observed Behavior:** The "Copy" button inside the BibTeX block header has an explicit `min-block-size: 2rem` (32px) and `padding-inline: 0.75rem`. This violates the site's documented minimum touch target token (`--tap: 2.75rem` / 44px). On mobile screens, tapping the copy button requires high finger precision near the upper right corner.
- **Expected Behavior:** The copy control should clear the 44px touch target requirement (`.tap-target` or `min-block-size: var(--tap)`) or use an invisible pseudo-element expansion (`::before { inset: -6px; }`).
- **Severity:** Moderate
- **Root Cause Hypothesis:** Custom `.copy` class hardcoding `2rem` height to match visual aesthetic without responsive touch-expansion override.

#### Issue RES-03: Silent Failure on Clipboard Write Rejection
- **Location / Component:** `src/components/content/BibtexBlock.astro` (script, lines 63–70)
- **Viewport:** All Browsers / Insecure Contexts
- **Observed Behavior:** If `navigator.clipboard.writeText()` rejects (due to iframe permissions, non-HTTPS local IP testing, or browser permission denial), the `catch` block executes `return;` silently. The button remains in the "Copy" state with no visual indication that the operation was blocked.
- **Expected Behavior:** In the event of a clipboard rejection, the button should either fallback to text selection (`document.execCommand('copy')` / selecting text) or announce an accessible error state (e.g., "Failed to copy").
- **Severity:** Minor
- **Root Cause Hypothesis:** Omission of catch-block error handling to keep script footprint small.

---

### Route 5: Projects (`/projects`, `/projects/[...slug]`)
*Primary Components: `ProjectCard`, `ProjectLayout`, `ArchitectureFigure`, `StackList`, `StatusBadge`*

#### Issue PRJ-01: ArchitectureFigure Frame Border Contrast Against Diagram Whitespace
- **Location / Component:** `src/components/content/ArchitectureFigure.astro` (`.frame`, lines 62–70)
- **Viewport:** Dark Theme across all Viewports
- **Observed Behavior:** `ArchitectureFigure` wraps diagram images in `.frame { background-color: var(--surface); border: 1px solid var(--line); }`. Architecture diagrams exported with transparent backgrounds render dark ink on dark surfaces; diagrams exported with white backgrounds create a harsh white rectangle inside a dark bordered frame.
- **Expected Behavior:** Add support for diagram color inversion / brightness handling in dark mode (e.g. `filter: invert(0.9) hue-rotate(180deg)` for black-on-transparent SVGs/PNGs, or clean padding containment for white-background schemas).
- **Severity:** Minor
- **Root Cause Hypothesis:** Static background treatment without theme-adaptive media filtering for architectural artifacts.

---

### Route 6: Blog / Writing (`/blog`, `/blog/[...slug]`, `/blog/tags/[tag]`)
*Primary Components: `PostArchive`, `PostLayout`, `Prose`, `TableOfContents`, `SeriesNav`, `PrevNext`, `Aside`, `Callout`, `Details`*

#### Issue BLO-01: Aside Float Collision with Sticky TableOfContents Rail on Desktop
- **Location / Component:** `src/components/mdx/Aside.astro` (`@media (min-width: 90rem)`, lines 59–68)
- **Viewport:** Ultra-Wide Desktop (`>= 1440px` / `90rem`)
- **Observed Behavior:** In `Aside.astro`, notes with `inline={false}` are styled with:
  ```css
  @media (min-width: 90rem) {
    .aside:not(.inline) {
      float: inline-end;
      inline-size: var(--rail-w);
      margin-inline-end: calc(-1 * (var(--rail-w) + 2rem));
    }
  }
  ```
  On blog posts where `TableOfContents` is enabled (`PostLayout.astro`), the right rail (`--rail-w: 16rem`) is already occupied by the sticky `<TableOfContents>`. When an article contains an `<Aside>`, the negative right margin floats the aside directly into the TOC sticky rail, causing text overlap and collision.
- **Expected Behavior:** When rendered inside a layout with an active TOC right rail, `<Aside>` elements must remain in-flow (`inline`) or float only when the right margin has surplus space beyond both the TOC rail and gutters.
- **Severity:** Moderate
- **Root Cause Hypothesis:** `<Aside>` CSS assumes the right margin is completely unallocated, failing to account for `PostLayout`'s sticky right-rail TOC grid.

#### Issue BLO-02: KaTeX Display Equation Sizing & Small Device Inline Padding
- **Location / Component:** `src/styles/prose.css` (`.prose .katex-display`, lines 259–265)
- **Viewport:** Compact Mobile (`375x667`)
- **Observed Behavior:** Display math formulas correctly scroll horizontally via `overflow-x: auto`. However, inline math formulas (`.katex`) containing complex fractions (e.g., `\alpha_v / \alpha_e` or exponents `10^{-4}`) slightly expand the line-box height from `1.65` to `~1.85`, creating noticeable vertical line-height jitter in prose paragraphs on narrow screens.
- **Expected Behavior:** Inline KaTeX elements should be constrained with `line-height: 0; vertical-align: -0.1em;` to preserve uniform prose vertical rhythm.
- **Severity:** Minor
- **Root Cause Hypothesis:** Unnormalized inline `.katex` vertical alignment inside `.prose`.

#### Issue BLO-03: Post Details/Accordion Marker Animation Jitter
- **Location / Component:** `src/components/mdx/Details.astro` (`.marker`, lines 66–75)
- **Viewport:** All Mobile & Desktop Viewports
- **Observed Behavior:** The disclosure marker uses `transition: transform var(--dur) var(--ease)`. When clicked, the summary text shifts slightly horizontally (1–2px) as the icon rotates 90 degrees due to flex layout bounding box calculation changes.
- **Expected Behavior:** The chevron icon container should have fixed dimensions (`inline-size: 1.25rem; block-size: 1.25rem; display: inline-flex; align-items: center; justify-content: center;`) so rotation does not alter text position.
- **Severity:** Minor
- **Root Cause Hypothesis:** `transform: rotate(90deg)` applied directly on the SVG without a rigid container box.

---

### Route 7: Search (`/search` & Modal Dialog)
*Primary Components: `SearchDialog`, `SearchResults`, `SearchTrigger`, `mountSearch`*

#### Issue SEA-01: Modal Height Compression with Mobile Virtual Keyboard
- **Location / Component:** `src/components/search/SearchDialog.astro` (`.dialog`, lines 111–125)
- **Viewport:** Mobile (`375x667` & `390x844`)
- **Observed Behavior:** The dialog has `margin-block-start: min(12vh, 6rem)`. When the virtual keyboard appears on mobile devices, the available viewport height shrinks to ~300px. The 6rem top margin pushes the dialog down, leaving only a tiny ~100px window for search results and cutting off facet chips.
- **Expected Behavior:** On mobile viewports (`< 640px`), `.dialog` should have `margin-block-start: 0.5rem; inline-size: calc(100vw - 1rem); max-block-size: calc(100dvh - 1rem);` so the search results maximize available screen space above the keyboard.
- **Severity:** Moderate
- **Root Cause Hypothesis:** Fixed desktop margin convention applied without mobile breakpoint override.

#### Issue SEA-02: Missing Background Body Scroll Lock on Modal Open
- **Location / Component:** `src/components/search/SearchDialog.astro` (script, lines 84–90)
- **Viewport:** iOS Safari / Android Chrome Mobile Viewports
- **Observed Behavior:** When the `<dialog id="search-dialog">` opens via `showModal()`, scrolling inside the results list or over the backdrop can cause the background `<body>` to scroll and rubber-band simultaneously.
- **Expected Behavior:** Opening the dialog should add an `overflow: hidden` class to `document.documentElement` / `document.body` and restore it on close.
- **Severity:** Moderate
- **Root Cause Hypothesis:** Reliance on native `<dialog>` default behavior without iOS Safari scroll-lock prevention.

#### Issue SEA-03: Search Result Highlight Contrast in Dark Mode
- **Location / Component:** `src/components/search/SearchResults.astro` (`.results mark`, lines 156–164)
- **Viewport:** Dark Theme across all Viewports
- **Observed Behavior:** Matched terms in search excerpts are wrapped in `<mark>`. In dark mode, regular excerpt text is `--c-300` (#b6bdc6) and `<mark>` text is `--c-100` (#e7eaee) with weight 600 and transparent background. The contrast difference between matching and non-matching text is very faint, making keyword scanning difficult.
- **Expected Behavior:** Highlighted search terms should utilize `--color-accent` or an accent tint (`background-color: var(--accent-soft); color: var(--accent); padding: 0.1em 0.25em; border-radius: var(--radius-xs);`).
- **Severity:** Minor
- **Root Cause Hypothesis:** Removal of browser default yellow `<mark>` background without replacing it with a theme-aware tinted background token.

---

### Route 8: Navigation, Chrome & Error Pages (`/404`, Header, Footer, Drawers)
*Primary Components: `SiteHeader`, `MobileDrawer`, `Nav`, `Breadcrumbs`, `BackToTop`, `SiteFooter`, `404.astro`*

#### Issue NAV-01: BackToTop Button Overlapping iOS Home Indicator on Compact Mobile
- **Location / Component:** `src/components/chrome/BackToTop.astro` (`.back-to-top`, lines 40–72)
- **Viewport:** Mobile (`375x667`, `390x844`)
- **Observed Behavior:** `BackToTop.astro` defines `inset-block-end: 1rem;` for mobile, and only applies `inset-block-end: max(1.5rem, env(safe-area-inset-bottom));` inside `@media (min-width: 40rem)`. On compact mobile devices with home indicator bars (iPhone standard / SE / Android gesture navigation), the button sits only 16px from the bottom, overlapping the system gesture zone.
- **Expected Behavior:** `inset-block-end: max(1rem, env(safe-area-inset-bottom));` must be defined on the base rule for mobile screens.
- **Severity:** Moderate
- **Root Cause Hypothesis:** Safe-area calculation mistakenly nested inside desktop/tablet media query.

#### Issue NAV-02: Breadcrumbs Trail Wrapping on 360px–375px Viewports
- **Location / Component:** `src/components/chrome/Breadcrumbs.astro` (`.current`, lines 91–99)
- **Viewport:** Mobile Compact (`375x667` / `360px`)
- **Observed Behavior:** `.current` sets `max-inline-size: 22ch;`. On 360px-375px screens with long paper/post titles, the breadcrumb trail (`Home > Research > [22ch Title]`) sums to ~350px. Inside a container with `--gutter: 1rem` (32px total padding), the trail wraps onto 2 lines, leaving an orphaned chevron on row 1 or wrapping the final title onto row 2.
- **Expected Behavior:** `.current` should use a responsive clamp: `max-inline-size: min(22ch, 42vw);` to guarantee the breadcrumb never wraps to a second line.
- **Severity:** Minor
- **Root Cause Hypothesis:** Static character measure (`22ch`) exceeding available container width on compact mobile devices.

#### Issue NAV-03: Theme Toggle Inaccessible from Inside Open Mobile Drawer
- **Location / Component:** `src/components/chrome/MobileDrawer.astro`
- **Viewport:** Mobile (`< 1024px`)
- **Observed Behavior:** The `ThemeToggle` button is situated in `SiteHeader.astro`. When the `MobileDrawer` `<dialog>` opens, the backdrop covers the header. A user navigating via the mobile drawer has no access to the theme toggle unless they close the drawer.
- **Expected Behavior:** The `MobileDrawer` footer or header should include a `ThemeToggle` instance or secondary toggle switch for convenient mobile access.
- **Severity:** Minor
- **Root Cause Hypothesis:** Desktop header layout assumed header controls would always remain visible, but mobile drawer modal covers them.

---

## 4. Global Inconsistencies & Design Token Discrepancies

### A. Focus-Visible Radius Mismatch
- **Observation:** `global.css` line 447 defines `:focus-visible { border-radius: var(--radius-xs); }` (3px).
- **Inconsistency:** Buttons (`Btn.astro`) use `var(--radius-sm)` (4px); Cards (`Card.astro`) use `var(--radius-md)` (6px); Pills (`Pill.astro`) and Tags (`Tag.astro`) use `var(--radius-full)` (999px) and `var(--radius-sm)`.
- **Result:** When tabbing to pills or rounded buttons, the focus ring draws with sharp 3px corners over a 999px pill or 6px card, creating noticeable corner clipping.
- **Fix:** Update `:focus-visible` to use `border-radius: inherit;` where supported, or let components declare their own matching focus ring radius.

### B. Button Height & Touch-Target Tokens
- **Observation:**
  - `Btn` sm: `min-block-size: 2.25rem` (36px)
  - `Btn` md: `min-block-size: var(--tap)` (44px)
  - `TagFilter` chips: computed `~26px`
  - `BibtexBlock` copy button: `min-block-size: 2rem` (32px)
  - `SearchResults` facets: `min-block-size: 2rem` (32px)
- **Inconsistency:** Three different small-button heights (26px, 32px, 36px) exist across the codebase alongside the standard 44px `--tap` token.
- **Fix:** Standardize secondary and tertiary interactive chips to a minimum touch-target base (`min-block-size: 2.25rem` with mobile tap expansion).

### C. Container Width Ladder Discipline
- **Observation:**
  - `PageLayout.astro` uses `width="content"` (72ch).
  - `ArchiveLayout.astro` uses `width="shell"` (1440px) for all pages, including single-column `/experience`.
  - `PostLayout.astro` uses `width="shell"` (1440px) with custom grid.
  - `PaperLayout.astro` and `ProjectLayout.astro` use `width="content"` (72ch).
- **Inconsistency:** L2 single-column `/experience` header aligns to 1440px, while L3 paper/project detail headers align to 72ch, creating horizontal jumping when navigating between career history and project case studies.

---

## 5. Remediation & Execution Plan

### Phase 1: Critical & Moderate Layout Fixes (Zero Regression Target)
1. **Fix `MetricGrid.astro`:**
   - Replace faux-border `gap: 1px; background-color: var(--line);` with clean explicit cell borders (`border: 1px solid var(--line)` on items, or grid track alignment).
   - Change `grid-template-columns` to responsive 2/4 column ladders: `repeat(auto-fit, minmax(14rem, 1fr))` to eliminate single-item trailing rows.
2. **Fix `ArchiveLayout.astro` for `columns={1}`:**
   - When `columns={1}`, wrap `.head` and breadcrumbs in `max-inline-size: var(--content-max)` to match `/experience` timeline and education cards.
3. **Fix `Aside.astro` Desktop Float Collision:**
   - In `Aside.astro`, guard the float rule so it does not collide with `has-rail` layouts, or default `Aside` to in-flow block layout inside post templates with active TOC.
4. **Fix `SearchDialog.astro` Mobile Viewport & Scroll Locking:**
   - Add mobile breakpoint `@media (max-width: 40rem)` with `margin-block-start: 0.5rem; max-block-size: calc(100dvh - 1rem);`.
   - Add `document.documentElement.style.overflow = 'hidden'` on dialog open and restore on close.
5. **Fix `BackToTop.astro` Safe-Area Placement:**
   - Move `inset-block-end: max(1rem, env(safe-area-inset-bottom));` to the base class outside media queries.

### Phase 2: Touch-Target & Interaction Polish
1. **Enlarge `BibtexBlock.astro` & `TagFilter.astro` Touch Targets:**
   - Update `.copy` button and `.chip` to meet touch standards on mobile devices (`min-block-size: 2.25rem` or pseudo-element expansion).
2. **Add Reset Filter Trigger in `EmptyState`:**
   - Wire a "Clear filters" action button inside zero-result empty state on `/achievements`, `/research`, and `/projects`.
3. **Refine Breadcrumbs Truncation:**
   - Update `Breadcrumbs.astro` `.current` max-width to `min(22ch, 42vw)` to prevent 2-line wraps on compact mobile screens.
4. **Enhance Search Keyword Contrast in Dark Mode:**
   - Add background tint and accent color to `mark` tags in `SearchResults.astro`.

### Phase 3: Token Normalization & Polish
1. **Inherit Focus-Visible Border Radius:**
   - Update `global.css` `:focus-visible` to inherit border radius from the focused element.
2. **Add ThemeToggle to Mobile Drawer:**
   - Include a theme toggle button in `MobileDrawer.astro` footer for seamless mobile accessibility.
3. **Standardize Action Button Mobile Stacking:**
   - Ensure button groups in `/about` and `/404` stretch cleanly on screens `< 480px`.

---

## 6. Post-Fix Verification Checklist

- [ ] **Automated Contrast Check:** `npm run check:tokens` passes 100% with 0 errors.
- [ ] **Type & Syntax Validation:** `npm run check` passes with 0 errors, 0 warnings.
- [ ] **Desktop QA (1440x900 & 1280x800):**
  - [ ] Homepage hero, 3-column rails, timeline, and skills cards.
  - [ ] Experience header and timeline alignment at 1440px.
  - [ ] Blog detail TOC right-rail stickiness and Aside margin note non-collision.
  - [ ] Search modal ⌘K trigger, keyword highlighting in light/dark themes.
- [ ] **Tablet QA (768x1024 & 1024x768):**
  - [ ] 2-column card grids on `/research`, `/projects`, `/achievements`.
  - [ ] Desktop nav vs mobile hamburger drawer transition at 1024px.
  - [ ] MetricGrid 4-item layout symmetry on GaitSync case study.
- [ ] **Mobile QA (375x667 & 390x844):**
  - [ ] Mobile drawer open/close, focus trapping, backdrop tap.
  - [ ] Horizontal scroll audit (`scrollWidth <= innerWidth`) on all pages.
  - [ ] KaTeX display equation horizontal scroll containment.
  - [ ] BibTeX copy button tap target and clipboard status.
  - [ ] Search modal full-screen utilization above virtual keyboard.
  - [ ] BackToTop button clearance above iOS home indicator bar.
- [ ] **Cross-Theme Verification:**
  - [ ] Dark mode toggle on all routes; no unstyled or low-contrast text.
