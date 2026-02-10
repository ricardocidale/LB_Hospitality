/**
 * Shared Financial Table Row Components
 *
 * Composable row primitives for building financial statements (Income Statement,
 * Cash Flow, Balance Sheet). Extracted from YearlyCashFlowStatement.tsx and
 * generalised so every financial page uses the same visual language.
 *
 * Usage:
 *   import {
 *     SectionHeader, SubtotalRow, LineItem,
 *     ExpandableLineItem, GrandTotalRow, SpacerRow,
 *     MetricRow, TableShell
 *   } from "@/components/financial-table-rows";
 *
 * These are COMPOSITIONAL components — you lay them out as JSX children inside
 * a shadcn <Table> / <TableBody>.  For purely data-driven tables where every
 * row follows the same shape, use the declarative <FinancialTable> instead
 * (client/src/components/ui/financial-table.tsx).
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

/* ─────────────────────────────────────────────
   Design tokens — kept in one place so a palette
   change only touches these four lines.
   ───────────────────────────────────────────── */

/** Section header background (light ice-blue) */
const SECTION_BG = "#E8F4FD";
/** Subtotal row background (slightly darker ice-blue) */
const SUBTOTAL_BG = "#D0EAFB";
/** Grand total row — uses the design-system's primary gradient */
const GRAND_TOTAL_CLASS =
  "bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 backdrop-blur-sm font-bold text-primary-foreground shadow-sm";

/* ═══════════════════════════════════════════════
   1. SectionHeader
   Green-text label that introduces a section
   (e.g. "Revenue", "Operating Expenses").
   ═══════════════════════════════════════════════ */

interface SectionHeaderProps {
  /** Display label — e.g. "Revenue", "Operating Cash Flow" */
  label: string;
  /** Total column count (years + 1 for the label column) */
  colSpan: number;
  /** Optional tooltip shown as an info icon beside the label */
  tooltip?: string;
  /** Override the section header text color (default: text-[#257D41]) */
  textColor?: string;
}

export function SectionHeader({
  label,
  colSpan,
  tooltip,
  textColor = "text-[#257D41]",
}: SectionHeaderProps) {
  return (
    <TableRow className="bg-gray-50">
      <TableCell colSpan={colSpan} className={cn("font-bold py-2", textColor)}>
        <span className="flex items-center gap-1.5">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   2. SubtotalRow
   Bold row with tinted background for intermediate
   totals (e.g. "Total Revenue", "GOP", "Cash from
   Operations").
   ═══════════════════════════════════════════════ */

interface SubtotalRowProps {
  label: string;
  values: number[];
  tooltip?: string;
  /** When true, positive values get the accent color */
  positive?: boolean;
  /** Accent color class for positive values (default: text-accent) */
  positiveColor?: string;
  /** Custom background color for the label cell (default: matches row) */
  labelBg?: string;
  /** Override the entire row background (default: ice-blue dark) */
  bgColor?: string;
}

export function SubtotalRow({
  label,
  values,
  tooltip,
  positive,
  positiveColor = "text-accent",
  bgColor,
  labelBg,
}: SubtotalRowProps) {
  const rowStyle = bgColor ? { backgroundColor: bgColor } : { backgroundColor: SUBTOTAL_BG };
  const cellStyle = labelBg ? { backgroundColor: labelBg } : rowStyle;

  return (
    <TableRow style={rowStyle} className="font-semibold">
      <TableCell className="sticky left-0 py-1.5" style={cellStyle}>
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => (
        <TableCell
          key={i}
          className={cn(
            "text-right py-1.5 font-mono",
            v < 0 ? "text-destructive" : positive ? positiveColor : ""
          )}
        >
          <Money amount={v} />
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   3. LineItem
   Standard data row — the workhorse.  Handles
   indentation, negation, zero-suppression,
   tooltips, and custom formatting.
   ═══════════════════════════════════════════════ */

interface LineItemProps {
  label: string;
  values: number[];
  /** Indent the label (true = one level, or pass a number for deeper) */
  indent?: boolean | number;
  tooltip?: string;
  /** Show "0" instead of "-" when value is zero */
  showZero?: boolean;
  /** Display values as negative (prepend minus / wrap in parens) */
  negate?: boolean;
  /** Format values as percentages instead of currency */
  formatAsPercent?: boolean;
  /** Extra className on the row */
  className?: string;
}

export function LineItem({
  label,
  values,
  indent,
  tooltip,
  showZero,
  negate,
  formatAsPercent,
  className,
}: LineItemProps) {
  const indentLevel = indent === true ? 1 : typeof indent === "number" ? indent : 0;
  const paddingLeft = indentLevel > 0 ? `${indentLevel * 1.5 + 1}rem` : undefined;

  return (
    <TableRow className={className}>
      <TableCell
        className={cn("sticky left-0 bg-white py-1", indentLevel > 0 && "text-gray-500")}
        style={paddingLeft ? { paddingLeft } : undefined}
      >
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => {
        const displayVal = negate ? -v : v;
        if (formatAsPercent) {
          return (
            <TableCell key={i} className="text-right text-muted-foreground py-1 font-mono">
              {v === 0 && !showZero ? "-" : `${displayVal.toFixed(1)}%`}
            </TableCell>
          );
        }
        return (
          <TableCell key={i} className="text-right text-muted-foreground py-1 font-mono">
            {v === 0 && !showZero ? "-" : <Money amount={displayVal} />}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   4. ExpandableLineItem
   Collapsible section — click to show/hide child
   rows (e.g. revenue breakdown, expense detail).
   ═══════════════════════════════════════════════ */

interface ExpandableLineItemProps {
  label: string;
  values: number[];
  tooltip?: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  /** Display values as negative */
  negate?: boolean;
}

export function ExpandableLineItem({
  label,
  values,
  tooltip,
  children,
  expanded,
  onToggle,
  negate,
}: ExpandableLineItemProps) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <TableCell className="pl-6 sticky left-0 bg-white py-1">
          <span className="flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="ml-1">{label}</span>
            {tooltip && <HelpTooltip text={tooltip} />}
          </span>
        </TableCell>
        {values.map((v, i) => {
          const displayVal = negate ? -v : v;
          return (
            <TableCell key={i} className="text-right font-medium py-1 font-mono">
              <Money amount={displayVal} />
            </TableCell>
          );
        })}
      </TableRow>
      {expanded && children}
    </>
  );
}

/* ═══════════════════════════════════════════════
   5. GrandTotalRow
   Final summary row with the signature primary
   gradient background (used for "TOTAL ASSETS",
   "Net Change in Cash", etc.).
   ═══════════════════════════════════════════════ */

interface GrandTotalRowProps {
  label: string;
  values: number[];
  tooltip?: string;
  /** Use light variant for the tooltip icon */
  lightTooltip?: boolean;
}

export function GrandTotalRow({
  label,
  values,
  tooltip,
  lightTooltip = true,
}: GrandTotalRowProps) {
  return (
    <TableRow className={GRAND_TOTAL_CLASS}>
      <TableCell className="sticky left-0 bg-primary/70 py-1.5">
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} light={lightTooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="text-right py-1.5 font-mono">
          <Money amount={v} className={v < 0 ? "text-red-200" : ""} />
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   6. MetricRow
   KPI / ratio row — formatted as percentage,
   multiplier, or plain text.  Used for
   Cash-on-Cash, DSCR, NOI Margin, etc.
   ═══════════════════════════════════════════════ */

interface MetricRowProps {
  label: string;
  /** Pre-formatted string values (e.g. "18.1%", "1.45x", "N/A") */
  values: string[];
  tooltip?: string;
  /** Highlight class per value — e.g. "text-accent" or "text-destructive" */
  highlights?: (string | undefined)[];
}

export function MetricRow({ label, values, tooltip, highlights }: MetricRowProps) {
  return (
    <TableRow>
      <TableCell className="pl-6 sticky left-0 bg-white py-1">
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => (
        <TableCell
          key={i}
          className={cn("text-right font-medium py-1 font-mono", highlights?.[i])}
        >
          {v}
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   6b. ExpandableMetricRow
   Like MetricRow but with an accordion chevron.
   Click to expand/collapse child detail rows.
   ═══════════════════════════════════════════════ */

interface ExpandableMetricRowProps {
  label: string;
  values: string[];
  tooltip?: string;
  highlights?: (string | undefined)[];
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}

export function ExpandableMetricRow({
  label,
  values,
  tooltip,
  highlights,
  children,
  expanded,
  onToggle,
}: ExpandableMetricRowProps) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <TableCell className="pl-6 sticky left-0 bg-white py-1">
          <span className="flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            )}
            {label}
            {tooltip && <HelpTooltip text={tooltip} />}
          </span>
        </TableCell>
        {values.map((v, i) => (
          <TableCell
            key={i}
            className={cn("text-right font-medium py-1 font-mono", highlights?.[i])}
          >
            {v}
          </TableCell>
        ))}
      </TableRow>
      {expanded && children}
    </>
  );
}

/* ═══════════════════════════════════════════════
   7. SpacerRow
   Empty row for visual breathing room between
   sections.
   ═══════════════════════════════════════════════ */

interface SpacerRowProps {
  colSpan: number;
  height?: string;
}

export function SpacerRow({ colSpan, height = "h-2" }: SpacerRowProps) {
  return (
    <TableRow className={cn(height, "border-none")}>
      <TableCell colSpan={colSpan}></TableCell>
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   8. BalanceSheetSection
   Section header for Balance Sheet style tables
   (e.g. "ASSETS", "LIABILITIES", "EQUITY")
   ═══════════════════════════════════════════════ */

interface BalanceSheetSectionProps {
  label: string;
  colSpan: number;
}

export function BalanceSheetSection({ label, colSpan }: BalanceSheetSectionProps) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell colSpan={colSpan} className="font-bold text-accent">
        {label}
      </TableCell>
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   9. BalanceSheetLineItem
   Indented line item for Balance Sheet style
   (supports category headers, items, subtotals).
   ═══════════════════════════════════════════════ */

interface BalanceSheetLineItemProps {
  label: string;
  amount?: number;
  /** Indent level: 0 = flush, 1 = category, 2 = detail */
  indent?: number;
  /** Bold label (for category headers and subtotals) */
  bold?: boolean;
  /** Subtotal tint background */
  isSubtotal?: boolean;
  /** Grand total row (primary/10 background) */
  isTotal?: boolean;
}

export function BalanceSheetLineItem({
  label,
  amount,
  indent = 0,
  bold,
  isSubtotal,
  isTotal,
}: BalanceSheetLineItemProps) {
  const paddingLeft = indent > 0 ? `${indent * 1.5}rem` : undefined;

  return (
    <TableRow
      className={cn(
        isSubtotal && "bg-primary/5",
        isTotal && "bg-primary/10 font-bold"
      )}
    >
      <TableCell
        className={cn(bold && "font-medium")}
        style={paddingLeft ? { paddingLeft } : undefined}
      >
        {label}
      </TableCell>
      <TableCell className="text-right font-mono">
        {amount !== undefined ? (
          <Money amount={amount} className={bold ? "font-medium" : undefined} />
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/* ═══════════════════════════════════════════════
   10. TableShell
   Wraps a financial table with consistent card
   chrome, header row, and horizontal scroll.
   Use this instead of manually assembling
   <Card> + <Table> + <TableHeader> every time.
   ═══════════════════════════════════════════════ */

interface TableShellProps {
  /** Table title shown in the card header */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Column headers (years, dates, etc.) */
  columns: string[];
  /** Label for the sticky first column (default: "Category") */
  stickyLabel?: string;
  /** Table body content — compose with the row components above */
  children: React.ReactNode;
  /** Optional ref for export/screenshot */
  tableRef?: React.Ref<HTMLDivElement>;
  /** Optional banner content between header and table (e.g. warnings) */
  banner?: React.ReactNode;
  /** Optional extra className on the outer Card */
  className?: string;
}

export function TableShell({
  title,
  subtitle,
  columns,
  stickyLabel = "Category",
  children,
  tableRef,
  banner,
  className,
}: TableShellProps) {
  return (
    <Card
      ref={tableRef}
      className={cn("overflow-hidden bg-white shadow-lg border border-gray-100", className)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-900">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {banner}
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-[250px] font-bold sticky left-0 bg-gray-100 text-gray-900">
                {stickyLabel}
              </TableHead>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className="text-right min-w-[110px] font-bold text-gray-900"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
    </Card>
  );
}
