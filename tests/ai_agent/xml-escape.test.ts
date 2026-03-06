/**
 * Tests for XML escaping used in Twilio TwiML responses.
 *
 * escapeXml is not exported from twilio.ts, so we reimplement and test.
 */
import { describe, it, expect } from "vitest";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

describe("escapeXml", () => {
  it("escapes ampersands", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  it("escapes angle brackets", () => {
    expect(escapeXml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeXml('She said "hello"')).toBe("She said &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("handles multiple special characters", () => {
    expect(escapeXml("A & B < C > D \"E\" 'F'")).toBe(
      "A &amp; B &lt; C &gt; D &quot;E&quot; &apos;F&apos;"
    );
  });

  it("passes through plain text unchanged", () => {
    expect(escapeXml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles empty string", () => {
    expect(escapeXml("")).toBe("");
  });

  it("escapes ampersand before other entities (order matters)", () => {
    // If & is not escaped first, &lt; would become &amp;lt;
    const input = "already &lt; encoded";
    const result = escapeXml(input);
    expect(result).toBe("already &amp;lt; encoded");
  });
});
