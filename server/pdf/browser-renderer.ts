import { logger } from "../logger";

export interface PdfRenderOptions {
  width: string;
  height: string;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: { top?: string; bottom?: string; left?: string; right?: string };
}

type BrowserEngine = "playwright-chromium" | "puppeteer";

let resolvedEngine: BrowserEngine | null = null;
let browserInstance: any = null;
let launchPromise: Promise<any> | null = null;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
];

async function tryImport(pkg: string): Promise<any> {
  try {
    return await import(/* @vite-ignore */ pkg);
  } catch {
    return null;
  }
}

async function detectEngine(): Promise<BrowserEngine> {
  if (resolvedEngine) return resolvedEngine;

  const pw = await tryImport("playwright");
  if (pw?.chromium) {
    resolvedEngine = "playwright-chromium";
    logger.info("[pdf-renderer] Using Playwright (Chromium)", "pdf");
    return resolvedEngine;
  }

  const pup = await tryImport("puppeteer");
  if (pup) {
    resolvedEngine = "puppeteer";
    logger.info("[pdf-renderer] Using Puppeteer (Chrome)", "pdf");
    return resolvedEngine;
  }

  throw new Error("No PDF-capable browser engine available — install playwright or puppeteer");
}

async function launchBrowser(engine: BrowserEngine): Promise<any> {
  switch (engine) {
    case "playwright-chromium": {
      const pw = await tryImport("playwright");
      return pw.chromium.launch({ args: LAUNCH_ARGS });
    }
    case "puppeteer": {
      const pup = await tryImport("puppeteer");
      return pup.default.launch({ headless: true, args: LAUNCH_ARGS });
    }
  }
}

async function getBrowser(): Promise<{ browser: any; engine: BrowserEngine }> {
  const engine = await detectEngine();

  if (browserInstance?.isConnected?.()) {
    return { browser: browserInstance, engine };
  }

  if (launchPromise) {
    const browser = await launchPromise;
    return { browser, engine };
  }

  launchPromise = (async () => {
    try {
      browserInstance = await launchBrowser(engine);
      return browserInstance;
    } catch (err: any) {
      if (engine === "playwright-chromium") {
        logger.warn("[pdf-renderer] Playwright Chromium launch failed, trying Puppeteer...", "pdf");
        const pup = await tryImport("puppeteer");
        if (pup) {
          resolvedEngine = "puppeteer";
          browserInstance = await pup.default.launch({ headless: true, args: LAUNCH_ARGS });
          return browserInstance;
        }
      }
      throw err;
    } finally {
      launchPromise = null;
    }
  })();

  const browser = await launchPromise;
  return { browser, engine: resolvedEngine! };
}

export async function renderPdf(html: string, opts: PdfRenderOptions): Promise<Buffer> {
  const { browser, engine } = await getBrowser();

  if (engine === "playwright-chromium") {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle", timeout: 15_000 });
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
      await context.close();
    }
  }

  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15_000 });
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

export async function closeBrowserRenderer() {
  if (browserInstance) {
    try { await browserInstance.close(); } catch {}
    browserInstance = null;
  }
}

process.on("SIGTERM", closeBrowserRenderer);
process.on("SIGINT", closeBrowserRenderer);
