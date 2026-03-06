import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { DesignCheckResult } from "./types";

interface DesignCheckPanelProps {
  results: DesignCheckResult;
}

export function DesignCheckPanel({ results }: DesignCheckPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Design Quality & Test Coverage Check</h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Overall Coverage</p>
            <p className={`text-xl font-mono font-bold ${
              results.overallStatus === 'PASS' ? 'text-secondary' :
              results.overallStatus === 'WARNING' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {((results.passed / results.totalChecks) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1">Passed Checks</p>
          <p className="text-2xl font-mono font-bold text-green-700">{results.passed}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-1">Failed Checks</p>
          <p className="text-2xl font-mono font-bold text-red-700">{results.failed}</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest mb-1">Warnings</p>
          <p className="text-2xl font-mono font-bold text-yellow-700">{results.warnings}</p>
        </div>
      </div>

      <div className="space-y-2">
        {results.checks.map((check, idx) => (
          <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-white border border-gray-100 hover:border-secondary/20 transition-all shadow-sm">
            {check.status === 'pass' ? <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" /> :
             check.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" /> :
             <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{check.category}</span>
                <span className="text-sm font-semibold text-gray-800">{check.rule}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{check.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
