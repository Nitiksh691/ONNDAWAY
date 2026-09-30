import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:nitikshpal@gmail.com";

let vapidConfigured = false;

function configureVapid() {
  if (!vapidConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
}

export async function sendPushNotification(
  subscriptionRaw: string | object,
  payloadObj: { title: string; message: string; url?: string }
) {
  try {
    configureVapid();
    const subscription =
      typeof subscriptionRaw === "string"
        ? JSON.parse(subscriptionRaw)
        : subscriptionRaw;

    const payload = JSON.stringify({
      title: payloadObj.title,
      body: payloadObj.message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      url: payloadObj.url || "/",
    });

    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err: any) {
    console.error("Push notification error:", err?.message || err);
    return false;
  }
}
