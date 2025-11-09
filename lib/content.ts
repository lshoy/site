import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const contentDir = path.join(process.cwd(), "content", "posts");

export type Heading = {
  id: string;
  title: string;
  level: number;
};

type PostFrontmatter = {
  title?: string;
  summary?: string;
  date?: string;
  tags?: string[] | string;
  cosmeticTags?: string[] | string;
  "cosmetic-tags"?: string[] | string;
  series?: string;
  slug?: string;
  heroImage?: string;
};

export type PostSummary = {
  slug: string;
  title: string;
  summary?: string;
  date?: string;
  tags: string[];
  cosmeticTags: string[];
  series?: string;
  readingTime: string;
  excerpt: string;
  heroImage?: string;
  bodyText: string;
};

export type Post = PostSummary & {
  html: string;
  headings: Heading[];
};

export type GroupNode = {
  id: string;
  label: string;
  slug: string;
  depth: number;
  children: GroupNode[];
  posts: PostSummary[];
};

export type GroupSummary = {
  groups: GroupNode[];
  flatPosts: PostSummary[];
  updatedAt?: string;
};

type MutableGroupNode = {
  id: string;
  label: string;
  slug: string;
  depth: number;
  posts: PostSummary[];
  children: MutableGroupNode[];
  childMap: Map<string, MutableGroupNode>;
};

type PostStore = {
  posts: Post[];
  summaries: PostSummary[];
  postMap: Map<string, Post>;
};

type ScoredPost = {
  post: Post;
  score: number;
};

const loadPostStore = cache((): PostStore => {
  if (!fs.existsSync(contentDir)) {
    return { posts: [], summaries: [], postMap: new Map() };
  }

  const files = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(contentDir, file));

  const posts = files
    .map((filePath) => buildPostFromFile(filePath))
    .filter((value): value is Post => Boolean(value));

  posts.sort(compareByDateDesc);

  const summaries = posts.map((post) => toSummary(post));
  const postMap = new Map(posts.map((post): [string, Post] => [post.slug, post]));

  return { posts, summaries, postMap };
});

export function getAllPosts(): PostSummary[] {
  return loadPostStore().summaries;
}

export function getPostBySlug(slug: string): Post | undefined {
  return loadPostStore().postMap.get(slug);
}

export function getLatestPosts(limit = 3): PostSummary[] {
  return getAllPosts().slice(0, limit);
}

export function getRelatedPosts(
  slug: string,
  limit = 3,
): PostSummary[] {
  const store = loadPostStore();
  const current = store.postMap.get(slug);
  if (!current) return [];
  const scored: ScoredPost[] = store.posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: relatedScore(current, post),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.score === b.score) {
        const aTime = a.post.date ? new Date(a.post.date).getTime() : 0;
        const bTime = b.post.date ? new Date(b.post.date).getTime() : 0;
        return bTime - aTime;
      }
      return b.score - a.score;
    });
  return scored.slice(0, limit).map((entry) => toSummary(entry.post));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const summary of getAllPosts()) {
    summary.tags.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export function getGroupSummaries(): GroupSummary {
  const flatPosts = getAllPosts();
  const groups = buildGroupTree(flatPosts);
  const updatedAt = deriveLatestDate(flatPosts);
  return { groups, flatPosts, updatedAt };
}

function buildPostFromFile(filePath: string): Post | undefined {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = normalizeFrontmatter(data);
  const stem = path.basename(filePath, path.extname(filePath));
  const title = frontmatter.title || titleFromFilename(stem);
  if (!title) {
    console.warn(`Skipping ${filePath} because it has no title`);
    return undefined;
  }
  const slug =
    frontmatter.slug && frontmatter.slug.trim().length > 0
      ? slugify(frontmatter.slug)
      : slugify(stem);

  const headings: Heading[] = [];
  const html = renderMarkdown(content, headings);
  const readingTime = estimateReadingTime(content);
  const summary = frontmatter.summary;
  const bodyText = stripFormatting(content);

  return {
    slug,
    title,
    summary,
    date: frontmatter.date,
    tags: frontmatter.tags,
    cosmeticTags: frontmatter.cosmeticTags,
    series: frontmatter.series,
    readingTime,
    excerpt: buildExcerpt(summary, content),
    heroImage: frontmatter.heroImage,
    bodyText,
    html,
    headings,
  };
}

type NormalizedFrontmatter = {
  title: string;
  summary?: string;
  date?: string;
  tags: string[];
  cosmeticTags: string[];
  series?: string;
  slug?: string;
  heroImage?: string;
};

function normalizeFrontmatter(data: PostFrontmatter): NormalizedFrontmatter {
  const title = data.title ? String(data.title).trim() : "";
  const summary = data.summary ? String(data.summary).trim() : undefined;
  const date = data.date ? sanitizeDate(String(data.date)) : undefined;

  const tags = normalizeTagField(data.tags);
  const cosmeticTags = normalizeTagField(
    data.cosmeticTags ?? data["cosmetic-tags"],
  );

  const series = data.series ? String(data.series).trim() : undefined;
  const heroImage = data.heroImage ? String(data.heroImage).trim() : undefined;

  const slug = data.slug ? slugify(String(data.slug)) : undefined;
  return {
    title,
    summary,
    date,
    tags,
    cosmeticTags,
    series,
    slug,
    heroImage,
  };
}

function sanitizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return new Date(timestamp).toISOString();
}

function renderMarkdown(markdown: string, headings: Heading[]): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => (tree: unknown) => annotateHeadings(tree, headings))
    .use(rehypeStringify, { allowParseErrors: true });
  return String(processor.processSync(markdown));
}

function annotateHeadings(tree: unknown, headings: Heading[]) {
  if (!tree || typeof tree !== "object") return;
  const slugCounts = new Map<string, number>();
  walk(tree, (node) => {
    if (
      node.type === "element" &&
      typeof node.tagName === "string" &&
      /^h[1-4]$/.test(node.tagName)
    ) {
      const title = extractText(node).trim();
      if (!title) return;
      const baseSlug = slugify(title) || `section-${headings.length + 1}`;
      const count = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, count + 1);
      const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
      node.properties = { ...(node.properties ?? {}), id };
      headings.push({
        id,
        title,
        level: Number(node.tagName.replace("h", "")),
      });
    }
  });
}

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
  properties?: Record<string, unknown>;
};

function walk(node: unknown, visitor: (node: HastNode) => void) {
  if (!node || typeof node !== "object") return;
  const hast = node as HastNode;
  visitor(hast);
  if (Array.isArray(hast.children)) {
    for (const child of hast.children) {
      walk(child, visitor);
    }
  }
}

function extractText(node: HastNode): string {
  if (node.value && typeof node.value === "string") {
    return node.value;
  }
  if (!node.children) return "";
  return node.children.map((child) => extractText(child)).join("");
}

function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function buildExcerpt(summary: string | undefined, content: string): string {
  if (summary && summary.length > 0) return summary;
  const clean = stripFormatting(content);
  return truncate(clean, 180);
}

function stripFormatting(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function relatedScore(a: PostSummary, b: PostSummary): number {
  let score = 0;
  const sharedTags = a.tags.filter((tag) => b.tags.includes(tag)).length;
  score += sharedTags * 2;
  if (a.series && b.series && a.series === b.series) {
    score += 3;
  }
  return score;
}

function toSummary(post: Post): PostSummary {
  const { html: _html, headings: _headings, ...summary } = post;
  return summary;
}

function normalizeTagField(input: string[] | string | undefined): string[] {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const label = String(entry).trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(label);
  }
  return tags;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function titleFromFilename(input: string): string {
  return input
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildGroupTree(posts: PostSummary[]): GroupNode[] {
  const roots: MutableGroupNode[] = [];
  const rootMap = new Map<string, MutableGroupNode>();
  const ungrouped: PostSummary[] = [];

  for (const post of posts) {
    if (!post.tags.length) {
      ungrouped.push(post);
      continue;
    }
    for (const rawTag of post.tags) {
      insertTagPath(rawTag, post, roots, rootMap);
    }
  }

  if (ungrouped.length) {
    const node: MutableGroupNode = {
      id: "group-ungrouped",
      label: "Ungrouped",
      slug: "ungrouped",
      depth: 0,
      posts: [...ungrouped],
      children: [],
      childMap: new Map(),
    };
    roots.push(node);
  }

  return finalizeGroupNodes(roots);

  function insertTagPath(
    tag: string,
    post: PostSummary,
    rootList: MutableGroupNode[],
    rootChildren: Map<string, MutableGroupNode>,
  ) {
    const segments = splitTagPath(tag);
    if (!segments.length) {
      ungrouped.push(post);
      return;
    }
    let currentList = rootList;
    let currentMap = rootChildren;
    let parent: MutableGroupNode | undefined;

    segments.forEach((segment, depth) => {
      const key = segment.key;
      let node = currentMap.get(key);
      if (!node) {
        const slug = parent ? `${parent.slug}/${segment.slug}` : segment.slug;
        node = {
          id: slug,
          label: formatGroupLabel(segment.label),
          slug,
          depth,
          posts: [],
          children: [],
          childMap: new Map(),
        };
        currentMap.set(key, node);
        if (parent) {
          parent.children.push(node);
        } else {
          currentList.push(node);
        }
      }
      node.posts.push(post);
      parent = node;
      currentList = node.children;
      currentMap = node.childMap;
    });
  }
}

function splitTagPath(tag: string): { label: string; slug: string; key: string }[] {
  return tag
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const key = slugify(segment) || segment.toLowerCase().replace(/\s+/g, "-");
      return {
        label: segment,
        slug: key,
        key,
      };
    });
}

function finalizeGroupNodes(nodes: MutableGroupNode[]): GroupNode[] {
  const sorted = [...nodes].sort((a, b) => a.label.localeCompare(b.label));
  return sorted.map((node) => ({
    id: node.id,
    label: node.label,
    slug: node.slug,
    depth: node.depth,
    posts: dedupeAndSort(node.posts),
    children: finalizeGroupNodes(node.children),
  }));
}

function dedupeAndSort(posts: PostSummary[]): PostSummary[] {
  const seen = new Set<string>();
  const unique: PostSummary[] = [];
  for (const post of posts) {
    if (seen.has(post.slug)) continue;
    seen.add(post.slug);
    unique.push(post);
  }
  return unique.sort(compareByDateDesc);
}

function formatGroupLabel(value: string): string {
  const clean = value.trim();
  return clean.length ? clean : "Untitled";
}

function deriveLatestDate(posts: PostSummary[]): string | undefined {
  let latest = 0;
  for (const post of posts) {
    if (!post.date) continue;
    const timestamp = Date.parse(post.date);
    if (!Number.isNaN(timestamp)) {
      latest = Math.max(latest, timestamp);
    }
  }
  return latest ? new Date(latest).toISOString() : undefined;
}

function compareByDateDesc<T extends { date?: string; title: string }>(
  a: T,
  b: T,
): number {
  const aTime = a.date ? new Date(a.date).getTime() : 0;
  const bTime = b.date ? new Date(b.date).getTime() : 0;
  if (aTime === bTime) return a.title.localeCompare(b.title);
  return bTime - aTime;
}
