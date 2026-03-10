import { createServerClient } from "./supabase/server";
import { createHmac } from "crypto";

const APP_URL = "https://shadowbrokers-woad.vercel.app";

interface CustomWebhookConfig {
  id: string;
  user_id: string;
  name: string;
  webhook_url: string;
  secret: string;
  custom_headers: Record<string, string>;
  notify_alerts: boolean;
  notify_briefings: boolean;
  notify_danger: boolean;
  notify_high_confidence: boolean;
  notify_accuracy_report: boolean;
  notify_portfolio: boolean;
}

type NotifyType = "alerts" | "briefings" | "danger" | "high_confidence" | "accuracy_report" | "portfolio";

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  text: string; // Slack-compatible plain text
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

async function sendWebhook(config: CustomWebhookConfig, payload: WebhookPayload): Promise<boolean> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, config.secret);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-ShadowBrokers-Signature": `sha256=${signature}`,
    "X-ShadowBrokers-Event": payload.event,
    "X-ShadowBrokers-Timestamp": payload.timestamp,
    "User-Agent": "ShadowBrokers-Webhook/1.0",
    ...(config.custom_headers || {}),
  };

  try {
    const res = await fetch(config.webhook_url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function getActiveWebhooks(type: NotifyType): Promise<CustomWebhookConfig[]> {
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
    .from("user_custom_webhooks")
    .select("*")
    .eq(columnMap[type], true);

  return (data || []) as CustomWebhookConfig[];
}

async function getUserWebhooks(userId: string, type: NotifyType): Promise<CustomWebhookConfig[]> {
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
    .from("user_custom_webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq(columnMap[type], true);

  return (data || []) as CustomWebhookConfig[];
}

// --- Per-user notifications ---

export async function notifyCustomWebhookAlert(
  userId: string,
  ticker: string,
  condition: string,
  details: string
): Promise<void> {
  const webhooks = await getUserWebhooks(userId, "alerts");

  const payload: WebhookPayload = {
    event: "alert.triggered",
    timestamp: new Date().toISOString(),
    data: {
      ticker,
      condition,
      details,
      url: `${APP_URL}/ticker/${ticker}`,
    },
    text: `[ALERT] ${ticker} — ${condition.toUpperCase()}: ${details}`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

export async function notifyCustomWebhookPortfolio(
  userId: string,
  ticker: string,
  changePercent: number,
  currentPrice: number
): Promise<void> {
  const webhooks = await getUserWebhooks(userId, "portfolio");

  const sign = changePercent > 0 ? "+" : "";
  const payload: WebhookPayload = {
    event: "portfolio.alert",
    timestamp: new Date().toISOString(),
    data: {
      ticker,
      change_percent: changePercent,
      current_price: currentPrice,
      url: `${APP_URL}/portfolio`,
    },
    text: `[PORTFOLIO] ${ticker}: $${currentPrice.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

// --- Broadcast notifications ---

export async function notifyCustomWebhookBriefing(
  summary: string,
  bias: string,
  dangerTickers: string[]
): Promise<void> {
  const webhooks = await getActiveWebhooks("briefings");
  if (!webhooks.length) return;

  const payload: WebhookPayload = {
    event: "briefing.generated",
    timestamp: new Date().toISOString(),
    data: {
      summary,
      market_bias: bias,
      danger_tickers: dangerTickers,
      url: `${APP_URL}/dashboard`,
    },
    text: `[BRIEFING] Market bias: ${bias.toUpperCase()} — ${summary}`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

export async function notifyCustomWebhookDanger(
  ticker: string,
  reasoning: string,
  confidence: number
): Promise<void> {
  const webhooks = await getActiveWebhooks("danger");
  if (!webhooks.length) return;

  const payload: WebhookPayload = {
    event: "danger.signal",
    timestamp: new Date().toISOString(),
    data: {
      ticker,
      reasoning,
      confidence,
      url: `${APP_URL}/ticker/${ticker}`,
    },
    text: `[DANGER] ${ticker} (${Math.round(confidence * 100)}%): ${reasoning}`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

export async function notifyCustomWebhookHighConfidence(
  ticker: string,
  direction: string,
  confidence: number,
  reasoning: string
): Promise<void> {
  const webhooks = await getActiveWebhooks("high_confidence");
  if (!webhooks.length) return;

  const payload: WebhookPayload = {
    event: "prediction.high_confidence",
    timestamp: new Date().toISOString(),
    data: {
      ticker,
      direction,
      confidence,
      reasoning,
      url: `${APP_URL}/ticker/${ticker}`,
    },
    text: `[PREDICTION] ${ticker} ${direction.toUpperCase()} (${Math.round(confidence * 100)}%): ${reasoning}`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

export async function notifyCustomWebhookAccuracyReport(report: {
  total: number;
  correct: number;
  percentage: number;
  topTicker: string | null;
  worstTicker: string | null;
}): Promise<void> {
  const webhooks = await getActiveWebhooks("accuracy_report");
  if (!webhooks.length) return;

  const payload: WebhookPayload = {
    event: "accuracy.weekly_report",
    timestamp: new Date().toISOString(),
    data: {
      ...report,
      url: `${APP_URL}/dashboard`,
    },
    text: `[ACCURACY] Weekly: ${report.percentage.toFixed(1)}% (${report.correct}/${report.total})`,
  };

  await Promise.allSettled(webhooks.map((w) => sendWebhook(w, payload)));
}

export { sendWebhook as sendCustomWebhookDirect, signPayload };
