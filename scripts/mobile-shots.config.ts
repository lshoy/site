export type ViewportPreset = {
  name: string;
  width: number;
  height: number;
};

export type ScrollInstruction =
  | { label: string; mode: "top" }
  | { label: string; mode: "offset"; y: number }
  | { label: string; mode: "selector"; selector: string };

export type PageTarget = {
  name: string;
  path: string;
  waitFor?: string;
  scrolls: ScrollInstruction[];
};

export const viewports: ViewportPreset[] = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "pixel-7", width: 412, height: 915 },
  { name: "ipad-portrait", width: 834, height: 1112 },
  { name: "desktop", width: 1280, height: 720 },
];

export const pages: PageTarget[] = [
  {
    name: "home",
    path: "/",
    waitFor: ".browser-shell",
    scrolls: [
      { label: "top", mode: "top" },
      { label: "browser", mode: "selector", selector: ".browser-shell" },
      { label: "ledger", mode: "selector", selector: ".home-ledger" },
    ],
  },
  {
    name: "writings",
    path: "/writings",
    waitFor: ".browser-shell",
    scrolls: [
      { label: "top", mode: "top" },
      { label: "browser", mode: "selector", selector: ".browser-shell" },
      { label: "chronological-index", mode: "selector", selector: ".chronological-index" },
    ],
  },
  {
    name: "entry-diary-entry-014a",
    path: "/writings/diary-entry-014a",
    waitFor: ".article",
    scrolls: [
      { label: "top", mode: "top" },
      { label: "body", mode: "selector", selector: ".article-content" },
      { label: "related", mode: "selector", selector: ".related-posts" },
    ],
  },
];
