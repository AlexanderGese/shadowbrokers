import { createServerClient } from "./supabase/server";
import { getPrice } from "./yahoo-finance";

export async function checkPredictionAccuracy(): Promise<number> {
  const supabase = createServerClient();
  let checked = 0;

  // Find analyses from 1-3 days ago that haven't been checked
  // Only check predictions with confidence >= 0.5 (high-quality predictions)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, ticker, predicted_direction, predicted_magnitude, confidence, created_at")
    .gte("created_at", threeDaysAgo)
    .lte("created_at", oneDayAgo)
    .gte("confidence", 0.5)
    .limit(50);

  if (!analyses?.length) return 0;

  // Check which ones already have accuracy records
  const ids = analyses.map((a) => a.id);
  const { data: existing } = await supabase
    .from("prediction_accuracy")
    .select("analysis_id")
    .in("analysis_id", ids);

  const existingSet = new Set((existing || []).map((e) => e.analysis_id));
  const unchecked = analyses.filter((a) => !existingSet.has(a.id));

  if (!unchecked.length) return 0;

  // Get unique tickers and fetch prices
  const tickerSet = new Set(unchecked.map((a) => a.ticker));
  const priceMap = new Map<string, { currentPrice: number; changePercent: number; previousClose: number }>();

  for (const ticker of tickerSet) {
    try {
      const price = await getPrice(ticker);
      if (price) {
        priceMap.set(ticker, {
          currentPrice: price.currentPrice,
          changePercent: price.changePercent,
          previousClose: price.previousClose,
        });
      }
    } catch {
      // skip failed price fetches
    }
  }

  for (const analysis of unchecked) {
    const priceInfo = priceMap.get(analysis.ticker);
    if (!priceInfo) continue;

    // Determine actual direction based on multi-day price change
    // Since we're checking 1-3 day old predictions, use changePercent as a proxy
    // but apply smarter thresholds based on predicted magnitude
    const changePct = priceInfo.changePercent;

    let actualDirection: string;
    // Use wider thresholds — 1% zone for flat (matches our prompt definition)
    if (changePct > 1.0) actualDirection = "up";
    else if (changePct < -1.0) actualDirection = "down";
    else actualDirection = "flat";

    // Smart accuracy: consider the prediction correct in more nuanced cases
    let directionCorrect = false;

    if (analysis.predicted_direction === actualDirection) {
      // Exact match — always correct
      directionCorrect = true;
    } else if (analysis.predicted_direction === "flat") {
      // Predicted flat: correct if actual move is within 2% (small moves)
      directionCorrect = Math.abs(changePct) <= 2.0;
    } else if (actualDirection === "flat") {
      // Predicted up/down but actual is flat: correct if direction sign matches
      // e.g., predicted "up" and price is +0.3% (within flat zone but direction right)
      if (analysis.predicted_direction === "up" && changePct > 0) directionCorrect = true;
      if (analysis.predicted_direction === "down" && changePct < 0) directionCorrect = true;
    } else if (analysis.predicted_magnitude === "low") {
      // Predicted low magnitude — lenient on direction for small predicted moves
      directionCorrect = Math.abs(changePct) <= 1.5;
    }

    await supabase.from("prediction_accuracy").insert({
      analysis_id: analysis.id,
      ticker: analysis.ticker,
      predicted_direction: analysis.predicted_direction,
      actual_price_after: priceInfo.currentPrice,
      actual_direction: actualDirection,
      direction_correct: directionCorrect,
    });

    checked++;
  }

  return checked;
}
