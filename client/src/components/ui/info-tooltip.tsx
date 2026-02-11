import { Info, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  text: string;
  formula?: string;
  light?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  manualSection?: string;
  manualLabel?: string;
}

export function InfoTooltip({ text, formula, light = false, side = "top", manualSection, manualLabel }: InfoTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center ml-1 cursor-help rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            light
              ? "text-white/50 hover:text-white"
              : "text-primary hover:text-[#7A9E82]"
          }`}
          aria-label="Info"
          data-testid="info-tooltip-trigger"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        sideOffset={8}
        className="max-w-xs text-sm leading-relaxed px-4 py-3"
        data-testid="info-tooltip-content"
      >
        <span>{text}</span>
        {formula && (
          <code className="block mt-1.5 text-[11px] font-mono text-primary bg-white/5 rounded px-1.5 py-1">
            {formula}
          </code>
        )}
        {manualSection && (
          <a
            href={`/checker-manual#${manualSection}`}
            className="flex items-center gap-1 mt-1.5 text-[10px] text-primary hover:text-white transition-colors"
            data-testid="info-tooltip-manual-link"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            {manualLabel || "Learn more in the Manual"}
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
