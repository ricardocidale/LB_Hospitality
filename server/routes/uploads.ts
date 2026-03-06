import type { Express } from "express";
import { requireAuth } from "../auth";
import { ObjectStorageService } from "../replit_integrations/object_storage";
import { logActivity, logAndSendError } from "./helpers";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // UPLOADS
  // Presigned URL flow for uploading files to object storage.
  // ────────────────────────────────────────────────────────────

  app.post("/api/uploads/request-url", requireAuth, async (req, res) => {
    try {
      const { name, size, contentType, entityType, entityId } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      logActivity(req, "upload-request", entityType || "asset", entityId, name, { objectPath });
      
      res.json({ 
        uploadURL, 
        objectPath,
        metadata: { name, size, contentType }
      });
    } catch (error) {
      logAndSendError(res, "Failed to generate upload URL", error);
    }
  });
}
