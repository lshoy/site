const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatDisplayDate(value?: string, fallback = "Unknown") {
  if (!value) return fallback;
  try {
    return DISPLAY_DATE_FORMATTER.format(new Date(value));
  } catch {
    return fallback;
  }
}
