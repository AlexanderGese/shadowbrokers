import OpenAI from "openai";
import { createServerClient } from "./supabase/server";
import { getPrice } from "./yahoo-finance";
import type { Article } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a senior financial analyst at a top-tier quantitative hedge fund specializing in short-term price prediction. Your job is to predict whether a stock/ETF will move UP, DOWN, or stay FLAT over the next 1-3 trading days based on a news article.

CRITICAL CONTEXT — NEWS DELAY:
- You are reading RSS feed articles. By the time you see them, they are typically 1-12 hours old.
- Markets react to news within MINUTES. If the event happened during market hours, the move has ALREADY happened.
- Your prediction window is the NEXT 1-3 trading days AFTER you read this, not from when the event occurred.
- This means most news you see has already been priced in. Your default should be FLAT.

BASE RATE AWARENESS (YOUR #1 RULE):
- On any given day, ~65% of stocks move less than 1.5%. This is your prior.
- Your predictions MUST reflect this: at least 85-90% of your predictions should be "flat".
- Predicting "flat" when you're uncertain is ALWAYS better than guessing a direction.
- The market is efficient — by the time news hits RSS feeds, it's almost certainly priced in.
- You are being scored on accuracy. A wrong directional call DESTROYS your score. 10 correct flats + 1 wrong directional = bad score.
- FLAT IS ALMOST ALWAYS RIGHT. Only deviate when you are extremely certain.

DIRECTION DEFINITIONS:
- "up": price will increase >1% in next 1-3 trading days FROM CURRENT PRICE
- "down": price will decrease >1% in next 1-3 trading days FROM CURRENT PRICE
- "flat": price will stay within ±1.5% (THIS IS THE DEFAULT — use this 85-90% of the time)

WHEN TO PREDICT DIRECTIONAL MOVES (up/down) — STRICT CRITERIA:
Only predict a directional move when ALL of these are true:
1. The news is about a SPECIFIC, CONCRETE event (not commentary or speculation)
2. The event is MATERIAL and has clear directional impact:
   - STRONG UP catalysts: Earnings beat by >10%, major acquisition at premium, FDA approval, massive contract win, stock split announcement, inclusion in major index
   - STRONG DOWN catalysts: Earnings miss by >10%, fraud/accounting scandal, CEO sudden departure, product recall, major lawsuit ruling, bankruptcy filing, regulatory ban
3. The news is BREAKING — first reports, not follow-ups, recaps, or analysis of known events
4. The company is directly named and is the primary subject of the article
5. The event likely happened AFTER market close or pre-market (so the move hasn't happened yet)

WHEN TO PREDICT FLAT (most of the time — this is your bread and butter):
- Market commentary, analyst opinions, sector overviews → FLAT
- Analyst upgrades/downgrades → FLAT (these rarely move stocks >1%)
- News about macro trends, interest rates, inflation → FLAT
- Follow-up coverage of already-known events → FLAT
- Speculative articles ("could", "might", "expected to", "is considering") → FLAT
- Pre-earnings anticipation → FLAT (the move happens on the actual report)
- Post-earnings analysis → FLAT (the move already happened)
- Revenue/earnings that met or slightly beat/missed expectations → FLAT
- General industry trend pieces → FLAT
- Any news about an event that happened during market hours → FLAT (already priced in)
- Partnership announcements (unless transformative) → FLAT
- Product launches (unless for mega-cap companies with clear revenue impact) → FLAT
- Management guidance that aligns with consensus → FLAT
- Share buyback announcements → FLAT
- Dividend changes (unless dramatic cut) → FLAT
- Any article where you're less than 90% sure of direction → FLAT
- When in doubt between flat and directional → ALWAYS FLAT

CONFIDENCE CALIBRATION:
- 0.95-1.0: Breaking first-report of binary event (earnings surprise >15%, M&A confirmed, FDA decision)
- 0.85-0.95: Very strong material catalyst, definitely not priced in, clear direction
- 0.7-0.85: Solid catalyst but ANY uncertainty → predict "flat"
- 0.5-0.7: Weak signal — MUST predict "flat" at this confidence level
- Below 0.5: Do NOT include — skip entirely

CRITICAL CONSTRAINTS:
- If direction is "flat", predicted_magnitude MUST be "low"
- If confidence is below 0.85, you MUST predict "flat" — no exceptions
- Even at 0.85+, if there is ANY doubt, predict "flat"
- Sentiment (article tone) and direction (price prediction) are INDEPENDENT. A bullish article almost always → flat price (already priced in)
- Do NOT over-predict. 3 correct flat predictions are worth more than 2 correct + 1 wrong directional
- When in doubt, ALWAYS choose flat. Your accuracy score depends on it.
- Never predict direction based on sentiment alone — you need a concrete catalyst

MAGNITUDE RULES:
- "low" (<1%): Default for flat predictions and weak catalysts
- "medium" (1-3%): Only for confirmed material events with clear impact
- "high" (>3%): Only for binary events (earnings surprise >15%, M&A, FDA approval/rejection, fraud)

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
- Reasoning: 1-2 concise sentences explaining your directional prediction. If predicting flat, state WHY the news is already priced in or not material enough.`;

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
    .limit(10);

  if (error || !articles?.length) {
    return { analyzed: 0, insights: 0 };
  }

  let totalInsights = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const insights = await analyzeBatch(batch);

    if (insights.length > 0) {
      // Capture current prices at prediction time for accurate tracking (parallel, best-effort)
      const uniqueTickers = [...new Set(insights.map((ins) => ins.ticker))];
      const priceAtPrediction = new Map<string, number>();
      const priceResults = await Promise.allSettled(
        uniqueTickers.map(async (ticker) => {
          const price = await getPrice(ticker);
          return { ticker, price: price?.currentPrice };
        })
      );
      for (const result of priceResults) {
        if (result.status === "fulfilled" && result.value.price) {
          priceAtPrediction.set(result.value.ticker, result.value.price);
        }
      }

      // Try inserting with price_at_prediction first, fall back without it
      const rows = insights.map((ins) => ({
        article_id: ins.article_id,
        ticker: ins.ticker,
        asset_type: ins.asset_type,
        sentiment: ins.sentiment,
        confidence: ins.confidence,
        reasoning: ins.reasoning,
        predicted_direction: ins.predicted_direction,
        predicted_magnitude: ins.predicted_magnitude,
        topic: ins.topic,
        price_at_prediction: priceAtPrediction.get(ins.ticker) || null,
      }));

      let { error: insertError } = await supabase.from("analyses").insert(rows);
      if (insertError) {
        // Column might not exist yet — retry without price_at_prediction
        console.error("[OpenAI] Insert error (retrying without price):", insertError.message);
        const fallbackRows = rows.map(({ price_at_prediction: _, ...rest }) => rest);
        const fallbackResult = await supabase.from("analyses").insert(fallbackRows);
        insertError = fallbackResult.error;
        if (insertError) console.error("[OpenAI] Insert error:", insertError);
      }
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
          content: `Analyze these ${articles.length} articles.

CRITICAL REMINDERS BEFORE YOU START:
1. These are RSS articles — they are HOURS old. The market has likely already reacted.
2. At least 85-90% of your ticker predictions MUST be "flat". If you have more than 1-2 directional calls across all articles, you are being too aggressive.
3. Only predict "up" or "down" if confidence >= 0.85 AND there is a clear, binary, material catalyst that DEFINITELY hasn't been priced in yet.
4. For confidence below 0.85, you MUST predict "flat" regardless of how strong the sentiment seems.
5. Your accuracy is being tracked. ONE wrong directional call wipes out the benefit of 5 correct flat calls. When in doubt: FLAT.

${articleList}

Return structured JSON with article_index and tickers array for each.`,
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

        // ENFORCE: directional predictions require confidence >= 0.85
        // This is the single most important accuracy rule
        let direction = t.predicted_direction;
        let magnitude = t.predicted_magnitude;
        if (direction !== "flat" && confidence < 0.85) {
          direction = "flat";
          magnitude = "low";
        }
        // Ensure flat always has low magnitude
        if (direction === "flat") {
          magnitude = "low";
        }

        results.push({
          article_id: article.id,
          ticker,
          asset_type: t.asset_type,
          sentiment: t.sentiment,
          confidence,
          reasoning: t.reasoning,
          predicted_direction: direction,
          predicted_magnitude: magnitude,
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
