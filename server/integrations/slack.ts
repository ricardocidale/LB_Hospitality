import type { NotificationEvent } from "../notifications/events";
import { getEventLabel } from "../notifications/events";

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: { type: string; text: string }; url?: string; action_id?: string }[];
  accessory?: any;
}

function buildAlertBlocks(event: NotificationEvent): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `⚠️ ${getEventLabel(event.type)}`, emoji: true },
    },
  ];

  if (event.propertyName) {
    const fields: { type: string; text: string }[] = [
      { type: "mrkdwn", text: `*Property:*\n${event.propertyName}` },
    ];

    if (event.metric) {
      fields.push({ type: "mrkdwn", text: `*Metric:*\n${event.metric.toUpperCase()}` });
    }
    if (event.currentValue !== undefined) {
      fields.push({ type: "mrkdwn", text: `*Current Value:*\n${event.currentValue}` });
    }
    if (event.threshold !== undefined) {
      fields.push({ type: "mrkdwn", text: `*Threshold:*\n${event.threshold}` });
    }

    blocks.push({ type: "section", fields });
  }

  if (event.message) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: event.message },
    });
  }

  if (event.link) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.replit.app`
        : "https://app.example.com";

    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View in Portal" },
          url: `${baseUrl}${event.link}`,
          action_id: "view_portal",
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `📅 ${event.timestamp.toISOString()}` } as any,
    ],
  });

  return blocks;
}

function buildSystemEventBlocks(event: NotificationEvent): SlackBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${getEventLabel(event.type)}*\n${event.message || "System event triggered"}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `📅 ${event.timestamp.toISOString()}` } as any,
      ],
    },
  ];
}

export async function sendSlackNotification(
  webhookUrl: string,
  event: NotificationEvent
): Promise<void> {
  const isAlert = event.type.includes("BREACH") || event.type === "CHECKER_FAILURE";
  const blocks = isAlert ? buildAlertBlocks(event) : buildSystemEventBlocks(event);

  const payload = {
    text: `${getEventLabel(event.type)}: ${event.message || "Notification from HBG Portal"}`,
    blocks,
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed (${response.status}): ${text}`);
  }
}

export async function testSlackWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      text: "🔔 Test notification from HBG Portal — Slack integration is working!",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "✅ *Slack Integration Test*\nThis confirms your Slack webhook is configured correctly. Alert notifications will appear in this channel.",
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Webhook returned ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
