import { siteConfig } from "../../lib/site-config";
import { formatXHandle } from "../../lib/social";

export function SiteFooter() {
  const xLink = siteConfig.author.social.x;
  const xLabel = xLink ? formatXHandle(xLink) : null;

  return (
    <footer className="site-footer">
      <p>{siteConfig.footer.note}</p>
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
    </footer>
  );
}
