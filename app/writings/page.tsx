import type { Metadata } from "next";
import { BlogBrowser } from "../../components/post/blog-browser";
import { ChronologicalIndex } from "../../components/post/chronological-index";
import { formatDisplayDate } from "../../lib/date-format";
import { getGroupSummaries, GroupNode } from "../../lib/content";

export const metadata: Metadata = {
  title: "Writings",
  description: "Browse every entry by group or open the chronological index.",
};

export default function BlogIndex() {
  const { groups, flatPosts, updatedAt } = getGroupSummaries();
  const groupCount = countGroups(groups);
  const defaultSelection = groups[0]?.slug;

  return (
    <div className="catalog-page">
      <section className="ledger hero-ledger">
        <dl className="stats-grid">
          <div>
            <dt>Entries</dt>
            <dd>{flatPosts.length}</dd>
          </div>
          <div>
            <dt>Groups</dt>
            <dd>{groupCount}</dd>
          </div>
          <div>
            <dt>Last update</dt>
            <dd>{formatDisplayDate(updatedAt, "Undated")}</dd>
          </div>
        </dl>
      </section>

      <BlogBrowser
        groups={groups}
        posts={flatPosts}
        defaultSelection={defaultSelection}
        autoFocusSearch
      />

      <ChronologicalIndex posts={flatPosts} pageSize={8} />
    </div>
  );
}

function countGroups(nodes: GroupNode[]): number {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.children.length) {
      total += countGroups(node.children);
    }
  }
  return total;
}
