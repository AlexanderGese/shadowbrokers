import { setVapidDetails, sendNotification, type PushSubscription } from "web-push";
import { createServerClient } from "./supabase/server";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@shadowbrokers.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;

  try {
    await sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    // If subscription expired, return false so caller can clean up
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      return false;
    }
    console.error("[Push] Failed to send:", error);
    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  const supabase = createServerClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (!subscriptions?.length) return 0;

  let sent = 0;
  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      sub.subscription as unknown as PushSubscription,
      payload
    );
    if (success) {
      sent++;
    } else {
      // Clean up expired subscription
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  return sent;
}

export async function sendPushToAllUsers(payload: PushPayload): Promise<number> {
  const supabase = createServerClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, subscription");

  if (!subscriptions?.length) return 0;

  let sent = 0;
  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      sub.subscription as unknown as PushSubscription,
      payload
    );
    if (success) {
      sent++;
    } else {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }

  return sent;
}
