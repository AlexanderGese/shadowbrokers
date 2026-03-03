"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  metadata: { ticker?: string };
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnread(d.unreadCount || 0);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-xs px-2 py-1 text-muted hover:text-foreground transition-colors"
      >
        {"\u25CF"}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-bearish text-[8px] text-white flex items-center justify-center rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 border border-card-border bg-card-bg z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-card-border flex items-center justify-between">
            <span className="text-[9px] text-muted tracking-widest">NOTIFICATIONS</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[9px] text-accent hover:underline">
                MARK ALL READ
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-[10px] text-muted">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2 border-b border-card-border ${!n.read ? "bg-accent/5" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                  <span className="text-[10px] text-foreground font-bold">{n.title}</span>
                </div>
                <div className="text-[9px] text-muted mt-0.5">{n.body}</div>
                <div className="flex items-center gap-2 mt-1">
                  {n.metadata?.ticker && (
                    <Link
                      href={`/ticker/${n.metadata.ticker}`}
                      className="text-[9px] text-accent hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      VIEW {n.metadata.ticker}
                    </Link>
                  )}
                  <span className="text-[8px] text-muted">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
