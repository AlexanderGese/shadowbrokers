import { createServerClient } from "./supabase/server";

const APP_URL = "https://www.shadowbrokers.app";

interface WebhookConfig {
  user_id: string;
  webhook_url: string;
  notify_alerts: boolean;
  notify_briefings: boolean;
  notify_danger: boolean;
  notify_high_confidence: boolean;
  notify_accuracy_report: boolean;
  notify_portfolio: boolean;
}

type NotifyType = "alerts" | "briefings" | "danger" | "high_confidence" | "accuracy_report" | "portfolio";

async function getActiveWebhooks(type: NotifyType): Promise<WebhookConfig[]> {
  const supabase = createServerClient();
  const columnMap: Record<NotifyType, string> = {
    alerts: "notify_alerts",
    briefings: "notify_briefings",
    danger: "notify_danger",
    high_confidence: "notify_high_confidence",
    accuracy_report: "notify_accuracy_report",
    portfolio: "notify_portfolio",
  };

  const { data } = await supabase
    .from("user_webhooks")
    .select("*")
    .eq(columnMap[type], true);

  return (data || []) as WebhookConfig[];
}

const WEBHOOK_IDENTITY = {
  username: "SHADOWBROKERS",
  avatar_url: "https://www.shadowbrokers.app/icon-512.png",
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
    url: `${APP_URL}/ticker/${ticker}`,
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
    url: `${APP_URL}/dashboard`,
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
    url: `${APP_URL}/ticker/${ticker}`,
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
    url: `${APP_URL}/ticker/${ticker}`,
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

export async function notifyAccuracyReport(report: {
  total: number;
  correct: number;
  percentage: number;
  topTicker: string | null;
  worstTicker: string | null;
}): Promise<void> {
  const webhooks = await getActiveWebhooks("accuracy_report");
  if (!webhooks.length) return;

  const color = report.percentage >= 70 ? 0x00FF88 : report.percentage >= 50 ? 0xFFAA00 : 0xFF4444;

  const fields = [
    { name: "Total Predictions", value: `${report.total}`, inline: true },
    { name: "Correct", value: `${report.correct}`, inline: true },
    { name: "Accuracy", value: `${report.percentage.toFixed(1)}%`, inline: true },
  ];
  if (report.topTicker) fields.push({ name: "Best Ticker", value: report.topTicker, inline: true });
  if (report.worstTicker) fields.push({ name: "Worst Ticker", value: report.worstTicker, inline: true });

  const embed = {
    title: "WEEKLY ACCURACY REPORT",
    description: `AI prediction accuracy for the past 7 days: **${report.percentage.toFixed(1)}%**`,
    color,
    url: `${APP_URL}/dashboard`,
    fields,
    footer: { text: "ShadowBrokers Accuracy Tracker" },
    timestamp: new Date().toISOString(),
  };

  await Promise.allSettled(
    webhooks.map((w) => sendDiscordEmbed(w.webhook_url, embed))
  );
}

export async function notifyPortfolioAlert(
  userId: string,
  ticker: string,
  changePercent: number,
  currentPrice: number
): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("user_webhooks")
    .select("webhook_url, notify_portfolio")
    .eq("user_id", userId)
    .eq("notify_portfolio", true)
    .single();

  if (!data?.webhook_url) return;

  const color = changePercent > 0 ? 0x00FF88 : 0xFF4444;
  const sign = changePercent > 0 ? "+" : "";

  await sendDiscordEmbed(data.webhook_url, {
    title: `PORTFOLIO: ${ticker}`,
    description: `Significant price movement detected on your portfolio position.`,
    color,
    url: `${APP_URL}/portfolio`,
    fields: [
      { name: "Price", value: `$${currentPrice.toFixed(2)}`, inline: true },
      { name: "Change", value: `${sign}${changePercent.toFixed(2)}%`, inline: true },
    ],
    footer: { text: "ShadowBrokers Portfolio Alert" },
    timestamp: new Date().toISOString(),
  });
}
