import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Paperclip } from "@/components/icons/themed-icons";

interface ShareEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyName: string;
  metrics?: Record<string, any>;
  attachmentFilename?: string;
  attachmentBase64?: string;
}

export default function ShareEmailModal({
  open,
  onOpenChange,
  propertyName,
  metrics = {},
  attachmentFilename,
  attachmentBase64,
}: ShareEmailModalProps) {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/share-report", {
        to: recipientEmail,
        propertyName,
        metrics,
        message: message || undefined,
        attachmentBase64,
        attachmentFilename,
      });
    },
    onSuccess: () => {
      toast({ title: "Report sent", description: `Email sent to ${recipientEmail}` });
      setRecipientEmail("");
      setMessage("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Could not deliver the email. Check your Resend configuration.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" /> Share via Email
          </DialogTitle>
          <DialogDescription>
            Send a branded report for {propertyName} to a stakeholder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              data-testid="input-share-email"
              type="email"
              placeholder="stakeholder@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="share-message">Message (optional)</Label>
            <Textarea
              id="share-message"
              data-testid="input-share-message"
              placeholder="Add a personal note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {attachmentFilename && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              <Paperclip className="w-4 h-4" />
              <span>{attachmentFilename}</span>
            </div>
          )}

          {Object.keys(metrics).length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Metrics included in email:</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {Object.entries(metrics).map(([key, val]) => (
                  <div key={key} className="text-xs bg-muted px-2 py-1 rounded">
                    <span className="font-medium">{key}:</span> {String(val)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="button-send-share"
            onClick={() => sendMutation.mutate()}
            disabled={!recipientEmail || sendMutation.isPending}
          >
            <Send className="w-4 h-4 mr-1" />
            {sendMutation.isPending ? "Sending..." : "Send Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
