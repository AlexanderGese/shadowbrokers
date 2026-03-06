import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface EarningsData {
  ticker: string;
  name: string | null;
  sector: string | null;
  nextDate: string | null;
  epsEstimate: number | null;
  lastEpsActual: number | null;
  lastSurprisePct: number | null;
}

export async function getEarningsForTickers(
  tickers: { ticker: string; name: string | null; sector: string | null }[]
): Promise<EarningsData[]> {
  const BATCH_SIZE = 5;
  const results: EarningsData[] = [];

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (t) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const summary: any = await yahooFinance.quoteSummary(t.ticker, {
            modules: ["calendarEvents", "earnings"],
          });

          const calendarEvents = summary?.calendarEvents;
          const earnings = summary?.earnings;

          // Next earnings date
          const earningsDate = calendarEvents?.earnings?.earningsDate?.[0];
          const nextDate = earningsDate
            ? new Date(earningsDate).toISOString().slice(0, 10)
            : null;

          // EPS estimate
          const epsEstimate = calendarEvents?.earnings?.earningsAverage ?? null;

          // Last EPS actual and surprise
          const quarterly = earnings?.earningsChart?.quarterly;
          const lastQuarter = quarterly?.length ? quarterly[quarterly.length - 1] : null;
          const lastEpsActual = lastQuarter?.actual?.raw ?? null;
          const lastEpsEstimate = lastQuarter?.estimate?.raw ?? null;
          const lastSurprisePct =
            lastEpsActual !== null && lastEpsEstimate !== null && lastEpsEstimate !== 0
              ? Math.round(((lastEpsActual - lastEpsEstimate) / Math.abs(lastEpsEstimate)) * 10000) / 100
              : null;

          return {
            ticker: t.ticker,
            name: t.name,
            sector: t.sector,
            nextDate,
            epsEstimate,
            lastEpsActual,
            lastSurprisePct,
          };
        } catch {
          return {
            ticker: t.ticker,
            name: t.name,
            sector: t.sector,
            nextDate: null,
            epsEstimate: null,
            lastEpsActual: null,
            lastSurprisePct: null,
          };
        }
      })
    );

    for (const r of settled) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }

  return results;
}
