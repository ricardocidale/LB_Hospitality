import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconShare, IconUsers } from "@/components/icons";
import { useShareScenario } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ShareScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: number;
  scenarioName: string;
}

type Step = "enter" | "confirm" | "success";

export function ShareScenarioDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioName,
}: ShareScenarioDialogProps) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"single" | "all">("single");
  const [step, setStep] = useState<Step>("enter");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const shareScenario = useShareScenario();
  const { toast } = useToast();

  const resetDialog = () => {
    setEmail("");
    setMode("single");
    setStep("enter");
    setEmailError(null);
    setRecipientName(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError("Please enter an email address");
      return false;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleProceedToConfirm = () => {
    if (!validateEmail(email)) return;
    setStep("confirm");
  };

  const handleConfirmShare = async () => {
    try {
      const result = await shareScenario.mutateAsync({
        recipientEmail: email.trim(),
        mode,
        scenarioId: mode === "single" ? scenarioId : undefined,
      });
      setRecipientName(result.recipientName);
      setStep("success");
    } catch (error: any) {
      const msg = error.message || "Failed to share scenario";
      if (msg.includes("No user found")) {
        setEmailError("No user found with that email address");
        setStep("enter");
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
        setStep("enter");
      }
    }
  };

  if (step === "confirm") {
    return (
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Confirm Sharing</AlertDialogTitle>
            <AlertDialogDescription className="label-text">
              {mode === "single"
                ? <>Share scenario <strong>"{scenarioName}"</strong> with <strong>{email.trim()}</strong>?</>
                : <>Share <strong>all your scenarios</strong> with <strong>{email.trim()}</strong>?</>
              }
              <br /><br />
              The recipient will be able to view and load {mode === "single" ? "this scenario" : "your scenarios"} but cannot edit or delete them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStep("enter")} data-testid="button-share-back">
              Back
            </AlertDialogCancel>
            <AlertDialogCancel onClick={handleClose} data-testid="button-share-cancel-confirm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmShare}
              disabled={shareScenario.isPending}
              data-testid="button-share-confirm"
            >
              {shareScenario.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <IconShare className="w-4 h-4 mr-2" />}
              Share
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Shared Successfully</DialogTitle>
            <DialogDescription className="label-text">
              {mode === "single"
                ? <>Scenario <strong>"{scenarioName}"</strong> has been shared with <strong>{recipientName || email.trim()}</strong>.</>
                : <>All your scenarios have been shared with <strong>{recipientName || email.trim()}</strong>.</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} data-testid="button-share-done">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Share Scenario</DialogTitle>
          <DialogDescription className="label-text">
            Share "{scenarioName}" with another user by entering their email address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="label-text">Recipient Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              placeholder="colleague@example.com"
              data-testid="input-share-email"
            />
            {emailError && (
              <p className="text-sm text-destructive" data-testid="text-share-email-error">{emailError}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="label-text">What to share</label>
            <div className="flex gap-3">
              <Button
                variant={mode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("single")}
                data-testid="button-share-mode-single"
                className="flex items-center gap-2"
              >
                <IconShare className="w-4 h-4" />
                This scenario only
              </Button>
              <Button
                variant={mode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("all")}
                data-testid="button-share-mode-all"
                className="flex items-center gap-2"
              >
                <IconUsers className="w-4 h-4" />
                All my scenarios
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-share-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleProceedToConfirm}
            disabled={!email.trim()}
            data-testid="button-share-next"
            className="flex items-center gap-2"
          >
            <IconShare className="w-4 h-4" />
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
