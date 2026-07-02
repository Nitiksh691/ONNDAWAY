"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useApp } from "@/lib/context";

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useApp();

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderTab = (href: string, label: string, Icon: any) => {
    const active = isActive(href);
    return (
      <Link href={href} className={`bnav-tab ${active ? "active" : ""}`}>
        <div className="bnav-icon-wrapper">
          <Icon size={21} className="bnav-icon" strokeWidth={active ? 2.5 : 1.8} />
        </div>
        <span className="bnav-label">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <style>{`
        /* Hidden on desktop */
        @media (min-width: 768px) {
          .bnav-container { display: none !important; }
        }

        .bnav-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 900;
          padding: 0 20px max(12px, env(safe-area-inset-bottom));
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .bnav-bar-wrapper {
          position: relative;
          width: 100%;
          max-width: 420px;
          height: 68px;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 26px;
          filter: drop-shadow(0 8px 24px rgba(1, 53, 251, 0.18)) drop-shadow(0 2px 8px rgba(0,0,0,0.08));
        }

        .bnav-bar {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 26px;
          border: 1.5px solid rgba(1, 53, 251, 0.08);
          -webkit-mask-image: radial-gradient(circle 36px at 50% 5px, transparent 100%, black 100%);
          mask-image: radial-gradient(circle 36px at 50% 5px, transparent 100%, black 100%);
          z-index: 1;
        }

        .bnav-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
          padding: 0 12px;
        }

        .bnav-group {
          display: flex;
          align-items: center;
          width: 42%;
          justify-content: space-around;
        }

        .bnav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #94A3B8;
          transition: all 0.22s ease;
          width: 52px;
          padding: 6px 0;
          border-radius: 14px;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .bnav-tab:hover {
          color: #64748B;
        }

        .bnav-tab.active {
          color: var(--primary);
          background: rgba(1, 53, 251, 0.07);
        }

        .bnav-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
        }

        .bnav-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .bnav-tab.active .bnav-icon {
          transform: translateY(-2px) scale(1.05);
          filter: drop-shadow(0 3px 6px rgba(1,53,251,0.28));
        }

        .bnav-label {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: all 0.22s ease;
        }

        /* Center Cart Button */
        .bnav-center-btn {
          position: absolute;
          left: 50%;
          top: -22px;
          transform: translateX(-50%);
          width: 58px;
          height: 58px;
          background: linear-gradient(135deg, var(--primary), #2A55FF);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 20px rgba(1,53,251,0.4), inset 0 2px 4px rgba(255,255,255,0.25);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
          pointer-events: auto;
          text-decoration: none;
          z-index: 3;
        }

        .bnav-center-btn:hover {
          transform: translateX(-50%) scale(1.08);
          box-shadow: 0 12px 28px rgba(1,53,251,0.5), inset 0 2px 4px rgba(255,255,255,0.25);
        }

        .bnav-center-btn:active {
          transform: translateX(-50%) scale(0.94);
        }

        .bnav-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          padding: 0 3px;
        }
      `}</style>

      <div className="bnav-container">
        <div className="bnav-bar-wrapper">
          <div className="bnav-bar" />

          <div className="bnav-content">
            <div className="bnav-group">
              {renderTab("/", "Home", Home)}
              {renderTab("/menu", "Menu", UtensilsCrossed)}
            </div>

            <div className="bnav-group">
              {renderTab("/orders", "Orders", ClipboardList)}
              {renderTab("/profile", "Profile", User)}
            </div>
          </div>

          <Link href="/cart" className="bnav-center-btn">
            <ShoppingBag size={23} strokeWidth={2.5} />
            {cartCount > 0 && (
              <div className="bnav-badge">{cartCount > 9 ? "9+" : cartCount}</div>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
