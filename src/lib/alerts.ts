import { createServerClient } from "./supabase/server";
import { sendDiscordAlert } from "./discord";
import { notifyAlertTriggered } from "./discord-webhooks";

export async function checkAndTriggerAlerts(): Promise<number> {
  const supabase = createServerClient();
  let triggered = 0;

  // Get all active alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, profiles(id)")
    .eq("active", true);

  if (!alerts?.length) return 0;

  // Get current ticker summaries with confidence
  const { data: summaries } = await supabase
    .from("ticker_summaries")
    .select("ticker, overall_sentiment, avg_confidence");

  if (!summaries) return 0;

  const sentimentMap = new Map<string, string>();
  const confidenceMap = new Map<string, number>();
  for (const s of summaries) {
    sentimentMap.set(s.ticker, s.overall_sentiment);
    confidenceMap.set(s.ticker, s.avg_confidence);
  }

  // Get recent analyses (last 1h) for magnitude checks
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("ticker, predicted_magnitude, sentiment, confidence")
    .gte("created_at", oneHourAgo);

  const highMoveTickers = new Set<string>();
  const dangerTickers = new Set<string>();

  if (recentAnalyses) {
    for (const a of recentAnalyses) {
      if (a.predicted_magnitude === "high") {
        highMoveTickers.add(a.ticker);
      }
      if (a.sentiment === "bearish" && a.confidence > 0.7) {
        dangerTickers.add(a.ticker);
      }
    }
  }

  for (const alert of alerts) {
    const currentSentiment = sentimentMap.get(alert.ticker);
    if (!currentSentiment) continue;

    const currentConfidence = confidenceMap.get(alert.ticker) || 0;

    // Check if condition is met
    let shouldTrigger = false;
    let notifTitle = "";
    let notifBody = "";

    if (alert.condition === "any_change") {
      shouldTrigger = true;
      notifTitle = `${alert.ticker} is ${currentSentiment.toUpperCase()}`;
      notifBody = `Your alert for ${alert.ticker} triggered: sentiment is now ${currentSentiment}.`;
    } else if (alert.condition === "danger" && dangerTickers.has(alert.ticker)) {
      shouldTrigger = true;
      notifTitle = `[DANGER] ${alert.ticker}`;
      notifBody = `${alert.ticker} flagged as danger: bearish with high confidence.`;
    } else if (alert.condition === "high_move" && highMoveTickers.has(alert.ticker)) {
      shouldTrigger = true;
      notifTitle = `[HIGH MOVE] ${alert.ticker}`;
      notifBody = `${alert.ticker} predicted high-magnitude price movement.`;
    } else if (alert.condition === "sentiment_flip") {
      // Check if sentiment changed from last notification
      const { data: lastNotif } = await supabase
        .from("notifications")
        .select("metadata")
        .eq("user_id", alert.user_id)
        .eq("type", "alert")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const lastSentiment = (lastNotif?.metadata as Record<string, unknown>)?.sentiment as string | undefined;
      if (lastSentiment && lastSentiment !== currentSentiment) {
        shouldTrigger = true;
        notifTitle = `[FLIP] ${alert.ticker}`;
        notifBody = `${alert.ticker} sentiment flipped from ${lastSentiment} to ${currentSentiment}.`;
      }
    } else if (alert.condition === currentSentiment) {
      shouldTrigger = true;
      notifTitle = `${alert.ticker} is ${currentSentiment.toUpperCase()}`;
      notifBody = `Your alert for ${alert.ticker} triggered: sentiment is now ${currentSentiment}.`;
    }

    if (!shouldTrigger) continue;

    // Check cooldown (24h)
    if (alert.last_triggered_at) {
      const lastTriggered = new Date(alert.last_triggered_at).getTime();
      if (Date.now() - lastTriggered < 24 * 60 * 60 * 1000) continue;
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: alert.user_id,
      title: notifTitle,
      body: notifBody,
      type: "alert",
      metadata: { ticker: alert.ticker, sentiment: currentSentiment },
    });

    // Send Discord alerts (global + per-user webhooks)
    try {
      await sendDiscordAlert(alert.ticker, currentSentiment, currentConfidence, alert.condition, notifBody);
    } catch {
      // Don't block pipeline on Discord errors
    }
    try {
      await notifyAlertTriggered(alert.user_id, alert.ticker, alert.condition, notifBody);
    } catch {
      // Don't block pipeline on user webhook errors
    }

    // Update last triggered
    await supabase
      .from("alerts")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", alert.id);

    triggered++;
  }

  return triggered;
}
