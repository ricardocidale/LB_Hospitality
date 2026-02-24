/**
 * LogoSvg.tsx — Animated SVG logo for the platform.
 *
 * Renders the brand mark as an inline SVG with optional Framer Motion
 * rotation animation. Used in the sidebar, loading screens, and login page.
 */
import { motion } from "framer-motion";

interface LogoSvgProps {
  size?: number;
  color?: string;
  className?: string;
  rotating?: boolean;
  rotationDuration?: number;
  onClick?: () => void;
}

export function LogoSvg({
  size = 64,
  color = "#9FBCA4",
  className = "",
  rotating = false,
  rotationDuration = 20,
  onClick,
}: LogoSvgProps) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Five petals arranged in a flower pattern */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 30 C120 30, 140 50, 140 70 C140 90, 120 100, 100 100 C80 100, 60 90, 60 70 C60 50, 80 30, 100 30Z"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* Center neural nodes */}
      <circle cx="100" cy="100" r="6" fill={color} />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.cos(rad) * 18;
        const cy = 100 + Math.sin(rad) * 18;
        return (
          <g key={`node-${i}`}>
            <line
              x1="100"
              y1="100"
              x2={cx}
              y2={cy}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="4" fill={color} />
          </g>
        );
      })}
      {[30, 150, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.cos(rad) * 26;
        const cy = 100 + Math.sin(rad) * 26;
        return (
          <g key={`outer-${i}`}>
            <line
              x1={100 + Math.cos(rad) * 18}
              y1={100 + Math.sin(rad) * 18}
              x2={cx}
              y2={cy}
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="3.5" fill={color} />
          </g>
        );
      })}
    </svg>
  );

  if (!rotating) {
    return (
      <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
        {svg}
      </div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
      animate={{ rotate: 360 }}
      transition={{
        duration: rotationDuration,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{ display: "inline-flex" }}
    >
      {svg}
    </motion.div>
  );
}
