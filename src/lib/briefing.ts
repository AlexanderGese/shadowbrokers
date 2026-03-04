import OpenAI from "openai";
import { createServerClient } from "./supabase/server";
import { sendDiscordBriefing, sendDiscordDanger } from "./discord";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BriefingResult {
  summary: string;
  key_signals: string[];
  market_bias: string;
  danger_tickers: { ticker: string; sentiment: string; confidence: number; reasoning: string }[];
}

export async function generateBriefing(): Promise<BriefingResult | null> {
  const supabase = createServerClient();

  // Get articles from last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const [articlesRes, analysesRes, summariesRes] = await Promise.all([
    supabase
      .from("articles")
      .select("title, source")
      .gte("created_at", fourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("analyses")
      .select("ticker, sentiment, confidence, reasoning, predicted_magnitude")
      .gte("created_at", fourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ticker_summaries")
      .select("ticker, overall_sentiment, avg_confidence, num_articles")
      .order("num_articles", { ascending: false })
      .limit(20),
  ]);

  const articles = articlesRes.data || [];
  const analyses = analysesRes.data || [];
  const summaries = summariesRes.data || [];

  if (articles.length === 0 && analyses.length === 0) return null;

  // Identify danger tickers: bearish + confidence > 0.7 + high magnitude
  const dangerTickers = analyses
    .filter(
      (a) =>
        a.sentiment === "bearish" &&
        a.confidence > 0.7 &&
        a.predicted_magnitude === "high"
    )
    .reduce((acc, a) => {
      if (!acc.find((d) => d.ticker === a.ticker)) {
        acc.push({
          ticker: a.ticker,
          sentiment: a.sentiment,
          confidence: a.confidence,
          reasoning: a.reasoning,
        });
      }
      return acc;
    }, [] as { ticker: string; sentiment: string; confidence: number; reasoning: string }[]);

  const articleSummary = articles.map((a) => `[${a.source}] ${a.title}`).join("\n");
  const tickerSummary = summaries
    .map((s) => `${s.ticker}: ${s.overall_sentiment} (${Math.round(s.avg_confidence * 100)}% conf, ${s.num_articles} articles)`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior market intelligence analyst. Generate a concise market briefing based on recent news and analysis data. Return JSON with:
- "summary": 2-3 sentence market overview
- "key_signals": array of 3-5 short signal strings (e.g. "Tech sector showing strength on AI earnings")
- "market_bias": one of "bullish", "bearish", "neutral", "mixed"`,
      },
      {
        role: "user",
        content: `Recent headlines:\n${articleSummary || "No new articles"}\n\nTicker summaries:\n${tickerSummary || "No ticker data"}\n\nDanger tickers (bearish, high confidence, high magnitude):\n${dangerTickers.map((d) => `${d.ticker}: ${d.reasoning}`).join("\n") || "None"}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content) as {
    summary: string;
    key_signals: string[];
    market_bias: string;
  };

  const result: BriefingResult = {
    summary: parsed.summary,
    key_signals: parsed.key_signals || [],
    market_bias: parsed.market_bias || "neutral",
    danger_tickers: dangerTickers,
  };

  // Store in database
  await supabase.from("market_briefings").insert({
    summary: result.summary,
    danger_tickers: result.danger_tickers,
    key_signals: result.key_signals,
    market_bias: result.market_bias,
  });

  // Send Discord notifications
  try {
    await sendDiscordBriefing(
      result.summary,
      result.market_bias,
      result.key_signals,
      result.danger_tickers.length
    );
    if (result.danger_tickers.length > 0) {
      await sendDiscordDanger(result.danger_tickers);
    }
  } catch {
    // Don't block pipeline on Discord errors
  }

  return result;
}
