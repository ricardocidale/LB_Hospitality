import { resolveThemeColors } from "../../theme-resolver";

export async function generatePngZipBuffer(
  data: {
    companyName?: string;
    entityName: string;
    orientation?: "landscape" | "portrait";
    statementType?: string;
    themeColors?: any[];
  },
  buildPdfSectionsFromData: (data: any) => any[],
): Promise<Buffer> {
  const archiver = (await import("archiver")).default;
  const { buildPdfHtml } = await import("../pdf-html-templates");
  const { renderPng } = await import("../../browser-renderer");

  const company = data.companyName || data.entityName;
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const sections = buildPdfSectionsFromData(data);
  const colors = resolveThemeColors(data.themeColors);
  const reportTitle = data.statementType
    ? `${company} \u2014 ${data.statementType}`
    : `${company} \u2014 Financial Report`;

  const pngs: { name: string; buffer: Buffer }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const html = buildPdfHtml({ sections: [section] }, {
      orientation: data.orientation || "landscape",
      companyName: company,
      entityName: data.entityName,
      sections: [section],
      reportTitle,
      colors,
    });

    const pngBuffer = await renderPng(html, {
      width: isLandscape ? 1536 : 816,
      height: isLandscape ? 864 : 1056,
      scale: 2,
    });

    const idx = String(i + 1).padStart(2, "0");
    const label = (section.title || section.type || "Page").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    pngs.push({ name: `${idx}-${label}.png`, buffer: pngBuffer });
  }

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const png of pngs) {
      archive.append(png.buffer, { name: png.name });
    }
    archive.finalize();
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PNG ZIP generation timed out after 30s")), 30_000)
  );
  return Promise.race([zipPromise, timeoutPromise]);
}
