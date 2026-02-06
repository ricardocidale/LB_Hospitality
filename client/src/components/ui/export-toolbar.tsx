import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Download, FileDown, FileSpreadsheet, ImageIcon, ChevronDown, FileBarChart } from "lucide-react";

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

function ExportMenu({ actions, className, variant = "glass" }: ExportToolbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  if (variant === "light") {
    return (
      <div ref={menuRef} className={cn("relative", className)}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-xl border border-gray-300 hover:border-gray-400 bg-transparent hover:bg-gray-100/50 transition-all duration-200"
          data-testid="button-export-menu"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border border-gray-200 bg-white shadow-lg shadow-black/8 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                data-testid={action.testId}
              >
                {action.icon && <span className="w-4 h-4 text-gray-400">{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white rounded-2xl transition-all duration-300 ease-out"
        data-testid="button-export-menu"
      >
        <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
        <div className="absolute inset-0 rounded-2xl border border-white/20" />
        <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 bg-white/5" />
        <Download className="relative w-3.5 h-3.5" />
        <span className="relative">Export</span>
        <ChevronDown className={cn("relative w-3 h-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-[#1a2a3a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40">
            <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="py-1.5">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.onClick(); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all duration-150"
                  data-testid={action.testId}
                >
                  {action.icon && <span className="w-4 h-4 text-white/50">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportToolbar({ actions, className, variant = "glass" }: ExportToolbarProps) {
  return <ExportMenu actions={actions} className={className} variant={variant} />;
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

function csvAction(onClick: () => void): ExportAction {
  return {
    label: "CSV",
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-csv",
  };
}

function chartAction(onClick: () => void): ExportAction {
  return {
    label: "Chart as Image",
    icon: <FileBarChart className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-chart",
  };
}

function pngAction(onClick: () => void, testId?: string): ExportAction {
  return {
    label: "Table as PNG",
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    onClick,
    testId: testId || "button-export-table-png",
  };
}

export { ExportToolbar, ExportMenu, pdfAction, excelAction, csvAction, chartAction, pngAction };
