import type { Express, Request, Response } from "express";
import { openai, generateImageBuffer, getGeminiClient } from "./client";
import { requireAuth, isApiRateLimited } from "../../auth";
import { ObjectStorageService } from "../object_storage";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", requireAuth, async (req: Request, res: Response) => {
    try {
      if (isApiRateLimited(req.user!.id, "generate-image", 5)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }

      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data?.[0];
      res.json({
        url: imageData?.url,
        b64_json: imageData?.b64_json,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.post("/api/generate-property-image", requireAuth, async (req: Request, res: Response) => {
    try {
      if (isApiRateLimited(req.user!.id, "generate-image", 5)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const imageBuffer = await generateImageBuffer(prompt, "1024x1024");

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: imageBuffer,
        headers: { "Content-Type": "image/png" },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload generated image to object storage");
      }

      res.json({ objectPath, isAiGenerated: true });
    } catch (error) {
      console.error("Error generating property image:", error);
      const message = error instanceof Error ? error.message : "Failed to generate image";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/enhance-logo-prompt", requireAuth, async (req: Request, res: Response) => {
    try {
      if (isApiRateLimited(req.user!.id, "enhance-prompt", 10)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const gemini = getGeminiClient();
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `You are a world-class logo design director. Enhance this logo description into a detailed, vivid prompt optimized for AI image generation. Keep it concise (2-3 sentences max). Focus on style, colors, composition, and mood. Output ONLY the enhanced prompt, nothing else.\n\nOriginal: ${prompt}`
          }]
        }],
      });

      const enhanced = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!enhanced) {
        throw new Error("No response from AI");
      }

      res.json({ enhanced });
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      const message = error instanceof Error ? error.message : "Failed to enhance prompt";
      res.status(500).json({ error: message });
    }
  });
}
