import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

function getPlaidClient(): PlaidApi {
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

export async function createLinkToken(userId: string): Promise<string> {
  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "HBG Financial Platform",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}

export async function getAccounts(accessToken: string): Promise<PlaidAccount[]> {
  const client = getPlaidClient();
  const response = await client.accountsGet({ access_token: accessToken });
  return response.data.accounts.map((a) => ({
    accountId: a.account_id,
    name: a.name,
    officialName: a.official_name,
    type: a.type,
    subtype: a.subtype,
    mask: a.mask,
  }));
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

export async function syncTransactions(accessToken: string, cursor?: string | null): Promise<TransactionSyncResult> {
  const client = getPlaidClient();
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
}

export async function getInstitutionName(institutionId: string): Promise<string> {
  try {
    const client = getPlaidClient();
    const response = await client.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    });
    return response.data.institution.name;
  } catch {
    return "Unknown Institution";
  }
}

export async function removeItem(accessToken: string): Promise<void> {
  const client = getPlaidClient();
  await client.itemRemove({ access_token: accessToken });
}
