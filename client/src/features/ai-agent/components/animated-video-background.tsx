/**
 * AnimatedVideoBackground — Full-viewport looping video background layer.
 *
 * Inspired by ElevenLabs' BackgroundWave pattern. Renders a fixed,
 * non-interactive video behind all content with configurable opacity,
 * grayscale, and blur. Respects prefers-reduced-motion.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedVideoBackgroundProps {
  /** URL to a looping video (MP4 recommended). */
  src: string;
  /** CSS opacity (0–1). Default 0.75. */
  opacity?: number;
  /** Apply grayscale filter. Default true. */
  grayscale?: boolean;
  /** Optional backdrop blur in px. Default 0 (none). */
  blur?: number;
  /** Anchor the video to bottom, top, or center. Default "bottom". */
  anchor?: "top" | "center" | "bottom";
  /** Extra class names on the outer wrapper. */
  className?: string;
}

export function AnimatedVideoBackground({
  src,
  opacity = 0.75,
  grayscale = true,
  blur = 0,
  anchor = "bottom",
  className,
}: AnimatedVideoBackgroundProps) {
  const anchorClass =
    anchor === "top" ? "top-0" : anchor === "center" ? "top-1/2 -translate-y-1/2" : "bottom-0";

  return (
    <motion.video
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      autoPlay
      muted
      loop
      playsInline
      className={cn(
        "fixed left-0 w-full z-[-1] pointer-events-none object-cover",
        "hidden md:block motion-reduce:hidden",
        grayscale && "grayscale",
        anchorClass,
        className
      )}
      style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined}
      src={src}
    />
  );
}
