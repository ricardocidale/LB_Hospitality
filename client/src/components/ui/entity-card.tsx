import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityCardContainerProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onAdd?: () => void;
  addLabel?: string;
  variant?: "default" | "featured";
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function EntityCardContainer({
  icon,
  title,
  description,
  onAdd,
  addLabel = "New Item",
  variant = "default",
  children,
  className,
  "data-testid": testId,
}: EntityCardContainerProps) {
  return (
    <Card
      className={cn(
        variant === "featured"
          ? "bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-xl border-primary/30 shadow-[0_8px_32px_rgba(159,188,164,0.15)]"
          : "bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]",
        className
      )}
      data-testid={testId}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              {icon} {title}
            </CardTitle>
            <CardDescription className="label-text">{description}</CardDescription>
          </div>
          {onAdd && (
            <Button variant="outline" onClick={onAdd} className="flex items-center gap-2" data-testid={`button-add-${testId || "entity"}`}>
              <Plus className="w-4 h-4" /> {addLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">{children}</CardContent>
    </Card>
  );
}

interface EntityCardItemProps {
  id: number | string;
  name: string;
  logoUrl?: string | null;
  logoAlt?: string;
  fallbackIcon: React.ReactNode;
  badge?: React.ReactNode;
  description?: string | null;
  metadata?: React.ReactNode[];
  members?: Array<{ id: number | string; label: string }>;
  onEdit?: () => void;
  onDelete?: () => void;
  accentColor?: "primary" | "blue";
  children?: React.ReactNode;
  "data-testid"?: string;
}

export function EntityCardItem({
  id,
  name,
  logoUrl,
  logoAlt,
  fallbackIcon,
  badge,
  description,
  metadata,
  members,
  onEdit,
  onDelete,
  accentColor = "primary",
  children,
  "data-testid": testId,
}: EntityCardItemProps) {
  const accent = accentColor === "blue" ? "blue-500" : "primary";
  const bgClass = accentColor === "blue" ? "bg-blue-500/5" : "bg-primary/5";
  const borderClass = accentColor === "blue" ? "border-blue-500/20" : "border-primary/20";
  const iconBgClass = accentColor === "blue" ? "bg-blue-500/10" : "bg-primary/10";
  const editHoverClass = accentColor === "blue" ? "text-blue-500 hover:text-foreground hover:bg-blue-500/10" : "text-primary hover:text-foreground hover:bg-primary/10";
  const metaBgClass = accentColor === "blue" ? "bg-blue-500/10" : "bg-primary/10";
  const memberBorderClass = accentColor === "blue" ? "border-blue-500/20" : "border-primary/20";

  return (
    <div className={cn(bgClass, "border", borderClass, "rounded-xl p-4")} data-testid={testId || `entity-card-${id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className={cn("w-10 h-10 rounded-lg bg-white border", borderClass, "flex items-center justify-center overflow-hidden")}>
              <img src={logoUrl} alt={logoAlt || name} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className={cn("w-10 h-10 rounded-lg", iconBgClass, "border", borderClass, "flex items-center justify-center")}>
              {fallbackIcon}
            </div>
          )}
          <div>
            <h3 className="font-display text-foreground font-medium">{name}</h3>
            {badge && <div className="flex items-center gap-2 mt-0.5">{badge}</div>}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className={editHoverClass} data-testid={`button-edit-${testId || id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-${testId || id}`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
      {metadata && metadata.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
          {metadata.map((item, i) => (
            <span key={i} className={cn(metaBgClass, "px-2 py-0.5 rounded")}>{item}</span>
          ))}
        </div>
      )}
      {members && members.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <span key={m.id} className={cn("inline-flex items-center gap-1 bg-white/80 border", memberBorderClass, "rounded-full px-3 py-1 text-sm")}>
              <span className="font-medium">{m.label}</span>
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

interface EntityEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function EntityEmptyState({ icon, title, subtitle }: EntityEmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <div className="mx-auto mb-2 opacity-40 flex justify-center">{icon}</div>
      <p>{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}
