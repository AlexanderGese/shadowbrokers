import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { checkAndTriggerAlerts } from "@/lib/alerts";
import { checkPredictionAccuracy } from "@/lib/accuracy";
import { generateBriefing } from "@/lib/briefing";
import { notifyHighConfidencePrediction } from "@/lib/discord-webhooks";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = { success: true, timestamp: new Date().toISOString() };

  // Phase 1: RSS + Analysis (core pipeline)
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

  // Phase 2: Secondary tasks (run in parallel to save time)
  const [accuracyResult, alertsResult, briefingResult, highConfResult] = await Promise.allSettled([
    checkPredictionAccuracy(),
    checkAndTriggerAlerts(),
    generateBriefing(),
    (async () => {
      const supabase = createServerClient();
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: highConf } = await supabase
        .from("analyses")
        .select("ticker, predicted_direction, confidence, reasoning")
        .gte("created_at", fiveMinAgo)
        .gte("confidence", 0.8)
        .neq("predicted_direction", "flat");
      for (const p of highConf || []) {
        await notifyHighConfidencePrediction(p.ticker, p.predicted_direction, p.confidence, p.reasoning);
      }
      return (highConf || []).length;
    })(),
  ]);

  results.accuracyChecked = accuracyResult.status === "fulfilled" ? accuracyResult.value : { error: String((accuracyResult as PromiseRejectedResult).reason) };
  results.alertsTriggered = alertsResult.status === "fulfilled" ? alertsResult.value : { error: String((alertsResult as PromiseRejectedResult).reason) };
  results.briefingGenerated = briefingResult.status === "fulfilled" ? briefingResult.value !== null : { error: String((briefingResult as PromiseRejectedResult).reason) };
  results.highConfNotified = highConfResult.status === "fulfilled" ? highConfResult.value : { error: String((highConfResult as PromiseRejectedResult).reason) };

  return NextResponse.json(results);
}
