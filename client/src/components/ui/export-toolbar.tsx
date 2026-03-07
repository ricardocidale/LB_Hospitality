/**
 * export-toolbar.tsx — Dropdown menu for exporting financial data.
 *
 * Renders a button group with export format options: Excel (.xlsx),
 * PowerPoint (.pptx), PDF, and screenshot (PNG). Each option triggers
 * the corresponding export handler passed via props. The toolbar is
 * used on property detail, company, and portfolio pages.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Download, FileDown, FileSpreadsheet, ImageIcon, FileBarChart, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function ExportMenu({ actions, className }: ExportToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 h-9 text-xs font-medium", className)}
          data-testid="button-export-menu"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {actions.map((action, i) => (
          <DropdownMenuItem
            key={i}
            onClick={action.onClick}
            className="flex items-center gap-3 cursor-pointer"
            data-testid={action.testId}
          >
            {action.icon && <span className="w-4 h-4 text-muted-foreground/70">{action.icon}</span>}
            <span>{action.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ExportToolbar({ actions, className, variant }: ExportToolbarProps) {
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

function pptxAction(onClick: () => void): ExportAction {
  return {
    label: "PowerPoint",
    icon: <Presentation className="w-3.5 h-3.5" />,
    onClick,
    testId: "button-export-pptx",
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

export { ExportToolbar, ExportMenu, pdfAction, excelAction, csvAction, pptxAction, chartAction, pngAction };
