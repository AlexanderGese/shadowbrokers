"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <div className="border border-card-border bg-card-bg">
      <div className="px-4 py-2 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">AUTHENTICATION</span>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="text-[10px] text-muted tracking-widest block mb-1">EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
            placeholder="agent@shadowbrokers.io"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted tracking-widest block mb-1">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-[10px] text-bearish bg-bearish/10 px-3 py-2 border border-bearish/20">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent/10 border border-accent/30 text-accent text-xs py-2 hover:bg-accent/20 transition-colors disabled:opacity-50 tracking-widest"
        >
          {loading ? "AUTHENTICATING..." : "LOGIN"}
        </button>
        <div className="text-center space-y-1">
          <a href="/signup" className="block text-[10px] text-muted hover:text-accent transition-colors tracking-widest">
            NO ACCOUNT? <span className="text-accent">SIGN UP</span>
          </a>
          <a href="/" className="block text-[10px] text-muted/50 hover:text-muted transition-colors">
            ALPHA ACCESS ONLY
          </a>
        </div>
      </form>
    </div>
  );
}
