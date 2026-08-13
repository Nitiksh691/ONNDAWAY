"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Package, Plus, Minus, X, Trash2 } from "lucide-react";
import { useApp } from "@/lib/context";
import { useState, useEffect, useRef } from "react";
import { getActiveOrderId } from "@/lib/activeOrder";

/** Sticky bottom cart bar + slide-up mini-cart drawer */
export default function BottomActionBar() {
  const { cartCount, cartTotal, cart, updateQuantity, removeFromCart } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setHasActiveOrder(!!getActiveOrderId());
    check();
    window.addEventListener("otw:active-order", check);
    return () => window.removeEventListener("otw:active-order", check);
  }, []);

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

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;
  if (pathname === "/cart") return null;
  if (cartCount === 0) return null;

  return (
    <>
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
          left: 0, right: 0, bottom: drawerOpen ? 64 : -500,
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
            <ShoppingBag size={18} color="#0135FB" />
            <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>
              Your Cart
            </span>
            <span style={{
              background: "#0135FB", color: "#fff",
              borderRadius: "99px", fontSize: "0.7rem",
              fontWeight: 800, padding: "2px 8px", marginLeft: 4,
            }}>
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ background: "#F8FAFC", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Items list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {cart.map((cartItem) => {
            const price = (cartItem.unitPrice ?? cartItem.item.price) * cartItem.quantity;
            return (
              <div key={cartItem.cartItemId} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 20px",
                borderBottom: "1px solid #F8FAFC",
              }}>
                {/* Image */}
                <div style={{ position: "relative", width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F1F5F9" }}>
                  {cartItem.item.image ? (
                    <Image
                      src={cartItem.item.image}
                      alt={cartItem.item.name}
                      fill
                      sizes="52px"
                      style={{ objectFit: "cover" }}
                      onContextMenu={e => e.preventDefault()}
                      onDragStart={e => e.preventDefault()}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                      {cartItem.item.category === "coffee" ? "☕" : cartItem.item.category === "snacks" ? "🍟" : "🍽️"}
                    </div>
                  )}
                </div>

                {/* Name + customizations */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {cartItem.item.name}
                  </div>
                  {cartItem.selectedCustomizations && cartItem.selectedCustomizations.length > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: 2 }}>
                      {cartItem.selectedCustomizations.map(c => c.option).join(", ")}
                    </div>
                  )}
                  {cartItem.specialInstructions && (
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8", fontStyle: "italic", marginTop: 1 }}>
                      "{cartItem.specialInstructions}"
                    </div>
                  )}
                </div>

                {/* Price + qty controls */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0F172A" }}>₹{price}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => updateQuantity(cartItem.cartItemId!, cartItem.quantity - 1)}
                      style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid #0135FB", background: "#fff", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      {cartItem.quantity === 1 ? <Trash2 size={10} /> : <Minus size={10} />}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0F172A", minWidth: 16, textAlign: "center" }}>{cartItem.quantity}</span>
                    <button
                      onClick={() => updateQuantity(cartItem.cartItemId!, cartItem.quantity + 1)}
                      style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#0135FB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(1,53,251,0.3)" }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
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

      {/* Bottom bar */}
      <div className="bottom-action-bar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", width: "100%", gap: "12px" }}>

          {/* Left side — click to open drawer */}
          <button
            onClick={() => setDrawerOpen(prev => !prev)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10, padding: "6px 12px 6px 8px",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <div className="bottom-action-bar__icon">
              <ShoppingBag size={18} color="#fff" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1 }}>
                {drawerOpen ? "▼ Hide" : "▲ View"} items
              </div>
              <div className="bottom-action-bar__count">
                {cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal}
              </div>
            </div>
          </button>

          <div className="bottom-action-bar__actions">
            {hasActiveOrder && (
              <Link href="/orders" className="bottom-action-bar__orders">
                <Package size={15} />
                <span className="bottom-action-bar__orders-label">Orders</span>
              </Link>
            )}
            <Link href="/cart" className="bottom-action-bar__checkout">
              Checkout <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
