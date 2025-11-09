"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PostSummary } from "../../lib/content";
import { PostMeta } from "./post-meta";

type ChronologicalIndexProps = {
  posts: PostSummary[];
  pageSize?: number;
};

export function ChronologicalIndex({
  posts,
  pageSize = 10,
}: ChronologicalIndexProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));

  const currentSlice = useMemo(() => {
    const offset = (page - 1) * pageSize;
    return posts.slice(offset, offset + pageSize);
  }, [page, pageSize, posts]);

  const pageEntries = useMemo(
    () => buildPageList(totalPages, page),
    [page, totalPages],
  );

  const handlePageChange = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  const toggleIndex = () => {
    setOpen((value) => !value);
    setPage(1);
  };

  return (
    <section className="chronological-index">
      <button
        type="button"
        className="chronological-index-toggle"
        onClick={toggleIndex}
      >
        {open ? "Hide full index" : "Show full index"}
      </button>
      {open ? (
        <div className="chronological-index-panel">
          <ol className="chronological-index-list">
            {currentSlice.length ? (
              currentSlice.map((post) => (
                <li key={post.slug}>
                  <p className="chronological-index-title">
                  <Link href={`/writings/${post.slug}`}>{post.title}</Link>
                  </p>
                  <PostMeta {...post} showTags={false} />
                </li>
              ))
            ) : (
              <li className="chronological-index-empty">
                No entries yet. Drop Markdown files into <code>content/posts</code>.
              </li>
            )}
          </ol>
          {totalPages > 1 ? (
            <nav
              className="chronological-index-pagination"
              aria-label="Chronological pagination"
            >
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <div className="chronological-index-pages">
                {pageEntries.map((entry, index) =>
                  entry === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      className={
                        entry === page
                          ? "chronological-index-page active"
                          : "chronological-index-page"
                      }
                      aria-current={entry === page ? "page" : undefined}
                      onClick={() => handlePageChange(entry)}
                    >
                      {entry}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function buildPageList(total: number, current: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, total, current - 1, current, current + 1, 2, total - 1]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}
