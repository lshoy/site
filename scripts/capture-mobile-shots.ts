import fs from "node:fs/promises";
import path from "node:path";
import { chromium, Page } from "@playwright/test";
import {
  pages,
  viewports,
  type ScrollInstruction,
} from "./mobile-shots.config";

type CliOptions = {
  label: string;
  baseUrl: string;
};

async function main() {
  const options = parseArgs();
  const timestamp = buildTimestamp();
  const runFolderName = `${timestamp}-${sanitize(options.label)}`;
  const outputDir = path.join(
    process.cwd(),
    "tmp",
    "mobile-shots",
    runFolderName,
  );
  await fs.mkdir(outputDir, { recursive: true });

  const executablePath = process.env.CHROMIUM_BIN;
  if (!executablePath) {
    throw new Error(
      "CHROMIUM_BIN is not set. Ensure the dev shell exports the Chromium path.",
    );
  }
  const browser = await chromium.launch({ executablePath });
  let captured = 0;

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const target of pages) {
        const url = new URL(target.path, options.baseUrl).toString();
        const pageSlug = sanitize(target.name);
        console.log(
          `Visiting ${url} @ ${viewport.name} (${viewport.width}x${viewport.height})`,
        );
        await page.goto(url, { waitUntil: "networkidle" });
        const waitSelector = target.waitFor ?? ".app-shell";
        await page.waitForSelector(waitSelector, { timeout: 15000 });

        for (const scroll of target.scrolls) {
          await applyScroll(page, scroll);
          await page.waitForTimeout(400);
          const fileName = `${pageSlug}__${viewport.name}__${sanitize(
            scroll.label,
          )}.png`;
          const filePath = path.join(outputDir, fileName);
          await page.screenshot({ path: filePath, fullPage: false });
          captured += 1;
          console.log(`  • Captured ${fileName}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(
    `Finished capturing ${captured} screenshot${
      captured === 1 ? "" : "s"
    } into ${outputDir}`,
  );
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    label: "baseline",
    baseUrl: "http://localhost:3000",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--label" && args[index + 1]) {
      options.label = args[index + 1];
      index += 1;
    } else if (arg === "--baseUrl" && args[index + 1]) {
      options.baseUrl = args[index + 1];
      index += 1;
    }
  }

  return options;
}

function buildTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function sanitize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function applyScroll(page: Page, scroll: ScrollInstruction) {
  if (scroll.mode === "top") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    return;
  }
  if (scroll.mode === "offset") {
    await page.evaluate(
      (value) => window.scrollTo({ top: value, behavior: "instant" }),
      scroll.y,
    );
    return;
  }
  if (scroll.mode === "selector") {
    const locator = page.locator(scroll.selector).first();
    await locator.waitFor({ timeout: 10000 });
    await locator.scrollIntoViewIfNeeded();
    return;
  }
  const never: never = scroll;
  throw new Error(`Unknown scroll mode: ${JSON.stringify(never)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
