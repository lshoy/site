import { chromium } from "@playwright/test";
import { pages, viewports } from "./mobile-shots.config";

async function main() {
  const baseUrl =
    process.argv.find((arg, index, arr) => {
      if (arg === "--baseUrl" && arr[index + 1]) {
        return true;
      }
      return false;
    }) && getArgValue("--baseUrl")
      ? getArgValue("--baseUrl")!
      : "http://localhost:3000";

  const executablePath = process.env.CHROMIUM_BIN;
  if (!executablePath) {
    throw new Error("CHROMIUM_BIN is not set. Run inside `nix develop`.");
  }

  const browser = await chromium.launch({ executablePath });

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const target of pages) {
        const url = new URL(target.path, baseUrl).toString();
        await page.goto(url, { waitUntil: "networkidle" });
        const waitSelector = target.waitFor ?? ".app-shell";
        await page.waitForSelector(waitSelector, { timeout: 15000 });

        const diagnostics = await page.evaluate<{
          overflow: number;
          offenders: { selector: string; overflow: number }[];
        }>(() => {
          const width = window.innerWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const overflow = Math.max(0, scrollWidth - width);
          if (overflow < 1) {
            return { overflow, offenders: [] };
          }
          const offenders: Array<{ selector: string; overflow: number }> = [];
          const nodes = Array.from(document.querySelectorAll("*"));
          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const extra = rect.right - width;
            if (extra > 1) {
              offenders.push({
                selector: describeNode(node),
                overflow: Math.round(extra * 100) / 100,
              });
            }
          }
          offenders.sort((a, b) => b.overflow - a.overflow);
          return {
            overflow: Math.round(overflow * 100) / 100,
            offenders: offenders.slice(0, 5),
          };

          function describeNode(el: Element) {
            let selector = el.tagName.toLowerCase();
            if (el.id) {
              selector += `#${el.id}`;
            }
            if (el.classList.length) {
              selector +=
                "." +
                Array.from(el.classList)
                  .slice(0, 3)
                  .join(".");
            }
            return selector;
          }
        });

        if (diagnostics.overflow >= 1) {
          console.log(
            `[overflow] viewport=${viewport.name} page=${target.name} overflow=${diagnostics.overflow}px`,
          );
          diagnostics.offenders.forEach((offender, index) => {
            console.log(
              `  ${index + 1}. ${offender.selector} (+${offender.overflow}px)`,
            );
          });
        } else {
          console.log(
            `[ok] viewport=${viewport.name} page=${target.name} width fits`,
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return undefined;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
