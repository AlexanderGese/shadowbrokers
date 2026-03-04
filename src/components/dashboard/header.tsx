"use client";

import { SearchBar } from "./search-bar";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/alerts/notification-bell";

export function DashboardHeader({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <header className="relative z-50 border-b border-card-border bg-card-bg/95 backdrop-blur-sm px-4 md:px-6 py-3 border-t-2 border-t-accent/20">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" className="h-5 w-5" alt="ShadowBrokers" />
            <h1 className="text-sm md:text-lg font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </h1>
          </a>
          <span className="text-[10px] text-muted hidden lg:inline">FINANCIAL INTELLIGENCE</span>
        </div>

        {/* Center: Search */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-muted hidden xl:inline">
              {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
