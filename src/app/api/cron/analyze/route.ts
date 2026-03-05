import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { checkAndTriggerAlerts } from "@/lib/alerts";
import { checkPredictionAccuracy } from "@/lib/accuracy";
import { generateBriefing } from "@/lib/briefing";
import { notifyHighConfidencePrediction } from "@/lib/discord-webhooks";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rssResult = await fetchAndSaveArticles();
    const analysisResult = await analyzeAndStore();
    await refreshTickerSummaries();

    // Notify high-confidence predictions via user webhooks
    try {
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
    } catch (e) {
      console.error("[CRON] High-confidence notification error:", e);
    }

    // Check prediction accuracy for recent analyses
    let accuracyChecked = 0;
    try {
      accuracyChecked = await checkPredictionAccuracy();
    } catch (e) {
      console.error("[CRON] Accuracy check error:", e);
    }

    // Check and trigger alerts
    let alertsTriggered = 0;
    try {
      alertsTriggered = await checkAndTriggerAlerts();
    } catch (e) {
      console.error("[CRON] Alerts check error:", e);
    }

    // Generate market briefing
    let briefingGenerated = false;
    try {
      const briefing = await generateBriefing();
      briefingGenerated = briefing !== null;
    } catch (e) {
      console.error("[CRON] Briefing generation error:", e);
    }

    return NextResponse.json({
      success: true,
      rss: rssResult,
      analysis: analysisResult,
      accuracyChecked,
      alertsTriggered,
      briefingGenerated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Pipeline error:", error);
    return NextResponse.json(
      { error: "Cron pipeline failed", details: String(error) },
      { status: 500 }
    );
  }
}
