/**
 * GuidedWalkthrough.tsx — First-time user onboarding walkthrough.
 *
 * On first visit (or after reset), shows a welcome dialog asking if the user
 * wants a guided tour. Includes a "Do not offer this again" checkbox.
 * If the user accepts, a multi-step spotlight overlay walks them through
 * the platform. Completion/dismissal state is persisted via Zustand + localStorage.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { X, ChevronRight, ChevronLeft, HelpCircle, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface WalkthroughState {
  completed: boolean;
  dismissed: boolean;
  setCompleted: (v: boolean) => void;
  setDismissed: (v: boolean) => void;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set) => ({
      completed: false,
      dismissed: false,
      setCompleted: (v: boolean) => set({ completed: v }),
      setDismissed: (v: boolean) => set({ dismissed: v }),
    }),
    { name: "walkthrough-store" }
  )
);

function getTourSteps(firstName?: string | null) {
  const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome to Your Dashboard";
  return [
    { target: '[href="/"]', title: greeting, description: "This is your home base. It shows a high-level overview of your entire portfolio — key metrics, charts, and recent activity at a glance." },
    { target: '[href="/portfolio"]', title: "Step 1: Define Your Properties", description: "Start here. Add each property you want to model, then fill in the assumptions for each one — purchase price, room count, ADR, occupancy, expenses, and financing terms. This is the foundation of your entire simulation." },
    { target: '[href="/company"]', title: "Step 2: Management Company", description: "Next, define the management company assumptions — staffing tiers, partner compensation, base and incentive fee structures, and funding instruments. The management company earns fees from the properties you just set up." },
    { target: '[href="/settings"]', title: "Step 3: Systemwide Assumptions", description: "Review and adjust the global settings that apply across all properties — tax rates, inflation, depreciation schedules, and other defaults. These ensure consistency across your entire portfolio." },
    { target: '[href="/scenarios"]', title: "Save & Compare Scenarios", description: "Save your current assumptions as a named scenario so you can come back to it later. Create multiple scenarios to compare different strategies — like varying occupancy ramps or financing structures." },
    { target: '[href="/analysis"]', title: "Analysis Tools", description: "Explore what's available in the Analysis section — sensitivity tables, financing comparisons, executive summaries, side-by-side property comparisons, and portfolio timelines. This is where you stress-test your assumptions and see the big picture." },
    { target: '[href="/help"]', title: "User Manual & Help", description: "Consult the User Manual for a complete guide to every feature — from how revenue is calculated to how the balance sheet works. There's also a Checker Manual for verifying the financial models." },
    { target: '[data-testid="button-search"]', title: "Quick Navigation", description: "Press Ctrl+K anytime to search and jump to any page, property, or feature instantly. You can also find your favorite properties and recent activity in the sidebar." },
    { target: '[data-testid="button-notifications"]', title: "Stay Informed", description: "Check here for important alerts — like negative cash balance warnings or verification results. That's the tour! You can always restart it from the Help menu." },
  ];
}

function TourPromptDialog({ onAccept, onDecline }: { onAccept: () => void; onDecline: (neverAgain: boolean) => void }) {
  const [dontOffer, setDontOffer] = useState(false);
  const { user } = useAuth();
  const firstName = user?.firstName;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" data-testid="tour-prompt-dialog">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onDecline(dontOffer)} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <MapPin className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-display font-semibold text-gray-900">
              {firstName ? `Welcome, ${firstName}!` : "Welcome!"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Would you like a quick guided tour of the platform? It only takes a minute and covers navigation, key features, and where to find everything.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => onDecline(dontOffer)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              data-testid="button-tour-decline"
            >
              No Thanks
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md shadow-green-600/20"
              data-testid="button-tour-accept"
            >
              Take the Tour
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group" data-testid="label-dont-offer-again">
            <input
              type="checkbox"
              checked={dontOffer}
              onChange={(e) => setDontOffer(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
              data-testid="checkbox-dont-offer-again"
            />
            <span className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors select-none">
              Do not offer this again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function GuidedWalkthrough() {
  const { completed, dismissed, setCompleted, setDismissed } = useWalkthroughStore();
  const { user } = useAuth();
  const tourSteps = getTourSteps(user?.firstName);
  const [showPrompt, setShowPrompt] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!completed && !dismissed && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [completed, dismissed]);

  const handleAcceptTour = useCallback(() => {
    setShowPrompt(false);
    setActive(true);
    setStep(0);
  }, []);

  const handleDeclineTour = useCallback((neverAgain: boolean) => {
    setShowPrompt(false);
    setCompleted(true);
    if (neverAgain) {
      setDismissed(true);
    }
  }, [setCompleted, setDismissed]);

  const updateRect = useCallback(() => {
    if (!active) return;
    const current = tourSteps[step];
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      if (step < tourSteps.length - 1) {
        setStep(step + 1);
      } else {
        setCompleted(true);
        setActive(false);
      }
    }
  }, [active, step, setCompleted]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const handleNext = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      setCompleted(true);
      setActive(false);
    }
  }, [step, setCompleted]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    setCompleted(true);
    setActive(false);
  }, [setCompleted]);

  if (showPrompt) {
    return <TourPromptDialog onAccept={handleAcceptTour} onDecline={handleDeclineTour} />;
  }

  if (!active || !targetRect) return null;

  const padding = 6;
  const spotlightStyle: React.CSSProperties = {
    position: "fixed",
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: 12,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
    pointerEvents: "none",
    zIndex: 9998,
    transition: "all 0.3s ease",
  };

  const tooltipTop = targetRect.bottom + padding + 12;
  const tooltipLeft = Math.max(12, Math.min(targetRect.left, window.innerWidth - 292));
  const fitsBelow = tooltipTop + 200 < window.innerHeight;

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    top: fitsBelow ? tooltipTop : targetRect.top - padding - 12,
    left: tooltipLeft,
    transform: fitsBelow ? "none" : "translateY(-100%)",
    zIndex: 9999,
    maxWidth: 280,
  };

  const currentStep = tourSteps[step];

  return (
    <div data-testid="guided-walkthrough">
      <div
        className="fixed inset-0 z-[9997]"
        style={{ pointerEvents: "auto" }}
        onClick={handleSkip}
      />

      <div style={spotlightStyle} />

      <div
        style={tooltipStyle}
        className="bg-white rounded-xl border shadow-lg p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">{currentStep.title}</h3>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
            data-testid="button-close-tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">{currentStep.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {step + 1} of {tourSteps.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
              data-testid="button-skip-tour"
            >
              Skip Tour
            </button>

            {step > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600"
                data-testid="button-tour-back"
              >
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium"
              data-testid="button-tour-next"
            >
              {step === tourSteps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalkthroughTrigger() {
  const { setCompleted, setDismissed } = useWalkthroughStore();

  const handleClick = useCallback(() => {
    setCompleted(false);
    setDismissed(false);
  }, [setCompleted, setDismissed]);

  return (
    <button
      onClick={handleClick}
      className="group relative flex items-center gap-3 px-4 py-3 text-sm font-medium text-background/60 hover:text-white rounded-2xl transition-all duration-300 overflow-hidden w-full"
      data-testid="button-start-tour"
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
      <div className="relative w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
        <HelpCircle className="w-4 h-4 transition-all duration-300" />
      </div>
      <span className="relative">Guided Tour</span>
    </button>
  );
}

export default GuidedWalkthrough;
