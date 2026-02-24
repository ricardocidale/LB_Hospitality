import * as fs from "fs";
import * as path from "path";

const adminDir = path.join(__dirname, "../client/src/components/admin");
const adminPage = path.join(__dirname, "../client/src/pages/Admin.tsx");

console.log("\n  Admin Refactor Verification");
console.log(`  ${"─".repeat(50)}`);

const adminContent = fs.readFileSync(adminPage, "utf-8");
const adminLines = adminContent.split("\n").length;
console.log(`  Admin.tsx: ${adminLines} lines`);

const expectedTabs = [
  "UsersTab.tsx",
  "CompaniesTab.tsx",
  "ActivityTab.tsx",
  "VerificationTab.tsx",
  "LogosTab.tsx",
  "UserGroupsTab.tsx",
  "BrandingTab.tsx",
  "ThemesTab.tsx",
  "NavigationTab.tsx",
  "DatabaseTab.tsx",
];

const typesFile = path.join(adminDir, "types.ts");
const hasTypes = fs.existsSync(typesFile);
console.log(`  types.ts: ${hasTypes ? "EXISTS" : "MISSING"}`);

let totalTabLines = 0;
let missing: string[] = [];
let created: string[] = [];

for (const tab of expectedTabs) {
  const tabPath = path.join(adminDir, tab);
  if (fs.existsSync(tabPath)) {
    const lines = fs.readFileSync(tabPath, "utf-8").split("\n").length;
    totalTabLines += lines;
    created.push(`${tab} (${lines} lines)`);
  } else {
    missing.push(tab);
  }
}

console.log(`\n  Created (${created.length}/${expectedTabs.length}):`);
for (const c of created) console.log(`    ✓ ${c}`);

if (missing.length > 0) {
  console.log(`\n  Missing (${missing.length}):`);
  for (const m of missing) console.log(`    ✗ ${m}`);
}

const testIdPattern = /data-testid="([^"]+)"/g;
const adminTestIds = new Set<string>();
let match;
while ((match = testIdPattern.exec(adminContent)) !== null) {
  adminTestIds.add(match[1]);
}

let allTabContent = "";
for (const tab of expectedTabs) {
  const tabPath = path.join(adminDir, tab);
  if (fs.existsSync(tabPath)) {
    allTabContent += fs.readFileSync(tabPath, "utf-8");
  }
}

const tabTestIds = new Set<string>();
const tabTestIdPattern = /data-testid="([^"]+)"/g;
while ((match = tabTestIdPattern.exec(allTabContent)) !== null) {
  tabTestIds.add(match[1]);
}

const allTestIds = new Set([...adminTestIds, ...tabTestIds]);
console.log(`\n  Test IDs: ${allTestIds.size} total (${adminTestIds.size} in Admin.tsx, ${tabTestIds.size} in tab components)`);

console.log(`\n  Summary:`);
console.log(`    Admin.tsx: ${adminLines} lines`);
console.log(`    Tab components: ${totalTabLines} lines total`);
console.log(`    Types file: ${hasTypes ? "present" : "MISSING"}`);
console.log(`    Target: Admin.tsx < 250 lines`);
console.log(`    Status: ${adminLines < 250 && missing.length === 0 ? "COMPLETE" : "IN PROGRESS"}`);
console.log(`  ${"─".repeat(50)}\n`);

process.exit(missing.length === 0 && adminLines < 250 ? 0 : 1);
