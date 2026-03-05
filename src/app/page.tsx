"use client";

import { useState, useEffect, useRef } from "react";

const FEATURES = [
  {
    title: "AI SENTIMENT ENGINE",
    description: "GPT-4o analyzes thousands of news articles daily. Every ticker gets a bullish, bearish, or neutral classification with confidence scores.",
    icon: ">>",
    stat: "47+ TICKERS",
  },
  {
    title: "REAL-TIME PRICES",
    description: "Live market data from Yahoo Finance. Track price action, volume, market cap, and day ranges across your entire portfolio.",
    icon: "$",
    stat: "LIVE FEEDS",
  },
  {
    title: "SMART COMPARISON",
    description: "Side-by-side ticker analysis with sentiment trends, price correlation, and confidence divergence scoring.",
    icon: "<>",
    stat: "MULTI-AXIS",
  },
  {
    title: "PORTFOLIO TRACKING",
    description: "Import positions, track P&L in real-time, and overlay AI sentiment signals onto your holdings for smarter exits.",
    icon: "[]",
    stat: "LIVE P&L",
  },
  {
    title: "SENTIMENT ALERTS",
    description: "Custom triggers on sentiment flips, danger signals, and high-confidence moves. Never miss a market shift.",
    icon: "!!",
    stat: "6 TRIGGERS",
  },
  {
    title: "PREDICTION ACCURACY",
    description: "Full transparency. We track every AI prediction against actual price movement. See accuracy by sector, ticker, and time range.",
    icon: "%",
    stat: "VERIFIED",
  },
];

const DEMO_TICKERS = [
  { ticker: "AAPL", sentiment: "bullish", confidence: 78, change: "+1.24%", direction: "\u25B2" },
  { ticker: "NVDA", sentiment: "bullish", confidence: 85, change: "+3.47%", direction: "\u25B2" },
  { ticker: "TSLA", sentiment: "bearish", confidence: 72, change: "-2.18%", direction: "\u25BC" },
  { ticker: "MSFT", sentiment: "neutral", confidence: 65, change: "+0.32%", direction: "\u25C6" },
  { ticker: "SPY", sentiment: "bullish", confidence: 71, change: "+0.89%", direction: "\u25B2" },
  { ticker: "META", sentiment: "bullish", confidence: 81, change: "+2.05%", direction: "\u25B2" },
  { ticker: "AMZN", sentiment: "bullish", confidence: 74, change: "+1.78%", direction: "\u25B2" },
  { ticker: "GOOG", sentiment: "neutral", confidence: 68, change: "+0.45%", direction: "\u25C6" },
];

const TERMINAL_LINES = [
  { text: "$ shadowbrokers --init", color: "text-accent" },
  { text: "[SYS] Booting financial intelligence engine...", color: "text-muted" },
  { text: "[RSS] Reuters, CNBC, Yahoo, MarketWatch, FT, AP", color: "text-muted" },
  { text: "[AI] Loading GPT-4o analysis pipeline...", color: "text-muted" },
  { text: "[OK] 47 tickers classified", color: "text-bullish" },
  { text: "[OK] Prediction engine online", color: "text-bullish" },
  { text: "SYSTEM READY", color: "text-accent" },
];

const PIPELINE_STEPS = [
  { label: "INGEST", detail: "6 RSS feeds scraped every hour", icon: "01" },
  { label: "ANALYZE", detail: "GPT-4o classifies each article", icon: "02" },
  { label: "AGGREGATE", detail: "Signals merged per ticker", icon: "03" },
  { label: "PREDICT", detail: "Direction & magnitude scored", icon: "04" },
  { label: "DELIVER", detail: "Dashboard + alerts in real-time", icon: "05" },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [pipelineVisible, setPipelineVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Terminal line reveal
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const delays = [200, 600, 1000, 1400, 1800, 2100, 2500];
    for (let i = 0; i < TERMINAL_LINES.length; i++) {
      timers.push(
        setTimeout(() => setVisibleLines((prev) => [...prev, i]), delays[i])
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // Intersection observers
  useEffect(() => {
    const createObserver = (setter: (v: boolean) => void) =>
      new IntersectionObserver(([e]) => { if (e.isIntersecting) setter(true); }, { threshold: 0.1 });

    const o1 = createObserver(setFeaturesVisible);
    const o2 = createObserver(setPipelineVisible);
    const o3 = createObserver(setPreviewVisible);

    if (featuresRef.current) o1.observe(featuresRef.current);
    if (pipelineRef.current) o2.observe(pipelineRef.current);
    if (previewRef.current) o3.observe(previewRef.current);

    return () => { o1.disconnect(); o2.disconnect(); o3.disconnect(); };
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

  function scrollToSignup() {
    emailInputRef.current?.focus();
    emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="h-6 w-6" alt="ShadowBrokers" />
            <span className="text-sm md:text-base font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/pricing" className="hidden sm:inline-block text-[10px] px-3 py-1.5 text-muted hover:text-foreground transition-colors tracking-widest">
              PRICING
            </a>
            <button
              onClick={scrollToSignup}
              className="text-[10px] px-4 py-1.5 bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 hover:border-accent/60 transition-all tracking-widest"
            >
              GET EARLY ACCESS
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-grid-bg border-b border-card-border pt-16">
        <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
          {/* Floating orb effects */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-bullish/5 rounded-full blur-[80px] animate-float-slow-reverse" />

          <div className="relative z-10 text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-accent/20 bg-accent/5 px-4 py-1.5 mb-8 fade-in-up">
              <div className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot" />
              <span className="text-[10px] text-accent tracking-[0.2em]">EARLY ACCESS NOW OPEN</span>
            </div>

            {/* Glitch Title */}
            <h1
              className="glitch text-4xl md:text-6xl lg:text-8xl font-bold tracking-wider text-foreground mb-6 fade-in-up fade-in-up-delay-1"
              data-text="SHADOWBROKERS"
            >
              SHADOWBROKERS
            </h1>

            <p className="text-sm md:text-lg text-muted tracking-wider mb-3 fade-in-up fade-in-up-delay-2 max-w-2xl mx-auto">
              AI-powered financial intelligence that reads the market before you do.
            </p>
            <p className="text-[10px] md:text-xs text-muted/60 tracking-[0.2em] mb-12 fade-in-up fade-in-up-delay-3">
              6 RSS FEEDS &middot; GPT-4O ANALYSIS &middot; REAL-TIME PREDICTIONS
            </p>

            {/* Hero CTA - main signup */}
            <div className="max-w-xl mx-auto fade-in-up fade-in-up-delay-4">
              {!submitted ? (
                <div>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center border border-card-border bg-card-bg/80 backdrop-blur-sm hero-input-glow group">
                      <span className="text-accent text-xs px-3 opacity-60 group-focus-within:opacity-100 transition-opacity">$</span>
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full bg-transparent text-sm text-foreground py-3 pr-4 focus:outline-none placeholder:text-muted/40"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="hero-cta-btn px-8 py-3 bg-accent text-background text-xs font-bold tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 shrink-0"
                    >
                      {submitting ? "PROCESSING..." : "GET ACCESS"}
                    </button>
                  </form>
                  {error && (
                    <div className="text-center mt-3">
                      <span className="text-[10px] text-bearish">[ERR] {error}</span>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-4 text-[9px] text-muted/50">
                    <span>FREE TO JOIN</span>
                    <span className="text-muted/20">&middot;</span>
                    <span>NO CREDIT CARD</span>
                    <span className="text-muted/20">&middot;</span>
                    <span>CANCEL ANYTIME</span>
                  </div>
                </div>
              ) : (
                <div className="border border-bullish/30 bg-bullish/5 p-6 text-center space-y-3 success-flash">
                  <div className="text-bullish text-sm tracking-wider font-bold">
                    [OK] ACCESS SECURED
                  </div>
                  <div className="text-foreground text-xl md:text-2xl tracking-widest font-bold">
                    YOU&apos;RE #{position} IN LINE
                  </div>
                  <div className="text-[10px] text-muted">
                    We&apos;ll send your access credentials when your slot opens.
                  </div>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 border border-bullish/20 bg-bullish/5 px-4 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-bullish pulse-dot" />
                      <span className="text-[10px] text-bullish tracking-wider">STATUS: QUEUED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terminal - bottom of hero */}
          <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto px-4 fade-in-up fade-in-up-delay-5">
            <div className="border border-card-border bg-card-bg/90 backdrop-blur-sm shadow-2xl shadow-accent/5">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-card-border">
                <div className="h-2 w-2 rounded-full bg-bearish/80" />
                <div className="h-2 w-2 rounded-full bg-neutral/80" />
                <div className="h-2 w-2 rounded-full bg-bullish/80" />
                <span className="text-[9px] text-muted ml-2 tracking-wider">shadowbrokers@terminal ~ v5.0</span>
              </div>
              <div className="p-4 text-[11px] font-mono leading-[1.8] min-h-[160px]">
                {TERMINAL_LINES.map((line, i) => (
                  <div
                    key={i}
                    className={`${line.color} transition-all duration-300 ${
                      visibleLines.includes(i)
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1"
                    }`}
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
        </div>
      </section>

      {/* Ticker Marquee */}
      <section className="border-b border-card-border bg-card-bg overflow-hidden">
        <div className="ticker-marquee flex">
          {[...DEMO_TICKERS, ...DEMO_TICKERS].map((t, i) => {
            const color = t.sentiment === "bullish" ? "text-bullish" : t.sentiment === "bearish" ? "text-bearish" : "text-neutral";
            return (
              <div key={i} className="flex items-center gap-3 px-6 py-2.5 whitespace-nowrap border-r border-card-border shrink-0">
                <span className="text-xs font-bold text-foreground">{t.ticker}</span>
                <span className={`text-[10px] font-bold ${color}`}>{t.direction} {t.change}</span>
                <span className={`text-[9px] ${color} opacity-60`}>{t.confidence}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-card-border">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: "NEWS SOURCES", value: "6", sub: "RSS FEEDS" },
            { label: "DAILY ARTICLES", value: "50+", sub: "ANALYZED" },
            { label: "AI ENGINE", value: "GPT-4O", sub: "OPENAI" },
            { label: "PRICE DATA", value: "LIVE", sub: "YAHOO FINANCE" },
          ].map((stat, i) => (
            <div key={stat.label} className={`px-5 py-4 ${i < 3 ? "border-r" : ""} border-b border-card-border bg-card-bg/50 hover:bg-card-bg transition-colors`}>
              <div className="text-[9px] text-muted tracking-wider">{stat.label}</div>
              <div className="text-lg md:text-xl font-bold text-foreground mt-0.5">{stat.value}</div>
              <div className="text-[9px] text-accent/60 tracking-wider mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - Pipeline */}
      <section ref={pipelineRef} className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">HOW IT WORKS</span>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-lg md:text-2xl font-bold tracking-widest text-foreground mb-2">
              FROM NEWS TO SIGNAL IN SECONDS
            </h2>
            <p className="text-[10px] text-muted tracking-wider">
              Fully automated pipeline. No manual intervention.
            </p>
          </div>

          {/* Pipeline steps */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-card-border -translate-y-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className={`relative text-center transition-all duration-500 ${
                    pipelineVisible ? "fade-in-up" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="relative inline-flex items-center justify-center w-12 h-12 border border-accent/30 bg-accent/5 mb-3 mx-auto">
                    <span className="text-[10px] text-accent font-bold tracking-wider">{step.icon}</span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="hidden md:block absolute -right-[calc(50%+8px)] top-1/2 -translate-y-1/2">
                        <span className="text-accent/30 text-xs">&rarr;</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-foreground tracking-widest mb-1">{step.label}</div>
                  <div className="text-[9px] text-muted leading-relaxed">{step.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
              className={`bg-card-bg p-6 hover:bg-card-border/20 transition-all duration-500 group ${
                featuresVisible ? "fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-accent text-xl font-bold group-hover:scale-110 transition-transform">{feature.icon}</div>
                <span className="text-[8px] text-accent/50 tracking-widest border border-accent/10 px-2 py-0.5">{feature.stat}</span>
              </div>
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
      <section ref={previewRef} className="border-b border-card-border relative">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">DASHBOARD PREVIEW</span>
        </div>
        <div className={`transition-all duration-1000 ${previewVisible ? "opacity-100" : "opacity-0 translate-y-4"}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-card-border relative">
            {DEMO_TICKERS.map((t) => {
              const sentColor =
                t.sentiment === "bullish" ? "text-bullish" : t.sentiment === "bearish" ? "text-bearish" : "text-neutral";
              const sentBg =
                t.sentiment === "bullish" ? "bg-bullish/5" : t.sentiment === "bearish" ? "bg-bearish/5" : "bg-neutral/5";
              return (
                <div key={t.ticker} className={`bg-card-bg p-4 ${previewVisible ? "" : "blur-[3px]"} transition-all duration-1000`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground">{t.ticker}</span>
                    <span className={`text-lg ${sentColor}`}>{t.direction}</span>
                  </div>
                  <div className={`text-[10px] font-bold ${sentColor} mb-1`}>{t.change}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${sentColor} ${sentBg}`}>
                      {t.sentiment}
                    </div>
                    <span className="text-[9px] text-muted">{t.confidence}% conf</span>
                  </div>
                  {/* Mini confidence bar */}
                  <div className="mt-2 h-0.5 bg-card-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.sentiment === "bullish" ? "bg-bullish" : t.sentiment === "bearish" ? "bg-bearish" : "bg-neutral"}`}
                      style={{ width: `${t.confidence}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[3px]">
              <div className="text-center">
                <div className="text-[10px] text-muted/60 tracking-[0.4em] mb-2">[ CLASSIFIED ]</div>
                <div className="text-sm md:text-lg text-foreground tracking-widest font-bold mb-4">
                  FULL ACCESS REQUIRED
                </div>
                <button
                  onClick={scrollToSignup}
                  className="text-[10px] px-6 py-2.5 bg-accent text-background font-bold tracking-widest hover:bg-accent/90 transition-all"
                >
                  UNLOCK DASHBOARD
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="border-b border-card-border bg-card-bg/30">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-accent mb-1">6</div>
              <div className="text-[10px] text-muted tracking-widest">GLOBAL NEWS SOURCES</div>
              <div className="text-[9px] text-muted/50 mt-1">Reuters, CNBC, Yahoo, MarketWatch, FT, AP</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-bullish mb-1">24/7</div>
              <div className="text-[10px] text-muted tracking-widest">AUTOMATED ANALYSIS</div>
              <div className="text-[9px] text-muted/50 mt-1">Cron pipeline runs daily with auto-retry</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">100%</div>
              <div className="text-[10px] text-muted tracking-widest">PREDICTION TRANSPARENCY</div>
              <div className="text-[9px] text-muted/50 mt-1">Every forecast tracked against real prices</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="hero-grid-bg relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/5 rounded-full blur-[80px]" />
        <div className="relative z-10 px-4 py-20 md:py-28 text-center max-w-3xl mx-auto">
          <div className="text-[10px] text-accent/60 tracking-[0.4em] mb-4">
            DON&apos;T TRADE BLIND
          </div>
          <h2 className="text-xl md:text-3xl lg:text-4xl text-foreground tracking-wider font-bold mb-4">
            SEE WHAT THE AI SEES
          </h2>
          <p className="text-xs text-muted tracking-wider mb-10 max-w-lg mx-auto">
            Real-time sentiment analysis. Predictive signals. Portfolio intelligence.
            Join the operators who read the market before it moves.
          </p>

          {!submitted ? (
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center border border-card-border bg-card-bg/80 backdrop-blur-sm hero-input-glow group">
                  <span className="text-accent text-xs px-3 opacity-60 group-focus-within:opacity-100 transition-opacity">$</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-transparent text-sm text-foreground py-3 pr-4 focus:outline-none placeholder:text-muted/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="hero-cta-btn px-8 py-3 bg-accent text-background text-xs font-bold tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 shrink-0"
                >
                  {submitting ? "..." : "GET ACCESS"}
                </button>
              </form>
              {error && (
                <div className="text-center mt-3">
                  <span className="text-[10px] text-bearish">[ERR] {error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 border border-bullish/30 bg-bullish/5 px-6 py-3">
              <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
              <span className="text-xs text-bullish tracking-wider font-bold">YOU&apos;RE IN — POSITION #{position}</span>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border bg-card-bg/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" className="h-5 w-5 opacity-50" alt="" />
              <span className="text-[10px] text-muted tracking-wider">
                SHADOWBROKERS v5.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-bullish pulse-dot" />
              <span className="text-[10px] text-bullish tracking-wider">EARLY ACCESS OPEN</span>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t border-card-border/50 py-3">
            <a href="/pricing" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRICING</a>
            <a href="/terms" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">TERMS</a>
            <a href="/privacy" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRIVACY</a>
            <a href="/disclaimer" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">DISCLAIMER</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
