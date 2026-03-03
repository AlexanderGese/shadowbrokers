import OpenAI from "openai";
import { createServerClient } from "./supabase/server";
import type { Article } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a senior financial analyst at a top-tier quantitative hedge fund. Analyze news articles and determine their impact on specific stocks and ETFs.

For EVERY ticker you identify, you MUST provide:
- name: Full official company or fund name (e.g. "Apple Inc.", "SPDR S&P 500 ETF Trust")
- description: One clear sentence about what this company does or what this ETF tracks (e.g. "Designs and sells consumer electronics, software, and services including iPhone, Mac, and Apple Watch" or "Tracks the S&P 500 index, providing broad exposure to large-cap US equities")
- sector: One of: Technology, Energy, Financials, Healthcare, Consumer Discretionary, Consumer Staples, Industrials, Materials, Real Estate, Utilities, Communication Services, Broad Market, Commodities, Fixed Income, Cryptocurrency
- topic: The specific news theme driving this signal in 2-5 words (e.g. "Iran oil supply disruption", "AI chip demand surge", "Fed rate cut expectations", "Earnings beat guidance")

Rules:
- Only identify tickers DIRECTLY mentioned or clearly implied by the article
- For broad market events, use relevant ETFs (SPY, QQQ, DIA, IWM, XLF, XLE, XLK, etc.)
- Confidence: 0.0 to 1.0, reflecting how directly the article impacts the ticker
- Reasoning: 1-2 concise sentences explaining the connection
- If an article has no financial market relevance, return empty tickers array
- Use valid US market ticker symbols (NYSE, NASDAQ)
- Correctly distinguish stocks vs ETFs in asset_type
- predicted_magnitude: "low" = <1% move, "medium" = 1-3%, "high" = >3%
- description must be about the COMPANY/ETF itself, not about the news
- topic must be about the NEWS THEME, not about the company`;

const BATCH_SIZE = 8;

interface TickerAnalysis {
  ticker: string;
  name: string;
  description: string;
  sector: string;
  topic: string;
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

// Store enrichment data collected during analysis for use in summaries
const tickerEnrichment = new Map<string, { name: string; description: string; sector: string; asset_type: string; topics: string[] }>();

export async function analyzeAndStore(): Promise<{ analyzed: number; insights: number }> {
  const supabase = createServerClient();
  tickerEnrichment.clear();

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
          topic: ins.topic,
        }))
      );
      if (insertError) console.error("[OpenAI] Insert error:", insertError);
      totalInsights += insights.length;
    }

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
      max_tokens: 8192,
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
                          description: { type: "string" },
                          sector: { type: "string" },
                          topic: { type: "string" },
                          asset_type: { type: "string", enum: ["stock", "etf"] },
                          sentiment: { type: "string", enum: ["bullish", "neutral", "bearish"] },
                          confidence: { type: "number" },
                          reasoning: { type: "string" },
                          predicted_direction: { type: "string", enum: ["up", "flat", "down"] },
                          predicted_magnitude: { type: "string", enum: ["low", "medium", "high"] },
                        },
                        required: ["ticker", "name", "description", "sector", "topic", "asset_type", "sentiment", "confidence", "reasoning", "predicted_direction", "predicted_magnitude"],
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
          content: `Analyze these ${articles.length} articles for stock/ETF impact. For each ticker provide the full company description, sector, and the specific news topic driving the signal:\n\n${articleList}\n\nReturn structured JSON with article_index and tickers array for each.`,
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
      topic: string;
    }> = [];

    for (const analysis of parsed.analyses) {
      const article = articles[analysis.article_index];
      if (!article) continue;

      for (const t of analysis.tickers) {
        const ticker = t.ticker.toUpperCase();
        results.push({
          article_id: article.id,
          ticker,
          asset_type: t.asset_type,
          sentiment: t.sentiment,
          confidence: Math.max(0, Math.min(1, t.confidence)),
          reasoning: t.reasoning,
          predicted_direction: t.predicted_direction,
          predicted_magnitude: t.predicted_magnitude,
          topic: t.topic,
        });

        // Collect enrichment data
        if (!tickerEnrichment.has(ticker)) {
          tickerEnrichment.set(ticker, {
            name: t.name,
            description: t.description,
            sector: t.sector,
            asset_type: t.asset_type,
            topics: [t.topic],
          });
        } else {
          const existing = tickerEnrichment.get(ticker)!;
          if (!existing.topics.includes(t.topic)) {
            existing.topics.push(t.topic);
          }
        }
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

  const { data: analyses } = await supabase
    .from("analyses")
    .select("ticker, asset_type, sentiment, confidence, topic")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!analyses?.length) return;

  const tickerMap = new Map<string, {
    asset_type: string;
    sentiments: string[];
    confidences: number[];
    bullish: number;
    bearish: number;
    neutral: number;
    topics: string[];
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
        topics: [],
      });
    }
    const t = tickerMap.get(a.ticker)!;
    t.sentiments.push(a.sentiment);
    t.confidences.push(a.confidence);
    if (a.sentiment === "bullish") t.bullish++;
    else if (a.sentiment === "bearish") t.bearish++;
    else t.neutral++;
    if (a.topic && !t.topics.includes(a.topic)) {
      t.topics.push(a.topic);
    }
  }

  const summaries = Array.from(tickerMap.entries()).map(([ticker, data]) => {
    const total = data.sentiments.length;
    const avgConf = data.confidences.reduce((a, b) => a + b, 0) / total;
    let overall: string;
    if (data.bullish > data.bearish) overall = "bullish";
    else if (data.bearish > data.bullish) overall = "bearish";
    else overall = "neutral";

    // Get enrichment data from current analysis run
    const enrichment = tickerEnrichment.get(ticker);
    const topTopic = data.topics[0] || enrichment?.topics[0] || null;

    const summary: Record<string, unknown> = {
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

    // Add enrichment fields if available
    if (enrichment) {
      summary.name = enrichment.name;
      summary.description = enrichment.description;
      summary.sector = enrichment.sector;
      summary.topic = topTopic;
    } else if (topTopic) {
      summary.topic = topTopic;
    }

    return summary;
  });

  for (const summary of summaries) {
    await supabase
      .from("ticker_summaries")
      .upsert(summary, { onConflict: "ticker" });
  }
}
