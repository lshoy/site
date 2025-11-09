import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
} from "../../../lib/content";
import { PostMeta } from "../../../components/post/post-meta";
import { RelatedPosts } from "../../../components/post/related-posts";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return undefined;
  return {
    title: post.title,
    description: post.summary ?? post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return notFound();

  return (
    <article className="article">
      <header>
        <p className="site-tagline">{post.series ?? "Standalone note"}</p>
        <h1>{post.title}</h1>
        <PostMeta {...post} showCosmeticTags />
        {post.summary ? <p className="summary">{post.summary}</p> : null}
      </header>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <RelatedPosts slug={post.slug} />
    </article>
  );
}
