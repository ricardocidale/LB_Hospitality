import { execSync } from "child_process";

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = process.env.PASSWORD_ADMIN || process.env.ADMIN_PASSWORD || "admin";

function api(method: string, path: string, body?: unknown, cookie?: string): { status: number; body: string } {
  try {
    const args = ["-s", "-w", "\n%{http_code}", "-X", method];
    if (cookie) args.push("-H", `Cookie: ${cookie}`);
    if (body) {
      args.push("-H", "Content-Type: application/json", "-d", JSON.stringify(body));
    }
    const raw = execSync(`curl ${args.map(a => `'${a}'`).join(" ")} '${BASE}${path}'`, { timeout: 10000 }).toString();
    const lines = raw.trim().split("\n");
    const status = parseInt(lines[lines.length - 1]);
    const responseBody = lines.slice(0, -1).join("\n");
    return { status, body: responseBody };
  } catch {
    return { status: 0, body: "" };
  }
}

function login(): string | null {
  try {
    const raw = execSync(
      `curl -s -D - -X POST -H 'Content-Type: application/json' -d '{"email":"admin","password":"${ADMIN_PASSWORD}"}' '${BASE}/api/auth/admin-login'`,
      { timeout: 10000 }
    ).toString();
    const setCookie = raw.match(/set-cookie:\s*([^\r\n]+)/i);
    if (setCookie) {
      const sid = setCookie[1].split(";")[0];
      return sid;
    }
    return null;
  } catch {
    return null;
  }
}

console.log("  Marcela Conversation Stats");
console.log("  " + "─".repeat(50));

const cookie = login();
if (!cookie) {
  console.log("  ✗ Could not authenticate as admin");
  process.exit(1);
}

const convRes = api("GET", "/api/conversations", undefined, cookie);
if (convRes.status !== 200) {
  console.log(`  ✗ Failed to fetch conversations (HTTP ${convRes.status})`);
  process.exit(1);
}

interface Conv {
  id: number;
  title: string;
  channel?: string;
  createdAt: string;
}

const conversations: Conv[] = JSON.parse(convRes.body);

const byChannel: Record<string, Conv[]> = { web: [], phone: [], sms: [] };
for (const c of conversations) {
  const ch = c.channel || "web";
  if (!byChannel[ch]) byChannel[ch] = [];
  byChannel[ch].push(c);
}

console.log(`\n  Total conversations: ${conversations.length}`);
console.log("");

for (const [channel, convs] of Object.entries(byChannel)) {
  const icon = channel === "phone" ? "📞" : channel === "sms" ? "💬" : "🌐";
  console.log(`  ${icon} ${channel.toUpperCase()}: ${convs.length} conversations`);
  if (convs.length > 0) {
    const recent = convs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
    for (const c of recent) {
      const date = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      console.log(`     ${date} — ${c.title.slice(0, 50)}`);
    }
  }
}

const twilioRes = api("GET", "/api/admin/twilio-status", undefined, cookie);
console.log("");
if (twilioRes.status === 200) {
  const status = JSON.parse(twilioRes.body);
  console.log(`  Twilio: ${status.connected ? "✓ Connected" : "✗ Not connected"}${status.phoneNumber ? ` (${status.phoneNumber})` : ""}${status.error ? ` — ${status.error}` : ""}`);
} else {
  console.log(`  Twilio: Could not check status (HTTP ${twilioRes.status})`);
}

console.log("\n  " + "─".repeat(50));
