const script = `
(() => {
  try {
    const storageKey = "site-theme";
    const persisted = window.localStorage.getItem(storageKey);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = persisted === "light" || persisted === "dark"
      ? persisted
      : (media.matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
