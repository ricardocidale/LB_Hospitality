import { cn } from "@/lib/utils";
import StatusIndicator from "@/components/ui/status-indicator";

type StatusType = "active" | "inactive" | "pending" | "error" | "warning";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
  "data-testid"?: string;
}

const statusToState: Record<StatusType, "active" | "down" | "fixing" | "idle"> = {
  active: "active",
  inactive: "idle",
  pending: "fixing",
  error: "down",
  warning: "fixing",
};

const labelColors: Record<StatusType, string> = {
  active: "text-green-700",
  inactive: "text-muted-foreground",
  pending: "text-amber-700",
  error: "text-red-700",
  warning: "text-orange-700",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  pulse = false,
  className,
  "data-testid": testId = "status-badge",
}: StatusBadgeProps) {
  const indicatorSize = size === "sm" ? "sm" : "md";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const mappedState = statusToState[status];
  const shouldAnimate = pulse || mappedState === "active" || mappedState === "down" || mappedState === "fixing";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      data-testid={testId}
    >
      <StatusIndicator
        state={shouldAnimate ? mappedState : "idle"}
        size={indicatorSize}
        className="gap-0"
      />
      {label && (
        <span
          className={cn("font-medium leading-none", textSize, labelColors[status])}
          data-testid={`${testId}-label`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
