"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, FEATURE_COMPARISON, FAQ_ITEMS } from "@/lib/plans";

export default function PricingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg/80 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/">
              <img src="/logo.svg" className="h-6 w-6" alt="ShadowBrokers" />
            </Link>
            <Link href="/" className="text-sm md:text-lg font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-[10px] px-3 py-1 border border-accent/30 text-accent tracking-widest"
            >
              PRICING
            </Link>
            <span className="text-[10px] px-3 py-1 border border-accent/20 text-accent/60 tracking-widest hidden sm:inline-block">
              EARLY ACCESS
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-bg border-b border-card-border px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className="glitch text-3xl md:text-5xl font-bold tracking-widest text-foreground mb-4"
            data-text="PRICING"
          >
            PRICING
          </h1>
          <div className="text-[10px] md:text-xs text-accent tracking-[0.3em]">
            CHOOSE YOUR CLEARANCE LEVEL
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">SUBSCRIPTION TIERS</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`border ${
                  plan.highlighted
                    ? "border-accent"
                    : "border-card-border"
                } bg-card-bg relative`}
              >
                {/* Terminal Header */}
                <div className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b ${
                  plan.highlighted ? "border-accent/30" : "border-card-border"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-bearish" />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral" />
                    <div className="h-1.5 w-1.5 rounded-full bg-bullish" />
                  </div>
                  {plan.highlighted && (
                    <span className="text-[9px] text-accent tracking-widest">RECOMMENDED</span>
                  )}
                </div>

                {/* Plan Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className={`text-sm font-bold tracking-widest mb-1 ${
                      plan.highlighted ? "text-accent" : "text-foreground"
                    }`}>
                      {plan.name}
                    </div>
                    <div className="text-[10px] text-muted tracking-wider">
                      {plan.tagline}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-2xl md:text-3xl font-bold ${
                      plan.highlighted ? "text-accent" : "text-foreground"
                    }`}>
                      {plan.price === 0 ? "€0" : `€${plan.price}`}
                    </span>
                    <span className="text-[10px] text-muted ml-1">/mo</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <span className={`text-[10px] shrink-0 ${
                          plan.highlighted ? "text-accent" : "text-bullish"
                        }`}>&gt;</span>
                        <span className="text-[10px] text-muted leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full text-center text-[10px] tracking-widest py-2.5 transition-all ${
                      plan.highlighted
                        ? "bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 hover:border-accent/60"
                        : "border border-card-border text-muted hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">FEATURE COMPARISON</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-[10px] text-muted tracking-widest py-3 pr-4 w-1/2">FEATURE</th>
                <th className="text-center text-[10px] text-muted tracking-widest py-3 px-4">FREE</th>
                <th className="text-center text-[10px] text-accent tracking-widest py-3 px-4">PRO</th>
                <th className="text-center text-[10px] text-muted tracking-widest py-3 px-4">ULTRA</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((category) => (
                <>
                  <tr key={`cat-${category.category}`}>
                    <td
                      colSpan={4}
                      className="text-[9px] text-accent/60 tracking-[0.3em] pt-6 pb-2 border-b border-card-border/50"
                    >
                      {category.category}
                    </td>
                  </tr>
                  {category.rows.map((row) => (
                    <tr key={row.feature} className="border-b border-card-border/30">
                      <td className="text-[10px] text-foreground/80 py-2.5 pr-4">{row.feature}</td>
                      <td className="text-center text-[10px] py-2.5 px-4">
                        <span className={row.free === "✓" ? "text-bullish" : row.free === "—" ? "text-muted/40" : "text-muted"}>
                          {row.free}
                        </span>
                      </td>
                      <td className="text-center text-[10px] py-2.5 px-4">
                        <span className={row.pro === "✓" ? "text-bullish" : row.pro === "—" ? "text-muted/40" : "text-accent"}>
                          {row.pro}
                        </span>
                      </td>
                      <td className="text-center text-[10px] py-2.5 px-4">
                        <span className={row.ultra === "✓" ? "text-bullish" : row.ultra === "—" ? "text-muted/40" : "text-accent"}>
                          {row.ultra}
                        </span>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-0">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-card-border/30">
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full text-left flex items-start gap-2 py-3 group"
                >
                  <span className={`text-[10px] shrink-0 transition-transform duration-150 ${
                    openFAQ === i ? "text-accent rotate-90" : "text-muted"
                  }`}>
                    &gt;
                  </span>
                  <span className="text-xs text-foreground tracking-wider group-hover:text-accent transition-colors">
                    {item.question}
                  </span>
                </button>
                {openFAQ === i && (
                  <div className="pl-5 pb-4">
                    <p className="text-[10px] md:text-xs text-muted leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <section className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="border border-neutral/30 bg-neutral/5 p-4 md:p-6">
            <div className="flex items-start gap-3">
              <span className="text-neutral text-sm font-bold shrink-0">!!</span>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-neutral mb-2">
                  IMPORTANT NOTICE
                </div>
                <p className="text-[10px] text-muted leading-relaxed">
                  ShadowBrokers provides AI-generated market analysis for informational purposes only. It is not financial advice.
                  Past performance does not guarantee future results. Always do your own research.
                  By using this service you agree to our{" "}
                  <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>,{" "}
                  <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>, and{" "}
                  <Link href="/disclaimer" className="text-accent hover:underline">Financial Disclaimer</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-muted tracking-wider">
            SHADOWBROKERS v5.0 | AI-POWERED MARKET INTELLIGENCE
          </span>
          <div className="flex items-center gap-3">
            <Link href="/terms" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">TERMS</Link>
            <span className="text-[10px] text-muted/30">|</span>
            <Link href="/privacy" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRIVACY</Link>
            <span className="text-[10px] text-muted/30">|</span>
            <Link href="/disclaimer" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">DISCLAIMER</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
