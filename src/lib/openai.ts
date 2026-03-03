import OpenAI from "openai";
import { createServerClient } from "./supabase/server";
import type { Article } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a senior financial analyst at a quantitative hedge fund. Analyze news articles and determine their impact on specific stocks and ETFs.

Rules:
- Only identify tickers DIRECTLY mentioned or clearly implied by the article
- For broad market events, use relevant ETFs (SPY, QQQ, DIA, IWM, XLF, XLE, XLK, etc.)
- Confidence: 0.0 to 1.0, reflecting how directly the article impacts the ticker
- Reasoning: 1-2 concise sentences explaining the connection
- If an article has no financial market relevance, return empty tickers array for that article
- Use valid US market ticker symbols (NYSE, NASDAQ)
- Correctly distinguish stocks vs ETFs in asset_type
- predicted_magnitude: "low" = <1% move, "medium" = 1-3%, "high" = >3%`;

const BATCH_SIZE = 8;

interface TickerAnalysis {
  ticker: string;
  name: string;
  asset_type: "stock" | "etf";
  sentiment: "bullish" | "neutral" | "bearish";
  confidence: number;
  reasoning: string;
  predicted_direction: "up" | "flat" | "down";
  predicted_magnitude: "low" | "medium" | "high";
}

interface AnalysisResponse {
  analyses: {
    article_index: number;
    tickers: TickerAnalysis[];
  }[];
}

export async function analyzeAndStore(): Promise<{ analyzed: number; insights: number }> {
  const supabase = createServerClient();

  // Get unanalyzed articles
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("analyzed", false)
    .order("published_at", { ascending: false })
    .limit(40);

  if (error || !articles?.length) {
    return { analyzed: 0, insights: 0 };
  }

  let totalInsights = 0;

  // Process in batches
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const insights = await analyzeBatch(batch);

    if (insights.length > 0) {
      const { error: insertError } = await supabase.from("analyses").insert(
        insights.map((ins) => ({
          article_id: ins.article_id,
          ticker: ins.ticker,
          asset_type: ins.asset_type,
          sentiment: ins.sentiment,
          confidence: ins.confidence,
          reasoning: ins.reasoning,
          predicted_direction: ins.predicted_direction,
          predicted_magnitude: ins.predicted_magnitude,
        }))
      );
      if (insertError) console.error("[OpenAI] Insert error:", insertError);
      totalInsights += insights.length;
    }

    // Mark batch as analyzed
    await supabase
      .from("articles")
      .update({ analyzed: true })
      .in("id", batch.map((a) => a.id));
  }

  return { analyzed: articles.length, insights: totalInsights };
}

async function analyzeBatch(articles: Article[]) {
  const articleList = articles
    .map((a, i) => `[Article ${i}]\nTitle: ${a.title}\nSource: ${a.source}\nDescription: ${a.description || "N/A"}`)
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "financial_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              analyses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    article_index: { type: "number" },
                    tickers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          ticker: { type: "string" },
                          name: { type: "string" },
                          asset_type: { type: "string", enum: ["stock", "etf"] },
                          sentiment: { type: "string", enum: ["bullish", "neutral", "bearish"] },
                          confidence: { type: "number" },
                          reasoning: { type: "string" },
                          predicted_direction: { type: "string", enum: ["up", "flat", "down"] },
                          predicted_magnitude: { type: "string", enum: ["low", "medium", "high"] },
                        },
                        required: ["ticker", "name", "asset_type", "sentiment", "confidence", "reasoning", "predicted_direction", "predicted_magnitude"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["article_index", "tickers"],
                  additionalProperties: false,
                },
              },
            },
            required: ["analyses"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze these ${articles.length} articles for stock/ETF impact:\n\n${articleList}\n\nReturn structured JSON with article_index and tickers array for each.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed: AnalysisResponse = JSON.parse(content);
    const results: Array<{
      article_id: string;
      ticker: string;
      asset_type: string;
      sentiment: string;
      confidence: number;
      reasoning: string;
      predicted_direction: string;
      predicted_magnitude: string;
    }> = [];

    for (const analysis of parsed.analyses) {
      const article = articles[analysis.article_index];
      if (!article) continue;

      for (const t of analysis.tickers) {
        results.push({
          article_id: article.id,
          ticker: t.ticker.toUpperCase(),
          asset_type: t.asset_type,
          sentiment: t.sentiment,
          confidence: Math.max(0, Math.min(1, t.confidence)),
          reasoning: t.reasoning,
          predicted_direction: t.predicted_direction,
          predicted_magnitude: t.predicted_magnitude,
        });
      }
    }

    // Update ticker names in summaries
    const supabase = createServerClient();
    const tickerNames = new Map<string, { name: string; asset_type: string }>();
    for (const analysis of parsed.analyses) {
      for (const t of analysis.tickers) {
        tickerNames.set(t.ticker.toUpperCase(), { name: t.name, asset_type: t.asset_type });
      }
    }

    return results;
  } catch (error) {
    console.error("[OpenAI] Analysis error:", error);
    return [];
  }
}

export async function refreshTickerSummaries(): Promise<void> {
  const supabase = createServerClient();

  // Get aggregated data from analyses (last 7 days)
  const { data: analyses } = await supabase
    .from("analyses")
    .select("ticker, asset_type, sentiment, confidence")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!analyses?.length) return;

  // Aggregate per ticker
  const tickerMap = new Map<string, {
    asset_type: string;
    sentiments: string[];
    confidences: number[];
    bullish: number;
    bearish: number;
    neutral: number;
  }>();

  for (const a of analyses) {
    if (!tickerMap.has(a.ticker)) {
      tickerMap.set(a.ticker, {
        asset_type: a.asset_type,
        sentiments: [],
        confidences: [],
        bullish: 0,
        bearish: 0,
        neutral: 0,
      });
    }
    const t = tickerMap.get(a.ticker)!;
    t.sentiments.push(a.sentiment);
    t.confidences.push(a.confidence);
    if (a.sentiment === "bullish") t.bullish++;
    else if (a.sentiment === "bearish") t.bearish++;
    else t.neutral++;
  }

  // Upsert summaries
  const summaries = Array.from(tickerMap.entries()).map(([ticker, data]) => {
    const total = data.sentiments.length;
    const avgConf = data.confidences.reduce((a, b) => a + b, 0) / total;
    let overall: string;
    if (data.bullish > data.bearish) overall = "bullish";
    else if (data.bearish > data.bullish) overall = "bearish";
    else overall = "neutral";

    return {
      ticker,
      asset_type: data.asset_type,
      overall_sentiment: overall,
      avg_confidence: Math.round(avgConf * 100) / 100,
      bullish_count: data.bullish,
      bearish_count: data.bearish,
      neutral_count: data.neutral,
      num_articles: total,
      last_updated: new Date().toISOString(),
    };
  });

  for (const summary of summaries) {
    await supabase
      .from("ticker_summaries")
      .upsert(summary, { onConflict: "ticker" });
  }
}
