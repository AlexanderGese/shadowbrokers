"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface WebhookConfig {
  webhook_url: string;
  notify_alerts: boolean;
  notify_briefings: boolean;
  notify_danger: boolean;
  notify_high_confidence: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCreated, setProfileCreated] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [webhook, setWebhook] = useState<WebhookConfig>({
    webhook_url: "",
    notify_alerts: true,
    notify_briefings: true,
    notify_danger: true,
    notify_high_confidence: false,
  });
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadProfile();
    loadWebhook();
  }, [user, authLoading, router]);

  async function loadProfile() {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.email) {
        setDisplayName(data.display_name || "");
        setProfileEmail(data.email);
        setProfileCreated(data.created_at || "");
      }
    } catch {
      // ignore
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage({ type: "ok", text: "Username updated" });
      } else {
        setProfileMessage({ type: "err", text: data.error || "Failed to update" });
      }
    } catch {
      setProfileMessage({ type: "err", text: "Network error" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function loadWebhook() {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      if (data.webhook) {
        setWebhook({
          webhook_url: data.webhook.webhook_url || "",
          notify_alerts: data.webhook.notify_alerts ?? true,
          notify_briefings: data.webhook.notify_briefings ?? true,
          notify_danger: data.webhook.notify_danger ?? true,
          notify_high_confidence: data.webhook.notify_high_confidence ?? false,
        });
        setHasExisting(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function saveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhook),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "ok", text: "Webhook saved" });
        setHasExisting(true);
      } else {
        setMessage({ type: "err", text: data.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function testWebhook() {
    setMessage(null);
    setTesting(true);
    try {
      const res = await fetch("/api/webhooks/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "ok", text: "Test message sent — check Discord!" });
      } else {
        setMessage({ type: "err", text: data.error || "Test failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  async function removeWebhook() {
    setMessage(null);
    try {
      await fetch("/api/webhooks", { method: "DELETE" });
      setWebhook({
        webhook_url: "",
        notify_alerts: true,
        notify_briefings: true,
        notify_danger: true,
        notify_high_confidence: false,
      });
      setHasExisting(false);
      setMessage({ type: "ok", text: "Webhook removed" });
    } catch {
      setMessage({ type: "err", text: "Failed to remove" });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted tracking-widest">LOADING SETTINGS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <span className="text-xs text-muted tracking-widest">SETTINGS</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Section */}
        <div className="border border-card-border bg-card-bg">
          <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
            <span className="text-[10px] text-muted tracking-widest">PROFILE</span>
            <span className="text-[9px] px-2 py-0.5 bg-bullish/10 text-bullish border border-bullish/20">ALPHA</span>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 border border-accent/30 bg-accent/10 flex items-center justify-center">
                <span className="text-sm text-accent font-bold">
                  {(displayName || profileEmail || "?")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-xs text-foreground tracking-wider">
                  {displayName || profileEmail?.split("@")[0] || "Agent"}
                </div>
                <div className="text-[9px] text-muted">{profileEmail}</div>
              </div>
              {profileCreated && (
                <div className="ml-auto text-right">
                  <div className="text-[9px] text-muted">JOINED</div>
                  <div className="text-[10px] text-foreground">
                    {new Date(profileCreated).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted tracking-widest block mb-1">USERNAME</label>
                <div className="flex items-center border border-card-border bg-background">
                  <span className="text-[10px] text-accent px-3 shrink-0">@</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="your_username"
                    maxLength={32}
                    required
                    className="w-full bg-transparent text-xs text-foreground py-2.5 pr-3 focus:outline-none placeholder:text-muted/40"
                  />
                </div>
                <div className="text-[9px] text-muted mt-1">
                  This is how you appear across the platform. Max 32 characters.
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted tracking-widest block mb-1">EMAIL</label>
                <div className="flex items-center border border-card-border bg-background/50">
                  <span className="text-[10px] text-muted px-3 shrink-0">$</span>
                  <span className="text-xs text-muted py-2.5 pr-3">{profileEmail}</span>
                </div>
                <div className="text-[9px] text-muted mt-1">
                  Email cannot be changed during alpha.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="text-[10px] px-5 py-2 bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 transition-colors tracking-widest disabled:opacity-50"
                >
                  {savingProfile ? "SAVING..." : "UPDATE PROFILE"}
                </button>
              </div>

              {profileMessage && (
                <div className={`text-[10px] ${profileMessage.type === "ok" ? "text-bullish" : "text-bearish"}`}>
                  [{profileMessage.type === "ok" ? "OK" : "ERR"}] {profileMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Discord Webhook Section */}
        <div className="border border-card-border bg-card-bg">
          <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
            <span className="text-[10px] text-muted tracking-widest">DISCORD WEBHOOK</span>
            <span className="text-[9px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/20">ULTRA</span>
          </div>

          <div className="p-6">
            <p className="text-[10px] text-muted leading-relaxed mb-6">
              Connect a Discord webhook to receive real-time alerts, daily briefings, danger signals,
              and high-confidence predictions directly in your Discord server.
            </p>

            <form onSubmit={saveWebhook} className="space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="text-[10px] text-muted tracking-widest block mb-1">WEBHOOK URL</label>
                <div className="flex items-center border border-card-border bg-background">
                  <span className="text-[10px] text-accent px-3 shrink-0">$</span>
                  <input
                    type="url"
                    value={webhook.webhook_url}
                    onChange={(e) => setWebhook({ ...webhook, webhook_url: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    required
                    className="w-full bg-transparent text-xs text-foreground py-2.5 pr-3 focus:outline-none placeholder:text-muted/40"
                  />
                </div>
                <div className="text-[9px] text-muted mt-1">
                  Server Settings &rarr; Integrations &rarr; Webhooks &rarr; New Webhook &rarr; Copy URL
                </div>
              </div>

              {/* Notification toggles */}
              <div>
                <label className="text-[10px] text-muted tracking-widest block mb-2">NOTIFICATIONS</label>
                <div className="space-y-2">
                  <Toggle
                    label="ALERT TRIGGERS"
                    description="Get notified when your ticker alerts fire"
                    checked={webhook.notify_alerts}
                    onChange={(v) => setWebhook({ ...webhook, notify_alerts: v })}
                  />
                  <Toggle
                    label="DAILY BRIEFINGS"
                    description="Receive the daily market briefing summary"
                    checked={webhook.notify_briefings}
                    onChange={(v) => setWebhook({ ...webhook, notify_briefings: v })}
                  />
                  <Toggle
                    label="DANGER SIGNALS"
                    description="High-confidence bearish warnings on tickers"
                    checked={webhook.notify_danger}
                    onChange={(v) => setWebhook({ ...webhook, notify_danger: v })}
                  />
                  <Toggle
                    label="HIGH CONFIDENCE PREDICTIONS"
                    description="AI predictions with 80%+ confidence and directional moves"
                    checked={webhook.notify_high_confidence}
                    onChange={(v) => setWebhook({ ...webhook, notify_high_confidence: v })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-[10px] px-5 py-2 bg-accent/10 border border-accent/40 text-accent hover:bg-accent/20 transition-colors tracking-widest disabled:opacity-50"
                >
                  {saving ? "SAVING..." : "SAVE WEBHOOK"}
                </button>
                {hasExisting && (
                  <>
                    <button
                      type="button"
                      onClick={testWebhook}
                      disabled={testing}
                      className="text-[10px] px-4 py-2 border border-card-border text-muted hover:text-foreground transition-colors tracking-widest disabled:opacity-50"
                    >
                      {testing ? "SENDING..." : "TEST"}
                    </button>
                    <button
                      type="button"
                      onClick={removeWebhook}
                      className="text-[10px] px-4 py-2 border border-bearish/30 text-bearish/70 hover:text-bearish hover:border-bearish/50 transition-colors tracking-widest"
                    >
                      REMOVE
                    </button>
                  </>
                )}
              </div>

              {message && (
                <div className={`text-[10px] ${message.type === "ok" ? "text-bullish" : "text-bearish"}`}>
                  [{message.type === "ok" ? "OK" : "ERR"}] {message.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-3 border border-card-border hover:bg-card-border/10 transition-colors text-left"
    >
      <div>
        <div className="text-[10px] font-bold text-foreground tracking-widest">{label}</div>
        <div className="text-[9px] text-muted mt-0.5">{description}</div>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${checked ? "bg-accent" : "bg-card-border"}`}>
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
