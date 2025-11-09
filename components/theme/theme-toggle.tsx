"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      <span className="theme-toggle-label">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
