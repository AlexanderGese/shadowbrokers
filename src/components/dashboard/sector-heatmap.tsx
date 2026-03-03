import type { TickerSummary } from "@/lib/types";

interface SectorHeatmapProps {
  tickers: TickerSummary[];
}

interface SectorData {
  name: string;
  tickers: TickerSummary[];
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  dominant: "bullish" | "bearish" | "neutral";
  topTicker: TickerSummary | null;
}

export function SectorHeatmap({ tickers }: SectorHeatmapProps) {
  const sectorMap = new Map<string, TickerSummary[]>();
  for (const t of tickers) {
    const sector = t.sector || "Unknown";
    if (!sectorMap.has(sector)) sectorMap.set(sector, []);
    sectorMap.get(sector)!.push(t);
  }

  const sectors: SectorData[] = Array.from(sectorMap.entries())
    .map(([name, sectorTickers]) => {
      const bullish = sectorTickers.filter((t) => t.overall_sentiment === "bullish").length;
      const bearish = sectorTickers.filter((t) => t.overall_sentiment === "bearish").length;
      const neutral = sectorTickers.filter((t) => t.overall_sentiment === "neutral").length;
      const avgConfidence = sectorTickers.reduce((a, t) => a + t.avg_confidence, 0) / sectorTickers.length;
      const dominant: "bullish" | "bearish" | "neutral" = bullish >= bearish && bullish >= neutral ? "bullish" : bearish > bullish ? "bearish" : "neutral";
      const topTicker = [...sectorTickers].sort((a, b) => b.avg_confidence - a.avg_confidence)[0] || null;

      return { name, tickers: sectorTickers, bullish, bearish, neutral, avgConfidence, dominant, topTicker };
    })
    .sort((a, b) => b.tickers.length - a.tickers.length);

  if (sectors.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-card-border">
      <div className="px-4 py-2 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">SECTOR BREAKDOWN</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-px bg-card-border">
        {sectors.map((sector) => {
          const borderColor =
            sector.dominant === "bullish" ? "border-l-bullish" :
            sector.dominant === "bearish" ? "border-l-bearish" : "border-l-neutral";
          const sentColor =
            sector.dominant === "bullish" ? "text-bullish" :
            sector.dominant === "bearish" ? "text-bearish" : "text-neutral";
          const bgColor =
            sector.dominant === "bullish" ? "bg-bullish/5" :
            sector.dominant === "bearish" ? "bg-bearish/5" : "bg-neutral/5";

          return (
            <div key={sector.name} className={`${bgColor} border-l-2 ${borderColor} p-3 bg-card-bg`}>
              <div className="text-[10px] font-bold text-foreground tracking-wider mb-1">
                {sector.name.toUpperCase()}
              </div>
              <div className={`text-xs font-bold ${sentColor} uppercase mb-2`}>
                {sector.dominant}
              </div>
              <div className="flex gap-2 text-[9px] mb-2">
                <span className="text-bullish">{sector.bullish}B</span>
                <span className="text-neutral">{sector.neutral}N</span>
                <span className="text-bearish">{sector.bearish}R</span>
              </div>
              {sector.topTicker && (
                <div className="text-[9px] text-muted">
                  Top: <span className="text-foreground">{sector.topTicker.ticker}</span>
                  {" "}{Math.round(sector.topTicker.avg_confidence * 100)}%
                </div>
              )}
              <div className="text-[9px] text-muted mt-0.5">
                {sector.tickers.length} ticker{sector.tickers.length !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
