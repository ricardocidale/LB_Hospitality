import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, isApiRateLimited } from "../auth";
import { logAndSendError } from "./helpers";
import { getAnthropicClient } from "../ai/clients";

interface IcpLocationCity {
  name: string;
  radius: number;
}

interface IcpLocation {
  id: string;
  country: string;
  countryCode: string;
  states: string[];
  cities: IcpLocationCity[];
  notes: string;
}

interface IcpResearchReport {
  generatedAt: string;
  model: string;
  sections: IcpResearchSection[];
  extractedMetrics: Record<string, any>;
}

interface IcpResearchSection {
  title: string;
  locationKey?: string;
  content: string;
}

function buildIcpResearchPrompt(
  icpConfig: Record<string, any>,
  assetDescription: string,
  propertyLabel: string,
): string {
  const locations = (icpConfig._locations || []) as IcpLocation[];
  const descriptive = icpConfig._descriptive || {};
  const sources = icpConfig._sources as { urls?: any[]; files?: any[] } | undefined;

  const locationBlock = locations.length > 0
    ? locations.map((loc) => {
        const cities = loc.cities.map((c) => `${c.name} (${c.radius}mi radius)`).join(", ");
        const notes = loc.notes ? `\n  Additional context: ${loc.notes}` : "";
        return `- ${loc.country} > ${loc.states.join(", ")} > Cities: ${cities}${notes}`;
      }).join("\n")
    : "No specific locations defined.";

  let sourcesBlock = "";
  if (sources) {
    const urlList = (sources.urls || []).map((u: any) => `- ${u.label}: ${u.url}`).join("\n");
    const fileList = (sources.files || []).map((f: any) => {
      if (f.origin === "google-drive" && f.driveUrl) return `- [Google Drive] ${f.name}: ${f.driveUrl}`;
      return `- [Uploaded] ${f.name}`;
    }).join("\n");
    if (urlList || fileList) {
      sourcesBlock = `\n═══ REFERENCE SOURCES ═══\nThe user has provided the following reference sources. Incorporate relevant data, statistics, and insights from these sources into your analysis where applicable.\n${urlList ? `\nURLs:\n${urlList}` : ""}${fileList ? `\nFiles:\n${fileList}` : ""}\n`;
    }
  }

  return `You are a senior hospitality investment research analyst specializing in boutique luxury hotels and resorts. Produce a comprehensive ICP (Ideal Customer Profile) market research report for a hotel management company seeking to acquire or manage properties matching the profile below.

═══ PROPERTY LABEL ═══
${propertyLabel}

═══ TARGET LOCATIONS ═══
${locationBlock}

═══ ASSET DESCRIPTION / AI PROMPT ═══
${assetDescription || "No asset description provided."}

═══ PROPERTY PROFILE PARAMETERS ═══
Room count range: ${icpConfig.roomsMin || "N/A"}–${icpConfig.roomsMax || "N/A"}
Sweet spot: ${icpConfig.roomsSweetSpotMin || "N/A"}–${icpConfig.roomsSweetSpotMax || "N/A"}
F&B Rating: ${icpConfig.fbRating || "N/A"}/5
Land range: ${icpConfig.landAcresMin || "N/A"}–${icpConfig.landAcresMax || "N/A"} acres

═══ PROPERTY TYPES ═══
${descriptive.propertyTypes || "Boutique luxury hotel"}

═══ EXCLUSIONS ═══
${descriptive.exclusions || "None specified"}
${sourcesBlock}

═══ REPORT STRUCTURE ═══
Produce the report in the following JSON format:
{
  "generalMarket": {
    "title": "General Market Overview",
    "content": "Multi-paragraph analysis of the boutique luxury hotel market nationally/globally — trends, ADR benchmarks, occupancy patterns, cap rates, investor sentiment, regulatory environment, and competitive landscape. NOT location-specific."
  },
  "locations": [
    {
      "locationKey": "Country > State",
      "title": "Market Analysis: [Location Name]",
      "content": "Multi-paragraph deep dive for this specific market — local demand drivers, tourism statistics, seasonality, competitive set, typical ADR ranges, occupancy benchmarks, land/acquisition costs, development pipeline, regulatory/tax considerations, and opportunity assessment."
    }
  ],
  "conclusion": {
    "title": "Conclusion & Strategic Recommendations",
    "content": "Synthesis of findings, ranked location attractiveness, risk/reward assessment, timing considerations, and actionable next steps for the management company."
  },
  "extractedMetrics": {
    "nationalAvgAdr": { "value": 0, "unit": "USD", "description": "National average ADR for boutique luxury segment" },
    "nationalAvgOccupancy": { "value": 0, "unit": "%", "description": "National average occupancy rate" },
    "nationalAvgRevPAR": { "value": 0, "unit": "USD", "description": "National average RevPAR" },
    "avgCapRate": { "value": 0, "unit": "%", "description": "Average cap rate for boutique luxury hotels" },
    "locationMetrics": [
      {
        "location": "Location name",
        "avgAdr": { "value": 0, "unit": "USD" },
        "avgOccupancy": { "value": 0, "unit": "%" },
        "avgRevPAR": { "value": 0, "unit": "USD" },
        "capRate": { "value": 0, "unit": "%" },
        "avgLandCostPerAcre": { "value": 0, "unit": "USD" },
        "demandGrowthRate": { "value": 0, "unit": "%" },
        "competitiveIntensity": "low|medium|high",
        "investmentRating": "A+|A|B+|B|C"
      }
    ]
  }
}

IMPORTANT:
- Use real market data and current industry benchmarks. Base your analysis on actual hospitality industry reports, STR data patterns, and real estate investment metrics.
- All numeric values in extractedMetrics must be realistic numbers, not placeholders.
- Each location section should be 3-5 substantial paragraphs.
- The general market section should be 4-6 paragraphs.
- The conclusion should be 3-4 paragraphs.
- Return ONLY valid JSON, no markdown fences or extra text.`;
}

export function register(app: Express) {
  app.post("/api/research/icp/generate", requireAuth, async (req, res) => {
    try {
      if (isApiRateLimited(req.user!.id, "icp-research", 3)) {
        return res.status(429).json({ error: "Rate limit exceeded. Please wait a minute." });
      }

      const ga = await storage.getGlobalAssumptions(req.user!.id);
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });

      const icpConfig = (ga.icpConfig as Record<string, any>) || {};
      const assetDescription = ga.assetDescription || "";
      const propertyLabel = ga.propertyLabel || "Hotel";
      const model = (ga.researchConfig as any)?.preferredLlm || ga.preferredLlm || "claude-sonnet-4-6";

      const prompt = buildIcpResearchPrompt(icpConfig, assetDescription, propertyLabel);

      const anthropic = getAnthropicClient();

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "status", message: "Starting ICP market research..." })}\n\n`);

      let fullContent = "";

      const stream = await anthropic.messages.stream({
        model,
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullContent += event.delta.text;
          res.write(`data: ${JSON.stringify({ type: "content", data: event.delta.text })}\n\n`);
        }
      }

      let parsed: any;
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : fullContent);
      } catch {
        parsed = { rawResponse: fullContent };
      }

      const report: IcpResearchReport = {
        generatedAt: new Date().toISOString(),
        model,
        sections: [],
        extractedMetrics: parsed.extractedMetrics || {},
      };

      if (parsed.generalMarket) {
        report.sections.push({
          title: parsed.generalMarket.title || "General Market Overview",
          content: parsed.generalMarket.content || "",
        });
      }

      if (parsed.locations && Array.isArray(parsed.locations)) {
        for (const loc of parsed.locations) {
          report.sections.push({
            title: loc.title || loc.locationKey || "Location Analysis",
            locationKey: loc.locationKey || "",
            content: loc.content || "",
          });
        }
      }

      if (parsed.conclusion) {
        report.sections.push({
          title: parsed.conclusion.title || "Conclusion",
          content: parsed.conclusion.content || "",
        });
      }

      if (parsed.rawResponse) {
        report.sections.push({
          title: "Research Report",
          content: parsed.rawResponse,
        });
      }

      const updatedIcpConfig = { ...icpConfig, _research: report };
      await storage.patchGlobalAssumptions(ga.id, { icpConfig: updatedIcpConfig });

      res.write(`data: ${JSON.stringify({ type: "done", report })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("ICP research generation error:", error);
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message || "Generation failed" })}\n\n`);
      res.end();
    }
  });

  app.get("/api/research/icp", requireAuth, async (req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions(req.user!.id);
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      const icpConfig = (ga.icpConfig as Record<string, any>) || {};
      res.json(icpConfig._research || null);
    } catch (error) {
      logAndSendError(res, "Failed to fetch ICP research", error);
    }
  });

  app.post("/api/research/icp/export", requireAuth, async (req, res) => {
    try {
      const { format, orientation } = req.body;
      if (!["pdf", "docx"].includes(format)) {
        return res.status(400).json({ error: "Format must be pdf or docx" });
      }

      const ga = await storage.getGlobalAssumptions(req.user!.id);
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });

      const icpConfig = (ga.icpConfig as Record<string, any>) || {};
      const report = icpConfig._research as IcpResearchReport | undefined;
      if (!report) return res.status(404).json({ error: "No ICP research report found. Generate one first." });

      const propertyLabel = ga.propertyLabel || "Hotel";
      const isLandscape = orientation === "landscape";

      if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: isLandscape ? "l" : "p", unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentW = pageW - margin * 2;
        let y = margin;

        const addHeader = () => {
          doc.setFillColor(26, 35, 50);
          doc.rect(0, 0, pageW, 28, "F");
          doc.setFillColor(159, 188, 164);
          doc.rect(0, 28, pageW, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(255, 255, 255);
          doc.text("ICP Market Research Report", margin, 18);
          doc.setFontSize(9);
          doc.setTextColor(200, 200, 200);
          doc.text(propertyLabel, pageW - margin, 18, { align: "right" });
          y = 38;
        };

        const addFooter = (pageNum: number) => {
          doc.setFontSize(7);
          doc.setTextColor(140, 140, 140);
          doc.text(`Page ${pageNum}`, pageW / 2, pageH - 8, { align: "center" });
          doc.text(new Date(report.generatedAt).toLocaleDateString(), pageW - margin, pageH - 8, { align: "right" });
        };

        const checkPage = (needed: number) => {
          if (y + needed > pageH - 15) {
            addFooter(doc.getNumberOfPages());
            doc.addPage();
            addHeader();
          }
        };

        addHeader();
        let pageNum = 1;

        for (const section of report.sections) {
          checkPage(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(26, 35, 50);
          doc.text(section.title, margin, y);
          y += 8;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const paragraphs = section.content.split("\n\n").filter(Boolean);
          for (const para of paragraphs) {
            const lines = doc.splitTextToSize(para, contentW);
            for (const line of lines) {
              checkPage(5);
              doc.text(line, margin, y);
              y += 4.5;
            }
            y += 3;
          }
          y += 5;
        }

        if (report.extractedMetrics && Object.keys(report.extractedMetrics).length > 0) {
          checkPage(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(26, 35, 50);
          doc.text("Key Extracted Metrics", margin, y);
          y += 8;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);

          const metrics = report.extractedMetrics;
          for (const [key, val] of Object.entries(metrics)) {
            if (key === "locationMetrics") continue;
            if (val && typeof val === "object" && "value" in val) {
              checkPage(6);
              doc.text(`${val.description || key}: ${val.value} ${val.unit || ""}`, margin + 2, y);
              y += 5;
            }
          }

          if (metrics.locationMetrics && Array.isArray(metrics.locationMetrics)) {
            y += 3;
            for (const loc of metrics.locationMetrics) {
              checkPage(20);
              doc.setFont("helvetica", "bold");
              doc.text(loc.location || "Unknown Location", margin + 2, y);
              y += 5;
              doc.setFont("helvetica", "normal");
              const locEntries = [
                ["ADR", loc.avgAdr],
                ["Occupancy", loc.avgOccupancy],
                ["RevPAR", loc.avgRevPAR],
                ["Cap Rate", loc.capRate],
                ["Land Cost/Acre", loc.avgLandCostPerAcre],
                ["Demand Growth", loc.demandGrowthRate],
              ];
              for (const [label, metric] of locEntries) {
                if (metric && typeof metric === "object" && "value" in metric) {
                  checkPage(5);
                  doc.text(`  ${label}: ${metric.value} ${metric.unit || ""}`, margin + 4, y);
                  y += 4.5;
                }
              }
              if (loc.competitiveIntensity) {
                doc.text(`  Competitive Intensity: ${loc.competitiveIntensity}`, margin + 4, y);
                y += 4.5;
              }
              if (loc.investmentRating) {
                doc.text(`  Investment Rating: ${loc.investmentRating}`, margin + 4, y);
                y += 4.5;
              }
              y += 3;
            }
          }
        }

        addFooter(doc.getNumberOfPages());

        const buffer = Buffer.from(doc.output("arraybuffer"));
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="icp-research-report.pdf"`);
        res.send(buffer);
      } else {
        const docx = await import("docx");
        const {
          Document, Packer, Paragraph, TextRun, HeadingLevel,
          PageOrientation, AlignmentType, BorderStyle,
        } = docx;

        const children: any[] = [];

        children.push(
          new Paragraph({
            children: [new TextRun({ text: "ICP Market Research Report", bold: true, size: 36, color: "1A2332" })],
            heading: HeadingLevel.TITLE,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `${propertyLabel}  |  Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, size: 18, color: "888888" })],
            spacing: { after: 300 },
            border: { bottom: { color: "9FBCA4", size: 6, style: BorderStyle.SINGLE, space: 8 } },
          }),
        );

        for (const section of report.sections) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: section.title, bold: true, size: 26, color: "1A2332" })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
          );

          const paragraphs = section.content.split("\n\n").filter(Boolean);
          for (const para of paragraphs) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: para, size: 20, color: "333333" })],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED,
              }),
            );
          }
        }

        if (report.extractedMetrics && Object.keys(report.extractedMetrics).length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "Key Extracted Metrics", bold: true, size: 26, color: "1A2332" })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
          );

          const metrics = report.extractedMetrics;
          for (const [key, val] of Object.entries(metrics)) {
            if (key === "locationMetrics") continue;
            if (val && typeof val === "object" && "value" in val) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${val.description || key}: `, bold: true, size: 20, color: "333333" }),
                    new TextRun({ text: `${val.value} ${val.unit || ""}`, size: 20, color: "333333" }),
                  ],
                  spacing: { after: 60 },
                }),
              );
            }
          }

          if (metrics.locationMetrics && Array.isArray(metrics.locationMetrics)) {
            for (const loc of metrics.locationMetrics) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: loc.location || "Location", bold: true, size: 22, color: "257D41" })],
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 80 },
                }),
              );
              const locEntries = [
                ["ADR", loc.avgAdr],
                ["Occupancy", loc.avgOccupancy],
                ["RevPAR", loc.avgRevPAR],
                ["Cap Rate", loc.capRate],
                ["Land Cost/Acre", loc.avgLandCostPerAcre],
                ["Demand Growth", loc.demandGrowthRate],
                ["Competitive Intensity", loc.competitiveIntensity ? { value: loc.competitiveIntensity, unit: "" } : null],
                ["Investment Rating", loc.investmentRating ? { value: loc.investmentRating, unit: "" } : null],
              ];
              for (const [label, metric] of locEntries) {
                if (metric && typeof metric === "object" && "value" in metric) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${label}: `, bold: true, size: 18, color: "555555" }),
                        new TextRun({ text: `${metric.value} ${metric.unit || ""}`, size: 18, color: "555555" }),
                      ],
                      spacing: { after: 40 },
                      indent: { left: 360 },
                    }),
                  );
                }
              }
            }
          }
        }

        const docConfig: any = {
          sections: [{
            properties: {
              page: {
                size: isLandscape
                  ? { orientation: PageOrientation.LANDSCAPE }
                  : {},
                margin: { top: 720, bottom: 720, left: 900, right: 900 },
              },
            },
            children,
          }],
        };

        const docInstance = new Document(docConfig);
        const buffer = await Packer.toBuffer(docInstance);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="icp-research-report.docx"`);
        res.send(buffer);
      }
    } catch (error: any) {
      console.error("ICP research export error:", error);
      logAndSendError(res, "Failed to export ICP research", error);
    }
  });
}
