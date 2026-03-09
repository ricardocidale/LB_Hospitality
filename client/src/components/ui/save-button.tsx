import { IconLoader, IconSave } from "@/components/icons/brand-icons";
import * as React from "react";
;
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SaveButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function SaveButton({ 
  onClick, 
  disabled = false, 
  isPending = false,
  children = "IconSave Changes",
  className
}: SaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isPending}
      variant="default"
      className={cn(className)}
      data-testid="button-save-changes"
    >
      {isPending ? (
        <IconLoader className="w-4 h-4 animate-spin" />
      ) : (
        <IconSave className="w-4 h-4" />
      )}
      {children}
    </Button>
  );
}
