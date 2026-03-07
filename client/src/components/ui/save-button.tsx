import * as React from "react";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  children = "Save Changes",
  className
}: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none bg-gray-900 text-white hover:bg-gray-800",
        className
      )}
      data-testid="button-save-changes"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}
