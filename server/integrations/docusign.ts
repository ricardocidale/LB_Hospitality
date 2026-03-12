export interface DocuSignConfig {
  integrationKey: string;
  secretKey: string;
  accountId: string;
  baseUrl: string;
  oauthBaseUrl: string;
}

export interface EnvelopeRecipient {
  name: string;
  email: string;
}

export interface EnvelopeResult {
  envelopeId: string;
  status: string;
  statusDateTime: string;
}

export interface WebhookEvent {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    accountId: string;
    envelopeId: string;
    envelopeSummary?: {
      status: string;
      statusDateTime: string;
      recipients?: {
        signers?: Array<{
          name: string;
          email: string;
          status: string;
          signedDateTime?: string;
          deliveredDateTime?: string;
        }>;
      };
    };
  };
}

function getConfig(): DocuSignConfig {
  return {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || "",
    secretKey: process.env.DOCUSIGN_SECRET_KEY || "",
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || "",
    baseUrl: process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi",
    oauthBaseUrl: process.env.DOCUSIGN_OAUTH_BASE_URL || "https://account-d.docusign.com",
  };
}

export function isDocuSignConfigured(): boolean {
  const config = getConfig();
  return !!(config.integrationKey && config.secretKey && config.accountId);
}

async function getAccessToken(): Promise<string> {
  const config = getConfig();

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (hostname && xReplitToken) {
    try {
      const connResponse = await fetch(
        `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=docusign`,
        { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } }
      );
      const connData = await connResponse.json();
      const conn = connData.items?.[0];
      if (conn?.settings?.access_token) {
        return conn.settings.access_token;
      }
    } catch {
    }
  }

  if (!config.integrationKey || !config.secretKey) {
    throw new Error("DocuSign not configured: missing integration key or secret key");
  }

  const credentials = Buffer.from(`${config.integrationKey}:${config.secretKey}`).toString("base64");
  const response = await fetch(`${config.oauthBaseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "signature",
    }),
  });

  if (!response.ok) {
    throw new Error(`DocuSign auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createAndSendEnvelope(
  documentBase64: string,
  documentName: string,
  recipient: EnvelopeRecipient,
  senderName: string,
  senderEmail: string,
  subject: string
): Promise<EnvelopeResult> {
  const config = getConfig();

  if (!isDocuSignConfigured()) {
    return {
      envelopeId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "sent",
      statusDateTime: new Date().toISOString(),
    };
  }

  const accessToken = await getAccessToken();

  const envelopeDefinition = {
    emailSubject: subject,
    documents: [
      {
        documentBase64,
        name: documentName,
        fileExtension: "html",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: recipient.email,
          name: recipient.name,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: [
              {
                anchorString: "/sig1/",
                anchorYOffset: "0",
                anchorXOffset: "0",
                anchorUnits: "pixels",
              },
            ],
            dateSignedTabs: [
              {
                anchorString: "/date1/",
                anchorYOffset: "0",
                anchorXOffset: "0",
                anchorUnits: "pixels",
              },
            ],
          },
        },
      ],
    },
    status: "sent",
  };

  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelopeDefinition),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DocuSign envelope creation failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return {
    envelopeId: result.envelopeId,
    status: result.status,
    statusDateTime: result.statusDateTime,
  };
}

export async function getEnvelopeStatus(envelopeId: string): Promise<string> {
  const config = getConfig();
  if (!isDocuSignConfigured()) return "sent";

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) throw new Error(`Failed to get envelope status: ${response.status}`);
  const data = await response.json();
  return data.status;
}

export async function downloadSignedDocument(envelopeId: string): Promise<Buffer> {
  const config = getConfig();
  if (!isDocuSignConfigured()) {
    return Buffer.from("Simulated signed document content");
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${config.baseUrl}/v2.1/accounts/${config.accountId}/envelopes/${envelopeId}/documents/combined`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) throw new Error(`Failed to download signed document: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function verifyWebhookSignature(rawBody: string | Buffer, signature: string | undefined): boolean {
  const hmacKey = process.env.DOCUSIGN_WEBHOOK_SECRET;
  if (!hmacKey) {
    // Fail-secure: reject in production when secret is not configured
    if (process.env.NODE_ENV === "production") {
      console.error("[docusign] DOCUSIGN_WEBHOOK_SECRET not set in production — rejecting webhook");
      return false;
    }
    return true; // Allow in dev for testing
  }
  if (!signature) return false;
  try {
    const { createHmac, timingSafeEqual } = require("crypto");
    const computed = createHmac("sha256", hmacKey)
      .update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8"))
      .digest("base64");
    // Use timing-safe comparison to prevent timing attacks
    const a = Buffer.from(computed);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseWebhookEvent(body: any): {
  envelopeId: string;
  status: string;
  timestamp: string;
} | null {
  try {
    const event = body as WebhookEvent;
    const envelopeId = event.data?.envelopeId;
    const status = event.data?.envelopeSummary?.status || event.event;
    const timestamp = event.data?.envelopeSummary?.statusDateTime || event.generatedDateTime;

    if (!envelopeId) return null;

    return { envelopeId, status: normalizeStatus(status), timestamp };
  } catch {
    return null;
  }
}

function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "envelope-sent": "sent",
    "envelope-delivered": "delivered",
    "envelope-completed": "completed",
    "envelope-declined": "declined",
    "envelope-voided": "voided",
    "recipient-sent": "sent",
    "recipient-delivered": "delivered",
    "recipient-completed": "signed",
    "recipient-signed": "signed",
    "recipient-declined": "declined",
  };
  return statusMap[status.toLowerCase()] || status.toLowerCase();
}
