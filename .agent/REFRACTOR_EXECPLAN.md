# Purpose

We need to turn the current proof-of-concept Next.js Markdown blog into a production-ready foundation that stays simple, exports clean static files for Netlify, and leaves obvious hooks for richer storytelling ideas (tag trails, curated paths, custom styling) later. The finished site must statically serve Markdown posts stored under `content/posts`, expose a polished blog index and individual article view, and include a built-in light/dark mode toggle so authors can see the final presentation immediately. Verification happens by running the dev server (`nix develop -c pnpm dev`) and visiting `/`, `/blog`, and `/blog/<slug>` plus executing `nix develop -c pnpm build` to ensure the static export succeeds.

# Current State

The repo is a minimal Next 14 app router project. Markdown is precompiled by `scripts/build-content.mjs` into `generated/posts.json` and HTML snippets. Pages read those generated files via `lib/posts.ts`. Styling is a single global CSS file with default typography and no theming. There is no component system, no design tokens, and no notion of related content or surface area for future custom layouts. The content build step adds extra complexity when Netlify already runs the Next build. We need to eliminate redundant tooling, centralize content parsing, and redesign the UI.

# Target Experience

1. Authors drop Markdown files (with front matter for `title`, `summary`, `date`, optional `tags`, and `series`) into `content/posts`.
2. Running `nix develop -c pnpm dev` immediately loads content without a separate prebuild step. Visiting `/blog` shows cards grouped by tags/series information and sorted by date, with metadata such as reading time.
3. Clicking a card loads `/blog/<slug>`, which renders rich HTML with a themed header, summary, metadata block, automatic table of contents anchor IDs, and a related-posts section based on shared tags/series.
4. The header exposes a theme toggle that persists the choice (light/dark) in `localStorage`, defaults to `prefers-color-scheme`, and updates CSS custom properties for colors/spacing/typography tokens. The body transitions smoothly.
5. Running `nix develop -c pnpm build` (which wraps `next build` with `output: "export"`) produces a fully static `out/` directory ready for Netlify’s static hosting.

# Architecture Overview

## Content system

* Remove `scripts/build-content.mjs` and the `generated/` directory entirely. Move Markdown parsing into `lib/content.ts`.
* `lib/content.ts` exports synchronous helpers (wrapped in `cache` from React) so that server components can call `getAllPosts()` and `getPost(slug)`. Each helper:
  * Reads files in `content/posts`.
  * Parses gray-matter front matter with a lightweight schema guard (manual validation to avoid extra deps).
  * Uses `remark` + `rehype` for Markdown ➝ HTML with GitHub-flavored markdown and automatic heading slug generation/anchor links.
  * Calculates derived metadata (reading time, tag list, prev/next relations).
* Expose types: `PostFrontmatter`, `Post`, `PostSummary`, `RelatedPost`.

## UI + theming

* Replace `app/globals.css` with a design-token-first stylesheet that defines CSS custom properties for colors, radii, spacing, and typography under `[data-theme="light"]` / `[data-theme="dark"]`.
* Implement `components/theme/theme-provider.tsx` using a client component that sets `data-theme` on `<html>` and syncs preferences with `localStorage` + `prefers-color-scheme`.
* Implement `components/theme/theme-toggle.tsx` (client) that uses provider context to switch modes via an accessible toggle button.
* Introduce shared UI components to keep layout extensible:
  * `components/layout/site-header.tsx` – shows site title, nav (Home, Blog), theme toggle.
  * `components/layout/site-footer.tsx` – includes feed info and Netlify-ready notice.
  * `components/post/post-card.tsx` – renders card view for index with tags, summary, CTA.
  * `components/post/post-meta.tsx` – displays date, reading time, series, tags.
  * `components/post/related-posts.tsx` – lists related entries by shared tags/series.

## Pages

* `app/layout.tsx` wires up metadata (using a new `lib/site-config.ts` file), injects the ThemeProvider, and wraps children with header/footer containers.
* `app/page.tsx` becomes a landing page describing the blog, showing featured/latest posts, and linking to `/blog`. Provide placeholder sections for custom ideas (e.g., “Idea Trails”).
* `app/blog/page.tsx` fetches all posts, groups them by year, and renders `PostCard`s, plus optional tag cloud / filters (basic multi-select stub for future features, currently static).
* `app/blog/[slug]/page.tsx` loads single post content, includes metadata, renders HTML via `dangerouslySetInnerHTML`, injects `RelatedPosts`.

## Config + docs

* Replace `lib/posts.ts` with the new `lib/content.ts` (update imports accordingly).
* Update `README.md` with workflow instructions (no more manual content build step, describe theme toggle, describe how to add tags/series).
* Remove obsolete folders (`generated/`, `scripts/build-content.mjs`) and clean `.gitignore`.

# Milestones

## Milestone 1 – Content layer refactor

1. Delete `scripts/build-content.mjs` plus `generated/` usage. Update `.gitignore`.
2. Implement `lib/content.ts` with helper functions:
   * `readRawPostFiles()`.
   * `parseFrontmatter(filePath)`.
   * `renderMarkdown(content)`.
   * `getAllPosts()` returning sorted array and derived metadata.
   * `getPostBySlug(slug)`.
   * `getAdjacentPosts(slug)` if needed for related suggestions.
3. Update `tsconfig` paths if necessary and remove references to old `lib/posts`.

## Milestone 2 – Theming + layout primitives

1. Create `components/theme` provider + toggle with `ThemeContext`.
2. Replace `app/globals.css` with CSS variables for tokens, layout containers, typography, code blocks, and smooth theme transitions.
3. Add `components/layout/site-header.tsx` and `site-footer.tsx`.
4. Update `app/layout.tsx` to wrap children with the new provider, header, and footer.

## Milestone 3 – Blog index + cards

1. Build `components/post/post-card.tsx`, `post-meta.tsx`, `tag-pill.tsx` (helper).
2. Rewrite `app/blog/page.tsx` to fetch posts via new content layer, render hero text, tag cloud summary, and map posts to cards, grouped by year or series.
3. Ensure metadata + sorting works and the page remains static (no client components).

## Milestone 4 – Article view + landing page

1. Rewrite `app/blog/[slug]/page.tsx` to use new helpers, include summary, metadata, and HTML body.
2. Add `components/post/related-posts.tsx` (server) that picks up to 3 related posts by tags/series.
3. Expand `app/page.tsx` to highlight featured/latest posts and describe customization placeholders (idea trails section).

## Milestone 5 – Documentation + verification

1. Update `README.md` and any config references (e.g., mention theme toggle, no `generated`).
2. Run `nix develop -c pnpm lint`, `nix develop -c pnpm typecheck`, `nix develop -c pnpm build`.
3. Run `nix develop -c pnpm dev` in one shell and hit `curl http://localhost:3000/blog` (or visit manually) to confirm rendering; stop the dev server afterward.

# Testing & Validation

* Linting: `nix develop -c pnpm lint`.
* Type checking: `nix develop -c pnpm typecheck`.
* Static export build: `nix develop -c pnpm build` should finish with `out/` populated; inspect `out/blog/index.html` for expected markup.
* Manual spot check: start dev server via `nix develop -c pnpm dev`, open `/` and `/blog/<slug>` to ensure articles render and theme toggle updates `<html data-theme=...>`.

# Progress

- [x] Milestone 1 – Content layer refactor
- [x] Milestone 2 – Theming + layout primitives
- [x] Milestone 3 – Blog index + cards
- [x] Milestone 4 – Article view + landing page
- [x] Milestone 5 – Documentation + verification

# Change Log

* 2025-11-08 – Initial ExecPlan authored to cover full-site refactor per `.agent/AGENTS.md` requirements.
* 2025-11-08 – Completed all milestones: removed generated pipeline, added `lib/content`, rebuilt UI/theming, rewrote pages, refreshed docs, and validated via lint/typecheck/build plus preview server curl checks.
