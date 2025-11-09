import Link from "next/link";
import { PostSummary } from "../../lib/content";
import { PostMeta } from "./post-meta";

type PostCardProps = {
  post: PostSummary;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-card-body">
        <div className="post-card-meta">
          <PostMeta {...post} showTags={false} />
        </div>
        <h3>
          <Link href={`/writings/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <div className="post-card-tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
      <div className="post-card-cta">
        <Link href={`/writings/${post.slug}`}>Read note →</Link>
      </div>
    </article>
  );
}
