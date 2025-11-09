# Purpose

Transform the current blog into a minimalist, academically inspired reading room where the grouping system (formerly “tags”) feels curated, and a new blog browser becomes the primary way to explore writing. Readers should be able to scan high-level groups, drill into nested sub-groups, search quietly, and open any post without visual noise. Think restrained typography, gentle monochrome accents, and deliberate spacing.

# Current State

The site runs on Next.js App Router with Markdown posts stored under `content/posts` and parsed through `lib/content.ts`. Pages `/` and `/blog` lean on hero sections, tag pills prefixed with `#`, and card-heavy layouts with gradients, rounded buttons, and “shadcn-esque” widgets. Tags are rendered verbatim (e.g., `#philosophy`), and the blog index groups posts by year with a “tag cloud” of buttons. There is no hierarchy or search beyond manual scrolling, and the global styles favor colorful surfaces, soft shadows, and rounded pills that contradict the requested “minimalist hackery” tone.

# Target Experience

1. Visitors land on `/` and immediately encounter a “Blog Browser” slab occupying the hero area. It shows a two-column layout: a left column listing groups (derived from tags) in a collapsible tree, and a right column streaming the filtered posts. A muted inline search input lets readers filter by title, summary, or group slug without loud UI hints.
2. “Tags” are renamed visually to “groups”. Displays avoid `#`, pills, or color clouds. Instead, metadata uses small caps labels like `Group · philosophy` rendered in monospaced text with spacing reminiscent of a typeset bibliography.
3. `/blog` doubles down on browsing: it opens directly with the same browser component, plus a compact “Notebook ledger” at the top summarizing counts (posts, groups, last update). The rest of the page keeps a single-column list with metadata separators and faint rule lines.
4. Styling uses serif body text with monospaced accents, high contrast black/cream palette, thin rules, and zero drop shadows. Emphasis uses italic text, underlines, and border-left markers reminiscent of annotated manuscripts.

# Implementation Strategy

## Data and utilities

1. Extend `lib/content.ts` with a helper `getGroupTree()` that derives a hierarchical structure from tags. Each tag string is treated as a slash-delimited path (e.g., `philosophy/concept`). For each segment, build a node `{ id, label, slug, children, posts }`. Posts are attached at the leaf node corresponding to each tag; posts without tags fall under a synthetic `ungrouped` node.
2. Re-export supporting utilities from `lib/content.ts`:
   - `type GroupNode = { id: string; label: string; slug: string; depth: number; children: GroupNode[]; posts: PostSummary[]; }`.
   - `getGroupSummaries()` returning `{ groups: GroupNode[]; flatPosts: PostSummary[]; updatedAt: string }`. `updatedAt` is the max `date` across posts or “Undated” fallback.
3. Ensure the helper is serializable (no Maps, functions). Sorting rules: nodes alphabetical, posts by date desc.

## Blog browser component

1. Create `components/post/blog-browser.tsx` as a **client** component.
   - Props: `{ groups: GroupNode[]; posts: PostSummary[]; defaultSelection?: string }`.
   - Internal state tracks `query` (string) and `activeGroup` (slug or `all`). Query filters posts by case-insensitive match on `title`, `summary`, or joined tags. Active group filters posts to those appearing under the selected group’s subtree.
   - Render layout with CSS grid: narrow left column (group tree) and flexible right column (post stream).
2. Group tree UI:
   - Show root label “Groups” plus small stats.
   - Each node renders as a collapsible button with monospace label `depth`-indented using CSS `padding-left`.
   - Clicking toggles selection; highlight active node via underline and subtle background tint.
3. Search UI:
   - Minimal inline `<input aria-label="Search posts">` styled as a single underline field. Debounce not required; filter on change.
4. Post stream:
   - Render list of entries with `PostMeta` minus tag pills; instead, show `Group` line listing relevant tags formatted as `Group · philosophy › concept`.
   - Provide fallback text if no posts match filters.

## Page integration

1. **Home (`app/page.tsx`)**
   - Replace the hero block with a `section` containing a short aphorism (from `siteConfig`) and the `BlogBrowser` component seeded with latest groups.
   - Keep a secondary section “Recent marginalia” listing latest three posts using the new minimalist card style (just titles + metadata, no CTA button).
2. **Blog index (`app/blog/page.tsx`)**
   - Remove year grouping and tag cloud. Top of the page becomes a “research ledger” panel summarizing counts (`posts`, `groups`, `last updated`). Underneath, slot the `BlogBrowser` with `defaultSelection` pointing to the first group (if any).
   - Add textual guidance describing how to use the browser (two short sentences).

## Components and metadata

1. Update `components/post/post-card.tsx`, `post-meta.tsx`, and `tag-pill.tsx`:
   - Rename `TagPill` to `GroupLabel` (or provide new component) that renders `Group · label` without `#`.
   - `PostMeta` should display `date`, `readingTime`, optional `series`, and optionally a trailing `groups` line using the new `GroupLabel`.
   - `PostCard` should adopt the new textual style (strip CTA button, use definition-list feel).
2. Update `components/post/related-posts.tsx` to match the minimalist layout (list with rule boundaries, include group info).

## Styles

1. Rewrite `app/globals.css`:
   - Typography: set body font to `"Spectral"` or a system serif fallback, headings in the same family, and metadata in `var(--font-mono)` (e.g., `"IBM Plex Mono"`). Provide safe fallbacks; load via CSS stack only (no webfont download).
   - Palette: define CSS custom properties for `--canvas`, `--ink`, `--ink-muted`, `--rule`, `--accent`. Light theme uses #fdfbf7 background with near-black text; dark theme uses #050505 background with #f2f1ed text.
   - Layout: convert `.app-shell` to max-width 880px, generous vertical rhythm via `--baseline: 1.2rem`. Remove drop shadows and rounded pills; rely on 1px rules and subtle background fills.
   - Introduce utility classes used by new components (`.browser-grid`, `.group-tree`, `.ledger`, `.entry-list`, `.inline-search`, `.group-label`, `.rule-list`).
2. Adjust header/footer styles to match: e.g., simple horizontal rules, uppercase nav, no buttons.

## Minimalist search logic

1. Within `blog-browser.tsx`, compute `visiblePosts` using `useMemo`. Filtering logic:
   - `matchesQuery(post)` if query substring appears in `post.title`, `post.summary`, or `post.tags.join(" ")`.
   - `matchesGroup(post)` if `activeGroup === "all"` or `post.tags` includes `activeGroup` or one of its descendants; precompute `groupToDescendants` map server-side and pass in props to avoid recomputation.
2. Provide keyboard accessibility: arrow keys are optional, but ensure buttons are focusable and `aria-pressed` applied to active group. Search input should autofocus only on `/blog`.

# Verification

1. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build` to ensure static export still succeeds.
2. Manual checks:
   - `pnpm dev`, visit `/` and `/blog`, confirm the browser loads without hydration warnings, search filters posts instantly, and collapsing groups updates the list.
   - Toggle between light/dark themes to confirm the monochrome palette remains legible.
   - Inspect a post detail page to ensure metadata uses the new group styling and that no `#` characters remain in tag displays.

# Progress

- [x] Data helpers for groups (`getGroupTree`, serialization helpers)
- [x] Blog browser component with search + filtering
- [x] Page integrations for `/` and `/blog`
- [x] Component + typography restyle (metadata, related posts, cards)
- [x] Global CSS rework + verification commands

# Change Log

* 2025-02-14 – Initial ExecPlan drafted to cover the “group-first” browsing experience, minimalist styling, and accompanying infrastructure per `.agent/PLANS.md`.
* 2025-02-14 – Marked all milestones complete after implementing the browser, updated styling, and verification runs.
