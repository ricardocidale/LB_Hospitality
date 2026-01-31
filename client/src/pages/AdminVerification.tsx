import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, PlayCircle, FileCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";

interface VerificationResult {
  timestamp: string;
  propertiesChecked: number;
  formulaChecks: {
    passed: number;
    failed: number;
    details: Array<{
      name: string;
      checks: Array<{ name: string; passed: boolean; description: string }>;
    }>;
  };
  complianceChecks: {
    passed: number;
    failed: number;
    criticalIssues: number;
    details: Array<{ category: string; rule: string; passed: boolean }>;
  };
  overallStatus: "PASS" | "FAIL" | "WARNING";
}

export default function AdminVerification() {
  const [results, setResults] = useState<VerificationResult | null>(null);

  const runVerification = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/run-verification", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run verification");
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader 
          title="Financial Verification" 
          subtitle="Run formula and GAAP compliance checks on all financial statements"
          variant="dark"
        />

        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2d4a5e]/90 via-[#3d5a6a]/90 to-[#3a5a5e]/90 backdrop-blur-xl border-white/10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#257D41]/10 blur-3xl" />
          </div>
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-[#9FBCA4]" />
                <div>
                  <CardTitle className="text-xl font-display text-[#FFF9F5]">Verification Tools</CardTitle>
                  <CardDescription className="label-text text-white/60">
                    Check all formulas and GAAP compliance across financial statements
                  </CardDescription>
                </div>
              </div>
              <GlassButton
                variant="primary"
                onClick={() => runVerification.mutate()}
                disabled={runVerification.isPending}
                data-testid="button-run-verification"
              >
                {runVerification.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                Run Verification
              </GlassButton>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-6">
            {!results && !runVerification.isPending && (
              <div className="text-center py-12">
                <FileCheck className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="label-text text-white/60">Click "Run Verification" to check all financial statements</p>
                <p className="label-text text-white/40 mt-2">
                  This will validate formulas, GAAP compliance, and calculation accuracy
                </p>
              </div>
            )}

            {runVerification.isPending && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
                <p className="label-text text-white/60">Running verification checks...</p>
              </div>
            )}

            {results && (
              <>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-[#FFF9F5]">Verification Results</h3>
                      <p className="text-xs text-white/40 font-mono mt-1">
                        Run at: {formatDate(results.timestamp)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      results.overallStatus === "PASS" ? "bg-green-500/20 text-green-400" :
                      results.overallStatus === "WARNING" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {results.overallStatus === "PASS" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : results.overallStatus === "WARNING" ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-display font-bold">{results.overallStatus}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-mono text-[#FFF9F5]">{results.propertiesChecked}</div>
                      <div className="text-xs text-white/40 label-text">Properties Checked</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-mono text-green-400">{results.formulaChecks.passed}</div>
                      <div className="text-xs text-white/40 label-text">Formula Checks Passed</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-2xl font-mono text-green-400">{results.complianceChecks.passed}</div>
                      <div className="text-xs text-white/40 label-text">GAAP Checks Passed</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-[#FFF9F5] mb-3">Formula Checks by Property</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60 font-display">Property</TableHead>
                          <TableHead className="text-white/60 font-display">Check</TableHead>
                          <TableHead className="text-white/60 font-display">Description</TableHead>
                          <TableHead className="text-white/60 font-display text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.formulaChecks.details.map((property, pi) => (
                          property.checks.map((check, ci) => (
                            <TableRow key={`${pi}-${ci}`} className="border-white/10 hover:bg-white/5">
                              {ci === 0 && (
                                <TableCell 
                                  className="text-[#FFF9F5] font-medium"
                                  rowSpan={property.checks.length}
                                >
                                  {property.name}
                                </TableCell>
                              )}
                              <TableCell className="text-white/80">{check.name}</TableCell>
                              <TableCell className="text-white/60 text-sm">{check.description}</TableCell>
                              <TableCell className="text-center">
                                {check.passed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-[#FFF9F5] mb-3">GAAP Compliance Checks</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60 font-display">Standard</TableHead>
                          <TableHead className="text-white/60 font-display">Rule</TableHead>
                          <TableHead className="text-white/60 font-display text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.complianceChecks.details.map((check, i) => (
                          <TableRow key={i} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-[#FFF9F5]">{check.category}</TableCell>
                            <TableCell className="text-white/80">{check.rule}</TableCell>
                            <TableCell className="text-center">
                              {check.passed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#257D41]/10 border border-[#257D41]/30">
                  <h4 className="font-display text-[#9FBCA4] mb-2">Key GAAP Standards Verified</h4>
                  <ul className="grid grid-cols-2 gap-2 text-sm text-white/70 label-text">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />
                      ASC 470 - Debt: Interest vs Principal separation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />
                      ASC 230 - Cash Flows: Operating vs Financing classification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />
                      ASC 606 - Revenue: Point-in-time recognition
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />
                      ASC 360 - Property: Depreciation treatment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />
                      USALI Standard: NOI calculation methodology
                    </li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
