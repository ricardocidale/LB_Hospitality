import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { logActivity, logAndSendError } from "./helpers";
import { encryptPlaidToken, decryptPlaidToken } from "../crypto/plaid-tokens";
import * as plaidService from "../integrations/plaid";
import { categorizeByRules, categorizeByAI } from "../integrations/plaid-categorization";
import { z } from "zod";

async function assertPropertyAccess(req: Request, propertyId: number): Promise<boolean> {
  const user = req.user!;
  if (user.role === "admin") return true;

  const property = await storage.getProperty(propertyId);
  if (!property) return false;

  if (user.userGroupId) {
    const allowedIds = await storage.getGroupPropertyIds(user.userGroupId);
    if (allowedIds.length > 0 && !allowedIds.includes(propertyId)) return false;
  }

  return true;
}

export function register(app: Express) {
  app.post("/api/plaid/link-token", requireAuth, async (req, res) => {
    try {
      const linkToken = await plaidService.createLinkToken(String(req.user!.id));
      res.json({ linkToken });
    } catch (error) {
      logAndSendError(res, "Failed to create Plaid link token", error);
    }
  });

  app.post("/api/plaid/exchange", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        publicToken: z.string(),
        propertyId: z.number(),
        institutionName: z.string(),
        institutionId: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { publicToken, propertyId, institutionName, institutionId } = parsed.data;
      const userId = req.user!.id;

      if (!await assertPropertyAccess(req, propertyId)) {
        return res.status(403).json({ error: "Not authorized to access this property" });
      }

      const { accessToken, itemId } = await plaidService.exchangePublicToken(publicToken);
      const encrypted = encryptPlaidToken(accessToken);

      let accountIds: string[] = [];
      let accountNames: string[] = [];
      try {
        const accounts = await plaidService.getAccounts(accessToken);
        accountIds = accounts.map((a) => a.accountId);
        accountNames = accounts.map((a) => a.name);
      } catch (e) {
        console.error("Failed to fetch accounts after exchange:", e);
      }

      const connection = await storage.createPlaidConnection({
        userId,
        propertyId,
        itemId,
        institutionName,
        institutionId: institutionId || null,
        encryptedAccessToken: encrypted.ciphertext,
        accessTokenIv: encrypted.iv,
        accessTokenTag: encrypted.tag,
        accountIds,
        accountNames,
      });

      logActivity(req, "plaid_connect", "plaid_connection", connection.id, institutionName);

      res.json({
        id: connection.id,
        institutionName: connection.institutionName,
        accountNames: connection.accountNames,
        createdAt: connection.createdAt,
      });
    } catch (error) {
      logAndSendError(res, "Failed to exchange Plaid token", error);
    }
  });

  app.get("/api/plaid/accounts/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId as string);
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }

      if (!await assertPropertyAccess(req, propertyId)) {
        return res.status(403).json({ error: "Not authorized to access this property" });
      }

      const connections = await storage.getPlaidConnectionsByProperty(propertyId);
      const result = connections.map((c) => ({
        id: c.id,
        institutionName: c.institutionName,
        accountNames: c.accountNames,
        accountIds: c.accountIds,
        lastSyncedAt: c.lastSyncedAt,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }));

      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to get Plaid accounts", error);
    }
  });

  app.post("/api/plaid/sync/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId as string);
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }

      if (!await assertPropertyAccess(req, propertyId)) {
        return res.status(403).json({ error: "Not authorized to access this property" });
      }

      const connections = await storage.getPlaidConnectionsByProperty(propertyId);
      let totalAdded = 0;
      let totalModified = 0;
      let totalRemoved = 0;

      for (const conn of connections) {
        const accessToken = decryptPlaidToken({
          ciphertext: conn.encryptedAccessToken,
          iv: conn.accessTokenIv,
          tag: conn.accessTokenTag,
        });

        let cursor = conn.syncCursor;
        let hasMore = true;

        while (hasMore) {
          const syncResult = await plaidService.syncTransactions(accessToken, cursor);

          if (syncResult.added.length > 0) {
            const txData = syncResult.added.map((tx) => ({
              connectionId: conn.id,
              propertyId,
              plaidTransactionId: tx.transactionId,
              date: tx.date,
              name: tx.name,
              merchantName: tx.merchantName,
              amount: tx.amount,
              isoCurrencyCode: tx.isoCurrencyCode || "USD",
              category: tx.category?.join(", ") || null,
              categoryId: tx.categoryId,
              personalFinanceCategory: tx.personalFinanceCategory,
              pending: tx.pending,
            }));

            const inserted = await storage.createPlaidTransactions(txData);
            totalAdded += inserted.length;

            await categorizeTransactions(inserted.map((t) => ({
              id: t.id,
              name: t.name,
              merchantName: t.merchantName,
              categoryId: t.categoryId,
            })));
          }

          if (syncResult.modified.length > 0) {
            const modifiedIds = syncResult.modified.map(tx => tx.transactionId);
            await storage.removePlaidTransactionsByIds(modifiedIds);

            const txData = syncResult.modified.map((tx) => ({
              connectionId: conn.id,
              propertyId,
              plaidTransactionId: tx.transactionId,
              date: tx.date,
              name: tx.name,
              merchantName: tx.merchantName,
              amount: tx.amount,
              isoCurrencyCode: tx.isoCurrencyCode || "USD",
              category: tx.category?.join(", ") || null,
              categoryId: tx.categoryId,
              personalFinanceCategory: tx.personalFinanceCategory,
              pending: tx.pending,
            }));

            const reinserted = await storage.createPlaidTransactions(txData);
            totalModified += reinserted.length;

            await categorizeTransactions(reinserted.map((t) => ({
              id: t.id,
              name: t.name,
              merchantName: t.merchantName,
              categoryId: t.categoryId,
            })));
          }

          if (syncResult.removed.length > 0) {
            await storage.removePlaidTransactionsByIds(syncResult.removed);
            totalRemoved += syncResult.removed.length;
          }

          cursor = syncResult.nextCursor;
          hasMore = syncResult.hasMore;
        }

        await storage.updatePlaidConnectionSync(conn.id, cursor!, new Date());
      }

      res.json({ added: totalAdded, modified: totalModified, removed: totalRemoved });
    } catch (error) {
      logAndSendError(res, "Failed to sync Plaid transactions", error);
    }
  });

  app.get("/api/plaid/transactions/:propertyId", requireAuth, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId as string);
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }

      if (!await assertPropertyAccess(req, propertyId)) {
        return res.status(403).json({ error: "Not authorized to access this property" });
      }

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const transactions = await storage.getPlaidTransactionsByProperty(propertyId, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      logAndSendError(res, "Failed to get Plaid transactions", error);
    }
  });

  app.delete("/api/plaid/connection/:connectionId", requireAuth, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.connectionId as string);
      if (isNaN(connectionId)) {
        return res.status(400).json({ error: "Invalid connection ID" });
      }

      const connection = await storage.getPlaidConnectionById(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      if (connection.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      try {
        const accessToken = decryptPlaidToken({
          ciphertext: connection.encryptedAccessToken,
          iv: connection.accessTokenIv,
          tag: connection.accessTokenTag,
        });
        await plaidService.removeItem(accessToken);
      } catch (e) {
        console.error("Failed to remove Plaid item (continuing with local deletion):", e);
      }

      await storage.deletePlaidConnection(connectionId);
      logActivity(req, "plaid_disconnect", "plaid_connection", connection.id, connection.institutionName);

      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete Plaid connection", error);
    }
  });

  app.post("/api/plaid/webhook", async (req, res) => {
    try {
      const { webhook_type, webhook_code, item_id } = req.body;

      if (webhook_type === "ITEM" && webhook_code === "PENDING_EXPIRATION") {
        console.log(`Plaid token pending expiration for item: ${item_id}`);
      }

      if (webhook_type === "ITEM" && webhook_code === "NEW_ACCOUNTS_AVAILABLE") {
        console.log(`New accounts available for item: ${item_id}`);
      }

      if (webhook_code === "SYNC_UPDATES_AVAILABLE") {
        console.log(`Transaction sync updates available for item: ${item_id}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Plaid webhook error:", error);
      res.json({ received: true });
    }
  });
}

async function categorizeTransactions(
  transactions: { id: number; name: string; merchantName: string | null; categoryId: string | null }[]
) {
  const updates: { id: number; usaliCategory: string; usaliDepartment: string; categorizationMethod: string }[] = [];
  const uncategorized: { id: number; name: string }[] = [];

  for (const tx of transactions) {
    const ruleResult = categorizeByRules(tx.name, tx.merchantName, tx.categoryId);
    if (ruleResult) {
      updates.push({
        id: tx.id,
        usaliCategory: ruleResult.usaliCategory,
        usaliDepartment: ruleResult.usaliDepartment,
        categorizationMethod: "rule",
      });
    } else {
      uncategorized.push({ id: tx.id, name: tx.name });
    }
  }

  if (uncategorized.length > 0) {
    const descriptions = uncategorized.map((t) => t.name);
    const cached = await storage.getCategorizationCache(descriptions);
    const cacheMap = new Map(cached.map((c) => [c.descriptionPattern, c]));

    const stillUncategorized: { id: number; name: string }[] = [];
    for (const tx of uncategorized) {
      const hit = cacheMap.get(tx.name);
      if (hit) {
        updates.push({
          id: tx.id,
          usaliCategory: hit.usaliCategory,
          usaliDepartment: hit.usaliDepartment,
          categorizationMethod: "cache",
        });
      } else {
        stillUncategorized.push(tx);
      }
    }

    if (stillUncategorized.length > 0) {
      const aiResults = await categorizeByAI(stillUncategorized.map((t) => t.name));
      const cacheEntries: { descriptionPattern: string; usaliCategory: string; usaliDepartment: string; source: string }[] = [];

      for (const tx of stillUncategorized) {
        const result = aiResults.get(tx.name);
        if (result) {
          updates.push({
            id: tx.id,
            usaliCategory: result.usaliCategory,
            usaliDepartment: result.usaliDepartment,
            categorizationMethod: "ai",
          });
          cacheEntries.push({
            descriptionPattern: tx.name,
            usaliCategory: result.usaliCategory,
            usaliDepartment: result.usaliDepartment,
            source: "ai",
          });
        }
      }

      if (cacheEntries.length > 0) {
        await storage.upsertCategorizationCache(cacheEntries);
      }
    }
  }

  if (updates.length > 0) {
    await storage.updatePlaidTransactionCategories(updates);
  }
}
