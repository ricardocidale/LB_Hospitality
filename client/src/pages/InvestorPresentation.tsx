import { useState, useEffect, useCallback, useRef } from "react";
import { COLORS } from "./presentation/SlideLayout";

// Act I
import { Slide1, Slide2, Slide3, Slide4, Slide5, Slide6 } from "./presentation/ActOne";
// Act II
import { Slide7, Slide8, Slide9, Slide10, Slide11, Slide12 } from "./presentation/ActTwo";
// Act III
import { Slide13, Slide14, Slide15, Slide16, Slide17, Slide18, Slide19 } from "./presentation/ActThree";
// Act IV
import { Slide20, Slide21, Slide22, Slide23, Slide24, Slide25 } from "./presentation/ActFour";
// Appendix
import {
  Slide26, Slide27, Slide28, Slide29, Slide30, Slide31, Slide32, Slide33,
  Slide34, Slide35, Slide36, Slide37, Slide38, Slide39,
  Slide40, Slide41,
  Slide42, Slide43, Slide44, Slide45,
  Slide46, Slide47, Slide48, Slide49,
  Slide50, Slide51, Slide52, Slide53, Slide54, Slide55,
} from "./presentation/Appendix";

// ═══════════════════════════════════════════════════════════
// SLIDE REGISTRY
// ═══════════════════════════════════════════════════════════
interface SlideEntry {
  component: React.ComponentType;
  title: string;
  section: string;
}

const SLIDES: SlideEntry[] = [
  { component: Slide1, title: "Title", section: "Act I" },
  { component: Slide2, title: "The Broken Promise", section: "Act I" },
  { component: Slide3, title: "The Cultural Shift", section: "Act I" },
  { component: Slide4, title: "The Gay Culture Parallel", section: "Act I" },
  { component: Slide5, title: "The CNM Spectrum", section: "Act I" },
  { component: Slide6, title: "The Gap in the Market", section: "Act I" },
  { component: Slide7, title: "We Built the Container", section: "Act II" },
  { component: Slide8, title: "Inside a What If Retreat", section: "Act II" },
  { component: Slide9, title: "Format, Pricing & Locations", section: "Act II" },
  { component: Slide10, title: "Traction", section: "Act II" },
  { component: Slide11, title: "Testimonials", section: "Act II" },
  { component: Slide12, title: "The Lightbulb Moment", section: "Act II" },
  { component: Slide13, title: "Market Precedents", section: "Act III" },
  { component: Slide14, title: "The Vision", section: "Act III" },
  { component: Slide15, title: "Acquisition Criteria", section: "Act III" },
  { component: Slide16, title: "Belleayre Mountain", section: "Act III" },
  { component: Slide17, title: "Pipeline Markets", section: "Act III" },
  { component: Slide18, title: "Unit Economics", section: "Act III" },
  { component: Slide19, title: "5-Year Pro Forma", section: "Act III" },
  { component: Slide20, title: "The Founders", section: "Act IV" },
  { component: Slide21, title: "The Extended Team", section: "Act IV" },
  { component: Slide22, title: "Why Now, Why Us", section: "Act IV" },
  { component: Slide23, title: "The Ask", section: "Act IV" },
  { component: Slide24, title: "The Close", section: "Act IV" },
  { component: Slide25, title: "Thank You", section: "Act IV" },
  { component: Slide26, title: "Appendix Divider", section: "Appendix" },
  { component: Slide27, title: "A-1: Retreat Goals", section: "Appendix A" },
  { component: Slide28, title: "A-2: Format & Timing", section: "Appendix A" },
  { component: Slide29, title: "A-3: Intake & Group Design", section: "Appendix A" },
  { component: Slide30, title: "A-4: Focus Areas 1", section: "Appendix A" },
  { component: Slide31, title: "A-5: Focus Areas 2", section: "Appendix A" },
  { component: Slide32, title: "A-6: Pricing", section: "Appendix A" },
  { component: Slide33, title: "A-7: Safety & Inclusion", section: "Appendix A" },
  { component: Slide34, title: "A-8: Market Size", section: "Appendix B" },
  { component: Slide35, title: "A-9: Gay Parallel — Media", section: "Appendix B" },
  { component: Slide36, title: "A-10: Gay Parallel — Brands", section: "Appendix B" },
  { component: Slide37, title: "A-11: Gay Parallel — Market", section: "Appendix B" },
  { component: Slide38, title: "A-12: Gay Parallel — Legal", section: "Appendix B" },
  { component: Slide39, title: "A-13: CNM Spectrum Detail", section: "Appendix B" },
  { component: Slide40, title: "A-14: Lea Full Bio", section: "Appendix C" },
  { component: Slide41, title: "A-15: Dov Full Bio", section: "Appendix C" },
  { component: Slide42, title: "A-16: Transformation Plan", section: "Appendix D" },
  { component: Slide43, title: "A-17: Income Statement", section: "Appendix D" },
  { component: Slide44, title: "A-18: Cash Flows", section: "Appendix D" },
  { component: Slide45, title: "A-19: Balance Sheet", section: "Appendix D" },
  { component: Slide46, title: "A-20: Belleayre Gallery", section: "Appendix E" },
  { component: Slide47, title: "A-21: Candid Moments", section: "Appendix E" },
  { component: Slide48, title: "A-22: Instagram", section: "Appendix E" },
  { component: Slide49, title: "A-23: Lifestyle Photos", section: "Appendix E" },
  { component: Slide50, title: "A-24: The Disconnect", section: "Appendix F" },
  { component: Slide51, title: "A-25: Solutions Fall Short", section: "Appendix F" },
  { component: Slide52, title: "A-26: Origin Story", section: "Appendix F" },
  { component: Slide53, title: "A-27: Spectrum Detail", section: "Appendix F" },
  { component: Slide54, title: "A-28: Revenue Model", section: "Appendix F" },
  { component: Slide55, title: "A-29: Market Selection", section: "Appendix F" },
];

// ═══════════════════════════════════════════════════════════
// FLIPBOOK CSS (injected once)
// ═══════════════════════════════════════════════════════════
const FLIPBOOK_STYLES = `
  .flipbook-page {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
    transform-origin: left center;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  }

  .flipbook-page.flipping-forward {
    transform: perspective(2000px) rotateY(-180deg);
    box-shadow: -4px 0 16px rgba(0,0,0,0.3);
  }

  .flipbook-page.flipping-backward {
    transform: perspective(2000px) rotateY(0deg);
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  }

  .flipbook-page.flat {
    transform: perspective(2000px) rotateY(0deg);
  }

  .flipbook-page.behind {
    transform: perspective(2000px) rotateY(-180deg);
  }

  /* Page curl shadow */
  .flipbook-page::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 40px;
    height: 100%;
    background: linear-gradient(to left, rgba(0,0,0,0.08), transparent);
    pointer-events: none;
  }

  /* Subtle spine shadow */
  .flipbook-spine-shadow {
    position: absolute;
    left: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to right, rgba(0,0,0,0.15), transparent);
    z-index: 100;
    pointer-events: none;
  }

  /* Page edge texture */
  .flipbook-edge {
    position: absolute;
    left: -2px;
    top: 4px;
    bottom: 4px;
    width: 3px;
    background: repeating-linear-gradient(
      to bottom,
      ${COLORS.warmCream},
      ${COLORS.warmCream} 2px,
      #ddd 2px,
      #ddd 3px
    );
    border-radius: 1px 0 0 1px;
    z-index: 99;
    pointer-events: none;
  }

  /* Toolbar auto-hide */
  .flipbook-toolbar {
    opacity: 0;
    transition: opacity 0.3s;
  }
  .flipbook-container:hover .flipbook-toolbar,
  .flipbook-toolbar:focus-within {
    opacity: 1;
  }

  /* Page number badge */
  .page-badge {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 11px;
    color: ${COLORS.mutedGold};
    letter-spacing: 0.1em;
    opacity: 0.6;
    pointer-events: none;
  }
`;

// ═══════════════════════════════════════════════════════════
// NAVIGATION OVERLAY
// ═══════════════════════════════════════════════════════════
function SlideNav({
  currentSlide,
  totalSlides,
  onGoTo,
  onClose,
}: {
  currentSlide: number;
  totalSlides: number;
  onGoTo: (idx: number) => void;
  onClose: () => void;
}) {
  const sections = SLIDES.reduce<Record<string, number[]>>((acc, slide, idx) => {
    if (!acc[slide.section]) acc[slide.section] = [];
    acc[slide.section].push(idx);
    return acc;
  }, {});

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "24px" }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: "900px", width: "100%", maxHeight: "90vh", overflow: "auto", backgroundColor: COLORS.darkForest, borderRadius: "16px", padding: "32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", fontWeight: 700, color: COLORS.white, margin: 0 }}>
            Table of Contents
          </h2>
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
            Page {currentSlide + 1} of {totalSlides}
          </span>
        </div>

        {Object.entries(sections).map(([section, indices]) => (
          <div key={section} style={{ marginBottom: "20px" }}>
            <h3 style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", fontWeight: 700, color: COLORS.richGreen, letterSpacing: "0.1em", margin: "0 0 8px", textTransform: "uppercase" }}>
              {section}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {indices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => { onGoTo(idx); onClose(); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: idx === currentSlide ? COLORS.richGreen : "rgba(255,255,255,0.1)",
                    color: COLORS.white,
                    fontFamily: "Arial, sans-serif",
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { if (idx !== currentSlide) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={(e) => { if (idx !== currentSlide) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
                >
                  {idx + 1}. {SLIDES[idx].title}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <button onClick={onClose} style={{ padding: "8px 24px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "transparent", color: COLORS.white, fontFamily: "Arial, sans-serif", fontSize: "13px", cursor: "pointer" }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 50 }}>
      <div style={{ height: "100%", width: `${((current + 1) / total) * 100}%`, backgroundColor: COLORS.richGreen, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN FLIPBOOK PRESENTATION
// ═══════════════════════════════════════════════════════════
export default function InvestorPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward" | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= SLIDES.length || idx === currentSlide || flipDirection) return;

      const direction = idx > currentSlide ? "forward" : "backward";
      setPrevSlide(currentSlide);
      setFlipDirection(direction);

      // After animation
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        setCurrentSlide(idx);
        setPrevSlide(null);
        setFlipDirection(null);
      }, 600);
    },
    [currentSlide, flipDirection]
  );

  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);
  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showNav && e.key === "Escape") { setShowNav(false); return; }
      switch (e.key) {
        case "ArrowRight": case "ArrowDown": case " ": case "PageDown":
          e.preventDefault(); next(); break;
        case "ArrowLeft": case "ArrowUp": case "PageUp":
          e.preventDefault(); prev(); break;
        case "Home": e.preventDefault(); goTo(0); break;
        case "End": e.preventDefault(); goTo(SLIDES.length - 1); break;
        case "f": case "F":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleFullscreen(); } break;
        case "g": case "G":
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setShowNav(true); } break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showNav, next, prev, goTo, toggleFullscreen]);

  // Fullscreen tracking
  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // URL hash
  useEffect(() => { window.history.replaceState(null, "", `#${currentSlide + 1}`); }, [currentSlide]);
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const num = parseInt(hash, 10);
    if (num >= 1 && num <= SLIDES.length) setCurrentSlide(num - 1);
  }, []);

  // Touch/swipe support
  const touchStartRef = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchStartRef.current = null;
  }, [next, prev]);

  // Determine which slides to render for the flip
  const CurrentComponent = SLIDES[currentSlide].component;
  const targetIdx = flipDirection === "forward" ? currentSlide + 1 : flipDirection === "backward" ? currentSlide - 1 : null;
  const TargetComponent = targetIdx !== null && targetIdx >= 0 && targetIdx < SLIDES.length ? SLIDES[targetIdx].component : null;

  return (
    <div
      ref={containerRef}
      className="flipbook-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#111", position: "relative", cursor: "default" }}
    >
      <style>{FLIPBOOK_STYLES}</style>
      <ProgressBar current={flipDirection ? (targetIdx ?? currentSlide) : currentSlide} total={SLIDES.length} />

      {/* Book container centered 16:9 */}
      <div style={{
        position: "absolute", top: "3px", left: 0, right: 0, bottom: "48px",
        display: "flex", alignItems: "center", justifyContent: "center",
        perspective: "2000px",
      }}>
        <div style={{
          width: "100%", height: "100%",
          maxWidth: "calc((100vh - 51px) * 16 / 9)",
          maxHeight: "calc(100vw * 9 / 16)",
          position: "relative",
          transformStyle: "preserve-3d",
          borderRadius: "4px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.3)",
        }}>
          {/* Spine shadow */}
          <div className="flipbook-spine-shadow" />
          {/* Page edge texture */}
          <div className="flipbook-edge" />

          {/* === BACKWARD FLIP: target (lower page) is prev, current flips back === */}
          {flipDirection === "backward" && TargetComponent && (
            <>
              {/* Target page (revealed underneath) */}
              <div className="flipbook-page flat" style={{ zIndex: 1, borderRadius: "0 4px 4px 0" }}>
                <TargetComponent />
              </div>
              {/* Current page flipping backward (starts at -180, animates to 0 BUT we reverse: it was behind, now coming flat) */}
              {/* Actually: current page is on top, it flips UP to reveal target underneath */}
              <div
                className="flipbook-page"
                style={{
                  zIndex: 2,
                  borderRadius: "0 4px 4px 0",
                  transform: "perspective(2000px) rotateY(0deg)",
                  animation: "flipBackward 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards",
                }}
              >
                <CurrentComponent />
              </div>
            </>
          )}

          {/* === FORWARD FLIP: current page flips over to reveal target underneath === */}
          {flipDirection === "forward" && TargetComponent && (
            <>
              {/* Target page (revealed underneath) */}
              <div className="flipbook-page flat" style={{ zIndex: 1, borderRadius: "0 4px 4px 0" }}>
                <TargetComponent />
              </div>
              {/* Current page flipping forward */}
              <div
                className="flipbook-page"
                style={{
                  zIndex: 2,
                  borderRadius: "0 4px 4px 0",
                  transform: "perspective(2000px) rotateY(0deg)",
                  animation: "flipForward 0.6s cubic-bezier(0.645, 0.045, 0.355, 1) forwards",
                }}
              >
                <CurrentComponent />
              </div>
            </>
          )}

          {/* === STATIC (no flip in progress) === */}
          {!flipDirection && (
            <div className="flipbook-page flat" style={{ zIndex: 1, borderRadius: "0 4px 4px 0" }}>
              <CurrentComponent />
            </div>
          )}
        </div>
      </div>

      {/* Click zones */}
      <div style={{ position: "absolute", top: "3px", left: 0, width: "20%", bottom: "48px", cursor: currentSlide > 0 ? "w-resize" : "default", zIndex: 10 }} onClick={prev} />
      <div style={{ position: "absolute", top: "3px", right: 0, width: "20%", bottom: "48px", cursor: currentSlide < SLIDES.length - 1 ? "e-resize" : "default", zIndex: 10 }} onClick={next} />

      {/* Flipbook Toolbar */}
      <div
        className="flipbook-toolbar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: "48px",
          background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4))",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
          zIndex: 50, fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Prev */}
        <button
          onClick={prev}
          disabled={currentSlide === 0 || !!flipDirection}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            backgroundColor: currentSlide === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
            color: currentSlide === 0 ? "rgba(255,255,255,0.2)" : COLORS.white,
            fontSize: "16px", cursor: currentSlide === 0 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          &#9664;
        </button>

        {/* Page indicator */}
        <button
          onClick={() => setShowNav(true)}
          style={{
            padding: "4px 16px", borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.06)",
            color: COLORS.white, fontSize: "12px", cursor: "pointer",
            fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.05em",
            minWidth: "160px", textAlign: "center",
          }}
        >
          {currentSlide + 1} &middot; {SLIDES[currentSlide].title}
        </button>

        {/* Next */}
        <button
          onClick={next}
          disabled={currentSlide === SLIDES.length - 1 || !!flipDirection}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            backgroundColor: currentSlide === SLIDES.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
            color: currentSlide === SLIDES.length - 1 ? "rgba(255,255,255,0.2)" : COLORS.white,
            fontSize: "16px", cursor: currentSlide === SLIDES.length - 1 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          &#9654;
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            backgroundColor: "rgba(255,255,255,0.08)", color: COLORS.white,
            fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: "8px",
          }}
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
        >
          {isFullscreen ? "&#10005;" : "&#9723;"}
        </button>

        {/* TOC */}
        <button
          onClick={() => setShowNav(true)}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            backgroundColor: "rgba(255,255,255,0.08)", color: COLORS.white,
            fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="Table of Contents (G)"
        >
          &#9776;
        </button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes flipForward {
          0% { transform: perspective(2000px) rotateY(0deg); box-shadow: 2px 0 8px rgba(0,0,0,0.15); }
          50% { box-shadow: -8px 0 24px rgba(0,0,0,0.4); }
          100% { transform: perspective(2000px) rotateY(-180deg); box-shadow: 2px 0 4px rgba(0,0,0,0.1); }
        }
        @keyframes flipBackward {
          0% { transform: perspective(2000px) rotateY(0deg); box-shadow: 2px 0 8px rgba(0,0,0,0.15); }
          50% { box-shadow: -8px 0 24px rgba(0,0,0,0.4); }
          100% { transform: perspective(2000px) rotateY(180deg); box-shadow: 2px 0 4px rgba(0,0,0,0.1); }
        }
      `}</style>

      {/* Navigation overlay */}
      {showNav && (
        <SlideNav
          currentSlide={currentSlide}
          totalSlides={SLIDES.length}
          onGoTo={goTo}
          onClose={() => setShowNav(false)}
        />
      )}
    </div>
  );
}
