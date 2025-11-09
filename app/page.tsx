import Image from "next/image";
import Link from "next/link";
import { BlogBrowser } from "../components/post/blog-browser";
import { PostMeta } from "../components/post/post-meta";
import { getGroupSummaries, getLatestPosts } from "../lib/content";
import { siteConfig } from "../lib/site-config";

export default function HomePage() {
  const latest = getLatestPosts(3);
  const { groups, flatPosts } = getGroupSummaries();
  const heroImages = siteConfig.hero.images ?? [];

  return (
    <>
      <section className="intro">
        <div className="hero-lines">
          {siteConfig.hero.lines.map((line, index) => (
            <p className="intro-kicker" key={`${line}-${index}`}>
              {line}
            </p>
          ))}
        </div>
        {heroImages.length ? (
          <div className="hero-portraits">
            {heroImages.map((image, index) => (
              <figure className="hero-portrait" key={`${image.src}-${index}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes={`${image.width}px`}
                  priority={index === 0}
                />
              </figure>
            ))}
          </div>
        ) : null}
      </section>

      <BlogBrowser groups={groups} posts={flatPosts} />

      <section className="ledger home-ledger">
        <header>
          <h2>Most Recent</h2>
          <Link href="/writings">Open the full ledger</Link>
        </header>
        {latest.length ? (
          <ul className="rule-list">
            {latest.map((post) => (
              <li key={post.slug}>
                <p className="ledger-title">
                  <Link href={`/writings/${post.slug}`}>{post.title}</Link>
                </p>
                <PostMeta {...post} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No entries yet. Drop Markdown files into <code>content/posts</code>.
          </p>
        )}
      </section>
    </>
  );
}
