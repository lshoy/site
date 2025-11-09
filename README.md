# Larry Shoyfer Writings Website

(prev webdev; all done by codex)

This repository powers **larryshoyfer.com**, a static Next.js site that turns Markdown files into a searchable notebook. The landing page and `/writings` route revolve around a “blog browser” panel: a left rail lists nested groups derived from slash-delimited tags, while the right rail streams matching entries with inline search. Entry pages keep the same serif/monospace palette, surface metadata via tapes of labels, and link to nearby notes based on shared tags or series.

## Highlights

- **Markdown-first content system.** `lib/content.ts` reads every file in `content/posts`, parses front matter with `gray-matter`, converts Markdown to HTML using `remark`/`rehype`, extracts heading IDs, estimates reading time, and stores searchable body text.
- **Hierarchical browsing.** `components/post/blog-browser.tsx` builds a group tree from slash-delimited tags (`philosophy/concept`) so you can scan curated clusters, or drop to “All” and search titles, summaries, tags, cosmetic tags, and raw body copy.
- **Ledger and index views.** `/writings` surfaces counts (“Entries”, “Groups”, “Last update”), the browser, plus a toggleable chronological index (`components/post/chronological-index.tsx`) for paging through the archive.
- **Detail pages with context.** `/writings/[slug]` renders the article, metadata (`PostMeta` + `GroupLabel` chips for `tags`/`cosmeticTags`), and “Nearby notes” (`RelatedPosts`) scored by overlapping tags/series.
- **Themeable, static output.** `components/theme/*` handles the dark/light toggle (with a head-start script to avoid flashes) and `next.config.ts` keeps `output: "export"` + unoptimized images so `pnpm build` emits a Netlify-ready `out/` folder.

## Requirements

- Node.js 20+ and pnpm 9+.  
- Optional: `nix develop` from `flake.nix` provisions Node 22, pnpm, git, compilers, and pins caches inside this repo. Every command below can be run as `nix develop -c <command>` or inside that shell directly.

## Quick start

```sh
nix develop          # optional but recommended dev shell
pnpm install         # install dependencies into local node_modules
pnpm dev             # start Next.js on http://localhost:3000
```

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the dev server with hot reload |
| `pnpm lint` | ESLint (Next.js + TypeScript rules) |
| `pnpm typecheck` | `tsc --noEmit` to catch type issues |
| `pnpm build` | `next build` (static export) → `out/` |
| `pnpm preview` | Serve the exported site from `out/` |
| `pnpm clean` | Remove `.next` and `out` |
| `pnpm format` / `pnpm format:fix` | Check or write Prettier formatting |

## Authoring posts

1. Add a Markdown file under `content/posts`. File names become default slugs (e.g. `014a.md` → `/writings/014a`) unless overridden with `slug`.
2. Use front matter to describe the entry:

   ```yaml
   ---
   title: Diary Entry 017
   date: 2025-10-17
   summary: Stream-of-consciousness riffing on Concept Principle.
   tags:
     - philosophy/diary
     - disillusionment
     - cp
   cosmetic-tags:
     - Experimental just means "bullshit"
     - Experimental doesn't just mean "bullshit"
   series: Concept Principle
   heroImage: /me.jpeg         # optional, currently unused but stored
   slug: diary-entry-017       # optional custom URL segment
   ---
   ```

3. Keep writing in Markdown. The pipeline automatically:
   - Builds heading IDs for `<h1>`–`<h4>` and captures a table of contents (`Post.headings`) if you need one later.
   - Stores plain-text excerpts + estimated reading time (200 wpm) for cards and ledgers.
   - Normalizes `tags` to drive the group tree. Nesting with `/` builds hierarchies (e.g. `aesthetics/architecture/brutalism`). Untagged posts fall under an “Ungrouped” bucket.
   - Accepts `cosmetic-tags` (or `cosmeticTags`) for extra chips that only appear on entry pages when `showCosmeticTags` is true.
   - Scores related posts by shared tags (weight 2) plus series matches (weight 3) for the “Nearby notes” list.

There is no prebuild script—Markdown is read at request/build time via server components and memoized with `React.cache`.

## Browsing experience

- **Home (`app/page.tsx`).** Displays multilingual hero lines + portraits from `lib/site-config.ts`, then drops users straight into the blog browser. A “Most Recent” ledger lists the three newest posts with metadata.
- **Writings index (`app/writings/page.tsx`).** Adds the stats ledger, reuses the browser (with optional autofocus on the search input), and exposes a toggleable chronological index (page size defaults to 8 entries).
- **Entries (`app/writings/[slug]/page.tsx`).** Rendered entirely on the server: series label, title, metadata, optional summary, Markdown body, and the related-posts section.
- **Navigation & theme.** `components/layout/site-header.tsx` handles routing (`/` + `/writings`) and shows the persistent theme toggle from `components/theme/theme-toggle.tsx`. `ThemeScript` runs in `<head>` so the correct palette is applied before hydration, and choice is saved in `localStorage`.
- **Group labels.** `components/post/group-label.tsx` renders scrollable, color-coded chips for both structural tags and cosmetic variants, with drag + wheel support plus a mini indicator bar.

## Repository layout

- `app/` – Routes, layouts, and global styles. `app/globals.css` defines the serif/monospace palette, ledger styles, browser grid, and responsive rules.
- `components/layout/` – Header/footer shells wired to `siteConfig`.
- `components/post/` – Blog browser, ledger cards, metadata, chronological index, and related-posts helpers.
- `components/theme/` – Theme provider, toggle, and early hydration script.
- `content/posts/` – Markdown sources (any `.md` file is loaded).
- `lib/content.ts` – Content loader, `GroupNode` derivation, search utilities, and related-post scoring.
- `lib/site-config.ts` – Centralized site metadata (hero lines, portrait list, footer note, nav items, social links).
- `public/` – Portrait imagery referenced by the homepage hero.

## Configuration & customization

- Edit `lib/site-config.ts` to change the site title, description, hero copy, portrait metadata, navigation items, or footer prose. The same config feeds SEO metadata, header links, and hero content.
- Tweak typography, palette, spacing, and component classes in `app/globals.css`. The CSS uses custom properties (`--ink`, `--canvas`, etc.) so swapping colors or fonts updates the whole shell.
- Extend UI primitives in `components/post/*` if you want to add new ledger rows, filters, or detail page adornments without touching the content parser.
- Update redirects or export settings in `next.config.ts`. Right now `/blog` and `/blog/:slug` permanently redirect to `/writings` equivalents, and images stay unoptimized for static hosting.

## Deployment & verification

1. Run quality gates:

   ```sh
   pnpm lint
   pnpm typecheck
   pnpm build
   ```

2. `pnpm build` performs a static export and writes the site to `out/`. Serve it locally with `pnpm preview` or upload `out/` to Netlify/any static host.

Because everything is file-system driven, deploying new writing is as simple as committing Markdown under `content/posts` and rebuilding.
