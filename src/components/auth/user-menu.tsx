"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createBrowserClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";

export function UserMenu() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <span className="text-[10px] text-muted">...</span>;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-[10px] px-3 py-1 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest"
      >
        LOGIN
      </Link>
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "Agent";
  const admin = isAdmin(user.email);

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[10px] px-3 py-1 border border-card-border hover:border-accent/30 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-bullish" />
        <span className="text-foreground tracking-wider uppercase">
          {displayName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 border border-card-border bg-card-bg z-50">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[10px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors tracking-widest"
          >
            DASHBOARD
          </Link>
          <Link
            href="/portfolio"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[10px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors tracking-widest"
          >
            PORTFOLIO
          </Link>
          <Link
            href="/alerts"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[10px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors tracking-widest"
          >
            ALERTS
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[10px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors tracking-widest"
          >
            SETTINGS
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[10px] text-muted hover:text-foreground hover:bg-card-border/30 transition-colors tracking-widest"
          >
            PRICING
          </Link>
          {admin && (
            <>
              <div className="border-t border-card-border" />
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[10px] text-accent hover:bg-accent/10 transition-colors tracking-widest"
              >
                ADMIN PANEL
              </Link>
            </>
          )}
          <div className="border-t border-card-border" />
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 text-[10px] text-bearish hover:bg-bearish/10 transition-colors tracking-widest"
          >
            LOGOUT
          </button>
        </div>
      )}
    </div>
  );
}
