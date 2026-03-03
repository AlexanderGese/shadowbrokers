"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface StarButtonProps {
  ticker: string;
  initialStarred?: boolean;
  size?: "sm" | "md";
}

export function StarButton({ ticker, initialStarred = false, size = "sm" }: StarButtonProps) {
  const { user } = useAuth();
  const [starred, setStarred] = useState(initialStarred);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (starred) {
        await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
        setStarred(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
        setStarred(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const sizeClass = size === "sm" ? "text-xs" : "text-base";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={loading}
      className={`${sizeClass} ${starred ? "text-bullish" : "text-muted/40"} hover:text-bullish transition-colors disabled:opacity-50`}
      title={starred ? "Remove from watchlist" : "Add to watchlist"}
    >
      {starred ? "\u2605" : "\u2606"}
    </button>
  );
}
