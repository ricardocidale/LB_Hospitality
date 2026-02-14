import { ReactNode, useState } from "react";

// ═══════════════════════════════════════════════════════════
// DESIGN SYSTEM CONSTANTS
// ═══════════════════════════════════════════════════════════
export const COLORS = {
  darkForest: "#1B3A2D",
  warmCream: "#F5F0E8",
  richGreen: "#257D41",
  white: "#FFFFFF",
  black: "#000000",
  mutedGold: "#C4A265",
  footnoteLight: "rgba(255,255,255,0.5)",
  footnoteDark: "#666666",
  labelLight: "rgba(255,255,255,0.8)",
  labelDark: "#999999",
  attrLight: "rgba(255,255,255,0.7)",
} as const;

// ═══════════════════════════════════════════════════════════
// PHOTO HELPER — loads from /presentation/ with placeholder fallback
// ═══════════════════════════════════════════════════════════
export function SlideImage({
  src,
  alt,
  className = "",
  style,
  overlay,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  overlay?: number; // 0-100 dark green overlay %
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: `linear-gradient(135deg, ${COLORS.darkForest}22, ${COLORS.darkForest}44)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.darkForest,
          fontSize: "11px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          padding: "12px",
          opacity: 0.6,
        }}
      >
        {alt}
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style, position: "relative", overflow: "hidden" }}>
      <img
        src={`/presentation/${src}`}
        alt={alt}
        onError={() => setError(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(0.85) contrast(1.05)",
        }}
      />
      {overlay && overlay > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: COLORS.darkForest,
            opacity: overlay / 100,
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BASE SLIDE WRAPPER
// ═══════════════════════════════════════════════════════════
export function Slide({
  bg = "dark",
  children,
  number,
  footnotes,
  className = "",
}: {
  bg?: "dark" | "cream";
  children: ReactNode;
  number: number;
  footnotes?: string;
  className?: string;
}) {
  const isDark = bg === "dark";

  return (
    <div
      className={`slide-container ${className}`}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: isDark ? COLORS.darkForest : COLORS.warmCream,
        color: isDark ? COLORS.white : COLORS.black,
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          padding: "clamp(24px, 4vh, 48px) clamp(32px, 5vw, 72px)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {/* Footnotes */}
      {footnotes && (
        <div
          style={{
            padding: "0 clamp(32px, 5vw, 72px) 8px",
            fontSize: "clamp(6px, 0.7vw, 8px)",
            lineHeight: 1.4,
            color: isDark ? COLORS.footnoteLight : COLORS.footnoteDark,
            maxHeight: "40px",
            overflow: "hidden",
          }}
        >
          {footnotes}
        </div>
      )}

      {/* Slide number */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "16px",
          fontSize: "8px",
          color: COLORS.mutedGold,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {number}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TYPOGRAPHY COMPONENTS
// ═══════════════════════════════════════════════════════════
const serifFont = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sansFont = "'Arial', 'Helvetica Neue', sans-serif";

export function SlideTitle({
  children,
  size = "large",
  italic = false,
  color,
  style,
}: {
  children: ReactNode;
  size?: "small" | "medium" | "large" | "hero";
  italic?: boolean;
  color?: string;
  style?: React.CSSProperties;
}) {
  const sizes = {
    small: "clamp(18px, 2.2vw, 28px)",
    medium: "clamp(24px, 2.8vw, 36px)",
    large: "clamp(28px, 3.5vw, 42px)",
    hero: "clamp(36px, 4.5vw, 54px)",
  };

  return (
    <h1
      style={{
        fontFamily: serifFont,
        fontWeight: 700,
        fontSize: sizes[size],
        fontStyle: italic ? "italic" : "normal",
        lineHeight: 1.2,
        margin: 0,
        color,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function SlideSubtitle({
  children,
  color,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontFamily: sansFont,
        fontWeight: 400,
        fontSize: "clamp(12px, 1.3vw, 16px)",
        lineHeight: 1.5,
        margin: 0,
        color,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function BodyText({
  children,
  opacity = 1,
  size = "normal",
  bold = false,
  color,
  style,
}: {
  children: ReactNode;
  opacity?: number;
  size?: "small" | "normal" | "large";
  bold?: boolean;
  color?: string;
  style?: React.CSSProperties;
}) {
  const sizes = {
    small: "clamp(10px, 1vw, 13px)",
    normal: "clamp(11px, 1.15vw, 15px)",
    large: "clamp(13px, 1.4vw, 18px)",
  };

  return (
    <p
      style={{
        fontFamily: sansFont,
        fontWeight: bold ? 700 : 400,
        fontSize: sizes[size],
        lineHeight: 1.6,
        margin: 0,
        opacity,
        color,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CALLOUT
// ═══════════════════════════════════════════════════════════
export function StatCallout({
  value,
  label,
  valueSize = "large",
}: {
  value: string;
  label: string;
  valueSize?: "medium" | "large" | "xlarge";
}) {
  const sizes = {
    medium: "clamp(28px, 3.5vw, 50px)",
    large: "clamp(36px, 4.5vw, 60px)",
    xlarge: "clamp(44px, 5.5vw, 70px)",
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: serifFont,
          fontWeight: 700,
          fontSize: sizes[valueSize],
          lineHeight: 1.1,
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: sansFont,
          fontWeight: 400,
          fontSize: "clamp(10px, 1vw, 13px)",
          opacity: 0.8,
          lineHeight: 1.4,
          maxWidth: "200px",
          margin: "0 auto",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// QUOTE
// ═══════════════════════════════════════════════════════════
export function Quote({
  text,
  attribution,
  isDark = true,
}: {
  text: string;
  attribution?: string;
  isDark?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", maxWidth: "85%", margin: "0 auto" }}>
      <p
        style={{
          fontFamily: serifFont,
          fontStyle: "italic",
          fontSize: "clamp(14px, 1.5vw, 20px)",
          lineHeight: 1.6,
          margin: 0,
          color: isDark ? COLORS.white : COLORS.black,
        }}
      >
        "{text}"
      </p>
      {attribution && (
        <p
          style={{
            fontFamily: sansFont,
            fontSize: "clamp(9px, 0.9vw, 11px)",
            marginTop: "8px",
            color: isDark ? COLORS.attrLight : COLORS.footnoteDark,
          }}
        >
          {attribution}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CARD COMPONENTS
// ═══════════════════════════════════════════════════════════
export function Card({
  children,
  bg = "outlined",
  className = "",
  style,
}: {
  children: ReactNode;
  bg?: "outlined" | "dark" | "green" | "cream";
  className?: string;
  style?: React.CSSProperties;
}) {
  const bgStyles: Record<string, React.CSSProperties> = {
    outlined: {
      border: "1px solid rgba(0,0,0,0.15)",
      backgroundColor: COLORS.warmCream,
      color: COLORS.black,
    },
    dark: {
      backgroundColor: COLORS.darkForest,
      color: COLORS.white,
    },
    green: {
      backgroundColor: COLORS.richGreen,
      color: COLORS.white,
    },
    cream: {
      backgroundColor: COLORS.warmCream,
      color: COLORS.black,
    },
  };

  return (
    <div
      className={className}
      style={{
        borderRadius: "12px",
        padding: "clamp(16px, 2vw, 28px)",
        ...bgStyles[bg],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GRID LAYOUTS
// ═══════════════════════════════════════════════════════════
export function Grid({
  children,
  cols = 2,
  gap = "clamp(16px, 2vw, 32px)",
  style,
}: {
  children: ReactNode;
  cols?: number;
  gap?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SplitLayout({
  left,
  right,
  leftWidth = "55%",
}: {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "clamp(16px, 3vw, 48px)",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ width: leftWidth, display: "flex", flexDirection: "column" }}>{left}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{right}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SPACER
// ═══════════════════════════════════════════════════════════
export function Spacer({ size = "md" }: { size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const heights = { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px" };
  return <div style={{ height: heights[size], flexShrink: 0 }} />;
}
