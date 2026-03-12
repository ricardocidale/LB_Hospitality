import { cn } from "@/lib/utils";

type Provenance = "verified" | "cited" | "estimated";

const config: Record<Provenance, { label: string; className: string; tooltip: string }> = {
  verified: {
    label: "Verified",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    tooltip: "Data from institutional source (FRED, STR, CoStar)",
  },
  cited: {
    label: "Cited",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    tooltip: "Sourced from web research with citations",
  },
  estimated: {
    label: "Estimated",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
    tooltip: "AI-generated estimate without external backing",
  },
};

export function ProvenanceBadge({
  provenance,
  className,
}: {
  provenance: Provenance;
  className?: string;
}) {
  const c = config[provenance];
  return (
    <span
      data-testid={`badge-provenance-${provenance}`}
      title={c.tooltip}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider cursor-default",
        c.className,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-emerald-500": provenance === "verified",
          "bg-blue-500": provenance === "cited",
          "bg-zinc-400": provenance === "estimated",
        })}
      />
      {c.label}
    </span>
  );
}
