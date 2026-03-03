import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServerClient();

  const [accuracyResult, articlesResult, tickersResult, summariesResult] = await Promise.all([
    supabase
      .from("prediction_accuracy")
      .select("direction_correct"),
    supabase
      .from("articles")
      .select("source"),
    supabase
      .from("ticker_summaries")
      .select("ticker, num_articles")
      .order("num_articles", { ascending: false })
      .limit(20),
    supabase
      .from("ticker_summaries")
      .select("overall_sentiment"),
  ]);

  // Accuracy stats
  const predictions = accuracyResult.data || [];
  const totalPredictions = predictions.length;
  const correctCount = predictions.filter((p) => p.direction_correct === true).length;
  const accuracyPct = totalPredictions > 0 ? Math.round((correctCount / totalPredictions) * 1000) / 10 : 0;

  // Source breakdown
  const sourceMap = new Map<string, number>();
  for (const a of articlesResult.data || []) {
    sourceMap.set(a.source, (sourceMap.get(a.source) || 0) + 1);
  }
  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Top tickers
  const topTickers = (tickersResult.data || []).map((t) => ({
    ticker: t.ticker,
    numArticles: t.num_articles,
  }));

  // Sentiment distribution
  const sentimentDist = { bullish: 0, bearish: 0, neutral: 0 };
  for (const s of summariesResult.data || []) {
    const sent = s.overall_sentiment as keyof typeof sentimentDist;
    if (sent in sentimentDist) sentimentDist[sent]++;
  }

  return NextResponse.json({
    accuracy: { totalPredictions, correctCount, percentCorrect: accuracyPct },
    sourceBreakdown,
    topTickers,
    sentimentDist,
  });
}
