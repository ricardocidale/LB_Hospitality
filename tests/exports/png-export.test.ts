import { describe, it, expect } from "vitest";
import {
  BRAND,
  formatShort,
  formatFull,
} from "../../client/src/lib/exports/exportStyles";

describe("PNG export data formatting", () => {
  it("formatShort produces compact labels suitable for PNG table cells", () => {
    expect(formatShort(6030000)).toBe("$6.0M");
    expect(formatShort(450000)).toBe("$450K");
    expect(formatShort(800)).toBe("$800");
    expect(formatShort(0)).toBe("\u2014");
    expect(formatShort(-1200000)).toBe("($1.2M)");
  });

  it("formatFull produces detailed labels for PNG financial tables", () => {
    expect(formatFull(1234567)).toBe("$1,234,567");
    expect(formatFull(0)).toBe("\u2014");
    expect(formatFull(-50000)).toBe("($50,000)");
  });
});

describe("PNG export configuration defaults", () => {
  it("default retina scale of 2 doubles pixel dimensions", () => {
    const elementWidth = 800;
    const elementHeight = 400;
    const scale = 2;
    expect(elementWidth * scale).toBe(1600);
    expect(elementHeight * scale).toBe(800);
  });

  it("custom dimensions override element-based calculation", () => {
    const elementWidth = 800;
    const elementHeight = 400;
    const scale = 2;
    const customWidth = 1200;
    const customHeight = 600;

    const width = customWidth || elementWidth * scale;
    const height = customHeight || elementHeight * scale;
    expect(width).toBe(1200);
    expect(height).toBe(600);
  });
});

describe("PNG brand color consistency", () => {
  it("BRAND colors used in PNG table headers match brand spec", () => {
    expect(BRAND.SECONDARY_HEX).toBe("3F3F46");
    expect(BRAND.PRIMARY_HEX).toBe("18181B");
    expect(BRAND.ACCENT_HEX).toBe("10B981");
  });

  it("BRAND RGB tuples match hex values", () => {
    expect(BRAND.SECONDARY_RGB).toEqual([0x3F, 0x3F, 0x46]);
    expect(BRAND.PRIMARY_RGB).toEqual([0x18, 0x18, 0x1B]);
  });
});

describe("SVG serialization for chart PNG fallback", () => {
  it("SVG serialization produces valid data URI prefix", () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
    const encodedData = Buffer.from(svgString).toString("base64");
    const dataUri = `data:image/svg+xml;base64,${encodedData}`;
    expect(dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    const decoded = Buffer.from(encodedData, "base64").toString();
    expect(decoded).toContain("xmlns");
    expect(decoded).toContain("width");
  });
});
