import type { ReactNode } from "react";

export interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  color?: "blue" | "green" | "red" | "purple" | "amber" | "slate" | "primary";
  variant?: "default" | "rounded" | "diamond";
}

export interface FlowGroup {
  title: string;
  nodes: FlowNode[];
  direction?: "row" | "col";
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-800 dark:text-blue-200" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-800 dark:text-emerald-200" },
  red: { bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-300 dark:border-red-700", text: "text-red-800 dark:text-red-200" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", text: "text-purple-800 dark:text-purple-200" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-800 dark:text-amber-200" },
  slate: { bg: "bg-slate-50 dark:bg-slate-800/40", border: "border-slate-300 dark:border-slate-600", text: "text-slate-700 dark:text-slate-200" },
  primary: { bg: "bg-primary/10", border: "border-primary/40", text: "text-primary" },
};

function NodeBox({ node }: { node: FlowNode }) {
  const c = NODE_COLORS[node.color ?? "slate"];
  const rounded = node.variant === "rounded" ? "rounded-full px-5" : node.variant === "diamond" ? "rotate-45 rounded-lg" : "rounded-lg";
  return (
    <div
      className={`inline-flex flex-col items-center justify-center border-2 px-4 py-2.5 text-center shadow-sm ${rounded} ${c.bg} ${c.border}`}
      data-testid={`flow-node-${node.id}`}
    >
      <span className={`text-xs font-semibold leading-tight ${node.variant === "diamond" ? "-rotate-45" : ""} ${c.text}`}>
        {node.label}
      </span>
      {node.sublabel && (
        <span className={`text-[10px] leading-tight mt-0.5 opacity-70 ${node.variant === "diamond" ? "-rotate-45" : ""} ${c.text}`}>
          {node.sublabel}
        </span>
      )}
    </div>
  );
}

function Arrow({ label, direction = "right" }: { label?: string; direction?: "right" | "down" }) {
  if (direction === "down") {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1">
        <div className="w-px h-4 bg-border" />
        {label && <span className="text-[9px] text-muted-foreground px-1 leading-tight">{label}</span>}
        <div className="text-muted-foreground text-xs leading-none">▼</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 px-1">
      <div className="h-px w-4 bg-border" />
      {label && <span className="text-[9px] text-muted-foreground leading-tight whitespace-nowrap">{label}</span>}
      <div className="text-muted-foreground text-xs leading-none">▶</div>
    </div>
  );
}

export function FlowRow({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>}
      <div className="flex items-center gap-1 flex-wrap">{children}</div>
    </div>
  );
}

export function FlowCol({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="space-y-0">
      {label && <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>}
      <div className="flex flex-col items-center gap-0">{children}</div>
    </div>
  );
}

export function FlowSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-muted/20 p-4 ${className ?? ""}`}>
      {title && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>}
      {children}
    </div>
  );
}

export function FlowGrid({ children, cols = 3 }: { children: ReactNode; cols?: number }) {
  const gridClass = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-4" : cols === 5 ? "grid-cols-5" : "grid-cols-3";
  return <div className={`grid ${gridClass} gap-3`}>{children}</div>;
}

export { NodeBox, Arrow };
