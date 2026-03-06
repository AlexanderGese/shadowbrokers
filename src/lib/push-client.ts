export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (error) {
    console.error("[SW] Registration failed:", error);
    return null;
  }
}

export async function subscribeToPush(
  vapidKey: string
): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    // Send to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    return subscription;
  } catch (error) {
    console.error("[Push] Subscribe failed:", error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    await subscription.unsubscribe();

    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return true;
  } catch (error) {
    console.error("[Push] Unsubscribe failed:", error);
    return false;
  }
}

export async function getPushPermissionState(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as "granted" | "denied" | "prompt";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
