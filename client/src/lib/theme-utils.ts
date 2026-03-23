export function getComputedThemeColor(cssVar: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) return "hsl(0, 0%, 53%)";
  if (raw.startsWith("#") || raw.startsWith("rgb")) return raw;
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length >= 3) {
    return `hsl(${parts[0]}, ${parts[1]}%, ${parts[2]}%)`;
  }
  return raw;
}

export function getThemeColors() {
  return {
    primary: getComputedThemeColor("--primary"),
    secondary: getComputedThemeColor("--secondary"),
    background: getComputedThemeColor("--background"),
    foreground: getComputedThemeColor("--foreground"),
    muted: getComputedThemeColor("--muted"),
    mutedForeground: getComputedThemeColor("--muted-foreground"),
    border: getComputedThemeColor("--border"),
    card: getComputedThemeColor("--card"),
    destructive: getComputedThemeColor("--destructive"),
    warning: getComputedThemeColor("--warning"),
    success: getComputedThemeColor("--success"),
    chart1: getComputedThemeColor("--chart-1"),
    chart2: getComputedThemeColor("--chart-2"),
    chart3: getComputedThemeColor("--chart-3"),
    chart4: getComputedThemeColor("--chart-4"),
    chart5: getComputedThemeColor("--chart-5"),
    accentPop: getComputedThemeColor("--accent-pop"),
    accentPop2: getComputedThemeColor("--accent-pop-2"),
    line1: getComputedThemeColor("--line-1"),
    line2: getComputedThemeColor("--line-2"),
    line3: getComputedThemeColor("--line-3"),
    line4: getComputedThemeColor("--line-4"),
    line5: getComputedThemeColor("--line-5"),
  };
}
