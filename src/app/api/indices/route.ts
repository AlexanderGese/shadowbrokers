import { NextResponse } from "next/server";
import { getPrices } from "@/lib/yahoo-finance";

const INDEX_TICKERS = ["SPY", "QQQ", "DIA"];
const INDEX_NAMES: Record<string, string> = {
  SPY: "S&P 500",
  QQQ: "NASDAQ",
  DIA: "DOW",
};

export async function GET() {
  try {
    const prices = await getPrices(INDEX_TICKERS);
    const indices = INDEX_TICKERS.map((ticker) => {
      const price = prices.get(ticker);
      return {
        ticker,
        name: INDEX_NAMES[ticker],
        currentPrice: price?.currentPrice ?? null,
        changePercent: price?.changePercent ?? null,
      };
    });

    return NextResponse.json({ indices });
  } catch (error) {
    console.error("[API] Indices error:", error);
    return NextResponse.json({ indices: [] }, { status: 500 });
  }
}
