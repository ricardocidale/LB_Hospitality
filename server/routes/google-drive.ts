import type { Express } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { storage } from "../storage";
import { requireAuth , getAuthUser } from "../auth";
import { logger } from "../logger";
import { driveFolderSchema } from "./helpers";
import { fromZodError } from "zod-validation-error";
import { isEncryptionConfigured } from "../lib/token-encryption";
import multer from "multer";
import { Readable } from "stream";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function checkGoogleConfig(): boolean {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn("Google Drive routes: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set", "drive");
    return false;
  }
  if (!isEncryptionConfigured()) {
    logger.warn("Google Drive routes: TOKEN_ENCRYPTION_KEY not set — Drive features disabled", "drive");
    return false;
  }
  return true;
}

async function getAuthedDriveClient(userId: number) {
  const tokens = await storage.getDecryptedGoogleTokens(userId);
  if (!tokens.driveConnected || !tokens.accessToken) {
    return null;
  }

  const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oAuth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken || undefined,
    expiry_date: tokens.tokenExpiry ? tokens.tokenExpiry.getTime() : undefined,
  });

  const now = Date.now();
  const expiry = tokens.tokenExpiry ? tokens.tokenExpiry.getTime() : 0;
  if (expiry && expiry < now + 60_000) {
    if (!tokens.refreshToken) {
      await storage.clearUserGoogleDriveTokens(userId);
      return null;
    }
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      await storage.updateUserGoogleTokens(userId, {
        googleAccessToken: credentials.access_token!,
        googleRefreshToken: credentials.refresh_token || tokens.refreshToken,
        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      });
      logger.info(`Google Drive token refreshed for user ${userId}`, "drive");
    } catch (error) {
      logger.error(`Google Drive token refresh failed for user ${userId}: ${error instanceof Error ? error.message : error}`, "drive");
      await storage.clearUserGoogleDriveTokens(userId);
      return null;
    }
  }

  return google.drive({ version: "v3", auth: oAuth2Client });
}

export function register(app: Express) {
  if (!checkGoogleConfig()) {
    logger.warn("Google Drive routes disabled: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET", "drive");
    return;
  }

  app.get("/api/drive/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(getAuthUser(req).id);
      res.json({
        connected: user?.googleDriveConnected ?? false,
        email: user?.email,
      });
    } catch (error) {
      logger.error(`Drive status error: ${error instanceof Error ? error.message : error}`, "drive");
      res.status(500).json({ error: "Failed to check Drive status" });
    }
  });

  app.post("/api/drive/disconnect", requireAuth, async (req, res) => {
    try {
      await storage.clearUserGoogleDriveTokens(getAuthUser(req).id);
      res.json({ success: true });
    } catch (error) {
      logger.error(`Drive disconnect error: ${error instanceof Error ? error.message : error}`, "drive");
      res.status(500).json({ error: "Failed to disconnect Drive" });
    }
  });

  app.get("/api/drive/files", requireAuth, async (req, res) => {
    try {
      const drive = await getAuthedDriveClient(getAuthUser(req).id);
      if (!drive) {
        return res.status(401).json({ error: "Google Drive not connected. Please connect your Drive first." });
      }

      const folderId = (req.query.folderId as string) || undefined;
      const response = await drive.files.list({
        q: folderId ? `'${folderId}' in parents and trashed = false` : "trashed = false",
        fields: "files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)",
        pageSize: 100,
        orderBy: "folder,name",
      });

      res.json({ files: response.data.files || [] });
    } catch (error) {
      logger.error(`Drive list files error: ${error instanceof Error ? error.message : error}`, "drive");
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  app.post("/api/drive/folders", requireAuth, async (req, res) => {
    try {
      const drive = await getAuthedDriveClient(getAuthUser(req).id);
      if (!drive) {
        return res.status(401).json({ error: "Google Drive not connected" });
      }

      const validation = driveFolderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const { name, parentId } = validation.data;

      const fileMetadata: Record<string, unknown> = {
        name,
        mimeType: "application/vnd.google-apps.folder",
      };
      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await drive.files.create({
        requestBody: fileMetadata as any,
        fields: "id, name, mimeType, webViewLink",
      });

      res.json({ folder: response.data });
    } catch (error) {
      logger.error(`Drive create folder error: ${error instanceof Error ? error.message : error}`, "drive");
      res.status(500).json({ error: "Failed to create folder" });
    }
  });

  app.post("/api/drive/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const drive = await getAuthedDriveClient(getAuthUser(req).id);
      if (!drive) {
        return res.status(401).json({ error: "Google Drive not connected" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const parentId = req.body.parentId;
      const fileMetadata: Record<string, unknown> = {
        name: file.originalname,
      };
      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata as any,
        media,
        fields: "id, name, mimeType, size, webViewLink",
      });

      res.json({ file: response.data });
    } catch (error) {
      logger.error(`Drive upload error: ${error instanceof Error ? error.message : error}`, "drive");
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
}
