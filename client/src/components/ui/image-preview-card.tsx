/**
 * image-preview-card.tsx — Thumbnail preview card with edit/delete overlay.
 *
 * Displays an image with hover-reveal action buttons for editing or removing
 * the image. Used in property photo management and AI image picker flows.
 */
import { IconPencil, IconTrash } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePreviewCardProps {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  badge?: React.ReactNode;
  aspectRatio?: "square" | "landscape" | "portrait";
  className?: string;
  "data-testid"?: string;
}

const aspectMap = {
  square: "aspect-square",
  landscape: "aspect-[16/10]",
  portrait: "aspect-[3/4]",
};

export function ImagePreviewCard({
  src,
  alt,
  title,
  subtitle,
  onEdit,
  onDelete,
  badge,
  aspectRatio = "landscape",
  className,
  "data-testid": testId = "image-preview-card",
}: ImagePreviewCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border",
        "bg-card shadow-sm",
        aspectMap[aspectRatio],
        className
      )}
      data-testid={testId}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        data-testid={`${testId}-image`}
      />

      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 bg-card border border-border text-foreground hover:bg-muted hover:text-foreground"
              data-testid={`${testId}-edit`}
            >
              <IconPencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 bg-card border border-border text-foreground hover:bg-red-50 hover:text-red-600"
              data-testid={`${testId}-delete`}
            >
              <IconTrash className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {badge && (
        <div className="absolute top-2 left-2 z-10" data-testid={`${testId}-badge`}>
          {badge}
        </div>
      )}

      {(title || subtitle) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
          {title && (
            <p
              className="text-sm font-medium text-white truncate"
              data-testid={`${testId}-title`}
            >
              {title}
            </p>
          )}
          {subtitle && (
            <p
              className="text-xs text-white/70 truncate mt-0.5"
              data-testid={`${testId}-subtitle`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
