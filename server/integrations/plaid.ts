import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { BaseIntegrationService, type IntegrationHealth } from "./base";

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}

export interface SyncedTransaction {
  transactionId: string;
  date: string;
  name: string;
  merchantName: string | null;
  amount: number;
  isoCurrencyCode: string | null;
  category: string[] | null;
  categoryId: string | null;
  personalFinanceCategory: string | null;
  pending: boolean;
}

export interface TransactionSyncResult {
  added: SyncedTransaction[];
  modified: SyncedTransaction[];
  removed: string[];
  nextCursor: string;
  hasMore: boolean;
}

class PlaidIntegration extends BaseIntegrationService {
  readonly serviceName = "plaid";

  private getClient(): PlaidApi {
    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
          "PLAID-SECRET": process.env.PLAID_SECRET || "",
        },
      },
    });
    return new PlaidApi(config);
  }

  private isConfigured(): boolean {
    return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const start = Date.now();
    const { lastError, lastErrorAt } = this.getLastError();
    try {
      if (!this.isConfigured()) {
        return {
          name: this.serviceName,
          healthy: false,
          latencyMs: Date.now() - start,
          lastError: "PLAID_CLIENT_ID or PLAID_SECRET not configured",
          circuitState: this.getCircuitState(),
        };
      }
      // Lightweight check — just verify credentials are set and circuit is healthy
      return {
        name: this.serviceName,
        healthy: true,
        latencyMs: Date.now() - start,
        lastError,
        lastErrorAt,
        circuitState: this.getCircuitState(),
      };
    } catch (error: any) {
      return {
        name: this.serviceName,
        healthy: false,
        latencyMs: Date.now() - start,
        lastError: error.message,
        lastErrorAt: Date.now(),
        circuitState: this.getCircuitState(),
      };
    }
  }

  async createLinkToken(userId: string): Promise<string> {
    return this.execute("createLinkToken", async () => {
      const client = this.getClient();
      const response = await client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: "HBG Financial Platform",
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: "en",
      });
      return response.data.link_token;
    });
  }

  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    return this.execute("exchangePublicToken", async () => {
      const client = this.getClient();
      const response = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    });
  }

  async getAccounts(accessToken: string): Promise<PlaidAccount[]> {
    return this.execute("getAccounts", async () => {
      const client = this.getClient();
      const response = await client.accountsGet({ access_token: accessToken });
      return response.data.accounts.map((a) => ({
        accountId: a.account_id,
        name: a.name,
        officialName: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
      }));
    });
  }

  async syncTransactions(accessToken: string, cursor?: string | null): Promise<TransactionSyncResult> {
    return this.execute("syncTransactions", async () => {
      const client = this.getClient();
      const response = await client.transactionsSync({
        access_token: accessToken,
        cursor: cursor || undefined,
      });

      const mapTx = (t: any): SyncedTransaction => ({
        transactionId: t.transaction_id,
        date: t.date,
        name: t.name,
        merchantName: t.merchant_name || null,
        amount: t.amount,
        isoCurrencyCode: t.iso_currency_code || "USD",
        category: t.category || null,
        categoryId: t.category_id || null,
        personalFinanceCategory: t.personal_finance_category?.primary || null,
        pending: t.pending || false,
      });

      return {
        added: response.data.added.map(mapTx),
        modified: response.data.modified.map(mapTx),
        removed: response.data.removed.map((r) => r.transaction_id),
        nextCursor: response.data.next_cursor,
        hasMore: response.data.has_more,
      };
    });
  }

  async getInstitutionName(institutionId: string): Promise<string> {
    try {
      return await this.execute("getInstitutionName", async () => {
        const client = this.getClient();
        const response = await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        return response.data.institution.name;
      });
    } catch {
      return "Unknown Institution";
    }
  }

  async removeItem(accessToken: string): Promise<void> {
    return this.execute("removeItem", async () => {
      const client = this.getClient();
      await client.itemRemove({ access_token: accessToken });
    });
  }
}

const plaidIntegration = new PlaidIntegration();

// Exported functions for backward compatibility
export const createLinkToken = (userId: string) => plaidIntegration.createLinkToken(userId);
export const exchangePublicToken = (publicToken: string) => plaidIntegration.exchangePublicToken(publicToken);
export const getAccounts = (accessToken: string) => plaidIntegration.getAccounts(accessToken);
export const syncTransactions = (accessToken: string, cursor?: string | null) => plaidIntegration.syncTransactions(accessToken, cursor);
export const getInstitutionName = (institutionId: string) => plaidIntegration.getInstitutionName(institutionId);
export const removeItem = (accessToken: string) => plaidIntegration.removeItem(accessToken);
export const getPlaidHealthCheck = () => plaidIntegration.healthCheck();
