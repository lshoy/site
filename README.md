# Idea Loom — Markdown-first Next.js blog

Idea Loom is a clean, extensible Next.js App Router project that turns Markdown files into a statically exported blog (ready for Netlify). It ships with a dark/light theme toggle, a future-friendly component system, and zero custom build steps: the app reads Markdown directly at request/build time.

## Requirements

- Nix with flakes enabled (for the reproducible dev shell)
- Node 22.x and pnpm are provided by the flake, nothing global is required

## Quick start

```sh
nix develop        # drop into the dev shell
pnpm install       # install Node deps into the local node_modules
pnpm dev           # start Next.js on http://localhost:3000
```

## Commands

All commands should be executed via `nix develop -c ...` (or run inside the shell).

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the dev server with live reload |
| `pnpm lint` | ESLint (Next.js + TypeScript rules) |
| `pnpm typecheck` | Standalone `tsc --noEmit` |
| `pnpm build` | `next build` with `output: "export"`; writes static HTML to `out/` |
| `pnpm preview` | Serve the exported site from `out/` |

## Writing posts

1. Drop Markdown files into `content/posts`.
2. Each file uses front matter for metadata:

   ```yaml
   ---
   title: My New Post
   date: 2025-02-12
   summary: One-liner used on cards and metadata.
   tags:
     - concepts
     - experiments
   series: Deep Dives
   slug: optional-custom-slug
   ---
   ```

3. The site automatically:
   - Generates slugs (unless `slug` is provided) and heading IDs.
   - Calculates reading time and excerpts.
   - Suggests related posts based on overlapping tags/series.
   - Groups index listings by year and shows a live tag spectrum.

There is no content prebuild script—the Next.js server components read Markdown on demand, so editing files is enough.

## Theming & customization

- Global tokens (colors, spacing, typography) live in `app/globals.css`. CSS variables power the light/dark themes.
- The theme toggle persists user preference via `localStorage` and respects `prefers-color-scheme`.
- Update brand copy, hero text, nav, and social links in `lib/site-config.ts`.
- Shared components:
  - `components/layout/*` for headers/footers.
  - `components/theme/*` for theming logic.
  - `components/post/*` for cards, metadata, and related-post sections.

Extend these components (e.g., add idea trails, tag filters, custom layouts) without touching the content layer.

## Static export & Netlify

`next.config.ts` keeps `images.unoptimized` and `output: "export"` for Netlify-friendly static HTML. Run:

```sh
nix develop -c pnpm build
```

Next writes the final site to `out/`. Deploy that directory to Netlify (or run `pnpm preview` to verify locally).

## Project layout

- `app/` — Next.js routes (landing page, blog index, article view) built with server components.
- `components/` — Theme, layout, and post primitives.
- `content/posts/` — Markdown sources.
- `lib/content.ts` — Markdown parser (gray-matter + remark/rehype) with caching, reading time, tag utilities, and related-post scoring.
- `lib/site-config.ts` — Centralized site metadata for copy and navigation.

Happy publishing!
