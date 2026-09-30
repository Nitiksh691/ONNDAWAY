"use client";
import { useEffect, useRef } from "react";

interface UsePushNotificationsProps {
  orderId: string | null;
  userId: string | null;
  orderStatus?: string;
}

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  preparing: {
    title: "🍳 Your order is being prepared!",
    body: "Our kitchen is working on your food. Hang tight!",
  },
  out_for_delivery: {
    title: "🛵 Your order is on the way!",
    body: "Your rider is heading to you right now. Get ready!",
  },
  delivered: {
    title: "🎉 Order Delivered!",
    body: "Your food has arrived. Enjoy your meal! Rate your experience.",
  },
  cancelled: {
    title: "❌ Order Cancelled",
    body: "Your order has been cancelled. Contact support for help.",
  },
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(
  orderId: string,
  userId: string
): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("VAPID public key not configured");
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Save subscription to backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, orderId, subscription }),
    });

    return true;
  } catch (err) {
    console.error("Push subscription error:", err);
    return false;
  }
}

export default function PushNotificationSetup({
  orderId,
  userId,
  orderStatus,
}: UsePushNotificationsProps) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!orderId || !userId || subscribedRef.current) return;

    // Only subscribe for active orders
    if (
      orderStatus === "delivered" ||
      orderStatus === "cancelled" ||
      orderStatus === "payment_pending"
    )
      return;

    // Check if already subscribed for this order
    const key = `push_subscribed_${orderId}`;
    if (localStorage.getItem(key)) return;

    // Delay so we don't immediately bombard the user with permission dialogs
    const timer = setTimeout(async () => {
      const success = await subscribeToPushNotifications(orderId, userId);
      if (success) {
        localStorage.setItem(key, "1");
        subscribedRef.current = true;
      }
    }, 3000); // Ask after 3 seconds

    return () => clearTimeout(timer);
  }, [orderId, userId, orderStatus]);

  return null;
}
