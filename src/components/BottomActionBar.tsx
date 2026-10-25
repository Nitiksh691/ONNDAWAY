"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Package, Plus, Minus, X, Trash2, Navigation, Sparkles } from "lucide-react";
import { useApp } from "@/lib/context";
import { useState, useEffect, useRef } from "react";
import { fetchActiveOrder } from "@/lib/activeOrder";
import type { Order } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

/** Sticky bottom cart bar + slide-up mini-cart drawer with sleek bottom progress bar */
export default function BottomActionBar() {
  const { cartCount, cartTotal, cart, updateQuantity, removeFromCart, profile } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState(69);
  const [freeDelivery, setFreeDelivery] = useState<{ enabled: boolean; minAmount: number } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d) {
          if (d.minOrderValue !== undefined) setMinOrderValue(Number(d.minOrderValue) || 0);
          if (d.homeLayout?.freeDelivery) {
            setFreeDelivery({
              enabled: d.homeLayout.freeDelivery.enabled !== false,
              minAmount: Number(d.homeLayout.freeDelivery.minAmount) || 199,
            });
          }
        }
      })
      .catch(() => { });
  }, []);

  // Track active order & only subscribe to SSE when user actually has an active order
  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let retryTimer: NodeJS.Timeout | null = null;

    const stopSSE = () => {
      if (es) {
        es.close();
        es = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const startSSE = () => {
      if (cancelled || es) return;
      const streamUrl = process.env.NEXT_PUBLIC_NODE_SERVER_URL
        ? `${process.env.NEXT_PUBLIC_NODE_SERVER_URL}/api/orders/stream`
        : "/api/orders/stream";

      try {
        es = new EventSource(streamUrl);
        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "order_change") check();
          } catch { }
        };
        es.onerror = () => {
          es?.close();
          es = null;
          if (!cancelled) {
            retryTimer = setTimeout(startSSE, 8000);
          }
        };
      } catch {
        // ignore
      }
    };

    const check = async () => {
      // If delivery partner, don't show customer tracking
      const isDelivery = profile?.role === "delivery" || (typeof window !== "undefined" && !!localStorage.getItem("otw_delivery_id"));
      if (isDelivery) {
        setHasActiveOrder(false);
        setActiveOrder(null);
        stopSSE();
        return;
      }

      const active = await fetchActiveOrder();
      if (!cancelled) {
        if (active && active.status !== "delivered" && active.status !== "cancelled") {
          setHasActiveOrder(true);
          setActiveOrder(active);
          // Only establish real-time SSE when user has an active pending order
          startSSE();
        } else {
          setHasActiveOrder(false);
          setActiveOrder(null);
          stopSSE();
        }
      }
    };

    check();
    window.addEventListener("otw:active-order", check);
    window.addEventListener("storage", check);

    return () => {
      cancelled = true;
      stopSSE();
      window.removeEventListener("otw:active-order", check);
      window.removeEventListener("storage", check);
    };
  }, [profile?.role]);

  // Close drawer when navigating
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handle = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [drawerOpen]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery") || pathname.startsWith("/vendor")) return null;
  if (profile?.role === "delivery" || (typeof window !== "undefined" && !!localStorage.getItem("otw_delivery_id"))) return null;
  if (pathname.startsWith("/track/")) return null;

  const isCartPage = pathname === "/cart";
  const hasCartItems = cartCount > 0 && !isCartPage;
  const showTrackBar = hasActiveOrder && !!activeOrder;

  const statusText =
    activeOrder?.status === "out_for_delivery"
      ? "🛵 On the way to you!"
      : activeOrder?.status === "preparing"
        ? "🍳 Being prepared in kitchen"
        : "📋 Order placed & confirmed";

  const trackBarClass = isCartPage
    ? "otw-track-bar on-cart-page"
    : hasCartItems
      ? "otw-track-bar has-cart-bar"
      : "otw-track-bar has-bottom-nav";

  const TrackBar = showTrackBar && activeOrder ? (
    <div className={trackBarClass}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", width: "100%", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <Navigation size={12} color="#fff" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#ffffff",
              background: "rgba(0, 0, 0, 0.22)",
              padding: "2px 7px",
              borderRadius: 5,
              whiteSpace: "nowrap",
              flexShrink: 0
            }}>
              {statusText}
            </span>
            <span style={{
              fontWeight: 700,
              fontSize: "0.78rem",
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              #{activeOrder.id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>
        <Link
          href={`/track/${activeOrder.id}`}
          style={{
            background: "#fff", color: "#059669",
            padding: "5px 12px", borderRadius: 8,
            fontWeight: 800, fontSize: "0.78rem",
            textDecoration: "none", display: "flex",
            alignItems: "center", gap: 4,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            flexShrink: 0, whiteSpace: "nowrap"
          }}
        >
          Track <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  ) : null;

  if (!hasCartItems) {
    // Only Track Bar is shown if active order exists
    return (
      <>
        {TrackBar}
        <style>{`
          .otw-track-bar {
            position: fixed;
            left: 0;
            right: 0;
            z-index: 925;
            background: linear-gradient(135deg, #059669, #10b981);
            padding: 8px 16px;
            box-shadow: 0 -3px 16px rgba(0,0,0,0.14);
            border-top: 1px solid rgba(255,255,255,0.18);
            font-family: 'Outfit', 'Inter', system-ui, sans-serif;
            transition: bottom 0.25s ease;
          }
          @media (max-width: 767px) {
            .otw-track-bar.has-bottom-nav {
              bottom: 50px;
            }
            .otw-track-bar.on-cart-page {
              bottom: 0px;
            }
          }
          @media (min-width: 768px) {
            .otw-track-bar.has-bottom-nav,
            .otw-track-bar.on-cart-page {
              bottom: 0px;
            }
          }
        `}</style>
      </>
    );
  }

  // Check if cart contains any Onndaway food or coffee (exempt from minimum order & gets free delivery!)
  const hasOnndawayFoodOrCoffee = cart.some(c => {
    const cat = (c.item?.category || "").toLowerCase();
    const itemName = (c.item?.name || "").toLowerCase();
    const world = c.item?.world;
    return (
      cat.includes("coffee") ||
      cat.includes("mojito") ||
      cat.includes("beverage") ||
      cat.includes("drink") ||
      world === "food" ||
      itemName.includes("coffee") ||
      itemName.includes("mojito") ||
      (!world && !c.item?.isConsignment)
    );
  });

  // Minimum order: always ₹69 (or configured value) for all carts
  const activeMinOrder = (minOrderValue && minOrderValue > 0) ? minOrderValue : 69;
  const isMinOrderPending = activeMinOrder > 0 && cartTotal < activeMinOrder;
  const minOrderRemaining = Math.max(0, activeMinOrder - cartTotal);
  const minOrderPct = activeMinOrder > 0 ? Math.min(100, Math.round((cartTotal / activeMinOrder) * 100)) : 100;

  // Free delivery progress (food/coffee still get free delivery!)
  const freeDelThreshold = freeDelivery?.enabled ? (freeDelivery.minAmount || 199) : 0;
  const isFreeDeliveryUnlocked = hasOnndawayFoodOrCoffee || (freeDelThreshold > 0 && cartTotal >= freeDelThreshold);
  const freeDeliveryRemaining = Math.max(0, freeDelThreshold - cartTotal);
  const freeDeliveryPct = hasOnndawayFoodOrCoffee ? 100 : (freeDelThreshold > 0 ? Math.min(100, Math.round((cartTotal / freeDelThreshold) * 100)) : 100);

  // Show progress bar when min order not yet reached
  const showProgressSection = isMinOrderPending;

  return (
    <>
      {TrackBar}

      {/* Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)", zIndex: 990,
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Mini-cart drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          left: 0, right: 0, bottom: drawerOpen ? 76 : -500,
          maxHeight: "70vh",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          zIndex: 991,
          transition: "bottom 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>
              Your Cart
            </span>
            <span style={{
              background: "#EEF2FF", color: "#0135FB",
              fontSize: "0.75rem", fontWeight: 700,
              padding: "2px 8px", borderRadius: 20,
            }}>
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: "#F1F5F9", border: "none", borderRadius: "50%",
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#64748B",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Drawer items list */}
        <div style={{
          overflowY: "auto", flex: 1, padding: "8px 20px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {cart.map(cartItem => {
            const hasCustomizations = cartItem.selectedCustomizations && cartItem.selectedCustomizations.length > 0;
            const customPrice = (cartItem.selectedCustomizations || []).reduce((sum, c) => sum + (c.price || 0), 0);
            const effectivePrice = (cartItem.item.price || 0) + customPrice;
            const lineTotal = effectivePrice * cartItem.quantity;

            return (
              <div
                key={cartItem.cartItemId}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 0", borderBottom: "1px solid #F8FAFC",
                }}
              >
                {/* Image */}
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  overflow: "hidden", position: "relative",
                  background: "#F1F5F9", flexShrink: 0,
                }}>
                  {cartItem.item.image ? (
                    <Image
                      src={getOptimizedImageUrl(cartItem.item.image, 100)}
                      alt={cartItem.item.name}
                      fill
                      sizes="48px"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      🍽️
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: "0.85rem", color: "#0F172A",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {cartItem.item.name}
                  </div>
                  {hasCustomizations && (
                    <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 1 }}>
                      {cartItem.selectedCustomizations?.map(c => c.option).join(", ")}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0135FB", marginTop: 2 }}>
                    ₹{lineTotal}
                  </div>
                </div>

                {/* Quantity controls */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#F1F5F9", borderRadius: 8, padding: "4px 8px",
                }}>
                  <button
                    onClick={() => {
                      if (cartItem.quantity === 1) {
                        removeFromCart(cartItem.cartItemId);
                      } else {
                        updateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
                      }
                    }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: cartItem.quantity === 1 ? "#EF4444" : "#334155", padding: 0,
                    }}
                  >
                    {cartItem.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </button>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", minWidth: 16, textAlign: "center", color: "#0F172A" }}>
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#334155", padding: 0,
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid #F1F5F9",
          background: "#FAFBFF",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>TOTAL</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0F172A" }}>₹{cartTotal}</div>
          </div>
          <button
            onClick={() => { setDrawerOpen(false); router.push("/cart"); }}
            style={{
              background: "#0135FB", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 24px",
              fontWeight: 800, fontSize: "0.9rem",
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(1,53,251,0.35)",
            }}
          >
            Go to Cart <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Main Bottom Bar */}
      {/* <div className="bottom-action-bar" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}> */}
      <div
        className="bottom-action-bar"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "visible",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "var(--bottom-nav-height, 0px)",
          zIndex: 980,
          background: "#0135FB",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxSizing: "border-box",
        }}
      >
        {/* Top Section: Cart Summary & Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          gap: "10px",
          padding: showProgressSection ? "9px 14px" : "9px 14px max(10px, env(safe-area-inset-bottom))",
        }}>

          {/* Left side — click to open mini-cart drawer */}
          <button
            onClick={() => setDrawerOpen(prev => !prev)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "6px 10px 6px 8px",
              cursor: "pointer", transition: "background 0.15s",
              WebkitTapHighlightColor: "transparent",
              minWidth: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <div className="bottom-action-bar__icon">
              <ShoppingBag size={17} color="#fff" />
            </div>
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.75)", fontWeight: 700, lineHeight: 1 }}>
                {drawerOpen ? "▼ Close" : "▲ View"}
              </div>
              <div className="bottom-action-bar__count">
                {cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal}
              </div>
            </div>
          </button>

          {/* Right side actions */}
          <div className="bottom-action-bar__actions">
            {hasActiveOrder && activeOrder && (
              <Link
                href={`/track/${activeOrder.id}`}
                style={{
                  background: "#059669",
                  color: "#fff",
                  padding: "8px 10px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.3)"
                }}
              >
                <Navigation size={13} /> Track
              </Link>
            )}
            <Link href="/orders" className="bottom-action-bar__orders">
              <Package size={15} />
              <span className="bottom-action-bar__orders-label">Orders</span>
            </Link>
            <Link href="/cart" className="bottom-action-bar__checkout">
              Checkout <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* BOTTOM SECTION: Bold Min Order Progress Bar (only when min order not yet reached) */}
        {showProgressSection && isMinOrderPending && (
          <div style={{
            width: "100%",
            background: "rgba(0, 10, 60, 0.65)",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "8px 14px max(10px, env(safe-area-inset-bottom))",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}>
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 5, color: "#FEF08A",
                fontWeight: 800, fontSize: "clamp(0.7rem, 2.6vw, 0.8rem)", minWidth: 0,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
              }}>
                <span style={{ flexShrink: 0 }}>⚡</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  Add <strong style={{ color: "#FFFFFF" }}>₹{minOrderRemaining}</strong> more · min order ₹{activeMinOrder}
                </span>
              </span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                {minOrderPct}%
              </span>
            </div>

            {/* Bold progress track — 10px tall */}
            <div style={{
              height: 10,
              borderRadius: 99,
              background: "rgba(255, 255, 255, 0.12)",
              overflow: "hidden",
              position: "relative",
              width: "100%",
            }}>
              <div style={{
                height: "100%",
                width: `${minOrderPct}%`,
                borderRadius: 99,
                background: "linear-gradient(90deg, #F59E0B, #FBBF24, #FDE68A)",
                transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 0 12px rgba(251,191,36,0.8), 0 0 4px rgba(253,230,138,0.4)",
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .otw-track-bar {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 925;
          background: linear-gradient(135deg, #059669, #10b981);
          padding: 8px 16px;
          box-shadow: 0 -3px 16px rgba(0,0,0,0.14);
          border-top: 1px solid rgba(255,255,255,0.18);
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          transition: bottom 0.25s ease;
        }
        @media (max-width: 767px) {
          .otw-track-bar.has-bottom-nav {
            bottom: 50px;
          }
          .otw-track-bar.has-cart-bar {
            bottom: 74px;
          }
          .otw-track-bar.on-cart-page {
            bottom: 0px;
          }
        }
        @media (min-width: 768px) {
          .otw-track-bar.has-bottom-nav,
          .otw-track-bar.on-cart-page {
            bottom: 0px;
          }
          .otw-track-bar.has-cart-bar {
            bottom: 74px;
          }
        }
      `}</style>
    </>
  );
}
