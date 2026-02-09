import { cn } from "@/lib/utils";

interface ManualTableProps {
  headers: string[];
  rows: string[][];
  variant?: "dark" | "light";
}

export function ManualTable({ headers, rows, variant = "dark" }: ManualTableProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border",
        isDark ? "border-white/10" : "border-gray-200",
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? "bg-white/10" : "bg-gray-50"}>
            {headers.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-left font-semibold whitespace-nowrap",
                  isDark ? "text-white/90" : "text-gray-900",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={cn(
                "border-t transition-colors",
                isDark
                  ? "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                  : "border-gray-200 hover:bg-gray-50",
              )}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-4 py-2.5",
                    isDark ? "text-white/80" : "text-gray-700",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
