const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

async function sendWebhook(embeds: DiscordEmbed[]): Promise<void> {
  if (!WEBHOOK_URL) return;

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "SHADOWBROKERS",
      avatar_url: "https://shadowbrokers-woad.vercel.app/icon-512.png",
      embeds,
    }),
  });
}

export async function sendDiscordAlert(
  ticker: string,
  sentiment: string,
  confidence: number,
  condition: string,
  body: string
): Promise<void> {
  if (!WEBHOOK_URL) return;

  const color =
    sentiment === "bullish" ? 0x00ff88 : sentiment === "bearish" ? 0xff4444 : 0xffaa00;

  await sendWebhook([
    {
      title: `[${condition.toUpperCase()}] ${ticker}`,
      description: body,
      color,
      fields: [
        { name: "Sentiment", value: sentiment.toUpperCase(), inline: true },
        { name: "Confidence", value: `${Math.round(confidence * 100)}%`, inline: true },
        { name: "Condition", value: condition.replace(/_/g, " ").toUpperCase(), inline: true },
      ],
      timestamp: new Date().toISOString(),
    },
  ]);
}

export async function sendDiscordBriefing(
  summary: string,
  marketBias: string,
  keySignals: string[],
  dangerCount: number
): Promise<void> {
  if (!WEBHOOK_URL) return;

  const biasColor =
    marketBias === "bullish" ? 0x00ff88 : marketBias === "bearish" ? 0xff4444 : 0x00aaff;

  await sendWebhook([
    {
      title: `MARKET BRIEFING — ${marketBias.toUpperCase()}`,
      description: summary,
      color: biasColor,
      fields: [
        {
          name: "Key Signals",
          value: keySignals.map((s) => `> ${s}`).join("\n") || "None",
        },
        {
          name: "Danger Tickers",
          value: dangerCount > 0 ? `${dangerCount} ticker(s) flagged` : "None",
          inline: true,
        },
      ],
      footer: { text: "ShadowBrokers Market Intelligence" },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export async function sendDiscordDanger(
  tickers: { ticker: string; reasoning: string; confidence: number }[]
): Promise<void> {
  if (!WEBHOOK_URL || tickers.length === 0) return;

  await sendWebhook([
    {
      title: `DANGER ZONE — ${tickers.length} TICKER(S)`,
      description: tickers
        .map(
          (t) =>
            `**${t.ticker}** (${Math.round(t.confidence * 100)}%)\n${t.reasoning}`
        )
        .join("\n\n"),
      color: 0xff4444,
      footer: { text: "High-confidence bearish signals detected" },
      timestamp: new Date().toISOString(),
    },
  ]);
}

export async function testDiscordWebhook(): Promise<boolean> {
  if (!WEBHOOK_URL) return false;

  try {
    await sendWebhook([
      {
        title: "ShadowBrokers — Webhook Test",
        description: "Discord webhook is configured and working.",
        color: 0x00aaff,
        footer: { text: "Test message from ShadowBrokers admin panel" },
        timestamp: new Date().toISOString(),
      },
    ]);
    return true;
  } catch {
    return false;
  }
}
