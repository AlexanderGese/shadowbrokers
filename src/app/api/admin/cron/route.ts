import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { checkAndTriggerAlerts } from "@/lib/alerts";
import { checkPredictionAccuracy } from "@/lib/accuracy";

export const maxDuration = 60;

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const rssResult = await fetchAndSaveArticles();
    const analysisResult = await analyzeAndStore();
    await refreshTickerSummaries();

    let accuracyChecked = 0;
    try {
      accuracyChecked = await checkPredictionAccuracy();
    } catch (e) {
      console.error("[ADMIN] Accuracy check error:", e);
    }

    let alertsTriggered = 0;
    try {
      alertsTriggered = await checkAndTriggerAlerts();
    } catch (e) {
      console.error("[ADMIN] Alerts check error:", e);
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
    console.error("[ADMIN] Pipeline error:", error);
    return NextResponse.json(
      { error: "Pipeline failed", details: String(error) },
      { status: 500 }
    );
  }
}
