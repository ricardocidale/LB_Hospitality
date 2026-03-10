import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroImageProps {
  src: string;
  alt: string;
  aspectRatio?: "16/10" | "16/9" | "4/3" | "1/1" | "auto";
  overlay?: "bottom" | "full" | "none";
  className?: string;
  imageClassName?: string;
  animate?: boolean;
  priority?: boolean;
  children?: React.ReactNode;
}

/**
 * Premium hero image component with blur-up loading, gradient overlays,
 * smooth entrance animations, and hover effects.
 */
export function HeroImage({
  src,
  alt,
  aspectRatio = "16/10",
  overlay = "bottom",
  className,
  imageClassName,
  animate = true,
  priority = false,
  children,
}: HeroImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const hasImage = src && !error;

  const overlayClass =
    overlay === "bottom"
      ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      : overlay === "full"
        ? "bg-gradient-to-t from-black/80 via-black/40 to-black/10"
        : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg group",
        aspectRatio !== "auto" && `aspect-[${aspectRatio}]`,
        className
      )}
      style={aspectRatio !== "auto" ? { aspectRatio: aspectRatio.replace("/", " / ") } : undefined}
    >
      {/* Skeleton shimmer placeholder */}
      {!loaded && hasImage && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/60 to-muted animate-pulse" />
      )}

      {/* Fallback gradient when no image */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Main image with blur-up + entrance animation */}
      {hasImage && (
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          initial={animate ? { opacity: 0, scale: 1.02 } : false}
          animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]",
            !loaded && "blur-sm",
            imageClassName
          )}
        />
      )}

      {/* Gradient overlay */}
      {overlay !== "none" && <div className={cn("absolute inset-0 pointer-events-none", overlayClass)} />}

      {/* Children (badges, buttons, etc.) rendered on top */}
      {children}
    </div>
  );
}
