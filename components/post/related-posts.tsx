import Link from "next/link";
import { getRelatedPosts } from "../../lib/content";
import { PostMeta } from "./post-meta";

type RelatedPostsProps = {
  slug: string;
  limit?: number;
};

export function RelatedPosts({ slug, limit = 3 }: RelatedPostsProps) {
  const related = getRelatedPosts(slug, limit);
  if (!related.length) return null;
  return (
    <section className="related-posts">
      <h2>Nearby notes</h2>
      <ul className="rule-list">
        {related.map((post) => (
          <li key={post.slug}>
            <Link href={`/writings/${post.slug}`}>{post.title}</Link>
            <PostMeta {...post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
