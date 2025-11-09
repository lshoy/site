export function formatXHandle(url: string): string {
  if (!url) return "X.com";
  const match = url.match(/x\.com\/(@?[\w.\-_]+)/i);
  if (match && match[1]) {
    const handle = match[1].replace(/^@/, "");
    return `@${handle}`;
  }
  return "X.com";
}
