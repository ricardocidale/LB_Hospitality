import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  text: string;
  light?: boolean;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ text, light = false, side = "top" }: HelpTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center ml-1.5 cursor-help rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            light
              ? "text-white/50 hover:text-white"
              : "text-[#9FBCA4] hover:text-[#7A9E82]"
          }`}
          aria-label="Help"
          data-testid="help-tooltip-trigger"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        sideOffset={8}
        className="max-w-xs text-sm leading-relaxed px-4 py-3"
        data-testid="help-tooltip-content"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
