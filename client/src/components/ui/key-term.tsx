import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { lookupGlossary } from "@/lib/glossary";
import type { GlossaryEntry } from "@/lib/glossary";

interface KeyTermProps {
  term: string;
  children?: React.ReactNode;
  entry?: GlossaryEntry;
  side?: "top" | "bottom" | "left" | "right";
}

export function KeyTerm({ term, children, entry: overrideEntry, side = "top" }: KeyTermProps) {
  const entry = overrideEntry || lookupGlossary(term);
  if (!entry) {
    return <span>{children ?? term}</span>;
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span
          className="border-b border-dotted border-muted-foreground/40 cursor-help transition-colors hover:border-primary/60 hover:text-primary"
          data-testid={`key-term-${term.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        >
          {children ?? term}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align="center"
        sideOffset={8}
        className="max-w-xs text-sm leading-relaxed px-4 py-3"
        data-testid={`key-term-tooltip-${term.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      >
        <p className="font-semibold text-[13px] mb-1">{entry.term}</p>
        <p className="text-[12px] opacity-90">{entry.definition}</p>
        {entry.formula && (
          <code className="block mt-1.5 text-[11px] font-mono text-primary bg-muted rounded px-1.5 py-1">
            {entry.formula}
          </code>
        )}
        {entry.formulaRef && (
          <span className="block mt-1 text-[10px] opacity-60">
            Ref: {entry.formulaRef}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
