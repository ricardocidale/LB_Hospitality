import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  variant?: "dark" | "light";
  className?: string;
}

export function SectionCard({
  id,
  title,
  subtitle,
  icon: Icon,
  expanded,
  onToggle,
  sectionRef,
  children,
  variant = "dark",
  className,
}: SectionCardProps) {
  const isDark = variant === "dark";

  return (
    <div ref={sectionRef} id={id} className="scroll-mt-24">
      <Card
        className={cn(
          isDark
            ? "bg-white/5 backdrop-blur-xl border-white/10 shadow-xl"
            : "border rounded-lg",
          className,
        )}
      >
        <button
          data-testid={`section-toggle-${id}`}
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between p-5 text-left transition-colors rounded-xl",
            isDark ? "hover:bg-white/5" : "hover:bg-muted/50",
          )}
        >
          <div className="flex items-center gap-3">
            {isDark ? (
              <Icon className="w-5 h-5 text-primary" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="text-left">
              <h2
                className={cn(
                  "font-semibold",
                  isDark ? "text-lg text-white" : "text-base",
                )}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronDown
              className={cn(
                "w-5 h-5",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            />
          ) : (
            <ChevronRight
              className={cn(
                "w-5 h-5",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            />
          )}
        </button>
        {expanded && (
          <CardContent className="pt-0 pb-6 px-5 space-y-4">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
