"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GroupNode, PostSummary } from "../../lib/content";
import { PostMeta } from "./post-meta";

type BlogBrowserProps = {
  groups: GroupNode[];
  posts: PostSummary[];
  defaultSelection?: string;
  autoFocusSearch?: boolean;
};

type FlatGroup = {
  slug: string;
  label: string;
  depth: number;
  count: number;
};

export function BlogBrowser({
  groups,
  posts,
  defaultSelection,
  autoFocusSearch = false,
}: BlogBrowserProps) {
  const [activeGroup, setActiveGroup] = useState(defaultSelection ?? "all");
  const [query, setQuery] = useState("");

  const { flattened, lookup } = useMemo(() => flattenGroups(groups), [groups]);
  const groupIndex = useMemo(() => buildGroupIndex(groups), [groups]);

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePosts = useMemo(() => {
    const matches: { post: PostSummary; score: number }[] = [];
    for (const post of posts) {
      const groupMatch =
        activeGroup === "all" ||
        groupIndex.get(activeGroup)?.has(post.slug) === true;
      if (!groupMatch) continue;
      if (!normalizedQuery) {
        matches.push({ post, score: 0 });
        continue;
      }
      const score = computeMatchScore(post, normalizedQuery);
      if (score > 0) {
        matches.push({ post, score });
      }
    }
    if (normalizedQuery) {
      matches.sort((a, b) => {
        if (b.score === a.score) {
          return compareByDateDesc(a.post, b.post);
        }
        return b.score - a.score;
      });
    }
    return matches.map((entry) => entry.post);
  }, [activeGroup, groupIndex, normalizedQuery, posts]);

  const activeLabel =
    activeGroup === "all"
      ? "All groups"
      : lookup.get(activeGroup)?.label ?? "All groups";

  return (
    <section className="browser-shell" aria-label="Writings browser">
      <div className="browser-grid">
        <div className="browser-panel">
          <header className="browser-panel-header">
            <p className="browser-panel-title">Groups</p>
            <p className="browser-panel-count">
              {posts.length} total entries
            </p>
          </header>
          <div className="group-list">
            <button
              type="button"
              className={groupButtonClass(activeGroup === "all")}
              aria-pressed={activeGroup === "all"}
              onClick={() => setActiveGroup("all")}
            >
              <span>All</span>
              <span className="group-count">{posts.length}</span>
            </button>
            {flattened.map((group) => (
              <button
                key={group.slug}
                type="button"
                className={groupButtonClass(activeGroup === group.slug)}
                aria-pressed={activeGroup === group.slug}
                onClick={() =>
                  setActiveGroup((current) =>
                    current === group.slug ? "all" : group.slug,
                  )
                }
                style={{ paddingLeft: `${group.depth * 0.75 + 0.4}rem` }}
              >
                <span>{group.label}</span>
                <span className="group-count">{group.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="browser-panel">
          <header className="browser-panel-header">
            <p className="browser-panel-title">{activeLabel}</p>
            <label className="inline-search">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, summary, groups, body"
                autoFocus={autoFocusSearch}
              />
            </label>
          </header>
          <ol className="entry-list">
            {visiblePosts.length ? (
              visiblePosts.map((post) => (
                <li key={post.slug} className="entry-list-item">
                  <p className="entry-title">
                    <Link href={`/writings/${post.slug}`}>{post.title}</Link>
                  </p>
                  <PostMeta {...post} />
                  {post.summary ? (
                    <p className="entry-summary">{post.summary}</p>
                  ) : (
                    <p className="entry-summary muted">{post.excerpt}</p>
                  )}
                </li>
              ))
            ) : (
              <li className="entry-list-empty">
                Nothing matched your filter. Try clearing the search or
                selecting a different group.
              </li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

function flattenGroups(groups: GroupNode[]) {
  const flattened: FlatGroup[] = [];
  const lookup = new Map<string, GroupNode>();

  function walk(nodes: GroupNode[]) {
    for (const node of nodes) {
      lookup.set(node.slug, node);
      flattened.push({
        slug: node.slug,
        label: node.label,
        depth: node.depth,
        count: node.posts.length,
      });
      if (node.children.length) {
        walk(node.children);
      }
    }
  }

  walk(groups);
  return { flattened, lookup };
}

function buildGroupIndex(groups: GroupNode[]) {
  const map = new Map<string, Set<string>>();
  function walk(node: GroupNode): Set<string> {
    const collected = new Set<string>();
    node.posts.forEach((post) => collected.add(post.slug));
    for (const child of node.children) {
      const childSet = walk(child);
      childSet.forEach((slug) => collected.add(slug));
    }
    map.set(node.slug, collected);
    return collected;
  }
  for (const group of groups) {
    walk(group);
  }
  return map;
}

function computeMatchScore(post: PostSummary, query: string) {
  const title = post.title.toLowerCase();
  const summary = (post.summary ?? "").toLowerCase();
  const tags = post.tags.join(" ").toLowerCase();
  const body = post.bodyText.toLowerCase();
  let score = 0;
  if (title.includes(query)) score += 6;
  if (summary.includes(query)) score += 4;
  if (tags.includes(query)) score += 3;
  if (body.includes(query)) score += 1;
  return score;
}

function compareByDateDesc(a: PostSummary, b: PostSummary) {
  const aTime = a.date ? new Date(a.date).getTime() : 0;
  const bTime = b.date ? new Date(b.date).getTime() : 0;
  if (aTime === bTime) return a.title.localeCompare(b.title);
  return bTime - aTime;
}

function groupButtonClass(active: boolean) {
  return active ? "group-button active" : "group-button";
}
