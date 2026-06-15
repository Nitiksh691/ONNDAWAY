import { STORAGE_KEYS } from "./constants";
import type { Order, OrderStatus } from "./types";

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export function getActiveOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.activeOrderId);
}

export function setActiveOrderId(orderId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.activeOrderId, orderId);
  window.dispatchEvent(new CustomEvent("otw:active-order", { detail: { orderId } }));
}

export function clearActiveOrderId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.activeOrderId);
  window.dispatchEvent(new CustomEvent("otw:active-order", { detail: { orderId: null } }));
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

export async function fetchActiveOrder(): Promise<Order | null> {
  const orderId = getActiveOrderId();
  if (!orderId) return null;
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    if (!res.ok) {
      clearActiveOrderId();
      return null;
    }
    const order: Order = await res.json();
    if (!isActiveOrderStatus(order.status)) {
      clearActiveOrderId();
      return null;
    }
    return order;
  } catch {
    return null;
  }
}
