"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useApp } from "@/lib/context";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount, profile } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;
  if (cartCount > 0) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const tabs = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/menu", label: "Menu", Icon: UtensilsCrossed },
    { href: "/orders", label: "Orders", Icon: ClipboardList },
    { href: "/profile", label: "Profile", Icon: User },
  ];

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .bnav-root { display: none !important; }
        }

        .bnav-root {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 900;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.07);
          display: flex;
          align-items: stretch;
          justify-content: space-around;
          height: 50px;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .bnav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #9ca3af;
          flex: 1;
          padding: 6px 4px 4px;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.18s;
          position: relative;
        }

        .bnav-tab.active {
          color: #0135FB;
        }

        .bnav-tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          position: relative;
        }

        /* Active indicator — tiny dot */
        .bnav-tab.active .bnav-dot {
          display: block;
        }
        .bnav-dot {
          display: none;
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #0135FB;
        }

        .bnav-tab-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          line-height: 1;
        }

        /* Center cart FAB */
        .bnav-cart-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          text-decoration: none;
        }

        .bnav-cart {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #0135FB;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          box-shadow: 0 4px 16px rgba(1,53,251,0.35);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }

        .bnav-cart:active {
          transform: scale(0.9);
          box-shadow: 0 2px 8px rgba(1,53,251,0.25);
        }

        .bnav-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 17px;
          height: 17px;
          background: #ef4444;
          color: white;
          font-size: 0.58rem;
          font-weight: 900;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          padding: 0 2px;
        }

        .bnav-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .bnav-avatar-init {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0135FB;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.68rem;
        }

        .bnav-tab.active .bnav-avatar,
        .bnav-tab.active .bnav-avatar-init {
          box-shadow: 0 0 0 2px #0135FB;
        }
      `}</style>

      <nav className="bnav-root" role="navigation" aria-label="Main navigation">
        {/* Home */}
        <Link href="/" className={`bnav-tab ${isActive("/") ? "active" : ""}`}>
          <div className="bnav-tab-icon">
            <Home size={21} strokeWidth={isActive("/") ? 2.5 : 1.8} />
            <span className="bnav-dot" />
          </div>
          <span className="bnav-tab-label">Home</span>
        </Link>

        {/* Menu */}
        <Link href="/menu" className={`bnav-tab ${isActive("/menu") ? "active" : ""}`}>
          <div className="bnav-tab-icon">
            <UtensilsCrossed size={21} strokeWidth={isActive("/menu") ? 2.5 : 1.8} />
            <span className="bnav-dot" />
          </div>
          <span className="bnav-tab-label">Menu</span>
        </Link>

        {/* Cart — center bubble */}
        <Link href="/cart" className="bnav-cart-wrap" aria-label="Cart">
          <div className="bnav-cart">
            <ShoppingBag size={20} strokeWidth={2.5} />
            {cartCount > 0 && (
              <div className="bnav-badge">{cartCount > 9 ? "9+" : cartCount}</div>
            )}
          </div>
        </Link>

        {/* Orders */}
        <Link href="/orders" className={`bnav-tab ${isActive("/orders") ? "active" : ""}`}>
          <div className="bnav-tab-icon">
            <ClipboardList size={21} strokeWidth={isActive("/orders") ? 2.5 : 1.8} />
            <span className="bnav-dot" />
          </div>
          <span className="bnav-tab-label">Orders</span>
        </Link>

        {/* Profile */}
        <Link href="/profile" className={`bnav-tab ${isActive("/profile") ? "active" : ""}`}>
          <div className="bnav-tab-icon">
            {mounted && profile?.image ? (
              <img src={profile.image} alt="Profile" className="bnav-avatar" />
            ) : mounted && profile?.name ? (
              <div className="bnav-avatar-init">{profile.name[0].toUpperCase()}</div>
            ) : (
              <User size={21} strokeWidth={isActive("/profile") ? 2.5 : 1.8} />
            )}
            <span className="bnav-dot" />
          </div>
          <span className="bnav-tab-label">Profile</span>
        </Link>
      </nav>
    </>
  );
}
