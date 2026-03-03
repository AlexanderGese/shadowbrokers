import { createServerClient } from "./supabase/server";
import { getPrice } from "./yahoo-finance";

export async function checkPredictionAccuracy(): Promise<number> {
  const supabase = createServerClient();
  let checked = 0;

  // Find analyses from 1-3 days ago that haven't been checked
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, ticker, predicted_direction, predicted_magnitude, created_at")
    .gte("created_at", threeDaysAgo)
    .lte("created_at", oneDayAgo)
    .limit(20);

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

  // Get unique tickers and their current prices
  const tickerSet = new Set(unchecked.map((a) => a.ticker));
  const priceMap = new Map<string, number>();

  for (const ticker of tickerSet) {
    const price = await getPrice(ticker);
    if (price) priceMap.set(ticker, price.currentPrice);
  }

  for (const analysis of unchecked) {
    const currentPrice = priceMap.get(analysis.ticker);
    if (!currentPrice) continue;

    // We don't have the price at prediction time stored, so we check direction based on
    // the change percent from previous close (available in price cache)
    const price = await getPrice(analysis.ticker);
    if (!price) continue;

    const changePct = price.changePercent;
    let actualDirection: string;
    if (changePct > 0.5) actualDirection = "up";
    else if (changePct < -0.5) actualDirection = "down";
    else actualDirection = "flat";

    const directionCorrect = analysis.predicted_direction === actualDirection;

    await supabase.from("prediction_accuracy").insert({
      analysis_id: analysis.id,
      ticker: analysis.ticker,
      predicted_direction: analysis.predicted_direction,
      actual_price_after: currentPrice,
      actual_direction: actualDirection,
      direction_correct: directionCorrect,
    });

    checked++;
  }

  return checked;
}
