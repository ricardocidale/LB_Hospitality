import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth";

const MAX_HTML_SIZE = 5 * 1024 * 1024;

const BLOCKED_TAGS = /(<\s*\/?\s*(script|iframe|frame|frameset|object|embed|applet|form|link|meta|base)\b[^>]*>)/gi;

const BLOCKED_ATTRS = /\b(on\w+|srcdoc|formaction|action|data)\s*=/gi;

const BLOCKED_URLS = /(src|href|url)\s*[:=]\s*["']?\s*(javascript:|data:text\/html|file:|ftp:|\\\\|\/\/localhost|\/\/127\.|\/\/0\.|\/\/\[::1\]|\/\/169\.254\.|\/\/metadata\.google)/gi;

function sanitizeHtml(html: string): string {
  let cleaned = html;
  cleaned = cleaned.replace(BLOCKED_TAGS, "<!-- blocked -->");
  cleaned = cleaned.replace(BLOCKED_ATTRS, "data-blocked=");
  cleaned = cleaned.replace(BLOCKED_URLS, 'data-blocked="blocked"');
  return cleaned;
}

export function register(app: Express) {
  app.post("/api/render/png", requireAuth, async (req: Request, res: Response) => {
    try {
      const { html, width, height, scale } = req.body;

      if (!html || typeof html !== "string") {
        res.status(400).json({ error: "html is required" });
        return;
      }

      if (html.length > MAX_HTML_SIZE) {
        res.status(413).json({ error: "HTML payload too large" });
        return;
      }

      const sanitized = sanitizeHtml(html);

      const w = typeof width === "number" && width > 0 ? Math.min(width, 4096) : 1200;
      const h = typeof height === "number" && height > 0 ? Math.min(height, 4096) : 800;
      const s = typeof scale === "number" && scale > 0 ? Math.min(scale, 4) : 2;

      const { renderPngIsolated } = await import("../pdf/browser-renderer");
      const pngBuffer = await renderPngIsolated(sanitized, { width: w, height: h, scale: s });

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", pngBuffer.length);
      res.send(pngBuffer);
    } catch (error: any) {
      console.error("[render-png] Error:", error.message);
      res.status(500).json({ error: "PNG rendering failed" });
    }
  });
}
