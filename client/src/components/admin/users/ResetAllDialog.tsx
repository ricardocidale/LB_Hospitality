import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconEye, IconEyeOff, IconKey } from "@/components/icons";

interface ResetAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  confirm: string;
  setConfirm: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isPending: boolean;
  onSubmit: () => void;
}

export default function ResetAllDialog({
  open,
  onOpenChange,
  password,
  setPassword,
  confirm,
  setConfirm,
  showPassword,
  setShowPassword,
  isPending,
  onSubmit,
}: ResetAllDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) { setPassword(""); setConfirm(""); setShowPassword(false); }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <IconKey className="w-5 h-5" />
            Reset All Passwords
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            This will reset ALL user passwords. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reset-all-password">New Password</Label>
            <div className="relative">
              <Input
                id="reset-all-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password for all users"
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-all-confirm">Type <span className="font-mono font-bold text-destructive">RESET ALL PASSWORDS</span> to confirm</Label>
            <Input
              id="reset-all-confirm"
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="RESET ALL PASSWORDS"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!password || confirm !== "RESET ALL PASSWORDS" || isPending}
            onClick={onSubmit}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Reset All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
