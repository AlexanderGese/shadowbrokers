import OpenAI from "openai";
import { createServerClient } from "./supabase/server";
import type { Article } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a senior financial analyst at a top-tier quantitative hedge fund. Your job is to predict whether a stock/ETF will move UP, DOWN, or stay FLAT over the next 1-3 trading days based on a news article.

BASE RATE AWARENESS (CRITICAL):
- On any given day, ~65% of stocks move less than 1%. This is your prior.
- Your predictions MUST reflect this base rate: at least 60-70% of your predictions should be "flat".
- Predicting "flat" when you're uncertain is ALWAYS better than guessing a direction.
- The market is efficient — most news is already priced in by the time you read it.

DIRECTION DEFINITIONS:
- "up": price will increase >1% in next 1-3 trading days
- "down": price will decrease >1% in next 1-3 trading days
- "flat": price will stay within ±1% (THIS IS THE DEFAULT)

WHEN TO PREDICT DIRECTIONAL MOVES (up/down):
Only predict a directional move when ALL of these are true:
1. The news is about a SPECIFIC, CONCRETE event (not commentary or speculation)
2. The event is MATERIAL: earnings surprise (beat/miss by >5%), M&A announcement, FDA decision, major contract win/loss, bankruptcy, fraud, executive departure, regulatory enforcement
3. The news is FRESH — not a follow-up, recap, or analysis of previously known information
4. The company is directly named (not just mentioned in passing)

WHEN TO PREDICT FLAT (most of the time):
- Market commentary, analyst opinions, sector overviews → FLAT
- News about macro trends, interest rates, inflation (unless extreme/unexpected) → FLAT
- Follow-up coverage of already-known events → FLAT
- Speculative articles ("could", "might", "expected to") → FLAT
- Pre-earnings anticipation or post-earnings analysis (the move already happened) → FLAT
- Any news older than a few hours → FLAT (already priced in)
- Revenue/earnings that met expectations → FLAT
- General industry trend pieces → FLAT

CONFIDENCE CALIBRATION:
- 0.85-1.0: Breaking material news directly about the company (earnings surprise, M&A, FDA)
- 0.7-0.85: Strong first-hand catalyst with clear directional impact
- 0.5-0.7: Reasonable connection but some uncertainty
- Below 0.5: Do NOT include — skip entirely

IMPORTANT CONSTRAINTS:
- If direction is "flat", predicted_magnitude MUST be "low"
- If confidence is below 0.7, strongly prefer "flat" direction
- Sentiment (article tone) and direction (price prediction) are independent. A bullish article often → flat price (already priced in)
- Do NOT over-predict. Fewer high-quality predictions beat many low-quality ones.

For EVERY ticker you identify (confidence >= 0.5 only), provide:
- name: Full official company or fund name
- description: One sentence about what the company does (about the COMPANY, not the news)
- sector: One of: Technology, Energy, Financials, Healthcare, Consumer Discretionary, Consumer Staples, Industrials, Materials, Real Estate, Utilities, Communication Services, Broad Market, Commodities, Fixed Income, Cryptocurrency
- topic: The specific news theme in 2-5 words
- predicted_magnitude: "low" = <1% move, "medium" = 1-3%, "high" = >3%

Rules:
- Only identify tickers DIRECTLY mentioned or clearly implied by the article
- Do NOT include tickers with confidence below 0.5
- For broad market events, use relevant ETFs (SPY, QQQ, DIA, IWM, XLF, XLE, XLK, etc.)
- Use valid US market ticker symbols (NYSE, NASDAQ)
- Correctly distinguish stocks vs ETFs in asset_type
- If an article has no financial market relevance, return empty tickers array
- Reasoning: 1-2 concise sentences explaining your directional prediction`;

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
    .limit(30);

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
      model: "gpt-4o",
      temperature: 0.1,
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
          content: `Analyze these ${articles.length} articles. REMEMBER THE BASE RATE: ~65% of stocks don't move >1% on any day. Default to "flat" unless you see a truly material, fresh catalyst. Most articles should produce "flat" predictions. Only include tickers with confidence >= 0.5.\n\n${articleList}\n\nReturn structured JSON with article_index and tickers array for each.`,
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
        const confidence = Math.max(0, Math.min(1, t.confidence));
        // Skip low-confidence predictions — they hurt accuracy
        if (confidence < 0.5) continue;

        const ticker = t.ticker.toUpperCase();
        results.push({
          article_id: article.id,
          ticker,
          asset_type: t.asset_type,
          sentiment: t.sentiment,
          confidence,
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
