export interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
  analyzed: boolean;
  created_at: string;
}

export interface Analysis {
  id: string;
  article_id: string;
  ticker: string;
  asset_type: "stock" | "etf";
  sentiment: "bullish" | "neutral" | "bearish";
  confidence: number;
  reasoning: string;
  predicted_direction: "up" | "flat" | "down";
  predicted_magnitude: "low" | "medium" | "high";
  created_at: string;
}

export interface TickerSummary {
  id: string;
  ticker: string;
  name: string | null;
  asset_type: string;
  overall_sentiment: string;
  avg_confidence: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  num_articles: number;
  last_updated: string;
}

export interface TickerDetail extends TickerSummary {
  analyses: (Analysis & { article: Article })[];
}

export interface AnalysisResult {
  tickers: {
    ticker: string;
    name: string;
    asset_type: "stock" | "etf";
    sentiment: "bullish" | "neutral" | "bearish";
    confidence: number;
    reasoning: string;
    predicted_direction: "up" | "flat" | "down";
    predicted_magnitude: "low" | "medium" | "high";
  }[];
}

export interface RSSArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
}
