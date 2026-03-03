import YahooFinance from "yahoo-finance2";
import { createServerClient } from "./supabase/server";
import type { PriceData } from "./types";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function getPrice(ticker: string): Promise<PriceData | null> {
  const supabase = createServerClient();

  // Check cache first
  const { data: cached } = await supabase
    .from("price_cache")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (
    cached &&
    Date.now() - new Date(cached.fetched_at).getTime() < CACHE_DURATION_MS
  ) {
    return mapCacheToPrice(cached);
  }

  // Fetch from Yahoo Finance
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yahooFinance.quote(ticker);
    const price: PriceData = {
      ticker,
      currentPrice: quote.regularMarketPrice ?? 0,
      previousClose: quote.regularMarketPreviousClose ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      marketCap: quote.marketCap ?? null,
      dayHigh: quote.regularMarketDayHigh ?? 0,
      dayLow: quote.regularMarketDayLow ?? 0,
      volume: quote.regularMarketVolume ?? null,
      currency: quote.currency ?? "USD",
      fetchedAt: new Date().toISOString(),
    };

    // Upsert cache
    await supabase.from("price_cache").upsert(
      {
        ticker,
        current_price: price.currentPrice,
        previous_close: price.previousClose,
        change_percent: price.changePercent,
        market_cap: price.marketCap,
        day_high: price.dayHigh,
        day_low: price.dayLow,
        volume: price.volume,
        currency: price.currency,
        fetched_at: price.fetchedAt,
      },
      { onConflict: "ticker" }
    );

    return price;
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch ${ticker}:`, error);
    return cached ? mapCacheToPrice(cached) : null;
  }
}

export async function getPrices(
  tickers: string[]
): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();
  const BATCH_SIZE = 5;

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const prices = await Promise.allSettled(batch.map(getPrice));
    prices.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        results.set(batch[idx], result.value);
      }
    });
  }

  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCacheToPrice(cached: any): PriceData {
  return {
    ticker: cached.ticker,
    currentPrice: cached.current_price,
    previousClose: cached.previous_close,
    changePercent: cached.change_percent,
    marketCap: cached.market_cap,
    dayHigh: cached.day_high,
    dayLow: cached.day_low,
    volume: cached.volume,
    currency: cached.currency,
    fetchedAt: cached.fetched_at,
  };
}
