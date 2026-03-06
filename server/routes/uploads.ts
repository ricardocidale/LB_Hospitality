import type { Express } from "express";
import { requireAuth } from "../auth";
import { objectStorageClient, ObjectStorageService } from "../replit_integrations/object_storage";
import { logActivity, logAndSendError } from "./helpers";
import { randomUUID } from "crypto";

export function register(app: Express) {
  app.post("/api/uploads/request-url", requireAuth, async (req, res) => {
    try {
      const { name, size, contentType, entityType, entityId } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
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

  app.post("/api/uploads/direct", requireAuth, async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const body = Buffer.concat(chunks);

      if (body.length === 0) {
        return res.status(400).json({ error: "No file data received" });
      }

      const objectStorageService = new ObjectStorageService();
      const privateDir = objectStorageService.getPrivateObjectDir();
      const objectId = randomUUID();
      const fullPath = `${privateDir}/uploads/${objectId}`;

      const parts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
      const bucketName = parts[0];
      const objectName = parts.slice(1).join("/");

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const contentType = req.headers["content-type"] || "application/octet-stream";
      await file.save(body, { contentType });

      const objectPath = `/objects/uploads/${objectId}`;
      logActivity(req, "upload-direct", "asset", undefined, objectId, { objectPath });

      res.json({ objectPath });
    } catch (error) {
      logAndSendError(res, "Failed to upload file", error);
    }
  });
}
