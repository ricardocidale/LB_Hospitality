import { HelpCircle } from "lucide-react";
import { useState } from "react";

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="ml-2 text-primary/60 hover:text-primary transition-colors focus:outline-none"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 left-0 bottom-full mb-3 w-80 p-4 text-sm bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700">
          <div className="leading-relaxed">{text}</div>
          <div className="absolute left-4 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
