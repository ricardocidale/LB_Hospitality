import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { GlassButton } from "./glass-button";

export interface SaveButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  children?: React.ReactNode;
}

export function SaveButton({ 
  onClick, 
  disabled = false, 
  isPending = false,
  children = "Save Changes"
}: SaveButtonProps) {
  return (
    <GlassButton 
      variant="primary" 
      onClick={onClick} 
      disabled={disabled || isPending}
      data-testid="button-save-changes"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {children}
    </GlassButton>
  );
}
