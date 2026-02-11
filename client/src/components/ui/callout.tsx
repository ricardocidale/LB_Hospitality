import { AlertTriangle, ShieldAlert, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "warning" | "critical" | "info" | "success";
type Variant = "dark" | "light";

const severityConfig: Record<
  Severity,
  Record<Variant, { bg: string; border: string; text: string }> & { icon: React.ComponentType<{ className?: string }> }
> = {
  warning: {
    icon: AlertTriangle,
    light: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
    dark: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-200/90" },
  },
  critical: {
    icon: ShieldAlert,
    light: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
    dark: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-200/90" },
  },
  info: {
    icon: Info,
    light: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
    dark: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-200/90" },
  },
  success: {
    icon: CheckCircle,
    light: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
    dark: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-200/90" },
  },
};

interface CalloutProps {
  children: React.ReactNode;
  severity?: Severity;
  variant?: Variant;
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
}

export function Callout({
  children,
  severity = "warning",
  variant = "dark",
  icon,
  title,
}: CalloutProps) {
  const entry = severityConfig[severity];
  const colors = entry[variant] as { bg: string; border: string; text: string };
  const IconComponent = icon ?? entry.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        colors.bg,
        colors.border,
      )}
    >
      <IconComponent
        className={cn("w-5 h-5 flex-shrink-0 mt-0.5", colors.text)}
      />
      <div className={cn("text-sm font-medium", colors.text)}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </div>
  );
}
