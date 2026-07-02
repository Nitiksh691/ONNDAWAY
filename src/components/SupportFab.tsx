"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Phone, X, Info } from "lucide-react";
import Link from "next/link";
import { useDraggableFab } from "@/hooks/useDraggableFab";
import { getActiveOrderId } from "@/lib/activeOrder";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, COMPANY_BLURB, COMPANY_NAME } from "@/lib/company";

// BottomNav: 62px tabs + when cart is open, 52px cart bar = 114px total
// Floating pill nav total height
const NAV_HEIGHT = 112;

/** Support helpline — hidden when live order tracking widget is active */
export default function SupportFab() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [cartBarVisible, setCartBarVisible] = useState(false);
  const bottomOffset = NAV_HEIGHT + 16;
  const { style, onDragStart, isDragging, didDrag } = useDraggableFab(bottomOffset, 16, "otw_fab_support");

  useEffect(() => {
    const check = () => {
      setHasActiveOrder(!!getActiveOrderId());
      try {
        const cart = localStorage.getItem("otw_cart");
        setCartBarVisible(!!cart && JSON.parse(cart).length > 0);
      } catch { setCartBarVisible(false); }
    };
    check();
    window.addEventListener("otw:active-order", check);
    const t = setInterval(check, 2000);
    return () => { window.removeEventListener("otw:active-order", check); clearInterval(t); };
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;
  if (pathname.startsWith("/track/")) return null;
  if (hasActiveOrder) return null;

  const fabStyle = { ...style, bottom: `max(${bottomOffset}px, env(safe-area-inset-bottom))` };

  const handleTap = () => {
    if (!isDragging && !didDrag()) setExpanded(v => !v);
  };

  return (
    <div style={fabStyle} className="otw-floating-fab">
      {expanded && (
        <div className="otw-fab-popup">
          <button
            onClick={() => setExpanded(false)}
            className="otw-fab-popup__close"
            aria-label="Close"
          >
            <X size={14} />
          </button>
          <div className="otw-fab-popup__label">{COMPANY_NAME}</div>
          <p className="otw-fab-popup__text">{COMPANY_BLURB}</p>
          <a href={SUPPORT_TEL} className="otw-fab-popup__cta">
            <Phone size={17} /> {SUPPORT_PHONE_DISPLAY}
          </a>
          <Link href="/about" className="otw-fab-popup__link">
            <Info size={14} /> Learn about us
          </Link>
        </div>
      )}

      <button
        type="button"
        className="otw-fab otw-fab--support"
        aria-label="Call for enquiry"
        onPointerDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
        onClick={handleTap}
      >
        <div className="otw-fab__pulse" />
        <Phone size={22} />
      </button>
    </div>
  );
}
