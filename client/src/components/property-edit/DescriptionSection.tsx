import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Loader2, X } from "lucide-react";
import { IconWand2 } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import type { PropertyEditSectionProps } from "./types";

export default function DescriptionSection({ draft, onChange }: PropertyEditSectionProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const { toast } = useToast();

  const handleAIRewrite = async () => {
    const text = (draft.description || "").trim();
    if (!text) {
      toast({ title: "Nothing to improve", description: "Please write a description first.", variant: "destructive" });
      return;
    }
    setIsRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          propertyName: draft.name,
          location: draft.location,
          roomCount: draft.roomCount,
        }),
      });
      if (!res.ok) throw new Error("Rewrite failed");
      const data = await res.json();
      if (data.rewritten) {
        onChange("description", data.rewritten);
        toast({ title: "Description improved", description: "AI has rewritten your description." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to rewrite description. Please try again.", variant: "destructive" });
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative p-6">
        <div className="mb-4">
          <h3 className="text-xl font-display text-foreground">Property Description</h3>
          <p className="text-muted-foreground text-sm label-text">Describe the property, its features, and investment thesis</p>
        </div>
        <div className="space-y-3">
          <Label className="label-text text-foreground flex items-center gap-1.5">
            Description
            <HelpTooltip text="A narrative description of the property. This is used in reports, exports, and as context for AI research. Describe the property's unique features, target market, and investment appeal." />
          </Label>
          <Textarea
            value={draft.description || ""}
            onChange={(e) => onChange("description", e.target.value || null)}
            placeholder="Describe this property — its setting, unique features, target guests, and what makes it an attractive investment..."
            className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground min-h-[120px] resize-y"
            data-testid="input-property-description"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAIRewrite}
              disabled={isRewriting || !(draft.description || "").trim()}
              data-testid="button-ai-rewrite-description"
            >
              {isRewriting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <IconWand2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isRewriting ? "Rewriting..." : "Improve with AI"}
            </Button>
            {(draft.description || "").trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("description", null)}
                className="text-muted-foreground"
                data-testid="button-clear-description"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
