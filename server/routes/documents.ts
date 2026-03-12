import type { Express } from "express";
import { requireAuth, requireManagementAccess, isApiRateLimited } from "../auth";
import { storage } from "../storage";
import { logActivity, logAndSendError } from "./helpers";
import { DocumentAIService } from "../integrations/document-ai";
import { mapExtractionToFields, getConfidenceLevel } from "../document-ai/field-mapper";
import { DOCUMENT_TEMPLATES, renderTemplate } from "../document-ai/templates";
import { createAndSendEnvelope, isDocuSignConfigured, parseWebhookEvent, verifyWebhookSignature, downloadSignedDocument } from "../integrations/docusign";
import { objectStorageClient, ObjectStorageService } from "../replit_integrations/object_storage";
import { randomUUID } from "crypto";
import { z } from "zod";

const documentAIService = new DocumentAIService();

// Singleton — avoid creating a new instance per request
const sharedObjectStorageService = new ObjectStorageService();

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
  "image/webp",
];
const MAX_DOC_SIZE = 20 * 1024 * 1024;

export function register(app: Express) {
  app.post("/api/documents/extract", requireManagementAccess, async (req, res) => {
    try {
      // Rate limit: max 3 document extractions per minute per user
      if (isApiRateLimited(req.user!.id, "document-extract", 3)) {
        return res.status(429).json({ error: "Rate limit exceeded. Please wait before extracting another document." });
      }

      const contentType = (req.headers["content-type"] || "").split(";")[0].trim();
      const propertyId = parseInt(req.headers["x-property-id"] as string);
      const fileName = (req.headers["x-file-name"] as string) || "document";

      if (!propertyId || isNaN(propertyId)) {
        return res.status(400).json({ error: "Missing x-property-id header" });
      }

      if (!ALLOWED_DOC_TYPES.includes(contentType)) {
        return res.status(400).json({ error: `Unsupported file type: ${contentType}. Supported: PDF, PNG, JPEG, TIFF, WebP` });
      }

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;
      for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalSize += buf.length;
        if (totalSize > MAX_DOC_SIZE) {
          return res.status(413).json({ error: `File too large. Maximum size is ${MAX_DOC_SIZE / 1024 / 1024}MB.` });
        }
        chunks.push(buf);
      }
      const body = Buffer.concat(chunks);

      if (body.length === 0) {
        return res.status(400).json({ error: "No file data received" });
      }

      const objectStorageService = sharedObjectStorageService;
      const privateDir = objectStorageService.getPrivateObjectDir();
      const objectId = randomUUID();
      const fullPath = `${privateDir}/documents/${objectId}`;
      const parts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
      const bucketName = parts[0];
      const objectName = parts.slice(1).join("/");

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(body, { contentType });

      const objectPath = `/objects/documents/${objectId}`;

      const extraction = await storage.createDocumentExtraction({
        propertyId,
        userId: req.user!.id,
        fileName,
        fileContentType: contentType,
        objectPath,
        documentType: "general",
        status: "processing",
      });

      logActivity(req, "document-upload", "document", extraction.id, fileName, { propertyId, objectPath });

      try {
        const result = await documentAIService.processDocument(objectPath, contentType);

        const mappedFields = mapExtractionToFields(result, property);

        await storage.updateDocumentExtraction(extraction.id, {
          status: "completed",
          rawExtractionData: result as any,
          processedAt: new Date(),
        });

        const fieldRecords = await storage.createExtractionFields(
          mappedFields.map((f) => ({
            extractionId: extraction.id,
            fieldName: f.fieldName,
            fieldLabel: f.fieldLabel,
            extractedValue: f.extractedValue,
            mappedPropertyField: f.mappedPropertyField,
            confidence: f.confidence,
            status: "pending",
            currentValue: f.currentValue,
          }))
        );

        logActivity(req, "document-extracted", "document", extraction.id, fileName, {
          propertyId,
          fieldCount: fieldRecords.length,
        });

        res.json({
          extraction: { ...extraction, status: "completed", processedAt: new Date() },
          fields: fieldRecords.map((f) => ({
            ...f,
            confidenceLevel: getConfidenceLevel(f.confidence),
          })),
        });
      } catch (extractionError) {
        await storage.updateDocumentExtraction(extraction.id, {
          status: "failed",
          errorMessage: extractionError instanceof Error ? extractionError.message : "Extraction failed",
        });

        res.json({
          extraction: {
            ...extraction,
            status: "failed",
            errorMessage: extractionError instanceof Error ? extractionError.message : "Extraction failed",
          },
          fields: [],
        });
      }
    } catch (error) {
      logAndSendError(res, "Failed to process document", error);
    }
  });

  app.get("/api/documents/extractions/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(String(req.params.propertyId));
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }

      const extractions = await storage.getPropertyExtractions(propertyId);
      res.json(extractions);
    } catch (error) {
      logAndSendError(res, "Failed to get extractions", error);
    }
  });

  app.get("/api/documents/extractions/:extractionId/fields", requireAuth, async (req, res) => {
    try {
      const extractionId = parseInt(String(req.params.extractionId));
      if (isNaN(extractionId)) {
        return res.status(400).json({ error: "Invalid extraction ID" });
      }

      const fields = await storage.getExtractionFields(extractionId);
      res.json(
        fields.map((f) => ({
          ...f,
          confidenceLevel: getConfidenceLevel(f.confidence),
        }))
      );
    } catch (error) {
      logAndSendError(res, "Failed to get extraction fields", error);
    }
  });

  app.patch("/api/documents/fields/:fieldId/status", requireManagementAccess, async (req, res) => {
    try {
      const fieldId = parseInt(String(req.params.fieldId));
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      const updated = await storage.updateExtractionFieldStatus(fieldId, status);

      if (status === "approved" && updated.mappedPropertyField) {
        const extraction = await storage.getDocumentExtraction(updated.extractionId);
        if (extraction) {
          const numericValue = parseFloat(updated.extractedValue.replace(/[$,%]/g, ""));
          if (!isNaN(numericValue)) {
            const updateData: Record<string, any> = {};
            let finalValue = numericValue;

            const percentFields = [
              "startOccupancy", "maxOccupancy", "exitCapRate", "taxRate",
              "costRateRooms", "costRateFB", "costRateAdmin", "costRateMarketing",
              "costRatePropertyOps", "costRateUtilities", "costRateInsurance",
              "costRateTaxes", "costRateIT", "costRateFFE", "costRateOther",
              "revShareEvents", "revShareFB", "revShareOther", "adrGrowthRate",
              "dispositionCommission", "baseManagementFeeRate", "incentiveManagementFeeRate",
            ];

            if (percentFields.includes(updated.mappedPropertyField) && finalValue > 1) {
              finalValue = finalValue / 100;
            }

            updateData[updated.mappedPropertyField] = finalValue;
            await storage.updateProperty(extraction.propertyId, updateData);

            logActivity(req, "extraction-field-applied", "property", extraction.propertyId, updated.fieldLabel, {
              field: updated.mappedPropertyField,
              value: finalValue,
              source: `extraction:${extraction.id}`,
            });
          }
        }
      }

      res.json({ ...updated, confidenceLevel: getConfidenceLevel(updated.confidence) });
    } catch (error) {
      logAndSendError(res, "Failed to update field status", error);
    }
  });

  app.post("/api/documents/fields/:extractionId/bulk-status", requireManagementAccess, async (req, res) => {
    try {
      const extractionId = parseInt(String(req.params.extractionId));
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      if (status === "approved") {
        const fields = await storage.getExtractionFields(extractionId);
        const extraction = await storage.getDocumentExtraction(extractionId);

        if (extraction) {
          const updateData: Record<string, any> = {};
          const percentFields = [
            "startOccupancy", "maxOccupancy", "exitCapRate", "taxRate",
            "costRateRooms", "costRateFB", "costRateAdmin", "costRateMarketing",
            "costRatePropertyOps", "costRateUtilities", "costRateInsurance",
            "costRateTaxes", "costRateIT", "costRateFFE", "costRateOther",
            "revShareEvents", "revShareFB", "revShareOther", "adrGrowthRate",
            "dispositionCommission", "baseManagementFeeRate", "incentiveManagementFeeRate",
          ];

          for (const field of fields) {
            if (field.mappedPropertyField && field.status === "pending") {
              const numericValue = parseFloat(field.extractedValue.replace(/[$,%]/g, ""));
              if (!isNaN(numericValue)) {
                let finalValue = numericValue;
                if (percentFields.includes(field.mappedPropertyField) && finalValue > 1) {
                  finalValue = finalValue / 100;
                }
                updateData[field.mappedPropertyField] = finalValue;
              }
            }
          }

          if (Object.keys(updateData).length > 0) {
            await storage.updateProperty(extraction.propertyId, updateData);
          }
        }
      }

      await storage.bulkUpdateExtractionFieldStatus(extractionId, status);

      logActivity(req, "extraction-bulk-action", "document", extractionId, null, { status });

      const updatedFields = await storage.getExtractionFields(extractionId);
      res.json(
        updatedFields.map((f) => ({
          ...f,
          confidenceLevel: getConfidenceLevel(f.confidence),
        }))
      );
    } catch (error) {
      logAndSendError(res, "Failed to bulk update fields", error);
    }
  });

  app.get("/api/documents/templates", requireAuth, async (_req, res) => {
    res.json(DOCUMENT_TEMPLATES);
  });

  app.post("/api/documents/templates/preview", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        templateId: z.string(),
        propertyId: z.number(),
        recipientName: z.string().min(1),
      });

      const data = schema.parse(req.body);

      const property = await storage.getProperty(data.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const globalAssumptions = await storage.getGlobalAssumptions();
      if (!globalAssumptions) {
        return res.status(500).json({ error: "Global assumptions not found" });
      }

      const senderName = [req.user!.firstName, req.user!.lastName].filter(Boolean).join(" ") || req.user!.email;

      const rendered = renderTemplate(
        data.templateId,
        property,
        globalAssumptions,
        senderName,
        data.recipientName
      );

      res.json({ html: rendered.html, subject: rendered.subject });
    } catch (error) {
      logAndSendError(res, "Failed to preview template", error);
    }
  });

  app.post("/api/documents/send", requireManagementAccess, async (req, res) => {
    try {
      const schema = z.object({
        templateId: z.string(),
        propertyId: z.number(),
        recipientName: z.string().min(1),
        recipientEmail: z.string().email(),
      });

      const data = schema.parse(req.body);

      const property = await storage.getProperty(data.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const globalAssumptions = await storage.getGlobalAssumptions();
      if (!globalAssumptions) {
        return res.status(500).json({ error: "Global assumptions not found" });
      }

      const senderName = [req.user!.firstName, req.user!.lastName].filter(Boolean).join(" ") || req.user!.email;

      const rendered = renderTemplate(
        data.templateId,
        property,
        globalAssumptions,
        senderName,
        data.recipientName
      );

      const documentBase64 = Buffer.from(rendered.html).toString("base64");

      const result = await createAndSendEnvelope(
        documentBase64,
        `${data.templateId}-${property.name}`,
        { name: data.recipientName, email: data.recipientEmail },
        senderName,
        req.user!.email,
        rendered.subject
      );

      const envelope = await storage.createDocusignEnvelope({
        propertyId: data.propertyId,
        userId: req.user!.id,
        envelopeId: result.envelopeId,
        templateType: data.templateId,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        status: result.status,
        templateData: {
          subject: rendered.subject,
          senderName,
        },
      });

      await storage.updateDocusignEnvelope(envelope.id, {
        sentAt: new Date(),
        statusHistory: [{ status: result.status, timestamp: result.statusDateTime }],
      });

      logActivity(req, "document-sent", "docusign", envelope.id, rendered.subject, {
        propertyId: data.propertyId,
        recipientEmail: data.recipientEmail,
        templateType: data.templateId,
      });

      res.json(envelope);
    } catch (error) {
      logAndSendError(res, "Failed to send document", error);
    }
  });

  app.get("/api/documents/envelopes/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(String(req.params.propertyId));
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }

      const envelopes = await storage.getPropertyEnvelopes(propertyId);
      res.json(envelopes);
    } catch (error) {
      logAndSendError(res, "Failed to get envelopes", error);
    }
  });

  app.get("/api/documents/docusign/status", requireAuth, async (_req, res) => {
    res.json({ configured: isDocuSignConfigured() });
  });

  app.post("/api/documents/webhook/docusign", async (req, res) => {
    try {
      const signature = req.headers["x-docusign-signature-1"] as string | undefined;
      if (!verifyWebhookSignature(JSON.stringify(req.body), signature)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const event = parseWebhookEvent(req.body);
      if (!event) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const envelope = await storage.getDocusignEnvelopeByEnvelopeId(event.envelopeId);
      if (!envelope) {
        return res.status(200).json({ message: "Envelope not found, ignoring" });
      }

      const history = [...(envelope.statusHistory || []), { status: event.status, timestamp: event.timestamp }];

      const updateData: any = {
        status: event.status,
        statusHistory: history,
      };

      if (event.status === "completed") {
        updateData.completedAt = new Date();

        try {
          const signedDoc = await downloadSignedDocument(event.envelopeId);
          const objectStorageService = sharedObjectStorageService;
          const privateDir = objectStorageService.getPrivateObjectDir();
          const docId = randomUUID();
          const fullPath = `${privateDir}/signed-documents/${docId}`;
          const pathParts = fullPath.startsWith("/") ? fullPath.slice(1).split("/") : fullPath.split("/");
          const bucketName = pathParts[0];
          const objectName = pathParts.slice(1).join("/");

          const bucket = objectStorageClient.bucket(bucketName);
          const storageFile = bucket.file(objectName);
          await storageFile.save(signedDoc, { contentType: "application/pdf" });

          updateData.signedDocumentPath = `/objects/signed-documents/${docId}`;
        } catch (downloadError) {
          console.error("Failed to download signed document:", downloadError);
        }
      }

      await storage.updateDocusignEnvelope(envelope.id, updateData);

      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      console.error("DocuSign webhook error:", error);
      res.status(200).json({ message: "Error processing webhook" });
    }
  });
}
