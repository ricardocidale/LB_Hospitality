import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "pending" | "error" | "warning";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
  "data-testid"?: string;
}

const dotColors: Record<StatusType, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  pending: "bg-amber-500",
  error: "bg-red-500",
  warning: "bg-orange-500",
};

const pulseColors: Record<StatusType, string> = {
  active: "bg-green-400",
  inactive: "bg-gray-300",
  pending: "bg-amber-400",
  error: "bg-red-400",
  warning: "bg-orange-400",
};

const labelColors: Record<StatusType, string> = {
  active: "text-green-700",
  inactive: "text-gray-500",
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
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2.5 h-2.5";
  const pulseSize = size === "sm" ? "w-1.5 h-1.5" : "w-2.5 h-2.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      data-testid={testId}
    >
      <span className="relative flex">
        {pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              pulseColors[status],
              pulseSize
            )}
          />
        )}
        <span
          className={cn("rounded-full", dotColors[status], dotSize)}
          data-testid={`${testId}-dot`}
        />
      </span>
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
