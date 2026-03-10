import { NextRequest, NextResponse } from "next/server";
import { checkAndTriggerAlerts } from "@/lib/alerts";
import { notifyHighConfidencePrediction } from "@/lib/discord-webhooks";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Phase 2: Check alerts + notify high-confidence predictions
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = { success: true, timestamp: new Date().toISOString() };

  try {
    results.alertsTriggered = await checkAndTriggerAlerts();
  } catch (e) {
    console.error("[CRON] Alerts error:", e);
    results.alertsTriggered = { error: String(e) };
  }

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
    results.highConfNotified = (highConf || []).length;
  } catch (e) {
    console.error("[CRON] High-confidence notification error:", e);
    results.highConfNotified = { error: String(e) };
  }

  return NextResponse.json(results);
}
