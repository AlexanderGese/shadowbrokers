import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { getHistoricalPrices } from "@/lib/yahoo-finance";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: positions } = await supabase
    .from("portfolio_positions")
    .select("ticker, shares, avg_price")
    .eq("user_id", user.id);

  if (!positions || positions.length === 0) {
    return NextResponse.json({ history: [] });
  }

  // Fetch 30d historical prices for each position
  const priceResults = await Promise.allSettled(
    positions.map((p) =>
      getHistoricalPrices(p.ticker, 30).then((candles) => ({
        ticker: p.ticker,
        shares: p.shares,
        avg_price: p.avg_price,
        candles,
      }))
    )
  );

  // Aggregate daily totals
  const dateMap = new Map<string, { totalValue: number; totalCost: number }>();

  for (const result of priceResults) {
    if (result.status !== "fulfilled") continue;
    const { shares, avg_price, candles } = result.value;
    const cost = shares * avg_price;

    for (const c of candles) {
      if (!dateMap.has(c.date)) {
        dateMap.set(c.date, { totalValue: 0, totalCost: 0 });
      }
      const d = dateMap.get(c.date)!;
      d.totalValue += c.close * shares;
      d.totalCost += cost;
    }
  }

  const history = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      totalValue: Math.round(d.totalValue * 100) / 100,
      totalCost: Math.round(d.totalCost * 100) / 100,
    }));

  return NextResponse.json({ history });
}
