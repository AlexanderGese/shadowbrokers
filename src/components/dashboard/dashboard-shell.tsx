"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TabBar, type DashboardTab } from "./tab-bar";
import { MarketSummary } from "./market-summary";
import { TopMovers } from "./top-movers";
import { SectorHeatmap } from "./sector-heatmap";
import { TickerGrid } from "./ticker-grid";
import { TickerTable } from "./ticker-table";
import { ArticlesFeed } from "./articles-feed";
import { MarketSentimentChart } from "@/components/charts/market-sentiment-chart";
import { MarketBriefing } from "./market-briefing";
import { AccuracyDashboard } from "./accuracy-dashboard";
import { IndexBar } from "./index-bar";
import type { TickerSummary, Article, Analysis } from "@/lib/types";

interface ArticleWithAnalyses extends Article {
  analyses: Pick<Analysis, "ticker" | "sentiment" | "confidence">[];
}

interface DashboardShellProps {
  tickers: TickerSummary[];
  articles: ArticleWithAnalyses[];
  totalArticleCount: number;
}

export function DashboardShell({ tickers, articles, totalArticleCount }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("OVERVIEW");
  const router = useRouter();

  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case "1":
          handleTabChange("OVERVIEW");
          break;
        case "2":
          handleTabChange("TICKERS");
          break;
        case "3":
          handleTabChange("NEWS");
          break;
        case "4":
          handleTabChange("CHARTS");
          break;
        case "5":
          handleTabChange("BRIEFING");
          break;
        case "6":
          handleTabChange("ACCURACY");
          break;
        case "c":
        case "C":
          if (!e.ctrlKey && !e.metaKey) {
            router.push("/compare");
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTabChange, router]);

  return (
    <>
      <IndexBar />
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "OVERVIEW" && (
        <>
          <MarketSummary tickers={tickers} totalArticles={totalArticleCount} />
          <TopMovers tickers={tickers} />
          <SectorHeatmap tickers={tickers} />
        </>
      )}

      {activeTab === "TICKERS" && (
        <>
          <TickerGrid tickers={tickers} />
          <TickerTable tickers={tickers} />
        </>
      )}

      {activeTab === "NEWS" && (
        <div className="border-b border-card-border">
          <ArticlesFeed articles={articles} />
        </div>
      )}

      {activeTab === "CHARTS" && (
        <MarketSentimentChart />
      )}

      {activeTab === "BRIEFING" && (
        <MarketBriefing />
      )}

      {activeTab === "ACCURACY" && (
        <AccuracyDashboard />
      )}
    </>
  );
}
