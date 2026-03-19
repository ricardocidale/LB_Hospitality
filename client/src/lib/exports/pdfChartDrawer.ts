/**
 * pdfChartDrawer.ts — High-fidelity line charts for jsPDF documents
 *
 * Renders charts that closely match the on-screen Recharts appearance:
 *   - Catmull-Rom smooth bezier curves (not straight segments)
 *   - Gradient-style area fill under each line (light tint of series colour)
 *   - Large data-point markers: white outer ring + filled inner circle
 *   - Plot-area background with alternating band shading
 *   - Legend rendered as a short line segment + marker + label
 *   - Card background with drop-shadow simulation and rounded corners
 */

interface ChartData {
  label: string;
  value: number;
}

interface ChartSeries {
  name: string;
  data: ChartData[];
  color: string;
}

interface DrawChartOptions {
  doc: any;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  series: ChartSeries[];
  formatValue?: (value: number) => string;
}

interface Point {
  x: number;
  y: number;
}

export function drawLineChart(options: DrawChartOptions): void {
  const {
    doc: docAny,
    x, y, width, height,
    title, series,
    formatValue = (v) => `$${(v / 1_000_000).toFixed(1)}M`,
  } = options;
  const doc = docAny as any;

  // ── Card: drop-shadow simulation ──────────────────────────────────────────
  doc.setFillColor(210, 212, 218);
  doc.roundedRect(x + 0.6, y + 0.6, width, height, 2, 2, "F");

  // ── Card: white background ────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, "F");

  doc.setDrawColor(218, 220, 228);
  doc.setLineWidth(0.15);
  doc.roundedRect(x, y, width, height, 2, 2, "S");

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text(title, x + width / 2, y + 9, { align: "center" });

  // ── Layout constants ──────────────────────────────────────────────────────
  const legendH   = 14;
  const xAxisH    = 11;
  const yAxisW    = 34;
  const topPad    = 16;
  const rightPad  = 8;

  const cX = x + yAxisW;
  const cY = y + topPad;
  const cW = width  - yAxisW - rightPad;
  const cH = height - topPad - xAxisH - legendH;

  // ── Plot-area background ──────────────────────────────────────────────────
  doc.setFillColor(248, 249, 251);
  doc.rect(cX, cY, cW, cH, "F");

  // ── Value range ───────────────────────────────────────────────────────────
  let minVal =  Infinity;
  let maxVal = -Infinity;
  series.forEach(s => s.data.forEach(d => {
    if (d.value < minVal) minVal = d.value;
    if (d.value > maxVal) maxVal = d.value;
  }));
  const range = maxVal - minVal || 1;
  minVal = Math.max(0, minVal - range * 0.05);
  maxVal = maxVal + range * 0.05;

  const toY = (val: number) =>
    cY + cH - ((val - minVal) / (maxVal - minVal)) * cH;

  const toX = (i: number, total: number) =>
    cX + (i / Math.max(total - 1, 1)) * cW;

  // ── Grid: alternating bands + lines ──────────────────────────────────────
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const gy   = cY + cH - (i / gridCount) * cH;
    const band = cH / gridCount;

    if (i < gridCount) {
      const shade = i % 2 === 0 ? [246, 247, 250] : [251, 251, 253];
      doc.setFillColor(shade[0], shade[1], shade[2]);
      doc.rect(cX, gy - band, cW, band, "F");
    }

    doc.setDrawColor(218, 220, 228);
    doc.setLineWidth(0.12);
    doc.setLineDashPattern(i === 0 ? [] : [1.5, 1.5], 0);
    doc.line(cX, gy, cX + cW, gy);

    const val = minVal + (i / gridCount) * (maxVal - minVal);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(145, 145, 158);
    doc.text(formatValue(val), cX - 2, gy + 1.5, { align: "right" });
  }
  doc.setLineDashPattern([], 0);

  // ── X-axis labels ─────────────────────────────────────────────────────────
  if (series.length > 0 && series[0].data.length > 0) {
    const n = series[0].data.length;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(145, 145, 158);
    series[0].data.forEach((d, i) => {
      doc.text(String(d.label), toX(i, n), cY + cH + 6, { align: "center" });
    });
  }

  // ── Build bezier path for a series (Catmull-Rom → cubic Bezier) ───────────
  const buildBezierSegments = (pts: Point[]): number[][] => {
    const segs: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const tension = 0.18;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      segs.push([
        cp1x - p1.x, cp1y - p1.y,
        cp2x - p1.x, cp2y - p1.y,
        p2.x  - p1.x, p2.y  - p1.y,
      ]);
    }
    return segs;
  };

  // ── Area fills (drawn below lines) ───────────────────────────────────────
  series.forEach(s => {
    if (s.data.length < 2) return;
    const [r, g, b] = hexToRgb(s.color);

    const n    = s.data.length;
    const pts  = s.data.map((d, i) => ({ x: toX(i, n), y: toY(d.value) }));
    const baseY = cY + cH;

    // Light tint: blend 88 % toward white
    const lr = Math.round(r + (255 - r) * 0.88);
    const lg = Math.round(g + (255 - g) * 0.88);
    const lb = Math.round(b + (255 - b) * 0.88);
    doc.setFillColor(lr, lg, lb);
    doc.setDrawColor(lr, lg, lb);

    const segments: number[][] = [];
    // Step 1: rise from baseline to first point
    segments.push([0, -(baseY - pts[0].y)]);
    // Step 2: smooth curve through data points
    segments.push(...buildBezierSegments(pts));
    // Step 3: drop back to baseline
    segments.push([0, baseY - pts[n - 1].y]);
    // Step 4: close along the baseline
    segments.push([pts[0].x - pts[n - 1].x, 0]);

    doc.lines(segments, pts[0].x, baseY, [1, 1], "F", true);
  });

  // ── Lines (smooth bezier, drawn over fills) ───────────────────────────────
  series.forEach(s => {
    if (s.data.length < 2) return;
    const [r, g, b] = hexToRgb(s.color);

    const n   = s.data.length;
    const pts = s.data.map((d, i) => ({ x: toX(i, n), y: toY(d.value) }));

    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1.4);

    doc.lines(buildBezierSegments(pts), pts[0].x, pts[0].y, [1, 1], "S", false);

    // ── Data-point markers: white outer ring + filled inner circle ──────────
    pts.forEach(p => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.6);
      doc.circle(p.x, p.y, 2.4, "FD");

      doc.setFillColor(r, g, b);
      doc.circle(p.x, p.y, 1.3, "F");
    });
  });

  // ── Plot-area border (on top of fills) ───────────────────────────────────
  doc.setDrawColor(208, 210, 218);
  doc.setLineWidth(0.15);
  doc.rect(cX, cY, cW, cH, "S");

  // ── Legend: line segment + marker + name ─────────────────────────────────
  const legY = y + height - 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  const itemWidths = series.map(s => {
    const tw = doc.getTextWidth(s.name) * (7 / doc.getFontSize());
    return tw + 17;
  });
  const totalLegW = itemWidths.reduce((a, b) => a + b, 0) - 2;
  let legX = x + (width - totalLegW) / 2;

  series.forEach((s, idx) => {
    const [r, g, b] = hexToRgb(s.color);

    // Line segment
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1.4);
    doc.line(legX, legY, legX + 9, legY);

    // Centre marker
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.6);
    doc.circle(legX + 4.5, legY, 2.0, "FD");
    doc.setFillColor(r, g, b);
    doc.circle(legX + 4.5, legY, 1.1, "F");

    // Label
    doc.setTextColor(55, 55, 65);
    doc.text(s.name, legX + 11, legY + 0.9);

    legX += itemWidths[idx];
  });
}

/** Convert "#RRGGBB" to [R, G, B]. Returns [0, 0, 0] for unrecognised input. */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [0, 0, 0];
}
