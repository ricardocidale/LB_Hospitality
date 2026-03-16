import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconSave } from "@/components/icons";

interface SaveScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  onSave: () => void;
  isPending: boolean;
}

export function SaveScenarioDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  onSave,
  isPending,
}: SaveScenarioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Save Current Configuration</DialogTitle>
          <DialogDescription className="label-text">
            Save your current assumptions and properties as a new scenario
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="label-text">Scenario Name</label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., Base Case, Optimistic, Conservative"
              data-testid="input-scenario-name"
            />
          </div>
          <div className="space-y-2">
            <label className="label-text">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of this scenario"
              data-testid="input-scenario-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onSave}
            disabled={isPending || !name.trim()}
            data-testid="button-save-scenario"
            className="flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            Save Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
