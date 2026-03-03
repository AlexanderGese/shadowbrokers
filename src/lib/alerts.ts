import { createServerClient } from "./supabase/server";

export async function checkAndTriggerAlerts(): Promise<number> {
  const supabase = createServerClient();
  let triggered = 0;

  // Get all active alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, profiles(id)")
    .eq("active", true);

  if (!alerts?.length) return 0;

  // Get current ticker summaries
  const { data: summaries } = await supabase
    .from("ticker_summaries")
    .select("ticker, overall_sentiment");

  if (!summaries) return 0;

  const sentimentMap = new Map<string, string>();
  for (const s of summaries) {
    sentimentMap.set(s.ticker, s.overall_sentiment);
  }

  for (const alert of alerts) {
    const currentSentiment = sentimentMap.get(alert.ticker);
    if (!currentSentiment) continue;

    // Check if condition is met
    let shouldTrigger = false;
    if (alert.condition === "any_change") {
      // Only trigger if we haven't triggered in the last 24h
      shouldTrigger = true;
    } else if (alert.condition === currentSentiment) {
      shouldTrigger = true;
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
      title: `${alert.ticker} is ${currentSentiment.toUpperCase()}`,
      body: `Your alert for ${alert.ticker} triggered: sentiment is now ${currentSentiment}.`,
      type: "alert",
      metadata: { ticker: alert.ticker, sentiment: currentSentiment },
    });

    // Update last triggered
    await supabase
      .from("alerts")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", alert.id);

    triggered++;
  }

  return triggered;
}
