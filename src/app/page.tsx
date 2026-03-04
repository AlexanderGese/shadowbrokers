"use client";

import { useState, useEffect, useRef } from "react";

const FEATURES = [
  {
    title: "AI SENTIMENT",
    description: "GPT-4o-mini analyzes news articles to classify bullish, bearish, and neutral signals across tickers.",
    icon: ">>",
  },
  {
    title: "LIVE PRICES",
    description: "Real-time price data from Yahoo Finance with market cap, volume, and day range stats.",
    icon: "$",
  },
  {
    title: "COMPARISON",
    description: "Side-by-side ticker comparison with sentiment trends, price action, and confidence scores.",
    icon: "<>",
  },
  {
    title: "PORTFOLIO",
    description: "Track your positions with live P&L calculations, sentiment signals, and sector exposure.",
    icon: "[]",
  },
  {
    title: "ALERTS",
    description: "Set sentiment-based alerts on any ticker. Get notified when market signals shift.",
    icon: "!!",
  },
  {
    title: "ACCURACY",
    description: "Prediction tracking compares AI forecasts against actual price movements over time.",
    icon: "%",
  },
];

const DEMO_TICKERS = [
  { ticker: "AAPL", name: "Apple Inc.", sentiment: "bullish", confidence: 78, change: "+1.24%" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sentiment: "bullish", confidence: 85, change: "+3.47%" },
  { ticker: "TSLA", name: "Tesla Inc.", sentiment: "bearish", confidence: 72, change: "-2.18%" },
  { ticker: "MSFT", name: "Microsoft", sentiment: "neutral", confidence: 65, change: "+0.32%" },
  { ticker: "SPY", name: "S&P 500 ETF", sentiment: "bullish", confidence: 71, change: "+0.89%" },
  { ticker: "META", name: "Meta Platforms", sentiment: "bullish", confidence: 81, change: "+2.05%" },
];

const TERMINAL_LINES = [
  { text: "$ shadowbrokers --init", color: "text-accent", delay: 200 },
  { text: "[SYS] Booting financial intelligence engine...", color: "text-muted", delay: 600 },
  { text: "[RSS] Connecting to 6 global news feeds...", color: "text-muted", delay: 1000 },
  { text: "[RSS] Reuters, CNBC, Yahoo, MarketWatch, FT, AP", color: "text-muted", delay: 1300 },
  { text: "[AI] Loading GPT-4o-mini analysis pipeline...", color: "text-muted", delay: 1700 },
  { text: "[OK] 47 tickers classified", color: "text-bullish", delay: 2100 },
  { text: "[OK] Sentiment signals calibrated", color: "text-bullish", delay: 2400 },
  { text: "[OK] Prediction engine online", color: "text-bullish", delay: 2700 },
  { text: "SYSTEM READY — AWAITING OPERATORS", color: "text-accent", delay: 3100 },
];

const STATS = [
  { label: "RSS SOURCES", value: "6" },
  { label: "DAILY ARTICLES", value: "50+" },
  { label: "AI MODEL", value: "GPT-4O" },
  { label: "PRICE FEEDS", value: "LIVE" },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Terminal line reveal
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < TERMINAL_LINES.length; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
        }, TERMINAL_LINES[i].delay)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // Intersection observer for features
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFeaturesVisible(true);
      },
      { threshold: 0.1 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setPosition(data.position);
      } else {
        setError(data.error || "Failed to join");
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg/80 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="h-6 w-6" alt="ShadowBrokers" />
            <span className="text-sm md:text-lg font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="text-[10px] px-3 py-1 border border-card-border text-muted hover:text-accent hover:border-accent/30 transition-colors tracking-widest">
              PRICING
            </a>
            <span className="text-[10px] px-3 py-1 border border-accent/20 text-accent tracking-widest">
              EARLY ACCESS
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-bg border-b border-card-border px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Glitch Title */}
          <h1
            className="glitch text-3xl md:text-5xl lg:text-6xl font-bold tracking-widest text-foreground mb-4"
            data-text="SHADOWBROKERS"
          >
            SHADOWBROKERS
          </h1>
          <div className="text-[10px] md:text-xs text-accent tracking-[0.3em] mb-8 fade-in-up fade-in-up-delay-2">
            AI-POWERED FINANCIAL INTELLIGENCE
          </div>
          <p className="text-xs md:text-sm text-muted tracking-wider mb-10 fade-in-up fade-in-up-delay-3">
            The market whispers. We listen.
          </p>

          {/* Terminal Block */}
          <div className="max-w-lg mx-auto border border-card-border bg-card-bg/90 text-left fade-in-up fade-in-up-delay-4">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-card-border">
              <div className="h-1.5 w-1.5 rounded-full bg-bearish" />
              <div className="h-1.5 w-1.5 rounded-full bg-neutral" />
              <div className="h-1.5 w-1.5 rounded-full bg-bullish" />
              <span className="text-[9px] text-muted ml-2 tracking-wider">TERMINAL — v5.0</span>
            </div>
            <div className="p-4 text-[10px] md:text-[11px] font-mono leading-relaxed min-h-[180px]">
              {TERMINAL_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`${line.color} transition-all duration-300 ${
                    visibleLines.includes(i)
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1"
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {visibleLines.includes(i) && line.text}
                </div>
              ))}
              {visibleLines.length === TERMINAL_LINES.length && (
                <div className="text-accent mt-1 cursor-blink">$</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="border-b border-card-border bg-card-bg">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">JOIN WAITLIST</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="text-xs md:text-sm text-foreground tracking-wider mb-2">
                  REQUEST EARLY ACCESS
                </div>
                <div className="text-[10px] text-muted">
                  Limited slots. Priority access for waitlist members.
                </div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <div className="flex-1 flex items-center border border-card-border bg-background border-glow">
                  <span className="text-[10px] text-accent px-3 shrink-0">$</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@email.com"
                    required
                    className="w-full bg-transparent text-xs text-foreground py-2.5 pr-3 focus:outline-none placeholder:text-muted/50 pulse-glow-focus"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-accent/10 border border-accent/40 text-accent text-[10px] tracking-widest hover:bg-accent/20 hover:border-accent/60 transition-all disabled:opacity-50 shrink-0"
                >
                  {submitting ? "PROCESSING..." : "EXECUTE"}
                </button>
              </form>
              {error && (
                <div className="text-center mt-3">
                  <span className="text-[10px] text-bearish">[ERR] {error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-bullish text-xs tracking-wider font-bold">
                [OK] POSITION SECURED
              </div>
              <div className="text-foreground text-sm md:text-base tracking-widest font-bold">
                YOU&apos;RE ON THE LIST
              </div>
              <div className="text-[10px] text-muted">
                Position #{position} in queue. We&apos;ll notify you when access opens.
              </div>
              <div className="inline-block border border-bullish/20 bg-bullish/5 px-4 py-2 mt-2">
                <span className="text-[10px] text-bullish tracking-wider">ACCESS GRANTED: PENDING</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-card-border grid grid-cols-2 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="border-r border-b border-card-border px-4 py-3 last:border-r-0 md:[&:nth-child(4)]:border-r-0"
          >
            <div className="text-[9px] text-muted tracking-wider">{stat.label}</div>
            <div className="text-sm md:text-base font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">CAPABILITIES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-card-border">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`bg-card-bg p-6 hover:bg-card-border/30 transition-all duration-300 ${
                featuresVisible ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-accent text-lg font-bold mb-2">{feature.icon}</div>
              <div className="text-xs font-bold tracking-widest text-foreground mb-2">
                {feature.title}
              </div>
              <div className="text-[10px] text-muted leading-relaxed">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Preview */}
      <section className="border-b border-card-border relative">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">LIVE FEED PREVIEW</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-card-border relative">
          {DEMO_TICKERS.map((t) => {
            const sentColor =
              t.sentiment === "bullish"
                ? "text-bullish"
                : t.sentiment === "bearish"
                  ? "text-bearish"
                  : "text-neutral";
            return (
              <div key={t.ticker} className="bg-card-bg p-4 blur-[2px]">
                <div className="text-sm font-bold text-foreground">{t.ticker}</div>
                <div className="text-[9px] text-muted mb-2">{t.name}</div>
                <div className={`text-[10px] font-bold uppercase ${sentColor}`}>
                  {t.sentiment}
                </div>
                <div className="text-[10px] text-muted mt-1">
                  {t.change}
                </div>
              </div>
            );
          })}
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <div className="text-[10px] text-muted tracking-[0.3em] mb-2">CLASSIFIED</div>
            <div className="text-xs text-foreground tracking-widest font-bold mb-3">
              EARLY ACCESS ONLY
            </div>
            <div className="border border-accent/30 bg-accent/5 px-4 py-2">
              <span className="text-[10px] text-accent tracking-wider">JOIN WAITLIST ABOVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="grid-bg px-4 py-16 md:py-20 text-center">
        <div className="relative z-10">
          <div className="text-[10px] text-muted tracking-[0.3em] mb-3">
            DON&apos;T TRADE BLIND
          </div>
          <div className="text-lg md:text-2xl text-foreground tracking-widest font-bold mb-2">
            SEE WHAT THE AI SEES
          </div>
          <div className="text-[10px] text-muted tracking-wider mb-6">
            Real-time sentiment analysis. Predictive signals. Portfolio intelligence.
          </div>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              document.querySelector<HTMLInputElement>("input[type=email]")?.focus();
            }}
            className="text-[10px] px-8 py-3 border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent/60 transition-all tracking-widest"
          >
            REQUEST ACCESS
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-[10px] text-muted tracking-wider">
            SHADOWBROKERS v5.0 | AI-POWERED MARKET INTELLIGENCE
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-bullish pulse-dot" />
            <span className="text-[10px] text-bullish tracking-wider">
              WAITLIST OPEN
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-card-border/50 pt-2">
          <a href="/pricing" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRICING</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/terms" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">TERMS</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/privacy" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRIVACY</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/disclaimer" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">DISCLAIMER</a>
        </div>
      </footer>
    </div>
  );
}
