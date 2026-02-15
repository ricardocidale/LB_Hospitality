import { apiRequest } from "@/lib/queryClient";

interface BrandingData {
  userName: string;
  companyName: string;
  logoUrl: string | null;
}

interface ResearchExportOptions {
  type: "property" | "company" | "global";
  title: string;
  subtitle?: string;
  content: any;
  updatedAt?: string;
  llmModel?: string;
  promptConditions?: Record<string, any>;
  branding?: BrandingData;
}

async function fetchBranding(): Promise<BrandingData> {
  try {
    const res = await fetch("/api/branding", { credentials: "include" });
    if (res.ok) return await res.json();
  } catch {}
  return { userName: "", companyName: "Hospitality Business Group", logoUrl: null };
}

async function loadLogoImage(url: string): Promise<string | null> {
  try {
    if (url.startsWith("data:")) return url;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function brandedHeader(doc: any, pageW: number, height: number) {
  doc.setFillColor(26, 35, 50);
  doc.rect(0, 0, pageW, height, "F");
  doc.setFillColor(159, 188, 164);
  doc.rect(0, height - 4, pageW, 2, "F");
}

function addSectionHeader(doc: any, title: string, y: number, color: [number, number, number]): number {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...color);
  doc.text(title, 14, y);
  y += 2;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(14, y, 80, y);
  return y + 6;
}

function addParagraph(doc: any, text: string, y: number, pageW: number): number {
  if (!text) return y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(text, pageW - 28);
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(line, 14, y);
    y += 4.5;
  }
  return y + 2;
}

function addKeyValue(doc: any, label: string, value: string, y: number): number {
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(label + ":", 18, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(value || "N/A", 70, y);
  return y + 5;
}

function addBulletList(doc: any, items: string[], y: number, pageW: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  for (const item of items) {
    if (y > 275) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(`• ${item}`, pageW - 32);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 18, y);
      y += 4;
    }
    y += 1;
  }
  return y + 2;
}

function addTable(doc: any, autoTable: any, headers: string[], rows: string[][], y: number, color: [number, number, number]): number {
  if (y > 240) { doc.addPage(); y = 20; }
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: rows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    margin: { left: 14, right: 14 },
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

function renderPropertyResearch(doc: any, autoTable: any, content: any, y: number, pageW: number): number {
  if (content.marketOverview) {
    y = addSectionHeader(doc, "Market Overview", y, [37, 125, 65]);
    y = addParagraph(doc, content.marketOverview.summary, y, pageW);
    if (content.marketOverview.keyMetrics?.length) {
      y = addTable(doc, autoTable, ["Metric", "Value", "Source"],
        content.marketOverview.keyMetrics.map((m: any) => [m.label, m.value, m.source || ""]),
        y, [37, 125, 65]);
    }
  }

  if (content.stabilizationTimeline) {
    y = addSectionHeader(doc, "Stabilization Timeline", y, [217, 119, 6]);
    y = addParagraph(doc, content.stabilizationTimeline.summary, y, pageW);
    if (content.stabilizationTimeline.phases?.length) {
      y = addTable(doc, autoTable, ["Phase", "Duration", "Description", "Occupancy Target"],
        content.stabilizationTimeline.phases.map((p: any) => [p.phase, p.duration, p.description, p.occupancyTarget || ""]),
        y, [217, 119, 6]);
    }
    if (content.stabilizationTimeline.totalMonths) {
      y = addKeyValue(doc, "Total Months to Stabilization", content.stabilizationTimeline.totalMonths, y);
    }
  }

  if (content.adrAnalysis) {
    y = addSectionHeader(doc, "ADR Analysis", y, [59, 130, 246]);
    y = addKeyValue(doc, "Market Average ADR", content.adrAnalysis.marketAverage || "N/A", y);
    y = addKeyValue(doc, "Boutique Range", content.adrAnalysis.boutiqueRange || "N/A", y);
    y = addKeyValue(doc, "Recommended Range", content.adrAnalysis.recommendedRange || "N/A", y);
    y = addParagraph(doc, content.adrAnalysis.rationale, y, pageW);
    if (content.adrAnalysis.comparables?.length) {
      y = addTable(doc, autoTable, ["Property", "ADR", "Type"],
        content.adrAnalysis.comparables.map((c: any) => [c.name, c.adr, c.type || ""]),
        y, [59, 130, 246]);
    }
  }

  if (content.occupancyAnalysis) {
    y = addSectionHeader(doc, "Occupancy Analysis", y, [139, 92, 246]);
    y = addKeyValue(doc, "Market Average", content.occupancyAnalysis.marketAverage || "N/A", y);
    y = addKeyValue(doc, "Ramp-Up Timeline", content.occupancyAnalysis.rampUpTimeline || "N/A", y);
    if (content.occupancyAnalysis.seasonalPattern?.length) {
      y = addTable(doc, autoTable, ["Season", "Occupancy", "Notes"],
        content.occupancyAnalysis.seasonalPattern.map((s: any) => [s.season, s.occupancy, s.notes || ""]),
        y, [139, 92, 246]);
    }
  }

  if (content.eventDemand) {
    y = addSectionHeader(doc, "Event & Experience Demand", y, [244, 121, 91]);
    const eventTypes = [
      { key: "corporateEvents", label: "Corporate Events" },
      { key: "exoticEvents", label: "Exotic & Unique Events" },
      { key: "wellnessRetreats", label: "Wellness Retreats" },
      { key: "weddingsPrivate", label: "Weddings & Private" },
    ];
    for (const et of eventTypes) {
      if (content.eventDemand[et.key]) {
        y = addKeyValue(doc, et.label, "", y);
        y = addParagraph(doc, content.eventDemand[et.key], y, pageW);
      }
    }
    if (content.eventDemand.estimatedEventRevShare) {
      y = addKeyValue(doc, "Est. Event Revenue Share", content.eventDemand.estimatedEventRevShare, y);
    }
    if (content.eventDemand.keyDrivers?.length) {
      y = addBulletList(doc, content.eventDemand.keyDrivers, y, pageW);
    }
  }

  if (content.cateringAnalysis) {
    y = addSectionHeader(doc, "Catering & F&B Boost Analysis", y, [217, 70, 239]);
    y = addKeyValue(doc, "Recommended Boost", content.cateringAnalysis.recommendedBoostPercent || "N/A", y);
    y = addKeyValue(doc, "Market Range", content.cateringAnalysis.marketRange || "N/A", y);
    y = addParagraph(doc, content.cateringAnalysis.rationale, y, pageW);
    if (content.cateringAnalysis.factors?.length) {
      y = addBulletList(doc, content.cateringAnalysis.factors, y, pageW);
    }
  }

  if (content.capRateAnalysis) {
    y = addSectionHeader(doc, "Cap Rate Analysis", y, [8, 145, 178]);
    y = addKeyValue(doc, "Market Range", content.capRateAnalysis.marketRange || "N/A", y);
    y = addKeyValue(doc, "Boutique Range", content.capRateAnalysis.boutiqueRange || "N/A", y);
    y = addKeyValue(doc, "Recommended Range", content.capRateAnalysis.recommendedRange || "N/A", y);
    y = addParagraph(doc, content.capRateAnalysis.rationale, y, pageW);
    if (content.capRateAnalysis.comparables?.length) {
      y = addTable(doc, autoTable, ["Property", "Cap Rate", "Sale Year", "Notes"],
        content.capRateAnalysis.comparables.map((c: any) => [c.name, c.capRate, c.saleYear || "", c.notes || ""]),
        y, [8, 145, 178]);
    }
  }

  if (content.landValueAllocation) {
    y = addSectionHeader(doc, "Land Value Allocation", y, [120, 113, 108]);
    y = addKeyValue(doc, "Recommended Land %", content.landValueAllocation.recommendedPercent || "N/A", y);
    y = addKeyValue(doc, "Market Range", content.landValueAllocation.marketRange || "N/A", y);
    y = addKeyValue(doc, "Assessment Method", content.landValueAllocation.assessmentMethod || "N/A", y);
    y = addParagraph(doc, content.landValueAllocation.rationale, y, pageW);
    if (content.landValueAllocation.factors?.length) {
      y = addBulletList(doc, content.landValueAllocation.factors, y, pageW);
    }
  }

  if (content.competitiveSet?.length) {
    y = addSectionHeader(doc, "Competitive Set", y, [159, 188, 164]);
    y = addTable(doc, autoTable, ["Property", "Rooms", "ADR", "Positioning"],
      content.competitiveSet.map((c: any) => [c.name, String(c.rooms || ""), c.adr || "", c.positioning || ""]),
      y, [37, 125, 65]);
  }

  if (content.risks?.length) {
    y = addSectionHeader(doc, "Risks & Mitigations", y, [220, 38, 38]);
    y = addTable(doc, autoTable, ["Risk", "Mitigation"],
      content.risks.map((r: any) => [r.risk, r.mitigation]),
      y, [220, 38, 38]);
  }

  if (content.sources?.length) {
    y = addSectionHeader(doc, "Sources", y, [107, 114, 128]);
    y = addBulletList(doc, content.sources, y, pageW);
  }

  return y;
}

function renderGlobalResearch(doc: any, autoTable: any, content: any, y: number, pageW: number): number {
  if (content.industryOverview) {
    y = addSectionHeader(doc, "Industry Overview", y, [37, 125, 65]);
    if (content.industryOverview.marketSize) y = addKeyValue(doc, "Market Size", content.industryOverview.marketSize, y);
    if (content.industryOverview.growthRate) y = addKeyValue(doc, "Growth Rate", content.industryOverview.growthRate, y);
    if (content.industryOverview.boutiqueShare) y = addKeyValue(doc, "Boutique Share", content.industryOverview.boutiqueShare, y);
    if (content.industryOverview.keyTrends?.length) {
      y = addBulletList(doc, content.industryOverview.keyTrends, y, pageW);
    }
  }

  if (content.eventHospitality) {
    y = addSectionHeader(doc, "Event Hospitality", y, [217, 119, 6]);
    const segments = ["wellnessRetreats", "corporateEvents", "yogaRetreats", "relationshipRetreats"];
    for (const seg of segments) {
      const data = content.eventHospitality[seg];
      if (data) {
        const label = seg.replace(/([A-Z])/g, ' $1').trim();
        if (data.marketSize) y = addKeyValue(doc, `${label} — Market Size`, data.marketSize, y);
        if (data.growth) y = addKeyValue(doc, `${label} — Growth`, data.growth, y);
      }
    }
  }

  if (content.financialBenchmarks) {
    y = addSectionHeader(doc, "Financial Benchmarks", y, [59, 130, 246]);
    if (content.financialBenchmarks.adrTrends?.length) {
      y = addTable(doc, autoTable, ["Year", "National", "Boutique", "Luxury"],
        content.financialBenchmarks.adrTrends.map((t: any) => [t.year, t.national, t.boutique || "", t.luxury || ""]),
        y, [59, 130, 246]);
    }
    if (content.financialBenchmarks.occupancyTrends?.length) {
      y = addTable(doc, autoTable, ["Year", "National", "Boutique", "Luxury"],
        content.financialBenchmarks.occupancyTrends.map((t: any) => [t.year, t.national, t.boutique || "", t.luxury || ""]),
        y, [59, 130, 246]);
    }
  }

  if (content.investmentReturns) {
    y = addSectionHeader(doc, "Investment Returns", y, [8, 145, 178]);
    if (content.investmentReturns.capRates) {
      const cr = content.investmentReturns.capRates;
      if (cr.economyMidscale) y = addKeyValue(doc, "Economy/Midscale Cap Rate", cr.economyMidscale, y);
      if (cr.upscale) y = addKeyValue(doc, "Upscale Cap Rate", cr.upscale, y);
      if (cr.luxury) y = addKeyValue(doc, "Luxury Cap Rate", cr.luxury, y);
      if (cr.boutique) y = addKeyValue(doc, "Boutique Cap Rate", cr.boutique, y);
    }
  }

  if (content.debtMarket) {
    y = addSectionHeader(doc, "Debt Market", y, [139, 92, 246]);
    if (content.debtMarket.currentConditions) y = addParagraph(doc, content.debtMarket.currentConditions, y, pageW);
    if (content.debtMarket.typicalTerms?.length) {
      y = addTable(doc, autoTable, ["Term", "Value"],
        content.debtMarket.typicalTerms.map((t: any) => [t.term, t.value]),
        y, [139, 92, 246]);
    }
  }

  if (content.emergingTrends?.length) {
    y = addSectionHeader(doc, "Emerging Trends", y, [217, 70, 239]);
    y = addBulletList(doc, content.emergingTrends.map((t: any) => typeof t === 'string' ? t : `${t.trend}: ${t.description}`), y, pageW);
  }

  if (content.sources?.length) {
    y = addSectionHeader(doc, "Sources", y, [107, 114, 128]);
    y = addBulletList(doc, content.sources, y, pageW);
  }

  return y;
}

function renderCompanyResearch(doc: any, autoTable: any, content: any, y: number, pageW: number): number {
  if (content.managementFees) {
    y = addSectionHeader(doc, "Management Fees", y, [37, 125, 65]);
    if (content.managementFees.baseFee) {
      const bf = content.managementFees.baseFee;
      y = addKeyValue(doc, "Industry Range", bf.industryRange || "N/A", y);
      y = addKeyValue(doc, "Boutique Range", bf.boutiqueRange || "N/A", y);
      y = addKeyValue(doc, "Recommended", bf.recommended || "N/A", y);
      if (bf.gaapReference) y = addKeyValue(doc, "GAAP Reference", bf.gaapReference, y);
    }
    if (content.managementFees.incentiveFee) {
      y += 2;
      const inf = content.managementFees.incentiveFee;
      y = addKeyValue(doc, "Incentive Fee Range", inf.industryRange || "N/A", y);
      y = addKeyValue(doc, "Common Basis", inf.commonBasis || "N/A", y);
      y = addKeyValue(doc, "Recommended", inf.recommended || "N/A", y);
    }
  }

  if (content.gaapStandards?.length) {
    y = addSectionHeader(doc, "GAAP Standards", y, [59, 130, 246]);
    y = addTable(doc, autoTable, ["Standard", "Reference", "Application"],
      content.gaapStandards.map((s: any) => [s.standard, s.reference, s.application]),
      y, [59, 130, 246]);
  }

  if (content.industryBenchmarks) {
    y = addSectionHeader(doc, "Industry Benchmarks", y, [139, 92, 246]);
    if (content.industryBenchmarks.operatingExpenseRatios?.length) {
      y = addTable(doc, autoTable, ["Category", "Range", "Source"],
        content.industryBenchmarks.operatingExpenseRatios.map((r: any) => [r.category, r.range, r.source || ""]),
        y, [139, 92, 246]);
    }
  }

  if (content.compensationBenchmarks) {
    y = addSectionHeader(doc, "Compensation Benchmarks", y, [217, 119, 6]);
    const cb = content.compensationBenchmarks;
    if (cb.gm) y = addKeyValue(doc, "General Manager", cb.gm, y);
    if (cb.director) y = addKeyValue(doc, "Director", cb.director, y);
    if (cb.manager) y = addKeyValue(doc, "Manager", cb.manager, y);
    if (cb.source) y = addKeyValue(doc, "Source", cb.source, y);
  }

  if (content.contractTerms?.length) {
    y = addSectionHeader(doc, "Contract Terms", y, [8, 145, 178]);
    y = addTable(doc, autoTable, ["Term", "Typical", "Notes"],
      content.contractTerms.map((t: any) => [t.term, t.typical, t.notes || ""]),
      y, [8, 145, 178]);
  }

  if (content.sources?.length) {
    y = addSectionHeader(doc, "Sources", y, [107, 114, 128]);
    y = addBulletList(doc, content.sources, y, pageW);
  }

  return y;
}

function renderPromptConditions(doc: any, conditions: Record<string, any>, y: number, pageW: number): number {
  y = addSectionHeader(doc, "Research Conditions", y, [100, 100, 120]);

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y - 2, pageW - 28, 4, 1, 1, "F");

  if (conditions.generatedAt) {
    const d = new Date(conditions.generatedAt);
    y = addKeyValue(doc, "Generated", d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }), y);
  }
  if (conditions.llmModel) y = addKeyValue(doc, "AI Model", conditions.llmModel, y);
  if (conditions.propertyLabel) y = addKeyValue(doc, "Property Type", conditions.propertyLabel, y);
  if (conditions.inflationRate !== undefined) y = addKeyValue(doc, "Inflation Rate", `${conditions.inflationRate}%`, y);
  if (conditions.projectionYears) y = addKeyValue(doc, "Projection Years", String(conditions.projectionYears), y);
  if (conditions.timeHorizon) y = addKeyValue(doc, "Time Horizon", conditions.timeHorizon, y);

  if (conditions.propertyContext) {
    const pc = conditions.propertyContext;
    const parts = [];
    if (pc.name) parts.push(pc.name);
    if (pc.location) parts.push(pc.location);
    if (pc.market) parts.push(pc.market);
    if (pc.roomCount) parts.push(`${pc.roomCount} rooms`);
    if (pc.startAdr) parts.push(`$${pc.startAdr} ADR`);
    if (parts.length) y = addKeyValue(doc, "Property", parts.join(" · "), y);
  }

  if (conditions.assetDefinition) {
    const ad = conditions.assetDefinition;
    const parts = [];
    if (ad.level) parts.push(`Tier: ${ad.level}`);
    if (ad.minRooms && ad.maxRooms) parts.push(`${ad.minRooms}–${ad.maxRooms} rooms`);
    if (ad.minAdr && ad.maxAdr) parts.push(`$${ad.minAdr}–$${ad.maxAdr} ADR`);
    if (ad.hasFB) parts.push("F&B");
    if (ad.hasEvents) parts.push("Events");
    if (ad.hasWellness) parts.push("Wellness");
    if (parts.length) y = addKeyValue(doc, "Asset Definition", parts.join(", "), y);
  }

  if (conditions.focusAreas?.length) {
    y = addKeyValue(doc, "Focus Areas", conditions.focusAreas.join(", "), y);
  }
  if (conditions.regions?.length) {
    y = addKeyValue(doc, "Target Regions", conditions.regions.join(", "), y);
  }
  if (conditions.customQuestions) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Custom Research Questions:", 18, y);
    y += 4;
    const questions = conditions.customQuestions.split("\n").filter((q: string) => q.trim());
    y = addBulletList(doc, questions, y, pageW);
  }

  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageW - 14, y);
  return y + 6;
}

async function buildResearchDoc(options: ResearchExportOptions) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const branding = options.branding || await fetchBranding();

  let logoDataUrl: string | null = null;
  if (branding.logoUrl) {
    logoDataUrl = await loadLogoImage(branding.logoUrl);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  const headerH = 60;
  brandedHeader(doc, pageW, headerH);

  const textStartX = 14;
  let logoEndX = textStartX;

  if (logoDataUrl) {
    try {
      const logoH = 18;
      const logoW = 18;
      doc.addImage(logoDataUrl, "PNG", 14, 8, logoW, logoH);
      logoEndX = 14 + logoW + 4;
    } catch {
      logoEndX = textStartX;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(branding.companyName, logoEndX, 20);

  if (branding.userName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 210, 220);
    doc.text(`Prepared for: ${branding.userName}`, logoEndX, 26);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(159, 188, 164);
  doc.text(options.title, 14, 38);
  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(options.subtitle, 14, 45);
  }
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  const now = new Date();
  const dateTimeStr = now.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  const meta = [`Generated: ${dateTimeStr}`];
  if (options.updatedAt) {
    const resDate = new Date(options.updatedAt);
    meta.push(`Research date: ${resDate.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}`);
  }
  if (options.llmModel) meta.push(`Model: ${options.llmModel}`);
  doc.text(meta.join(" | "), 14, 54);

  let y = 70;

  if (options.promptConditions) {
    y = renderPromptConditions(doc, options.promptConditions, y, pageW);
  }

  if (options.type === "property") {
    y = renderPropertyResearch(doc, autoTable, options.content, y, pageW);
  } else if (options.type === "global") {
    y = renderGlobalResearch(doc, autoTable, options.content, y, pageW);
  } else if (options.type === "company") {
    y = renderCompanyResearch(doc, autoTable, options.content, y, pageW);
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(26, 35, 50);
    doc.rect(0, pageH - 14, pageW, 14, "F");
    doc.setFillColor(159, 188, 164);
    doc.rect(0, pageH - 14, pageW, 0.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 190, 200);
    doc.text(`${branding.companyName} — Confidential`, 14, pageH - 6);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(159, 188, 164);
    doc.text("Powered by Norfolk AI", pageW / 2, pageH - 6, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 190, 200);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 6, { align: "right" });
  }

  return doc;
}

export async function downloadResearchPDF(options: ResearchExportOptions): Promise<void> {
  const doc = await buildResearchDoc(options);
  const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, "_")}_Research.pdf`;
  doc.save(filename);
}

export async function emailResearchPDF(options: ResearchExportOptions): Promise<{ success: boolean; error?: string }> {
  const doc = await buildResearchDoc(options);
  const arrayBuf = doc.output("arraybuffer");
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, "_")}_Research.pdf`;

  const res = await apiRequest("POST", "/api/email-research-pdf", {
    pdfBase64: base64,
    filename,
    subject: `${options.title} — AI Research Report`,
    researchType: options.type,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Email failed" }));
    return { success: false, error: err.error };
  }
  return { success: true };
}
