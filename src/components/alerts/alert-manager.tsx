"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface AlertManagerProps {
  ticker: string;
}

export function AlertManager({ ticker }: AlertManagerProps) {
  const { user } = useAuth();
  const [condition, setCondition] = useState<string>("bullish");
  const [status, setStatus] = useState<string>("");

  if (!user) return null;

  async function createAlert() {
    setStatus("creating...");
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, condition }),
    });
    if (res.ok) {
      setStatus("Alert created!");
      setTimeout(() => setStatus(""), 3000);
    } else {
      const data = await res.json();
      setStatus(data.error || "Failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        className="bg-background border border-card-border text-[10px] text-foreground px-2 py-1 focus:border-accent focus:outline-none"
      >
        <option value="bullish">BULLISH</option>
        <option value="bearish">BEARISH</option>
        <option value="any_change">ANY CHANGE</option>
      </select>
      <button
        onClick={createAlert}
        className="text-[10px] px-3 py-1 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest"
      >
        SET ALERT
      </button>
      {status && <span className="text-[9px] text-muted">{status}</span>}
    </div>
  );
}
