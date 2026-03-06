import { createServerClient } from "./supabase/server";

interface WebhookConfig {
  user_id: string;
  webhook_url: string;
  notify_alerts: boolean;
  notify_briefings: boolean;
  notify_danger: boolean;
  notify_high_confidence: boolean;
}

async function getActiveWebhooks(type: "alerts" | "briefings" | "danger" | "high_confidence"): Promise<WebhookConfig[]> {
  const supabase = createServerClient();
  const columnMap = {
    alerts: "notify_alerts",
    briefings: "notify_briefings",
    danger: "notify_danger",
    high_confidence: "notify_high_confidence",
  };

  const { data } = await supabase
    .from("user_webhooks")
    .select("*")
    .eq(columnMap[type], true);

  return (data || []) as WebhookConfig[];
}

const WEBHOOK_IDENTITY = {
  username: "SHADOWBROKERS",
  avatar_url: "https://shadowbrokers-woad.vercel.app/icon-512.png",
};

async function sendDiscordEmbed(webhookUrl: string, embed: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...WEBHOOK_IDENTITY, embeds: [embed] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyAlertTriggered(userId: string, ticker: string, condition: string, details: string): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("user_webhooks")
    .select("webhook_url, notify_alerts")
    .eq("user_id", userId)
    .eq("notify_alerts", true)
    .single();

  if (!data?.webhook_url) return;

  const colorMap: Record<string, number> = {
    bullish: 0x00FF88,
    bearish: 0xFF4444,
    danger: 0xFF4444,
    high_move: 0xFFAA00,
    sentiment_flip: 0x00AAFF,
    any_change: 0x00AAFF,
  };

  await sendDiscordEmbed(data.webhook_url, {
    title: `ALERT: ${ticker} — ${condition.toUpperCase()}`,
    description: details,
    color: colorMap[condition] || 0x00AAFF,
    footer: { text: "ShadowBrokers Alert System" },
    timestamp: new Date().toISOString(),
  });
}

export async function notifyBriefingGenerated(summary: string, bias: string, dangerTickers: string[]): Promise<void> {
  const webhooks = await getActiveWebhooks("briefings");

  const colorMap: Record<string, number> = {
    bullish: 0x00FF88,
    bearish: 0xFF4444,
    mixed: 0xFFAA00,
  };

  const embed = {
    title: `MARKET BRIEFING — ${bias.toUpperCase()}`,
    description: summary.substring(0, 2000),
    color: colorMap[bias] || 0x00AAFF,
    fields: dangerTickers.length > 0
      ? [{ name: "Danger Tickers", value: dangerTickers.join(", "), inline: false }]
      : [],
    footer: { text: "ShadowBrokers Daily Briefing" },
    timestamp: new Date().toISOString(),
  };

  await Promise.allSettled(
    webhooks.map((w) => sendDiscordEmbed(w.webhook_url, embed))
  );
}

export async function notifyDangerSignal(ticker: string, reasoning: string, confidence: number): Promise<void> {
  const webhooks = await getActiveWebhooks("danger");

  const embed = {
    title: `DANGER SIGNAL: ${ticker}`,
    description: reasoning,
    color: 0xFF4444,
    fields: [
      { name: "Confidence", value: `${Math.round(confidence * 100)}%`, inline: true },
      { name: "Action", value: "Review position immediately", inline: true },
    ],
    footer: { text: "ShadowBrokers Danger Alert" },
    timestamp: new Date().toISOString(),
  };

  await Promise.allSettled(
    webhooks.map((w) => sendDiscordEmbed(w.webhook_url, embed))
  );
}

export async function notifyHighConfidencePrediction(ticker: string, direction: string, confidence: number, reasoning: string): Promise<void> {
  const webhooks = await getActiveWebhooks("high_confidence");

  const colorMap: Record<string, number> = {
    up: 0x00FF88,
    down: 0xFF4444,
    flat: 0xFFAA00,
  };

  const embed = {
    title: `HIGH CONFIDENCE: ${ticker} ${direction.toUpperCase()}`,
    description: reasoning,
    color: colorMap[direction] || 0x00AAFF,
    fields: [
      { name: "Direction", value: direction.toUpperCase(), inline: true },
      { name: "Confidence", value: `${Math.round(confidence * 100)}%`, inline: true },
    ],
    footer: { text: "ShadowBrokers AI Prediction" },
    timestamp: new Date().toISOString(),
  };

  await Promise.allSettled(
    webhooks.map((w) => sendDiscordEmbed(w.webhook_url, embed))
  );
}
