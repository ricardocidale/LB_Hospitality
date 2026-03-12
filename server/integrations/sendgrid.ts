import { BaseIntegrationService, type IntegrationHealth } from "./base";

const SENDGRID_API_URL = "https://api.sendgrid.com/v3";

interface EmailAttachment {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
}

class SendGridIntegration extends BaseIntegrationService {
  readonly serviceName = "sendgrid";

  private getApiKey(): string {
    const key = process.env.SENDGRID_API_KEY;
    if (!key) throw new Error("SENDGRID_API_KEY not configured");
    return key;
  }

  private getFromEmail(): string {
    return process.env.SENDGRID_FROM_EMAIL || "noreply@hbg-portal.com";
  }

  private getFromName(): string {
    return process.env.SENDGRID_FROM_NAME || "HBG Portal";
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const start = Date.now();
    const { lastError, lastErrorAt } = this.getLastError();
    try {
      const apiKey = this.getApiKey();
      const response = await fetch(`${SENDGRID_API_URL}/user/credits`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const healthy = response.ok;
      return {
        name: this.serviceName,
        healthy,
        latencyMs: Date.now() - start,
        lastError: healthy ? lastError : `API returned ${response.status}`,
        lastErrorAt: healthy ? lastErrorAt : Date.now(),
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

  private async sendEmailInternal(params: {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
  }): Promise<void> {
    return this.execute("sendEmail", async () => {
      const apiKey = this.getApiKey();

      const payload: any = {
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: this.getFromEmail(), name: this.getFromName() },
        subject: params.subject,
        content: [{ type: "text/html", value: params.html }],
      };

      if (params.attachments?.length) {
        payload.attachments = params.attachments.map((a) => ({
          content: a.content,
          filename: a.filename,
          type: a.type || "application/pdf",
          disposition: a.disposition || "attachment",
        }));
      }

      const response = await fetch(`${SENDGRID_API_URL}/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`SendGrid API error (${response.status}): ${text}`);
      }
    });
  }

  async sendReportShareEmail(params: {
    to: string;
    propertyName: string;
    metrics: Record<string, any>;
    message?: string;
    attachmentBase64?: string;
    attachmentFilename?: string;
  }): Promise<void> {
    let metricsTable = "";
    if (Object.keys(params.metrics).length > 0) {
      const rows = Object.entries(params.metrics)
        .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`)
        .join("");
      metricsTable = `<table class="metrics"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const messageSection = params.message ? `<p style="margin:16px 0;color:#475569;">${params.message}</p>` : "";

    const html = brandedTemplate(
      `Financial Report: ${params.propertyName}`,
      `<p>A financial report for <strong>${params.propertyName}</strong> has been shared with you.</p>
      ${metricsTable}${messageSection}
      <p style="margin-top:24px;"><a href="#" class="btn">View in Portal</a></p>`
    );

    const attachments: EmailAttachment[] = [];
    if (params.attachmentBase64 && params.attachmentFilename) {
      const ext = params.attachmentFilename.split(".").pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
      attachments.push({
        content: params.attachmentBase64,
        filename: params.attachmentFilename,
        type: mimeTypes[ext || "pdf"] || "application/octet-stream",
      });
    }

    await this.sendEmailInternal({
      to: params.to,
      subject: `Financial Report: ${params.propertyName}`,
      html,
      attachments,
    });
  }

  async sendScenarioSummaryEmail(params: {
    to: string;
    scenarios: { name: string; metrics: Record<string, any> }[];
    message?: string;
  }): Promise<void> {
    const headers = ["Metric", ...params.scenarios.map((s) => s.name)];
    const allKeys = Array.from(new Set(params.scenarios.flatMap((s) => Object.keys(s.metrics))));

    const headerRow = headers.map((h) => `<th>${h}</th>`).join("");
    const bodyRows = allKeys
      .map((key) => {
        const cells = params.scenarios.map((s) => `<td>${s.metrics[key] ?? "—"}</td>`).join("");
        return `<tr><td><strong>${key}</strong></td>${cells}</tr>`;
      })
      .join("");

    const table = `<table class="metrics"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    const messageSection = params.message ? `<p style="margin:16px 0;color:#475569;">${params.message}</p>` : "";

    const html = brandedTemplate(
      "Scenario Comparison",
      `<p>A scenario comparison has been shared with you.</p>${table}${messageSection}`
    );

    await this.sendEmailInternal({
      to: params.to,
      subject: "Scenario Comparison — HBG Portal",
      html,
    });
  }

  async sendNotificationEmail(params: {
    to: string;
    subject: string;
    title: string;
    body: string;
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<void> {
    const actionBtn = params.actionUrl
      ? `<p style="margin-top:24px;"><a href="${params.actionUrl}" class="btn">${params.actionLabel || "View in Portal"}</a></p>`
      : "";

    const html = brandedTemplate(params.title, `<p>${params.body}</p>${actionBtn}`);

    await this.sendEmailInternal({
      to: params.to,
      subject: params.subject,
      html,
    });
  }
}

function brandedTemplate(title: string, body: string, companyName = "HBG Portal"): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px 40px; text-align: center; }
.header h1 { color: #fff; font-size: 24px; margin: 0; font-weight: 600; }
.header p { color: #94a3b8; font-size: 13px; margin: 8px 0 0; }
.body { padding: 32px 40px; }
.footer { padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
table.metrics { width: 100%; border-collapse: collapse; margin: 16px 0; }
table.metrics th { text-align: left; padding: 8px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #64748b; }
table.metrics td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.btn { display: inline-block; padding: 10px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
</style></head>
<body>
<div class="container">
<div class="header"><h1>${title}</h1><p>${companyName}</p></div>
<div class="body">${body}</div>
<div class="footer">Sent by HBG Portal &bull; This is an automated notification</div>
</div></body></html>`;
}

const sendGridIntegration = new SendGridIntegration();

// Exported functions for backward compatibility
export const sendReportShareEmail = (params: Parameters<typeof sendGridIntegration.sendReportShareEmail>[0]) =>
  sendGridIntegration.sendReportShareEmail(params);
export const sendScenarioSummaryEmail = (params: Parameters<typeof sendGridIntegration.sendScenarioSummaryEmail>[0]) =>
  sendGridIntegration.sendScenarioSummaryEmail(params);
export const sendNotificationEmail = (params: Parameters<typeof sendGridIntegration.sendNotificationEmail>[0]) =>
  sendGridIntegration.sendNotificationEmail(params);
export const testSendGridConnection = () => sendGridIntegration.healthCheck().then((h) => ({
  success: h.healthy,
  error: h.lastError,
}));
export const getSendGridHealthCheck = () => sendGridIntegration.healthCheck();
