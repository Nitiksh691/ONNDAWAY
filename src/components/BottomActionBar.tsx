"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useApp } from "@/lib/context";
import { useState, useEffect } from "react";
import { getActiveOrderId } from "@/lib/activeOrder";

/** Sticky bottom cart bar — visible on all screen sizes */
export default function BottomActionBar() {
  const { cartCount, cartTotal } = useApp();
  const pathname = usePathname();
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  useEffect(() => {
    const check = () => setHasActiveOrder(!!getActiveOrderId());
    check();
    window.addEventListener("otw:active-order", check);
    return () => window.removeEventListener("otw:active-order", check);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;
  if (cartCount === 0) return null;

  return (
    <div className="bottom-action-bar">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", width: "100%", gap: "12px" }}>
        <div className="bottom-action-bar__left">
          <div className="bottom-action-bar__icon">
            <ShoppingBag size={20} color="#fff" />
          </div>
          <div className="bottom-action-bar__info">
            <div className="bottom-action-bar__count">
              {cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal}
            </div>
          </div>
        </div>
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
  );
}
