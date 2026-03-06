import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extract ticker symbols from message (e.g., $AAPL, TSLA, etc.)
function extractTickers(message: string): string[] {
  const matches = message.match(/\$?[A-Z]{1,5}\b/g) || [];
  return [...new Set(matches.map((m) => m.replace("$", "")))];
}

export async function POST(request: NextRequest) {
  const { message, history = [] } = await request.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createServerClient();
  const tickers = extractTickers(message);

  // Gather context from DB in parallel
  const [summariesRes, analysesRes, articlesRes, briefingRes] = await Promise.all([
    tickers.length > 0
      ? supabase
          .from("ticker_summaries")
          .select("ticker, name, sector, overall_sentiment, avg_confidence, num_articles")
          .in("ticker", tickers)
      : Promise.resolve({ data: [] }),
    tickers.length > 0
      ? supabase
          .from("analyses")
          .select("ticker, sentiment, confidence, reasoning, predicted_direction, predicted_magnitude")
          .in("ticker", tickers)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    supabase
      .from("articles")
      .select("title, source, published_at")
      .or(
        tickers.length > 0
          ? tickers.map((t) => `title.ilike.%${t}%`).join(",")
          : `title.ilike.%${message.split(" ").slice(0, 3).join("%")}%`
      )
      .order("published_at", { ascending: false })
      .limit(5),
    supabase
      .from("market_briefings")
      .select("summary, market_bias, key_signals, danger_tickers")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Build context string
  let context = "";

  if (summariesRes.data?.length) {
    context += "\n## Ticker Data\n";
    for (const s of summariesRes.data) {
      context += `${s.ticker} (${s.name || "Unknown"}): ${s.overall_sentiment} sentiment, ${Math.round(s.avg_confidence * 100)}% confidence, ${s.num_articles} articles, sector: ${s.sector || "N/A"}\n`;
    }
  }

  if (analysesRes.data?.length) {
    context += "\n## Recent Analyses\n";
    for (const a of analysesRes.data) {
      context += `${a.ticker}: ${a.sentiment} (${Math.round(a.confidence * 100)}%), direction: ${a.predicted_direction}, magnitude: ${a.predicted_magnitude}. Reasoning: ${a.reasoning}\n`;
    }
  }

  if (articlesRes.data?.length) {
    context += "\n## Recent News\n";
    for (const a of articlesRes.data) {
      context += `[${a.source}] ${a.title} (${a.published_at?.slice(0, 10) || "recent"})\n`;
    }
  }

  if (briefingRes.data) {
    const b = briefingRes.data;
    context += `\n## Latest Market Briefing\nBias: ${b.market_bias}\nSummary: ${b.summary}\nSignals: ${(b.key_signals as string[])?.join("; ") || "N/A"}\n`;
  }

  const systemPrompt = `You are SHADOWBROKERS AI, an elite market intelligence assistant. You have access to real-time analysis data from our platform. Be concise, data-driven, and direct. Use a professional but slightly edgy tone. Reference specific data points when available. Always caveat that this is AI analysis, not financial advice.

${context ? `## Current Intelligence\n${context}` : "No specific data available for this query. Answer based on general market knowledge."}`;

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
    temperature: 0.4,
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
