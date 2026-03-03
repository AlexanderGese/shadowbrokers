import { NextRequest, NextResponse } from "next/server";
import { getPrices } from "@/lib/yahoo-finance";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return NextResponse.json({ error: "tickers param required" }, { status: 400 });
  }

  const tickers = tickersParam.split(",").slice(0, 20);
  const prices = await getPrices(tickers);

  const result: Record<string, unknown> = {};
  prices.forEach((price, ticker) => {
    result[ticker] = price;
  });

  return NextResponse.json({ prices: result });
}
