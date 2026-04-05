import { isIP } from "net";

const BLOCKED_HOSTS = new Set([
  "metadata.google.internal",
  "localhost",
]);

function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isInCIDR(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const mask = (~0 << (32 - Number(bits))) >>> 0;
  return (ipToLong(ip) & mask) === (ipToLong(base) & mask);
}

const PRIVATE_CIDRS = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "0.0.0.0/8",
];

function stripIPv6Prefix(hostname: string): string {
  const bracket = hostname.replace(/^\[|\]$/g, "");
  if (bracket.startsWith("::ffff:")) {
    return bracket.slice(7);
  }
  return bracket;
}

export function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (hostname.endsWith(".internal")) return true;

  const stripped = stripIPv6Prefix(hostname);

  if (stripped === "::1" || stripped === "::") return true;

  if (isIP(stripped) === 4) {
    return PRIVATE_CIDRS.some((cidr) => isInCIDR(stripped, cidr));
  }

  if (isIP(hostname.replace(/^\[|\]$/g, "")) === 6) {
    const clean = hostname.replace(/^\[|\]$/g, "");
    if (clean === "::1" || clean === "::" || clean.startsWith("fe80:") || clean.startsWith("fc") || clean.startsWith("fd")) {
      return true;
    }
  }

  return false;
}
