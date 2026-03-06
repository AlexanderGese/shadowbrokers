"use client";

import { useState, useEffect } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushPermissionState,
} from "@/lib/push-client";

export function PushToggle() {
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPushPermissionState().then(setPermission);

    // Check if already subscribed
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function handleToggle() {
    setLoading(true);
    try {
      if (subscribed) {
        const success = await unsubscribeFromPush();
        if (success) setSubscribed(false);
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error("[Push] No VAPID public key configured");
          return;
        }
        const sub = await subscribeToPush(vapidKey);
        if (sub) {
          setSubscribed(true);
          setPermission("granted");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (permission === "unsupported") {
    return (
      <div className="p-3 border border-card-border text-[10px] text-muted">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="p-3 border border-bearish/20 bg-bearish/5 text-[10px] text-bearish">
        Push notifications are blocked. Please enable them in your browser settings.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="w-full flex items-center justify-between p-3 border border-card-border hover:bg-card-border/10 transition-colors text-left disabled:opacity-50"
    >
      <div>
        <div className="text-[10px] font-bold text-foreground tracking-widest">PUSH NOTIFICATIONS</div>
        <div className="text-[9px] text-muted mt-0.5">
          {subscribed
            ? "Receiving alerts and briefings as push notifications"
            : "Get alerts and briefings as push notifications on this device"}
        </div>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${subscribed ? "bg-accent" : "bg-card-border"}`}>
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${
            subscribed ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
