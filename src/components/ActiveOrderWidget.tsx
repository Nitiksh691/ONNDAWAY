"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Package, Phone, X, ExternalLink } from "lucide-react";
import { fetchActiveOrder, getActiveOrderId } from "@/lib/activeOrder";
import { useDraggableFab } from "@/hooks/useDraggableFab";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, COMPANY_BLURB, COMPANY_NAME } from "@/lib/company";
import type { Order } from "@/lib/types";

// Floating pill nav total height
const NAV_HEIGHT = 112;

const STATUS_LABEL: Record<string, string> = {
  placed: "Order placed",
  preparing: "Being prepared",
  out_for_delivery: "On the way!",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_EMOJI: Record<string, string> = {
  placed: "📋",
  preparing: "🍳",
  out_for_delivery: "🛵",
  delivered: "✅",
  cancelled: "❌",
};

export default function ActiveOrderWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cartBarVisible, setCartBarVisible] = useState(false);
  const bottomOffset = NAV_HEIGHT + 16;
  const { style, onDragStart, isDragging, didDrag } = useDraggableFab(bottomOffset, 16, "otw_fab_track");

  const load = useCallback(async () => {
    if (!getActiveOrderId()) {
      setOrder(null);
      setVisible(false);
      return;
    }
    const active = await fetchActiveOrder();
    setOrder(active);
    setVisible(!!active);
  }, []);

  useEffect(() => {
    load();
    const onActiveOrder = () => load();
    window.addEventListener("otw:active-order", onActiveOrder);

    // Listen for real-time order changes via SSE instead of polling
    let eventSource: EventSource;
    const setupSSE = () => {
      eventSource = new EventSource("/api/orders/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "order_change") load();
        } catch (e) {}
      };
      eventSource.onerror = () => {
        eventSource.close();
        setTimeout(setupSSE, 5000);
      };
    };
    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener("otw:active-order", onActiveOrder);
    };
  }, [load]);

  useEffect(() => {
    const checkCart = () => {
      try {
        const cart = localStorage.getItem("otw_cart");
        setCartBarVisible(!!cart && JSON.parse(cart).length > 0);
      } catch { setCartBarVisible(false); }
    };
    checkCart();
    window.addEventListener("storage", checkCart);
    window.addEventListener("otw:cart-update", checkCart);
    return () => {
      window.removeEventListener("storage", checkCart);
      window.removeEventListener("otw:cart-update", checkCart);
    };
  }, []);

  if (!visible || !order) return null;
  if (pathname.startsWith("/track/")) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const fabStyle = {
    ...style,
    bottom: `max(${bottomOffset}px, calc(env(safe-area-inset-bottom) + ${NAV_HEIGHT}px))`,
  };

  const goToTrack = () => {
    if (!isDragging && !didDrag()) router.push(`/track/${order.id}`);
  };

  const toggleExpanded = () => {
    if (!isDragging && !didDrag()) setExpanded(v => !v);
  };

  return (
    <div style={fabStyle} className="otw-floating-fab">
      {expanded && (
        <div className="otw-fab-popup">
          <button onClick={() => setExpanded(false)} className="otw-fab-popup__close" aria-label="Close">
            <X size={14} />
          </button>
          <div className="otw-fab-popup__label">{COMPANY_NAME} · Live Order</div>
          <p className="otw-fab-popup__text">
            {STATUS_LABEL[order.status] || "Tracking order"} · #{order.id.slice(-6).toUpperCase()} · ₹{order.total}.
            {" "}{COMPANY_BLURB} Need help? Call us anytime.
          </p>
          <a href={SUPPORT_TEL} className="otw-fab-popup__cta">
            <Phone size={17} /> {SUPPORT_PHONE_DISPLAY}
          </a>
          <button type="button" onClick={goToTrack} className="otw-fab-popup__cta otw-fab-popup__cta--secondary">
            Open full tracking <ExternalLink size={16} />
          </button>
        </div>
      )}

      <div className="otw-fab-stack">
        <button
          type="button"
          className="otw-fab otw-fab--track"
          aria-label="Live order tracking"
          onPointerDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
          onClick={goToTrack}
        >
          <span className="otw-fab__emoji">{STATUS_EMOJI[order.status] || <Package size={22} />}</span>
          {order.status === "out_for_delivery" && <span className="otw-fab__pulse" />}
        </button>
        <button
          type="button"
          className="otw-fab-mini"
          aria-label="Order support"
          onClick={e => { e.stopPropagation(); toggleExpanded(); }}
        >
          <Phone size={13} />
        </button>
      </div>
    </div>
  );
}
