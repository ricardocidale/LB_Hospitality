import type { ServerExportData } from "../report/server-export-data";

export function generateCsvFromExportData(data: ServerExportData): Buffer {
  const lines: string[] = [];

  for (const stmt of data.statements) {
    lines.push(`"${stmt.title}"`);
    lines.push(["", ...stmt.years.map(y => `"${y}"`)].join(","));

    for (const row of stmt.rows) {
      const indent = row.indent ? "  ".repeat(row.indent) : "";
      const label = `"${indent}${row.category}"`;
      const values = row.values.map(v => {
        if (typeof v === "number") return v.toFixed(0);
        return `"${String(v)}"`;
      });
      lines.push([label, ...values].join(","));
    }
    lines.push("");
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}
