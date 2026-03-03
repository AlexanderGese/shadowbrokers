import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { checkAndTriggerAlerts } from "@/lib/alerts";
import { checkPredictionAccuracy } from "@/lib/accuracy";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rssResult = await fetchAndSaveArticles();
    const analysisResult = await analyzeAndStore();
    await refreshTickerSummaries();

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

    return NextResponse.json({
      success: true,
      rss: rssResult,
      analysis: analysisResult,
      accuracyChecked,
      alertsTriggered,
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
