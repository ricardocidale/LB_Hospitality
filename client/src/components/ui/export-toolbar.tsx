import * as React from "react";
import { cn } from "@/lib/utils";
import { FileDown, FileSpreadsheet, ImageIcon } from "lucide-react";

export interface ExportAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  testId?: string;
}

export interface ExportToolbarProps {
  actions: ExportAction[];
  className?: string;
  variant?: "glass" | "light";
}

function GlassExportButton({
  action,
}: {
  action: ExportAction;
}) {
  return (
    <button
      onClick={action.onClick}
      className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
      data-testid={action.testId}
    >
      <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl border border-white/20" />
      <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
      {action.icon && <span className="relative w-3.5 h-3.5">{action.icon}</span>}
      <span className="relative">{action.label}</span>
    </button>
  );
}

function ExportToolbar({ actions, className, variant = "glass" }: ExportToolbarProps) {
  if (variant === "light") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-xl border border-gray-300 hover:border-gray-400 bg-transparent hover:bg-gray-100/50 transition-all duration-200"
            data-testid={action.testId}
          >
            {action.icon && <span className="w-3.5 h-3.5">{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.map((action, i) => (
        <GlassExportButton key={i} action={action} />
      ))}
    </div>
  );
}

function pdfAction(onClick: () => void): ExportAction {
  return {
    label: "PDF",
    icon: <FileDown className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-pdf",
  };
}

function excelAction(onClick: () => void): ExportAction {
  return {
    label: "Excel",
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-excel",
  };
}

function chartAction(onClick: () => void): ExportAction {
  return {
    label: "Chart",
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-chart",
  };
}

function pngAction(onClick: () => void): ExportAction {
  return {
    label: "PNG",
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-png",
  };
}

export { ExportToolbar, pdfAction, excelAction, chartAction, pngAction };
