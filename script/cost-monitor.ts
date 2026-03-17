#!/usr/bin/env tsx
/**
 * script/cost-monitor.ts — Live terminal dashboard for API cost monitoring.
 *
 * Usage:
 *   npm run cost-monitor
 *   npm run cost-monitor -- --since today
 *   npm run cost-monitor -- --since 1h --budget 25
 *
 * Keyboard:
 *   q  Quit
 *   r  Reset aggregation
 *   h  Toggle hourly / daily / all-time view
 *   b  Cycle budget ($10 / $20 / $50 / $100 / off)
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// ── Constants ────────────────────────────────────────────────────────────────

const LOG_FILE = path.resolve(process.cwd(), "logs", "api-costs.jsonl");
const REFRESH_MS = 2_000;
const MAX_RECENT = 8;
const BUDGET_OPTIONS = [10, 20, 50, 100, 0]; // 0 = off

// ── Project identity ─────────────────────────────────────────────────────────

function getProjectName(): string {
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.name ?? path.basename(process.cwd());
  } catch {
    return path.basename(process.cwd());
  }
}

const PROJECT_NAME = getProjectName();

// ── ANSI helpers ─────────────────────────────────────────────────────────────

const ESC = "\x1b";
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const RED = `${ESC}[31m`;
const CYAN = `${ESC}[36m`;
const MAGENTA = `${ESC}[35m`;
const WHITE = `${ESC}[37m`;
const BG_BLUE = `${ESC}[44m`;
const CLEAR = `${ESC}[2J${ESC}[H`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;

function color(c: string, text: string): string {
  return `${c}${text}${RESET}`;
}

function rpad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

function lpad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : " ".repeat(n - s.length) + s;
}

function dollar(n: number): string {
  return `$${n.toFixed(2)}`;
}

function kilo(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CostEntry {
  timestamp: string;
  service: string;
  model?: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd: number;
  durationMs?: number;
  userId?: number;
  route: string;
}

interface Aggregation {
  totalCost: number;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byService: Map<string, { calls: number; cost: number; tokens: number }>;
  byModel: Map<string, { calls: number; cost: number; tokens: number }>;
  byRoute: Map<string, { calls: number; cost: number; avgMs: number; totalMs: number }>;
  recent: CostEntry[];
}

type ViewMode = "all" | "today" | "1h";

// ── State ────────────────────────────────────────────────────────────────────

let entries: CostEntry[] = [];
let viewMode: ViewMode = "today";
let budgetIdx = 1; // default $20
let lastFileSize = 0;

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--since" && args[i + 1]) {
    const v = args[i + 1];
    if (v === "today") viewMode = "today";
    else if (v.endsWith("h")) viewMode = "1h";
    else viewMode = "today";
    i++;
  }
  if (args[i] === "--budget" && args[i + 1]) {
    const b = parseInt(args[i + 1], 10);
    const idx = BUDGET_OPTIONS.indexOf(b);
    if (idx >= 0) budgetIdx = idx;
    i++;
  }
}

// ── Data loading ─────────────────────────────────────────────────────────────

function loadEntries(): void {
  if (!fs.existsSync(LOG_FILE)) {
    entries = [];
    lastFileSize = 0;
    return;
  }

  const stat = fs.statSync(LOG_FILE);
  if (stat.size === lastFileSize) return; // no change

  try {
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    lastFileSize = stat.size;
    entries = content
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as CostEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is CostEntry => e !== null);
  } catch {
    // file may be being written to — retry next cycle
  }
}

function filterEntries(): CostEntry[] {
  const now = new Date();
  if (viewMode === "all") return entries;

  if (viewMode === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    return entries.filter((e) => e.timestamp >= startOfDay);
  }

  if (viewMode === "1h") {
    const oneHourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    return entries.filter((e) => e.timestamp >= oneHourAgo);
  }

  return entries;
}

function aggregate(filtered: CostEntry[]): Aggregation {
  const agg: Aggregation = {
    totalCost: 0,
    totalCalls: filtered.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    byService: new Map(),
    byModel: new Map(),
    byRoute: new Map(),
    recent: filtered.slice(-MAX_RECENT).reverse(),
  };

  for (const e of filtered) {
    agg.totalCost += e.estimatedCostUsd;
    agg.totalInputTokens += e.inputTokens ?? 0;
    agg.totalOutputTokens += e.outputTokens ?? 0;

    // By service
    const svc = agg.byService.get(e.service) ?? { calls: 0, cost: 0, tokens: 0 };
    svc.calls++;
    svc.cost += e.estimatedCostUsd;
    svc.tokens += (e.inputTokens ?? 0) + (e.outputTokens ?? 0);
    agg.byService.set(e.service, svc);

    // By model
    if (e.model) {
      const mdl = agg.byModel.get(e.model) ?? { calls: 0, cost: 0, tokens: 0 };
      mdl.calls++;
      mdl.cost += e.estimatedCostUsd;
      mdl.tokens += (e.inputTokens ?? 0) + (e.outputTokens ?? 0);
      agg.byModel.set(e.model, mdl);
    }

    // By route
    const rt = agg.byRoute.get(e.route) ?? { calls: 0, cost: 0, avgMs: 0, totalMs: 0 };
    rt.calls++;
    rt.cost += e.estimatedCostUsd;
    rt.totalMs += e.durationMs ?? 0;
    rt.avgMs = rt.totalMs / rt.calls;
    agg.byRoute.set(e.route, rt);
  }

  return agg;
}

// ── Rendering ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
  gemini: "Google Gemini",
  elevenlabs: "ElevenLabs (Voice)",
  replicate: "Replicate (Image)",
  resend: "Resend (Email)",
  twilio: "Twilio (SMS)",
  "document-ai": "Document AI",
  "google-maps": "Google Maps",
  perplexity: "Perplexity",
};

const SERVICE_COLORS: Record<string, string> = {
  anthropic: MAGENTA,
  openai: GREEN,
  gemini: CYAN,
  elevenlabs: YELLOW,
  replicate: RED,
  resend: WHITE,
  twilio: RED,
  "document-ai": CYAN,
  perplexity: CYAN,
};

function progressBar(ratio: number, width: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  const c = clamped < 0.5 ? GREEN : clamped < 0.8 ? YELLOW : RED;
  return `${c}${"▓".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}

function costColor(cost: number, budget: number): string {
  if (budget <= 0) return WHITE;
  const ratio = cost / budget;
  if (ratio < 0.5) return GREEN;
  if (ratio < 0.8) return YELLOW;
  return RED;
}

function render(agg: Aggregation): string {
  const W = 64;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const budget = BUDGET_OPTIONS[budgetIdx];
  const viewLabel = viewMode === "all" ? "All Time" : viewMode === "today" ? "Today" : "Last Hour";

  const lines: string[] = [];

  // Header
  lines.push(color(BOLD + BG_BLUE + WHITE, ` ${"API Cost Monitor".padEnd(W - 19)}Live • ${timeStr} `));
  lines.push(color(DIM, `  Project: ${PROJECT_NAME}    Log: ${path.basename(LOG_FILE)}`));
  lines.push("");

  // Summary
  const cc = budget > 0 ? costColor(agg.totalCost, budget) : GREEN;
  const totalStr = color(BOLD + cc, dollar(agg.totalCost));
  const callStr = color(DIM, `${agg.totalCalls} calls`);
  const tokenStr = color(DIM, `${kilo(agg.totalInputTokens + agg.totalOutputTokens)} tokens`);
  lines.push(`  ${color(BOLD, viewLabel + " Spend:")} ${totalStr}    ${callStr}    ${tokenStr}`);

  if (budget > 0) {
    const ratio = agg.totalCost / budget;
    const bar = progressBar(ratio, 30);
    const pct = `${Math.round(ratio * 100)}%`;
    lines.push(`  ${bar} ${lpad(pct, 4)} of ${dollar(budget)} budget`);
  }
  lines.push("");

  // By Service
  lines.push(color(BOLD, `  ${"SERVICE".padEnd(28)} ${"CALLS".padStart(6)} ${"TOKENS".padStart(9)} ${"COST".padStart(9)}`));
  lines.push(color(DIM, `  ${"─".repeat(W - 4)}`));

  const sortedServices = [...agg.byService.entries()].sort((a, b) => b[1].cost - a[1].cost);
  for (const [svc, data] of sortedServices) {
    const label = SERVICE_LABELS[svc] ?? svc;
    const sc = SERVICE_COLORS[svc] ?? WHITE;
    lines.push(
      `  ${color(sc, rpad(label, 28))} ${lpad(String(data.calls), 6)} ${lpad(kilo(data.tokens), 9)} ${lpad(dollar(data.cost), 9)}`
    );

    // Sub-models
    const models = [...agg.byModel.entries()]
      .filter(([m]) => {
        const lower = m.toLowerCase();
        if (svc === "anthropic") return lower.includes("claude");
        if (svc === "openai") return lower.includes("gpt");
        if (svc === "gemini") return lower.includes("gemini");
        if (svc === "perplexity") return lower.includes("sonar");
        return false;
      })
      .sort((a, b) => b[1].cost - a[1].cost);

    for (const [model, md] of models) {
      const shortName = model.replace(/^claude-/, "").replace(/^gpt-/, "").replace(/^gemini-/, "");
      lines.push(
        `  ${color(DIM, `  ${rpad(shortName, 26)}`)} ${lpad(String(md.calls), 6)} ${lpad(kilo(md.tokens), 9)} ${lpad(dollar(md.cost), 9)}`
      );
    }
  }

  if (sortedServices.length === 0) {
    lines.push(color(DIM, `  (no calls yet)`));
  }
  lines.push("");

  // By Route
  lines.push(color(BOLD, `  ${"ROUTE".padEnd(34)} ${"CALLS".padStart(6)} ${"AVG ms".padStart(8)} ${"COST".padStart(9)}`));
  lines.push(color(DIM, `  ${"─".repeat(W - 4)}`));

  const sortedRoutes = [...agg.byRoute.entries()].sort((a, b) => b[1].cost - a[1].cost).slice(0, 8);
  for (const [route, data] of sortedRoutes) {
    const avgStr = data.avgMs > 0 ? `${Math.round(data.avgMs).toLocaleString()}` : "—";
    lines.push(
      `  ${rpad(route, 34)} ${lpad(String(data.calls), 6)} ${lpad(avgStr, 8)} ${lpad(dollar(data.cost), 9)}`
    );
  }

  if (sortedRoutes.length === 0) {
    lines.push(color(DIM, `  (no calls yet)`));
  }
  lines.push("");

  // Recent calls
  lines.push(color(BOLD, `  RECENT CALLS`));
  lines.push(color(DIM, `  ${"─".repeat(W - 4)}`));

  if (agg.recent.length === 0) {
    lines.push(color(DIM, `  Waiting for API calls...`));
    lines.push(color(DIM, `  Log file: ${LOG_FILE}`));
  } else {
    for (const e of agg.recent) {
      const t = new Date(e.timestamp);
      const ts = t.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const sc = SERVICE_COLORS[e.service] ?? WHITE;
      const modelStr = e.model ? e.model.replace(/^claude-|^gpt-|^gemini-/g, "").slice(0, 18) : e.operation;
      lines.push(
        `  ${color(DIM, ts)}  ${color(sc, rpad(e.service, 12))} ${rpad(modelStr, 20)} ${lpad(dollar(e.estimatedCostUsd), 8)}`
      );
    }
  }
  lines.push("");

  // Footer
  lines.push(color(DIM, `  q quit  r reset  h view (${viewLabel})  b budget (${budget > 0 ? dollar(budget) : "off"})`));

  return lines.join("\n");
}

// ── Main loop ────────────────────────────────────────────────────────────────

function tick(): void {
  loadEntries();
  const filtered = filterEntries();
  const agg = aggregate(filtered);
  const screen = render(agg);
  process.stdout.write(CLEAR + screen);
}

// Keyboard input
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.on("keypress", (_ch, key) => {
  if (!key) return;
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    process.stdout.write(SHOW_CURSOR + "\n");
    process.exit(0);
  }
  if (key.name === "r") {
    entries = [];
    lastFileSize = 0;
    tick();
  }
  if (key.name === "h") {
    const modes: ViewMode[] = ["today", "1h", "all"];
    const idx = modes.indexOf(viewMode);
    viewMode = modes[(idx + 1) % modes.length];
    tick();
  }
  if (key.name === "b") {
    budgetIdx = (budgetIdx + 1) % BUDGET_OPTIONS.length;
    tick();
  }
});

// Graceful exit
process.on("SIGINT", () => {
  process.stdout.write(SHOW_CURSOR + "\n");
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.stdout.write(SHOW_CURSOR + "\n");
  process.exit(0);
});

// Start
process.stdout.write(HIDE_CURSOR);
tick();
setInterval(tick, REFRESH_MS);
