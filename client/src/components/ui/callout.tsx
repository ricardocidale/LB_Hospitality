import { AlertTriangle, ShieldAlert, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "warning" | "critical" | "info" | "success";

const severityConfig: Record<
  Severity,
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-200/90",
    icon: AlertTriangle,
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    icon: ShieldAlert,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: CheckCircle,
  },
};

interface CalloutProps {
  children: React.ReactNode;
  severity?: Severity;
  icon?: React.ElementType;
  title?: string;
}

export function Callout({
  children,
  severity = "warning",
  icon,
  title,
}: CalloutProps) {
  const config = severityConfig[severity];
  const IconComponent = icon ?? config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        config.bg,
        config.border,
      )}
    >
      <IconComponent
        className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.text)}
      />
      <div className={cn("text-sm font-medium", config.text)}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
    </div>
  );
}
