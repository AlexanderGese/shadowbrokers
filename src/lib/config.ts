export const RSS_FEEDS = [
  // Tier 1 — Major wire services & financial news
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/businessNews", source: "reuters" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", source: "cnbc" },
  { name: "CNBC World", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362", source: "cnbc" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", source: "yahoo" },
  { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", source: "marketwatch" },
  { name: "MarketWatch Markets", url: "https://feeds.marketwatch.com/marketwatch/marketpulse/", source: "marketwatch" },
  { name: "Financial Times", url: "https://www.ft.com/rss/home", source: "ft" },
  { name: "AP Business", url: "https://rsshub.app/apnews/topics/business", source: "ap" },

  // Tier 2 — Business & investing
  { name: "Bloomberg via Google", url: "https://news.google.com/rss/search?q=site:bloomberg.com+markets&hl=en-US&gl=US&ceid=US:en", source: "bloomberg" },
  { name: "WSJ Markets", url: "https://feeds.content.wsj.com/rss/RSSMarketsMain.xml", source: "wsj" },
  { name: "Barron's", url: "https://feeds.barrons.com/barrons/articles", source: "barrons" },
  { name: "Investing.com", url: "https://rsshub.app/investing/news/stock-market-news", source: "investing" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml", source: "seekingalpha" },
  { name: "Benzinga", url: "https://www.benzinga.com/feed", source: "benzinga" },

  // Tier 3 — Tech & sector-specific
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", source: "techcrunch" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", source: "verge" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/technology-lab", source: "arstechnica" },

  // Tier 4 — Macro & economics
  { name: "Fed Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", source: "fed" },
  { name: "ECB", url: "https://www.ecb.europa.eu/rss/press.html", source: "ecb" },
  { name: "The Economist", url: "https://www.economist.com/finance-and-economics/rss.xml", source: "economist" },
  { name: "Fortune", url: "https://fortune.com/feed/", source: "fortune" },

  // Tier 5 — Crypto & alternatives
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "coindesk" },
  { name: "CoinTelegraph", url: "https://cointelegraph.com/rss", source: "cointelegraph" },
];

export const AI_CONFIG = {
  model: "gpt-4o",
  temperature: 0.1,
  batchSize: 8,
  maxTokens: 8192,
};

export const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "CRON_SECRET",
  "DISCORD_WEBHOOK_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
];
