import type { Express } from "express";
import { requireAuth } from "../auth";
import { objectStorageClient, ObjectStorageService } from "../replit_integrations/object_storage";
import { logActivity, logAndSendError } from "./helpers";
import { randomUUID } from "crypto";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = [
  "image/png", "image/jpeg", "image/jpg", "image/gif",
  "image/webp", "image/svg+xml", "image/bmp", "image/tiff",
];

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
      const contentType = (req.headers["content-type"] || "").split(";")[0].trim();
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: `Unsupported content type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}` });
      }

      const contentLength = parseInt(req.headers["content-length"] || "0", 10);
      if (contentLength > MAX_UPLOAD_BYTES) {
        return res.status(413).json({ error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` });
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;
      for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalSize += buf.length;
        if (totalSize > MAX_UPLOAD_BYTES) {
          return res.status(413).json({ error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` });
        }
        chunks.push(buf);
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
      await file.save(body, { contentType });

      const objectPath = `/objects/uploads/${objectId}`;
      logActivity(req, "upload-direct", "asset", undefined, objectId, { objectPath, contentType, size: body.length });

      res.json({ objectPath });
    } catch (error) {
      logAndSendError(res, "Failed to upload file", error);
    }
  });
}
