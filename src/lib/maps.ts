import type { Order } from "./types";

/** Google Maps directions or search URL for an order's delivery location. */
export function getOrderMapsUrl(order: Pick<Order, "location" | "latitude" | "longitude">): string {
  if (order.latitude != null && order.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.location)}`;
}

export function getOrderMapsEmbedUrl(order: Pick<Order, "latitude" | "longitude" | "location">): string | null {
  if (order.latitude != null && order.longitude != null) {
    return `https://maps.google.com/maps?q=${order.latitude},${order.longitude}&z=17&output=embed`;
  }
  return null;
}
