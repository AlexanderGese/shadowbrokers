import { createServerClient } from "./supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = "https://www.shadowbrokers.app";

interface TelegramConfig {
  user_id: string;
  chat_id: number;
  notify_alerts: boolean;
  notify_briefings: boolean;
  notify_danger: boolean;
  notify_high_confidence: boolean;
  notify_accuracy_report: boolean;
  notify_portfolio: boolean;
}

type NotifyType = "alerts" | "briefings" | "danger" | "high_confidence" | "accuracy_report" | "portfolio";

async function sendMessage(chatId: number, text: string, parseMode: "HTML" | "MarkdownV2" = "HTML"): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function getActiveUsers(type: NotifyType): Promise<TelegramConfig[]> {
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
    .from("user_telegram")
    .select("*")
    .eq(columnMap[type], true);

  return (data || []) as TelegramConfig[];
}

// --- Per-user notifications ---

export async function notifyTelegramAlert(
  userId: string,
  ticker: string,
  condition: string,
  details: string
): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("user_telegram")
    .select("chat_id, notify_alerts")
    .eq("user_id", userId)
    .eq("notify_alerts", true)
    .single();

  if (!data?.chat_id) return;

  const emoji = condition === "bullish" ? "🟢" : condition === "bearish" || condition === "danger" ? "🔴" : "🔵";
  const text = [
    `${emoji} <b>[${condition.toUpperCase().replace(/_/g, " ")}] ${ticker}</b>`,
    "",
    details,
    "",
    `<a href="${APP_URL}/ticker/${ticker}">View on ShadowBrokers</a>`,
  ].join("\n");

  await sendMessage(data.chat_id, text);
}

// --- Broadcast notifications ---

export async function notifyTelegramBriefing(
  summary: string,
  bias: string,
  dangerTickers: string[]
): Promise<void> {
  const users = await getActiveUsers("briefings");
  if (!users.length) return;

  const biasEmoji = bias === "bullish" ? "🟢" : bias === "bearish" ? "🔴" : "🔵";
  const lines = [
    `${biasEmoji} <b>MARKET BRIEFING — ${bias.toUpperCase()}</b>`,
    "",
    summary,
  ];

  if (dangerTickers.length > 0) {
    lines.push("", `⚠️ <b>Danger:</b> ${dangerTickers.join(", ")}`);
  }

  lines.push("", `<a href="${APP_URL}/dashboard">Open Dashboard</a>`);
  const text = lines.join("\n");

  await Promise.allSettled(users.map((u) => sendMessage(u.chat_id, text)));
}

export async function notifyTelegramDanger(
  ticker: string,
  reasoning: string,
  confidence: number
): Promise<void> {
  const users = await getActiveUsers("danger");
  if (!users.length) return;

  const text = [
    `🔴 <b>DANGER SIGNAL: ${ticker}</b>`,
    "",
    reasoning,
    "",
    `<b>Confidence:</b> ${Math.round(confidence * 100)}%`,
    `<a href="${APP_URL}/ticker/${ticker}">Review Position</a>`,
  ].join("\n");

  await Promise.allSettled(users.map((u) => sendMessage(u.chat_id, text)));
}

export async function notifyTelegramHighConfidence(
  ticker: string,
  direction: string,
  confidence: number,
  reasoning: string
): Promise<void> {
  const users = await getActiveUsers("high_confidence");
  if (!users.length) return;

  const emoji = direction === "up" ? "🟢" : direction === "down" ? "🔴" : "🟡";
  const text = [
    `${emoji} <b>HIGH CONFIDENCE: ${ticker} ${direction.toUpperCase()}</b>`,
    "",
    reasoning,
    "",
    `<b>Confidence:</b> ${Math.round(confidence * 100)}%`,
    `<a href="${APP_URL}/ticker/${ticker}">View Details</a>`,
  ].join("\n");

  await Promise.allSettled(users.map((u) => sendMessage(u.chat_id, text)));
}

export async function notifyTelegramAccuracyReport(report: {
  total: number;
  correct: number;
  percentage: number;
  topTicker: string | null;
  worstTicker: string | null;
}): Promise<void> {
  const users = await getActiveUsers("accuracy_report");
  if (!users.length) return;

  const emoji = report.percentage >= 70 ? "🟢" : report.percentage >= 50 ? "🟡" : "🔴";
  const lines = [
    `${emoji} <b>WEEKLY ACCURACY REPORT</b>`,
    "",
    `<b>Accuracy:</b> ${report.percentage.toFixed(1)}% (${report.correct}/${report.total})`,
  ];

  if (report.topTicker) lines.push(`<b>Best Ticker:</b> ${report.topTicker}`);
  if (report.worstTicker) lines.push(`<b>Worst Ticker:</b> ${report.worstTicker}`);

  lines.push("", `<a href="${APP_URL}/dashboard">View Full Report</a>`);

  const text = lines.join("\n");
  await Promise.allSettled(users.map((u) => sendMessage(u.chat_id, text)));
}

export async function notifyTelegramPortfolio(
  userId: string,
  ticker: string,
  changePercent: number,
  currentPrice: number
): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("user_telegram")
    .select("chat_id, notify_portfolio")
    .eq("user_id", userId)
    .eq("notify_portfolio", true)
    .single();

  if (!data?.chat_id) return;

  const emoji = changePercent > 0 ? "🟢" : "🔴";
  const sign = changePercent > 0 ? "+" : "";
  const text = [
    `${emoji} <b>PORTFOLIO: ${ticker}</b>`,
    "",
    `<b>Price:</b> $${currentPrice.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
    `<a href="${APP_URL}/portfolio">View Portfolio</a>`,
  ].join("\n");

  await sendMessage(data.chat_id, text);
}

// --- Bot command handling ---

export async function handleTelegramUpdate(update: {
  message?: { chat: { id: number }; text?: string; from?: { first_name?: string } };
}): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text === "/start") {
    await sendMessage(
      chatId,
      [
        "🕵️ <b>ShadowBrokers Bot</b>",
        "",
        "To connect your account:",
        "1. Go to Settings on <a href=\"" + APP_URL + "/settings\">shadowbrokers</a>",
        "2. In the Telegram section, click GENERATE TOKEN",
        "3. Send the token here",
        "",
        "Commands:",
        "/status — Check connection status",
        "/unlink — Disconnect your account",
      ].join("\n")
    );
    return;
  }

  if (text === "/unlink") {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("user_telegram")
      .delete()
      .eq("chat_id", chatId)
      .select()
      .single();

    if (data) {
      await sendMessage(chatId, "Account unlinked. You will no longer receive notifications.");
    } else {
      await sendMessage(chatId, "No linked account found.");
    }
    return;
  }

  if (text === "/status") {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("user_telegram")
      .select("linked_at, notify_alerts, notify_briefings, notify_danger, notify_high_confidence")
      .eq("chat_id", chatId)
      .single();

    if (data) {
      const active = [
        data.notify_alerts && "Alerts",
        data.notify_briefings && "Briefings",
        data.notify_danger && "Danger",
        data.notify_high_confidence && "High Confidence",
      ].filter(Boolean).join(", ");

      await sendMessage(
        chatId,
        [
          "🟢 <b>Account Linked</b>",
          `<b>Since:</b> ${new Date(data.linked_at).toLocaleDateString()}`,
          `<b>Active:</b> ${active || "None"}`,
        ].join("\n")
      );
    } else {
      await sendMessage(chatId, "❌ No account linked. Send a token to connect.");
    }
    return;
  }

  // Try to match as a link token
  if (/^[A-Za-z0-9]{8}$/.test(text)) {
    const supabase = createServerClient();
    const { data: token } = await supabase
      .from("telegram_link_tokens")
      .select("user_id, expires_at")
      .eq("token", text)
      .single();

    if (!token) {
      await sendMessage(chatId, "❌ Invalid or expired token. Generate a new one from Settings.");
      return;
    }

    if (new Date(token.expires_at) < new Date()) {
      await supabase.from("telegram_link_tokens").delete().eq("token", text);
      await sendMessage(chatId, "❌ Token expired. Generate a new one from Settings.");
      return;
    }

    // Link the account
    await supabase.from("user_telegram").upsert({
      user_id: token.user_id,
      chat_id: chatId,
    }, { onConflict: "user_id" });

    // Clean up the token
    await supabase.from("telegram_link_tokens").delete().eq("token", text);

    await sendMessage(
      chatId,
      [
        "🟢 <b>Account linked successfully!</b>",
        "",
        "You'll now receive notifications here.",
        `Manage preferences in <a href="${APP_URL}/settings">Settings</a>.`,
      ].join("\n")
    );
    return;
  }

  await sendMessage(chatId, "Send a link token from Settings, or use /start for help.");
}

export { sendMessage as sendTelegramMessage };
