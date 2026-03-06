"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Bucket {
  range: string;
  count: number;
}

export function ConfidenceHistogram() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/charts/confidence")
      .then((r) => r.json())
      .then((d) => setBuckets((d.buckets || []).map((b: Bucket) => ({ range: b.range, count: b.count }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="text-[10px] text-muted tracking-widest">LOADING HISTOGRAM...</span>
      </div>
    );
  }

  if (!buckets.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="text-[10px] text-muted">No confidence data available</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="range"
              tick={{ fontSize: 9, fill: "#888888" }}
              tickLine={false}
              axisLine={{ stroke: "#1a1a1a" }}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#888888" }}
              tickLine={false}
              axisLine={{ stroke: "#1a1a1a" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111111",
                border: "1px solid #1a1a1a",
                fontSize: 10,
                fontFamily: "monospace",
              }}
              labelStyle={{ color: "#888888" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as Bucket;
                return (
                  <div className="bg-[#111111] border border-[#1a1a1a] p-2 text-[10px] font-mono">
                    <div className="text-muted mb-1">{label}</div>
                    <div className="text-foreground">{d.count} predictions</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" barSize={30} fill="#00ff88" fillOpacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
