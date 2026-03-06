export type PlanTier = "free" | "pro" | "ultra";

export interface Plan {
  tier: PlanTier;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  ctaLabel: string;
  ctaHref: string;
  highlighted: boolean;
  features: string[];
  limits: Record<string, string | number | boolean>;
}

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "FREE",
    tagline: "Reconnaissance only",
    price: 0,
    priceLabel: "€0.00/mo",
    ctaLabel: "JOIN WAITLIST",
    ctaHref: "/#waitlist",
    highlighted: false,
    features: [
      "Landing page access",
      "Waitlist priority queue",
      "Public market overview",
    ],
    limits: {
      dashboard: false,
      tickers: false,
      news: false,
      charts: false,
      portfolio: false,
      watchlists: false,
      tickerDetails: false,
      alerts: 0,
      briefings: false,
      dangerZone: false,
      discordWebhooks: false,
      compareTool: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    tier: "pro",
    name: "PRO",
    tagline: "Full tactical access",
    price: 29.99,
    priceLabel: "€29.99/mo",
    ctaLabel: "GET PRO ACCESS",
    ctaHref: "/#waitlist",
    highlighted: true,
    features: [
      "Full dashboard access",
      "All ticker analysis",
      "Real-time news feed",
      "Interactive charts",
      "Portfolio tracking",
      "Watchlists",
      "Ticker detail pages",
      "Up to 10 alerts",
    ],
    limits: {
      dashboard: true,
      tickers: true,
      news: true,
      charts: true,
      portfolio: true,
      watchlists: true,
      tickerDetails: true,
      alerts: 10,
      briefings: false,
      dangerZone: false,
      discordWebhooks: false,
      compareTool: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    tier: "ultra",
    name: "ULTRA",
    tagline: "Maximum clearance",
    price: 89.99,
    priceLabel: "€89.99/mo",
    ctaLabel: "GO ULTRA",
    ctaHref: "/#waitlist",
    highlighted: false,
    features: [
      "Everything in Pro",
      "AI market briefings",
      "Danger zone alerts",
      "Unlimited alerts",
      "Discord webhooks",
      "Compare tool",
      "API access",
      "Priority support",
    ],
    limits: {
      dashboard: true,
      tickers: true,
      news: true,
      charts: true,
      portfolio: true,
      watchlists: true,
      tickerDetails: true,
      alerts: -1,
      briefings: true,
      dangerZone: true,
      discordWebhooks: true,
      compareTool: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
];

export interface FeatureRow {
  feature: string;
  free: string;
  pro: string;
  ultra: string;
}

export interface FeatureCategory {
  category: string;
  rows: FeatureRow[];
}

export const FEATURE_COMPARISON: FeatureCategory[] = [
  {
    category: "ACCESS",
    rows: [
      { feature: "Dashboard", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Ticker analysis", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Ticker detail pages", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Waitlist priority", free: "✓", pro: "✓", ultra: "✓" },
    ],
  },
  {
    category: "DATA",
    rows: [
      { feature: "Real-time news feed", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Interactive charts", free: "—", pro: "✓", ultra: "✓" },
      { feature: "AI market briefings", free: "—", pro: "—", ultra: "✓" },
      { feature: "Danger zone signals", free: "—", pro: "—", ultra: "✓" },
    ],
  },
  {
    category: "TOOLS",
    rows: [
      { feature: "Portfolio tracking", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Watchlists", free: "—", pro: "✓", ultra: "✓" },
      { feature: "Compare tool", free: "—", pro: "—", ultra: "✓" },
      { feature: "API access", free: "—", pro: "—", ultra: "✓" },
    ],
  },
  {
    category: "ALERTS",
    rows: [
      { feature: "Sentiment alerts", free: "—", pro: "Up to 10", ultra: "Unlimited" },
      { feature: "Discord webhooks", free: "—", pro: "—", ultra: "✓" },
    ],
  },
  {
    category: "INTEGRATION",
    rows: [
      { feature: "Priority support", free: "—", pro: "—", ultra: "✓" },
    ],
  },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "When will paid plans be available?",
    answer: "We're currently in early access. Paid plans will launch soon. Join the waitlist to get priority access and early-bird pricing when we go live.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "Is this financial advice?",
    answer: "No. ShadowBrokers provides AI-generated sentiment analysis for informational purposes only. It is not financial advice. Always do your own research before making investment decisions.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We will accept all major credit cards and debit cards via Stripe. Additional payment methods may be added in the future.",
  },
  {
    question: "How does the AI analysis work?",
    answer: "Our AI processes news from 6+ major financial sources and classifies sentiment using GPT-4o analysis. Results are available across the dashboard with confidence scores and detailed reasoning.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts. You can cancel your subscription at any time and retain access until the end of your current billing period.",
  },
];
