import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Phase 1: RSS fetch + OpenAI analysis + ticker summaries
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = { success: true, timestamp: new Date().toISOString() };

  try {
    results.rss = await fetchAndSaveArticles();
  } catch (e) {
    console.error("[CRON] RSS fetch error:", e);
    results.rss = { error: String(e) };
  }

  try {
    results.analysis = await analyzeAndStore();
  } catch (e) {
    console.error("[CRON] Analysis error:", e);
    results.analysis = { error: String(e) };
  }

  try {
    await refreshTickerSummaries();
    results.summaries = "ok";
  } catch (e) {
    console.error("[CRON] Ticker summary error:", e);
    results.summaries = { error: String(e) };
  }

  return NextResponse.json(results);
}
