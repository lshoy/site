import Link from "next/link";
import { siteConfig } from "../../lib/site-config";
import { formatXHandle } from "../../lib/social";
import { ThemeToggle } from "../theme/theme-toggle";

export function SiteHeader() {
  const xLink = siteConfig.author.social.x;
  const xLabel = xLink ? formatXHandle(xLink) : null;

  return (
    <header className="site-header">
      <div>
        <Link href="/" className="site-logo">
          {siteConfig.title}
        </Link>
        <p className="site-tagline">{siteConfig.description}</p>
      </div>
      <div className="site-header-controls">
        <nav aria-label="Primary navigation">
          {siteConfig.navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header-actions">
          {xLink && xLabel ? (
            <a
              className="site-social-link"
              href={xLink}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${xLabel} on X`}
            >
              <span>{xLabel}</span>
            </a>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
