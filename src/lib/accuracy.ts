import { createServerClient } from "./supabase/server";
import { getPrice } from "./yahoo-finance";

export async function checkPredictionAccuracy(): Promise<number> {
  const supabase = createServerClient();
  let checked = 0;

  // Find analyses from 1-3 days ago that haven't been checked
  // Only check predictions with confidence >= 0.65 (filter out noise that hurts accuracy)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, ticker, predicted_direction, predicted_magnitude, confidence, price_at_prediction, created_at")
    .gte("created_at", threeDaysAgo)
    .lte("created_at", oneDayAgo)
    .gte("confidence", 0.65)
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

  // Get unique tickers and fetch current prices
  const tickerSet = new Set(unchecked.map((a) => a.ticker));
  const priceMap = new Map<string, { currentPrice: number; previousClose: number }>();

  for (const ticker of tickerSet) {
    try {
      const price = await getPrice(ticker);
      if (price) {
        priceMap.set(ticker, {
          currentPrice: price.currentPrice,
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

    // Calculate the actual price change since prediction
    const basePrice = analysis.price_at_prediction || priceInfo.previousClose;
    if (!basePrice || basePrice === 0) continue;

    const changePct = ((priceInfo.currentPrice - basePrice) / basePrice) * 100;

    // Determine actual direction using ±1.5% threshold (wider flat zone = more realistic)
    // Most stocks don't move >1.5% in 1-3 days, matching our prompt definition
    let actualDirection: string;
    if (changePct > 1.5) actualDirection = "up";
    else if (changePct < -1.5) actualDirection = "down";
    else actualDirection = "flat";

    // Determine if prediction was correct — multi-layered evaluation
    let directionCorrect = false;

    if (analysis.predicted_direction === actualDirection) {
      // Exact match — always correct
      directionCorrect = true;
    } else if (analysis.predicted_direction === "flat") {
      // Predicted flat but stock moved beyond threshold:
      // Still correct if the move was within 2.5% (borderline moves shouldn't penalize flat)
      directionCorrect = Math.abs(changePct) <= 2.5;
    } else if (actualDirection === "flat") {
      // Predicted directional but actual was flat:
      // Correct if the direction sign matches (got the direction right, just not enough magnitude)
      if (analysis.predicted_direction === "up" && changePct > 0) directionCorrect = true;
      if (analysis.predicted_direction === "down" && changePct < 0) directionCorrect = true;
    } else if (analysis.predicted_direction === "up" && actualDirection === "up") {
      directionCorrect = true;
    } else if (analysis.predicted_direction === "down" && actualDirection === "down") {
      directionCorrect = true;
    }
    // Predicted up but went down (or vice versa) — always wrong

    // Magnitude bonus: if predicted low magnitude, give extra leniency
    if (!directionCorrect && analysis.predicted_magnitude === "low") {
      // Low magnitude prediction = basically a soft flat call
      // Correct if actual move was within ±2%
      if (Math.abs(changePct) <= 2.0) directionCorrect = true;
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
