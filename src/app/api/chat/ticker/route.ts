import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { message, ticker, history = [] } = await request.json();

  if (!message || !ticker) {
    return new Response(JSON.stringify({ error: "message and ticker required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upperTicker = ticker.toUpperCase();
  const supabase = createServerClient();

  // Load all context for this ticker in parallel
  const [summaryRes, analysesRes, articlesRes, accuracyRes, priceRes] = await Promise.all([
    supabase
      .from("ticker_summaries")
      .select("ticker, name, description, sector, overall_sentiment, avg_confidence, bullish_count, bearish_count, neutral_count, num_articles, topic")
      .eq("ticker", upperTicker)
      .single(),
    supabase
      .from("analyses")
      .select("sentiment, confidence, reasoning, predicted_direction, predicted_magnitude, topic, created_at")
      .eq("ticker", upperTicker)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("articles")
      .select("title, source, published_at")
      .ilike("title", `%${upperTicker}%`)
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("prediction_accuracy")
      .select("predicted_direction, actual_direction, direction_correct")
      .eq("ticker", upperTicker)
      .limit(20),
    supabase
      .from("price_cache")
      .select("current_price, previous_close, change_percent, market_cap, day_high, day_low, volume")
      .eq("ticker", upperTicker)
      .single(),
  ]);

  // Build rich context
  let context = `## ${upperTicker} Intelligence\n`;

  const summary = summaryRes.data;
  if (summary) {
    context += `\nCompany: ${summary.name || upperTicker}`;
    if (summary.description) context += `\nAbout: ${summary.description}`;
    if (summary.sector) context += `\nSector: ${summary.sector}`;
    context += `\nOverall Sentiment: ${summary.overall_sentiment} (${Math.round(summary.avg_confidence * 100)}% confidence)`;
    context += `\nBreakdown: ${summary.bullish_count} bullish, ${summary.neutral_count} neutral, ${summary.bearish_count} bearish (${summary.num_articles} total articles)`;
    if (summary.topic) context += `\nDriving Topic: ${summary.topic}`;
  }

  const price = priceRes.data;
  if (price) {
    context += `\n\n## Live Price Data`;
    context += `\nPrice: $${price.current_price?.toFixed(2)} (${price.change_percent >= 0 ? "+" : ""}${price.change_percent?.toFixed(2)}% today)`;
    context += `\nPrev Close: $${price.previous_close?.toFixed(2)}`;
    context += `\nDay Range: $${price.day_low?.toFixed(2)} - $${price.day_high?.toFixed(2)}`;
    if (price.market_cap) context += `\nMarket Cap: $${(price.market_cap / 1e9).toFixed(2)}B`;
    if (price.volume) context += `\nVolume: ${(price.volume / 1e6).toFixed(1)}M`;
  }

  const analyses = analysesRes.data;
  if (analyses?.length) {
    context += `\n\n## Recent AI Analyses (${analyses.length} entries)`;
    for (const a of analyses.slice(0, 10)) {
      context += `\n- ${a.sentiment} (${Math.round(a.confidence * 100)}%), direction: ${a.predicted_direction} ${a.predicted_magnitude}, topic: ${a.topic || "N/A"} — ${a.reasoning}`;
    }
  }

  const articles = articlesRes.data;
  if (articles?.length) {
    context += `\n\n## Recent News Headlines`;
    for (const a of articles) {
      context += `\n- [${a.source}] ${a.title} (${a.published_at?.slice(0, 10) || "recent"})`;
    }
  }

  const accuracy = accuracyRes.data;
  if (accuracy?.length) {
    const correct = accuracy.filter((a) => a.direction_correct).length;
    context += `\n\n## Prediction Accuracy for ${upperTicker}`;
    context += `\n${correct}/${accuracy.length} correct (${Math.round((correct / accuracy.length) * 100)}%)`;
  }

  const systemPrompt = `You are SHADOWBROKERS AI, an elite market intelligence assistant specialized in ${upperTicker}. You have comprehensive real-time data about this ticker from our analysis platform.

Be concise, data-driven, and direct. Reference specific numbers from the data when available. Answer questions about the company, its recent news, sentiment, price action, and predictions. If asked about technicals or fundamentals you don't have data for, say so honestly.

Always end with a brief disclaimer that this is AI analysis, not financial advice.

${context}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((h: { role: string; content: string }) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    temperature: 0.3,
    max_tokens: 1024,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
