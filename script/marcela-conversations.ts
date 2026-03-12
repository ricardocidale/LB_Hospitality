import { apiCall, adminLogin } from "./lib/http-client.js";
import { header, footer } from "./lib/formatter.js";

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}`;
const ADMIN_PASSWORD = process.env.PASSWORD_ADMIN || process.env.ADMIN_PASSWORD || "admin";

header("Marcela Conversation Stats", 50);

const cookie = adminLogin(BASE, ADMIN_PASSWORD);
if (!cookie) {
  console.log("  \u2717 Could not authenticate as admin");
  process.exit(1);
}

const convRes = apiCall("GET", "/api/conversations", undefined, cookie);
if (convRes.status !== 200) {
  console.log(`  \u2717 Failed to fetch conversations (HTTP ${convRes.status})`);
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
  const icon = channel === "phone" ? "\u260e\ufe0f" : channel === "sms" ? "\ud83d\udcac" : "\ud83c\udf10";
  console.log(`  ${icon} ${channel.toUpperCase()}: ${convs.length} conversations`);
  if (convs.length > 0) {
    const recent = convs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
    for (const c of recent) {
      const date = new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      console.log(`     ${date} \u2014 ${c.title.slice(0, 50)}`);
    }
  }
}

const twilioRes = apiCall("GET", "/api/admin/twilio-status", undefined, cookie);
console.log("");
if (twilioRes.status === 200) {
  const status = JSON.parse(twilioRes.body);
  console.log(`  Twilio: ${status.connected ? "\u2713 Connected" : "\u2717 Not connected"}${status.phoneNumber ? ` (${status.phoneNumber})` : ""}${status.error ? ` \u2014 ${status.error}` : ""}`);
} else {
  console.log(`  Twilio: Could not check status (HTTP ${twilioRes.status})`);
}

console.log("");
footer(50);
