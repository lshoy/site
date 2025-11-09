# Purpose

The site already feels intentional on desktop, but it breaks down on phones: there is no workflow to inspect it at real device widths, and the CSS only contains a single mobile rule so the browser grid, ledgers, and long hero copy force visitors to pinch/scroll awkwardly. The goal is to stand up a repeatable screenshot workflow, capture the current state, and then introduce responsive adjustments so `/`, `/writings`, and `/writings/[slug]` read cleanly on 320–768 px screens without changing the established desktop aesthetic.

# Current State

The repository is a Next.js App Router project (`app/` routes, `components/*` for layout + browser UI, `lib/content.ts` for Markdown ingestion). There is no automation for screenshots; developers rely on a local browser, so there is no reference set to compare changes against. Styles live in `app/globals.css`, which only defines one `@media (max-width: 720px)` block that stacks `.browser-grid` and header controls. Everything else uses fixed paddings, min-width inputs, and multi-column layouts sized for ~880 px. Concrete issues: the `inline-search` input in `components/post/blog-browser.tsx` enforces a 14rem minimum width that overflows 320 px phones; the group list renders before entries on small screens so visitors must scroll past a tall filter column to read any post; `.ledger`, `.article`, and `.app-shell` use large interior spacing that produces horizontal scroll on narrow widths; hero portraits (`app/page.tsx`) stay at 160 px, forcing wrap gaps wider than the viewport. Because there is no viewport export in `app/layout.tsx`, we also rely on implicit Next defaults rather than guaranteeing `width=device-width`.

# Target Experience

1. A repeatable “mobile shot” workflow exists under `tmp/mobile-shots/`, driven by a script that can resize Chromium to multiple breakpoints, scroll each page, and store timestamped PNGs for `/`, `/writings`, and a representative entry (`/writings/diary-entry-014a`). Baseline screenshots are captured before CSS work begins and can be regenerated after every iteration.
2. The layout adapts fluidly: gutters, typography, and component spacing scale with `clamp()` so nothing overflows 320 px devices, while the 880 px desktop presentation remains unchanged. Header nav, hero copy, ledgers, and chronologies stack gracefully without introducing new colors or shapes.
3. The blog browser prioritizes content on phones: the results rail appears before filters when stacked, the search input fits the viewport, group buttons wrap without shrinking text, and mobile users are not forced into an autofocus that summons the keyboard. Desktop sees the current two-column slab untouched.
4. Article pages retain the manuscript vibe but drop their padding and rule thickness on phones, ensuring metadata chips, related posts, and preformatted code blocks stay readable without horizontal scrolling.

# Implementation Strategy

## Snapshot toolkit

Introduce Playwright-based automation dedicated to screenshots. Add `@playwright/test` as a dev dependency (it bundles Chromium and a stable API) and create `scripts/mobile-shots.config.ts` exporting the pages, selectors, and scroll anchors we care about. Expected structure: each page definition lists `path`, a human name, and either numeric scroll offsets or CSS selectors (`section.home-ledger`, `.chronological-index`, `.article header`) that the runner will scroll into view. Define shared viewports for `iphone-se` (375×667), `pixel-7` (412×915), `ipad-portrait` (834×1112), and `desktop` (1280×720) so we can confirm we did not regress larger screens.

Create `scripts/capture-mobile-shots.ts` (plain TypeScript or ESM JavaScript, compiled via `ts-node` is unnecessary because `@playwright/test` can run through `tsx`/`ts-node/register`). The script should:

* Accept `--label` (defaults to `baseline`) and `--baseUrl` (defaults to `http://localhost:3000`) arguments.
* Generate a timestamped run folder under `tmp/mobile-shots/YYYYMMDD-HHMMSS-label/` and ensure `tmp/mobile-shots/` is added to `.gitignore`.
* For every `{page, viewport, scroll}` combination, launch Chromium with the requested viewport, visit the URL, wait for `.app-shell`, optionally wait for an extra selector declared in the config, perform `page.evaluate(() => window.scrollTo(0, value))` or `locator.scrollIntoViewIfNeeded()`, pause briefly, and write PNGs with filenames like `home__iphone-se__top.png` or `writings__pixel-7__chronological-index.png`.
* Summarize the run (count of screenshots and output folder) at the end so we can inspect them manually.

Expose the runner behind `package.json` scripts such as `"capture:screens": "tsx scripts/capture-mobile-shots.ts"` to avoid remembering the node CLI. Because screenshots are temporary references, do not commit them; they live entirely inside `tmp/mobile-shots/`.

## Baseline capture workflow

Document the baseline process inside the ExecPlan so any contributor can recreate it:

1. `pnpm install` to pull the new dev dependencies if needed, then start the dev server in one terminal via `pnpm dev`.
2. In another terminal run `pnpm capture:screens -- --label baseline`. The script writes shots under `tmp/mobile-shots/<timestamp>-baseline`.
3. Inspect the folder (or open it via the file explorer) to understand the current mobile issues. Keep this folder around during the responsive work for comparison; optionally copy it elsewhere if another run is needed.

Later milestones will repeat Step 2 with labels such as `post-fixes` to validate improvements.

## Global responsive scaffolding

Update `app/layout.tsx` to export an explicit `viewport` (`{ width: "device-width", initialScale: 1, viewportFit: "cover" }`) so the browser never scales down the mobile view. Revise `app/globals.css` to add fluid design tokens: introduce `--gutter`, `--section-gap`, and `--text-scale` custom properties alongside the existing palette, using `clamp()` to keep them within sensible ranges. Apply those tokens to `body`, `.app-shell`, and `main` so padding and gaps follow `clamp(1.5rem, 3vw, 2.5rem)` patterns instead of static `px` values. Expand the single media query into breakpoint tiers (e.g., `@media (max-width: 960px)`, `720px`, `560px`, `420px`) that progressively reduce padding, tweak font sizes, and adjust grid templates, while keeping the default desktop styles identical to today.

Ensure repeated primitives acknowledge narrow screens:

* `code`, `pre`, and `.rule-list li` need `max-width: 100%` rules and `overflow-x: auto` so long strings do not force scrolling.
* `.stats-grid` and `.post-meta-grid` should use `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))` at wide widths but collapse to two or one columns under 480 px.
* `.home-ledger`, `.ledger`, `.article`, and `.chronological-index` should switch to tighter padding via `clamp()` and reduce border thickness on coarse pointers to avoid the “boxed” feel on phones.

## Header and hero adjustments

Modify `.site-header` related rules so nav links wrap naturally: enable `flex-wrap` for `.site-header nav` and `.site-header-actions`, reduce letter-spacing on very small screens, and keep the same uppercase styling on desktop. For mobile, move the theme toggle and social link onto their own lines using CSS only; no markup changes are required.

Make the hero more flexible by converting `.hero-lines` and `.hero-portraits` into responsive grids. Use `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` for portraits so the four images collapse into two columns on tablets and full-width on phones. Scale the hero copy with `clamp(0.78rem, 0.6rem + 0.8vw, 0.85rem)` so the all-caps kicks do not overflow. These changes stay confined to `app/globals.css`.

## Blog browser improvements

Tweak `components/post/blog-browser.tsx` to support better behavior:

* Add semantic class hooks (`className="browser-panel browser-panel-groups"` and `className="browser-panel browser-panel-results"`) so CSS can reorder panels on small screens, placing results before filters.
* Replace the `autoFocus` attribute with a `useRef` + `useEffect` that only focuses the search input on non-touch devices (`matchMedia("(pointer: coarse)")`). This keeps the desktop experience identical while preventing mobile keyboards from opening automatically.
* Keep the rest of the logic intact (group flattening, filtering) so data correctness is unaffected.

Update `app/globals.css` accordingly: define `.browser-panel-groups` and `.browser-panel-results`, leverage CSS `order` within `@media (max-width: 640px)` to show the results panel first, and let `.group-list` gain vertical scrolling with `max-height` on small screens while `.group-button` uses `padding-inline` that fits phones. Reduce the `inline-search input` minimum width and set it to `width: min(100%, 18rem)` so it shrinks softly. Add a `.browser-mobile-meta` helper if needed for top-of-panel descriptions. The desktop grid, typography, and colors stay untouched outside of new media queries.

## Ledgers, indexes, and articles

Bring the rest of the site in line:

* Ledgers (`.ledger`, `.home-ledger`) and the stats `dl` on `/writings` should adopt `font-size` clamps and stack columns when narrower than 600 px.
* The chronological index pagination needs improved wrapping; add `flex-direction: column` at ≤480 px and widen the buttons to 100%.
* `.article` and `.article-content` should drop to `padding: clamp(1.25rem, 4vw, 2rem)` and adjust heading sizes, while `.related-posts` gains extra top margin only on desktops. Ensure `.group-label` chips gain a `flex-wrap: wrap` fallback when viewport is <420 px so long cosmetic tags stay readable.

All of the above are pure CSS changes to `app/globals.css`, which keeps the visual language intact but prevents horizontal scrollbars.

## Iterative screenshots and QA

After the CSS and component tweaks, rerun `pnpm capture:screens -- --label post-fixes` while the dev server is running. Compare the resulting folder with the baseline to verify that:

* Nothing regressed on `desktop` captures.
* 375–412 px shots show no horizontal scrollbars, cramped filters, or cropped hero images.
* Long pages (`/writings`, entry detail) remain legible at their mid/bottom scroll captures.

Close by running `pnpm lint`, `pnpm typecheck`, and `pnpm build` so the static export stays healthy. If differences remain, iterate on the CSS and recapture screenshots until the comparison looks good; delete temporary folders once satisfied.

# Verification

Development verification consists of automated checks plus manual screenshot diffs. Always run `pnpm lint`, `pnpm typecheck`, and `pnpm build` before delivering the change. For visual QA, keep the dev server alive, run `pnpm capture:screens -- --label baseline` prior to touching CSS, then rerun with a new label afterward. Open the two folders in an image viewer to confirm that mobile breakpoints behave as described and desktop matches the original look. Because screenshots are not committed, mention their location in the handoff notes.

# Progress

- [x] Snapshot tooling and baseline capture
- [x] Responsive layout adjustments across globals, header, and articles
- [x] Final verification plus after-the-fix screenshot pass

# Change Log

* 2025-11-09 – Tweaked the default nav offset once more (0.42rem default / 0.24rem ≤420 px) for the most natural alignment across all widths.
* 2025-11-09 – Neutralized the mobile-only full-width style on the theme toggle so it matches the desktop treatment at every breakpoint.
* 2025-11-09 – Added `scripts/check-overflow.ts` + `pnpm check:overflow` to detect horizontal overflow, removed the constrained browser shell, restored scrollable group chips, and captured `tmp/mobile-shots/20251109-124755-post-fixes-2` after re-running the verification suite.
* 2025-11-09 – Ran `pnpm lint`, `pnpm typecheck`, `pnpm build`, and captured `tmp/mobile-shots/20251109-111354-post-fixes` for comparison against the baseline set.
* 2025-11-09 – Reworked `app/globals.css` plus `app/layout.tsx`/`components/post/blog-browser.tsx` for fluid gutters, reordered browser panels on small screens, header/hero tweaks, and article padding reductions.
* 2025-11-09 – Wired up the Playwright-based screenshot runner (using the Chromium binary exported by the dev shell), captured baseline shots via `pnpm capture:screens -- --label baseline`, and noted the `tmp/mobile-shots/` workflow.
* 2025-11-09 – Initial ExecPlan describing the mobile screenshot workflow, baseline capture, and responsive CSS strategy per `.agent/PLANS.md`.
