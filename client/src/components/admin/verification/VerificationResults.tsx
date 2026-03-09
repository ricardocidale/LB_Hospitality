import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { IconCheckCircle2, IconXCircle, IconAlertTriangle } from "@/components/icons";
import { formatMoney } from "@/lib/financialEngine";
import type { CheckResult, VerificationResult } from "./types";

interface VerificationResultsProps {
  results: VerificationResult;
}

export function VerificationResults({ results }: VerificationResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700";
      case "material": return "bg-yellow-100 text-yellow-700";
      case "minor": return "bg-blue-100 text-blue-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const renderCheckRow = (chk: CheckResult, idx: number) => (
    <div key={idx} className="space-y-1">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
        {chk.passed ? <IconCheckCircle2 className="w-5 h-5 text-secondary shrink-0" /> : <IconXCircle className="w-5 h-5 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground text-sm font-medium">{chk.metric}</span>
            {!chk.passed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${severityColor(chk.severity)}`}>{chk.severity.toUpperCase()}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-secondary font-mono">{chk.gaapRef}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{chk.formula}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className={`text-xs px-2 py-1 rounded font-semibold ${chk.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {chk.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
      {!chk.passed && (
        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div><span className="text-muted-foreground">Expected:</span> <span className="font-mono font-semibold">{formatMoney(chk.expected)}</span></div>
            <div><span className="text-muted-foreground">Actual:</span> <span className="font-mono font-semibold">{formatMoney(chk.actual)}</span></div>
            <div><span className="text-muted-foreground">Variance:</span> <span className="font-mono font-semibold text-red-600">{formatMoney(chk.variance)} ({chk.variancePct.toFixed(2)}%)</span></div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGroupedChecks = (checks: CheckResult[], sectionPrefix: string) => {
    const grouped = new Map<string, CheckResult[]>();
    for (const chk of checks) {
      const cat = chk.category || "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(chk);
    }

    return Array.from(grouped.entries()).map(([category, catChecks]) => {
      const passed = catChecks.filter(c => c.passed).length;
      const failed = catChecks.filter(c => !c.passed).length;
      const hasFails = failed > 0;
      const key = `${sectionPrefix}-${category}`;
      const isExpanded = expandedCategories.has(key) || hasFails;

      return (
        <div key={category} className="space-y-1">
          <button
            onClick={() => toggleCategory(key)}
            data-testid={`accordion-category-${sectionPrefix}-${category.replace(/\s+/g, '-').toLowerCase()}`}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              hasFails
                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
            }`}
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            }
            {hasFails
              ? <IconAlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              : <IconCheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
            }
            <span className="text-sm font-semibold text-foreground flex-1 text-left">{category}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-secondary bg-green-100 px-2 py-0.5 rounded">{passed} passed</span>
              {failed > 0 && (
                <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded">{failed} failed</span>
              )}
            </div>
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {catChecks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Property Results */}
      {results.propertyResults.map((prop, pIdx) => (
        <div key={pIdx} className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">{prop.propertyName}</h3>
              <p className="text-xs text-muted-foreground">{prop.propertyType}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Health Score</p>
                <p className={`text-lg font-mono font-bold ${prop.failed === 0 ? 'text-secondary' : 'text-red-600'}`}>
                  {((prop.passed / prop.checks.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            {renderGroupedChecks(prop.checks, `prop-${pIdx}`)}
          </div>
        </div>
      ))}

      {/* Company Checks */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-foreground border-b pb-2">Management Company Checks</h3>
        <div className="grid gap-2">
          {renderGroupedChecks(results.companyChecks, "company")}
        </div>
      </div>

      {/* Consolidated Checks */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-foreground border-b pb-2">Consolidated Portfolio Checks</h3>
        <div className="grid gap-2">
          {renderGroupedChecks(results.consolidatedChecks, "consolidated")}
        </div>
      </div>

      {/* Known Value Tests */}
      {results.clientKnownValueTests && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-foreground border-b pb-2">Known-Value Test Cases (Verification Workpaper)</h3>
          <div className="p-4 rounded-xl bg-foreground font-mono text-[11px] leading-relaxed text-green-400 overflow-auto max-h-[400px]">
            {results.clientKnownValueTests.results.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
