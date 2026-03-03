import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
            <span className="text-xs text-muted tracking-widest">SHADOWBROKERS</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
