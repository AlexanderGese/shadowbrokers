"use client";

export type DashboardTab = "OVERVIEW" | "TICKERS" | "NEWS" | "CHARTS" | "BRIEFING" | "EARNINGS" | "ACCURACY";

const TABS: { key: DashboardTab; label: string; shortcut: string }[] = [
  { key: "OVERVIEW", label: "OVERVIEW", shortcut: "1" },
  { key: "TICKERS", label: "TICKERS", shortcut: "2" },
  { key: "NEWS", label: "NEWS", shortcut: "3" },
  { key: "CHARTS", label: "CHARTS", shortcut: "4" },
  { key: "BRIEFING", label: "BRIEFING", shortcut: "5" },
  { key: "EARNINGS", label: "EARNINGS", shortcut: "6" },
  { key: "ACCURACY", label: "ACCURACY", shortcut: "7" },
];

interface TabBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="hidden lg:block sticky top-0 z-40 border-b border-card-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2.5 text-[10px] tracking-widest transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span className="opacity-50">[{tab.shortcut}]</span> {tab.label}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-3 text-[9px] text-muted tracking-wider shrink-0 pl-4">
          <span>[1-7] TABS</span>
          <span>[C] COMPARE</span>
          <span>[CTRL+K] SEARCH</span>
        </div>
      </div>
    </div>
  );
}
