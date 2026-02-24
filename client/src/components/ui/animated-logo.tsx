/**
 * animated-logo.tsx — Animated brand logo with configurable motion effects.
 *
 * Renders the platform's building icon with selectable animation modes:
 * none, pulse, glow, spin, or bounce. Used in the sidebar header and
 * splash/loading screens.
 */
import { useState, useId } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationMode = "none" | "pulse" | "glow" | "spin" | "bounce";

interface AnimatedLogoProps {
  src: string;
  alt: string;
  size?: number;
  animation?: AnimationMode;
  className?: string;
  rounded?: boolean;
  "data-testid"?: string;
}

export function AnimatedLogo({
  src,
  alt,
  size = 48,
  animation = "none",
  className,
  rounded = true,
  "data-testid": testId = "animated-logo",
}: AnimatedLogoProps) {
  const [failed, setFailed] = useState(false);
  const uid = useId().replace(/:/g, "");
  const clipId = `clip-${uid}`;
  const r = rounded ? size / 2 : size * 0.15;
  const bounce = Math.round(size * 0.08);
  const cx = size / 2;

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-primary/10 border border-primary/20 shadow-sm",
          rounded ? "rounded-full" : "rounded-lg",
          className
        )}
        style={{ width: size, height: size }}
        data-testid={testId}
      >
        <Building2 className="text-primary" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  const svgStyle = `
    @keyframes al-pulse{0%,100%{opacity:1}50%{opacity:.55}}
    @keyframes al-glow{0%,100%{filter:drop-shadow(0 0 2px rgba(159,188,164,.3))}50%{filter:drop-shadow(0 0 8px rgba(159,188,164,.7))}}
    @keyframes al-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes al-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-${bounce}px)}}
    .al-pulse-${uid}{animation:al-pulse 2s ease-in-out infinite}
    .al-glow-${uid}{animation:al-glow 2.5s ease-in-out infinite}
    .al-spin-${uid}{animation:al-spin 3s linear infinite;transform-origin:${cx}px ${cx}px}
    .al-bounce-${uid}{animation:al-bounce 1.8s ease-in-out infinite}
  `;

  const animClass: Record<AnimationMode, string> = {
    none: "",
    pulse: `al-pulse-${uid}`,
    glow: `al-glow-${uid}`,
    spin: `al-spin-${uid}`,
    bounce: `al-bounce-${uid}`,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={alt}
      data-testid={testId}
    >
      <style>{svgStyle}</style>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={size} height={size} rx={r} ry={r} />
        </clipPath>
      </defs>
      <rect
        x={0.5} y={0.5}
        width={size - 1} height={size - 1}
        rx={r} ry={r}
        fill="white"
        stroke="rgba(159,188,164,0.25)"
        strokeWidth={1}
      />
      <g clipPath={`url(#${clipId})`} className={animClass[animation]}>
        <image
          href={src}
          x={0} y={0}
          width={size} height={size}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setFailed(true)}
        />
      </g>
      <rect
        x={0.5} y={0.5}
        width={size - 1} height={size - 1}
        rx={r} ry={r}
        fill="none"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={0.5}
      />
    </svg>
  );
}
