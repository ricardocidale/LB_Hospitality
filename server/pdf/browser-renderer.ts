import { logger } from "../logger";
import { execSync } from "child_process";

export interface PdfRenderOptions {
  width: string;
  height: string;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: { top?: string; bottom?: string; left?: string; right?: string };
}

let browserInstance: any = null;
let launchPromise: Promise<any> | null = null;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
  "--disable-extensions",
  "--disable-background-networking",
];

function findSystemChromium(): string | null {
  const candidates = [
    "chromium",
    "chromium-browser",
    "google-chrome-stable",
    "google-chrome",
  ];
  for (const cmd of candidates) {
    try {
      const p = execSync(`which ${cmd} 2>/dev/null`, { encoding: "utf8" }).trim();
      if (p) return p;
    } catch {}
  }
  return null;
}

async function launchBrowser(): Promise<any> {
  const systemChromium = findSystemChromium();

  if (systemChromium) {
    try {
      const puppeteerCore = await import("puppeteer-core");
      logger.info(`[pdf-renderer] Using puppeteer-core with system Chromium: ${systemChromium}`, "pdf");
      return puppeteerCore.default.launch({
        headless: true,
        executablePath: systemChromium,
        args: LAUNCH_ARGS,
      });
    } catch (err: any) {
      logger.warn(`[pdf-renderer] puppeteer-core + system Chromium failed: ${err.message}`, "pdf");
    }
  }

  try {
    const puppeteer = await import("puppeteer");
    logger.info("[pdf-renderer] Using full Puppeteer (bundled Chrome)", "pdf");
    return puppeteer.default.launch({
      headless: true,
      args: LAUNCH_ARGS,
    });
  } catch (err: any) {
    logger.warn(`[pdf-renderer] Puppeteer failed: ${err.message}`, "pdf");
  }

  try {
    const pw = await import("playwright");
    if (pw?.chromium) {
      logger.info("[pdf-renderer] Using Playwright Chromium", "pdf");
      return pw.chromium.launch({ args: LAUNCH_ARGS });
    }
  } catch {}

  throw new Error(
    "No PDF-capable browser engine available. " +
    "Install system chromium, puppeteer, or playwright."
  );
}

async function getBrowser(): Promise<any> {
  if (browserInstance) {
    const connected = typeof browserInstance.isConnected === "function"
      ? browserInstance.isConnected()
      : browserInstance.isConnected?.() ?? true;
    if (connected) return browserInstance;
    browserInstance = null;
  }

  if (launchPromise) {
    return launchPromise;
  }

  launchPromise = (async () => {
    try {
      browserInstance = await launchBrowser();
      return browserInstance;
    } finally {
      launchPromise = null;
    }
  })();

  return launchPromise;
}

export async function renderPdf(html: string, opts: PdfRenderOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Set viewport to match PDF dimensions for consistent rendering
    // Landscape 16:9 = 406.4mm × 228.6mm (16" × 9") → 1536 × 864 px at 96 dpi
    // Portrait       = 215.9mm × 279.4mm (US Letter) → 816 × 1056 px at 96 dpi
    const widthMm = parseFloat(opts.width ?? "216");
    const isLandscape = widthMm > 300;
    const widthPx = isLandscape ? 1536 : 816;
    const heightPx = isLandscape ? 864 : 1056;
    await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });
    // Wait for fonts to load
    try { await page.evaluateHandle("document.fonts.ready"); } catch {}
    const pdfBuffer = await page.pdf({
      width: opts.width,
      height: opts.height,
      printBackground: opts.printBackground ?? true,
      displayHeaderFooter: opts.displayHeaderFooter ?? false,
      headerTemplate: opts.headerTemplate || "<span></span>",
      footerTemplate: opts.footerTemplate || "<span></span>",
      margin: opts.margin || { top: "0mm", bottom: "8mm", left: "0mm", right: "0mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function renderPng(html: string, opts: { width: number; height: number; scale?: number }): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: opts.width, height: opts.height, deviceScaleFactor: opts.scale ?? 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });
    const pngBuffer = await page.screenshot({ type: "png", fullPage: false });
    return Buffer.from(pngBuffer);
  } finally {
    await page.close();
  }
}

export async function closeBrowserRenderer() {
  if (browserInstance) {
    try { await browserInstance.close(); } catch {}
    browserInstance = null;
  }
}

process.on("SIGTERM", closeBrowserRenderer);
process.on("SIGINT", closeBrowserRenderer);
