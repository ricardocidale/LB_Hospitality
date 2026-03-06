import { SectionCard } from "@/components/ui/section-card";
import { Callout } from "@/components/ui/callout";
import { MessageCircle } from "lucide-react";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section13Marcela({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="marcela"
      title="13. Marcela AI Assistant"
      icon={MessageCircle}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Marcela is the portal's AI-powered assistant. She can answer questions about the portfolio, explain financial metrics,
        and help navigate the application.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Text Chat</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; Click the chat icon in the bottom-right corner to open the chat window.</li>
          <li>&#8226; Type your question and press Enter or click Send.</li>
          <li>&#8226; Marcela can explain any metric, compare properties, and provide context from market research data.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Voice Chat</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; Click the microphone icon in the chat window to start a voice conversation.</li>
          <li>&#8226; Speak naturally — Marcela will listen, process your question, and respond with a spoken answer.</li>
          <li>&#8226; You can interrupt Marcela while she is speaking to ask follow-up questions.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Phone & SMS</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; <strong>Phone</strong> — call the dedicated Marcela phone number for a voice conversation about your portfolio.</li>
          <li>&#8226; <strong>SMS</strong> — text the same number to get quick answers via text message.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Accuracy & Validation</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; When answering questions about property financials, Marcela uses <strong>deterministic financial calculations</strong> from the engine — not estimates or approximations.</li>
          <li>&#8226; AI-generated market research recommendations are <strong>validated against the financial engine</strong> before being applied to property assumptions, ensuring values fall within realistic bounds.</li>
        </ul>
      </div>

      <Callout variant="light">
        Marcela never performs financial calculations directly. All financial data comes from the deterministic calculation engine
        to ensure accuracy and consistency.
      </Callout>
    </SectionCard>
  );
}
