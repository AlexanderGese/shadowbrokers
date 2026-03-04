import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg/80 backdrop-blur-sm px-4 md:px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="text-[10px] text-muted hover:text-accent transition-colors tracking-widest">
              &lt; BACK TO PRICING
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="h-5 w-5" alt="ShadowBrokers" />
            <span className="text-[10px] font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-foreground mb-2">
            {title}
          </h1>
          <div className="text-[10px] text-muted tracking-wider">
            LAST UPDATED: {lastUpdated}
          </div>
        </div>

        <div className="space-y-8 text-xs md:text-sm text-muted leading-relaxed">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-muted tracking-wider">
            SHADOWBROKERS v5.0
          </span>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRICING</Link>
            <span className="text-[10px] text-muted/30">|</span>
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
