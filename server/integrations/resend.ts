import { Resend } from "resend";
import { BaseIntegrationService, type IntegrationHealth } from "./base";
import { logApiCost } from "../middleware/cost-logger";

interface EmailAttachment {
  content: string;
  filename: string;
  type?: string;
}

class ResendIntegration extends BaseIntegrationService {
  readonly serviceName = "resend";

  private getClient(): Resend {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not configured");
    return new Resend(key);
  }

  private getFromAddress(): string {
    return "HBG Portal <noreply@h-analysis.com>";
  }

  async healthCheck(): Promise<IntegrationHealth> {
    const start = Date.now();
    const { lastError, lastErrorAt } = this.getLastError();
    try {
      const resend = this.getClient();
      const { error } = await resend.apiKeys.list();
      const healthy = !error;
      return {
        name: this.serviceName,
        healthy,
        latencyMs: Date.now() - start,
        lastError: healthy ? lastError : (error?.message ?? "Unknown error"),
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
      const resend = this.getClient();

      const emailPayload: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        attachments?: { content: Buffer; filename: string; contentType: string }[];
      } = {
        from: this.getFromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
      };

      if (params.attachments?.length) {
        emailPayload.attachments = params.attachments.map((a) => ({
          content: Buffer.from(a.content, "base64"),
          filename: a.filename,
          contentType: a.type || "application/pdf",
        }));
      }

      const startTime = Date.now();
      const { error } = await resend.emails.send(emailPayload);
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }
      try { logApiCost({ timestamp: new Date().toISOString(), service: "resend", operation: "email", estimatedCostUsd: 0.001, durationMs: Date.now() - startTime, route: "resend-integration" }); } catch {}
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

  async sendWelcomeEmail(params: {
    to: string;
    userName: string;
    loginUrl?: string;
  }): Promise<void> {
    const loginLink = params.loginUrl || "#";
    const html = brandedTemplate(
      "Welcome to HBG Portal",
      `<p>Hi <strong>${params.userName}</strong>,</p>
      <p>Welcome to HBG Portal! Your account has been created and you're ready to get started.</p>
      <p>You can log in at any time to access your properties, financial reports, and analytics tools.</p>
      <p style="margin-top:24px;"><a href="${loginLink}" class="btn">Log In to Your Account</a></p>
      <p style="margin-top:16px;color:#94a3b8;font-size:13px;">If you have any questions, reach out to your account administrator.</p>`
    );

    await this.sendEmailInternal({
      to: params.to,
      subject: "Welcome to HBG Portal",
      html,
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    userName: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }): Promise<void> {
    const expiry = params.expiresInMinutes || 60;
    const html = brandedTemplate(
      "Reset Your Password",
      `<p>Hi <strong>${params.userName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <p style="margin-top:24px;"><a href="${params.resetUrl}" class="btn">Reset Password</a></p>
      <p style="margin-top:16px;color:#94a3b8;font-size:13px;">This link will expire in ${expiry} minutes. If you didn't request this, you can safely ignore this email.</p>`
    );

    await this.sendEmailInternal({
      to: params.to,
      subject: "Reset Your Password — HBG Portal",
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

const resendIntegration = new ResendIntegration();

export const sendReportShareEmail = (params: Parameters<typeof resendIntegration.sendReportShareEmail>[0]) =>
  resendIntegration.sendReportShareEmail(params);
export const sendScenarioSummaryEmail = (params: Parameters<typeof resendIntegration.sendScenarioSummaryEmail>[0]) =>
  resendIntegration.sendScenarioSummaryEmail(params);
export const sendNotificationEmail = (params: Parameters<typeof resendIntegration.sendNotificationEmail>[0]) =>
  resendIntegration.sendNotificationEmail(params);
export const sendWelcomeEmail = (params: Parameters<typeof resendIntegration.sendWelcomeEmail>[0]) =>
  resendIntegration.sendWelcomeEmail(params);
export const sendPasswordResetEmail = (params: Parameters<typeof resendIntegration.sendPasswordResetEmail>[0]) =>
  resendIntegration.sendPasswordResetEmail(params);
export const testResendConnection = () => resendIntegration.healthCheck().then((h) => ({
  success: h.healthy,
  error: h.lastError,
}));
export const getResendHealthCheck = () => resendIntegration.healthCheck();
