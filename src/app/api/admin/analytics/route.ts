import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const range = request.nextUrl.searchParams.get("range") || "all";
  let since: string | null = null;
  if (range === "7d") {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (range === "30d") {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const supabase = createServerClient();

  let accuracyQuery = supabase.from("prediction_accuracy").select("direction_correct");
  let articlesQuery = supabase.from("articles").select("source");
  let analysesQuery = supabase.from("analyses").select("ticker, sentiment");

  if (since) {
    accuracyQuery = accuracyQuery.gte("checked_at", since);
    articlesQuery = articlesQuery.gte("created_at", since);
    analysesQuery = analysesQuery.gte("created_at", since);
  }

  const [accuracyResult, articlesResult, analysesResult] = await Promise.all([
    accuracyQuery,
    articlesQuery,
    analysesQuery,
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

  // Top tickers (from analyses, grouped by ticker)
  const tickerMap = new Map<string, number>();
  for (const a of analysesResult.data || []) {
    tickerMap.set(a.ticker, (tickerMap.get(a.ticker) || 0) + 1);
  }
  const topTickers = Array.from(tickerMap.entries())
    .map(([ticker, numArticles]) => ({ ticker, numArticles }))
    .sort((a, b) => b.numArticles - a.numArticles)
    .slice(0, 20);

  // Sentiment distribution (from analyses)
  const sentimentDist = { bullish: 0, bearish: 0, neutral: 0 };
  for (const a of analysesResult.data || []) {
    const sent = a.sentiment as keyof typeof sentimentDist;
    if (sent in sentimentDist) sentimentDist[sent]++;
  }

  return NextResponse.json({
    accuracy: { totalPredictions, correctCount, percentCorrect: accuracyPct },
    sourceBreakdown,
    topTickers,
    sentimentDist,
  });
}
