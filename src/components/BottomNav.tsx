"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useApp } from "@/lib/context";
import { useState, useEffect, useRef } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount, profile } = useApp();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (cartCount > 0) return null;

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .bnav-container { display: none !important; }
        }

        .bnav-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 900;
          pointer-events: none;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          padding-bottom: max(14px, env(safe-area-inset-bottom));
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bnav-container.hidden {
          transform: translateY(120%);
        }

        .bnav-pill {
          width: 100%;
          max-width: 400px;
          height: 64px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow:
            0 -2px 0 rgba(0, 0, 0, 0.02),
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 6px;
          pointer-events: auto;
          position: relative;
        }

        .bnav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #94A3B8;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex: 1;
          height: 100%;
          border-radius: 22px;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }

        .bnav-tab:hover {
          color: #64748B;
        }

        .bnav-tab.active {
          color: #0135FB;
        }

        .bnav-tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 28px;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .bnav-tab.active .bnav-tab-icon {
          background: rgba(1, 53, 251, 0.1);
          transform: translateY(-2px);
        }

        .bnav-tab-label {
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
        }

        /* Active indicator dot */
        .bnav-tab.active::after {
          content: '';
          position: absolute;
          bottom: 8px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #0135FB;
        }

        /* Cart center button */
        .bnav-cart {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(145deg, #0135FB, #2A55FF);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          box-shadow:
            0 6px 20px rgba(1, 53, 251, 0.45),
            inset 0 1px 0 rgba(255,255,255,0.25);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }

        .bnav-cart:active {
          transform: scale(0.92);
        }

        .bnav-cart:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 10px 28px rgba(1, 53, 251, 0.55), inset 0 1px 0 rgba(255,255,255,0.25);
        }

        .bnav-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 19px;
          height: 19px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          padding: 0 3px;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }

        .bnav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .bnav-avatar-initial {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0135FB, #2A55FF);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.72rem;
        }

        .bnav-tab.active .bnav-avatar,
        .bnav-tab.active .bnav-avatar-initial {
          box-shadow: 0 0 0 2.5px #0135FB;
          transform: translateY(-2px);
        }
      `}</style>

      <div className={`bnav-container ${!isVisible ? "hidden" : ""}`}>
        <div className="bnav-pill">

          {/* Home */}
          <Link href="/" className={`bnav-tab ${isActive("/") ? "active" : ""}`}>
            <div className="bnav-tab-icon">
              <Home size={20} strokeWidth={isActive("/") ? 2.5 : 1.8} />
            </div>
            <span className="bnav-tab-label">Home</span>
          </Link>

          {/* Menu */}
          <Link href="/menu" className={`bnav-tab ${isActive("/menu") ? "active" : ""}`}>
            <div className="bnav-tab-icon">
              <UtensilsCrossed size={20} strokeWidth={isActive("/menu") ? 2.5 : 1.8} />
            </div>
            <span className="bnav-tab-label">Menu</span>
          </Link>

          {/* Cart — Center Bubble */}
          <Link href="/cart" className="bnav-cart">
            <ShoppingBag size={22} strokeWidth={2.5} />
            {cartCount > 0 && (
              <div className="bnav-badge">{cartCount > 9 ? "9+" : cartCount}</div>
            )}
          </Link>

          {/* Orders */}
          <Link href="/orders" className={`bnav-tab ${isActive("/orders") ? "active" : ""}`}>
            <div className="bnav-tab-icon">
              <ClipboardList size={20} strokeWidth={isActive("/orders") ? 2.5 : 1.8} />
            </div>
            <span className="bnav-tab-label">Orders</span>
          </Link>

          {/* Profile — with avatar */}
          <Link href="/profile" className={`bnav-tab ${isActive("/profile") ? "active" : ""}`}>
            <div className="bnav-tab-icon" style={{ background: isActive("/profile") ? "rgba(1,53,251,0.1)" : "transparent", transform: isActive("/profile") ? "translateY(-2px)" : "none" }}>
              {mounted && profile?.image ? (
                <img src={profile.image} alt="Profile" className="bnav-avatar" />
              ) : mounted && profile?.name ? (
                <div className="bnav-avatar-initial">
                  {profile.name[0].toUpperCase()}
                </div>
              ) : (
                <User size={20} strokeWidth={isActive("/profile") ? 2.5 : 1.8} />
              )}
            </div>
            <span className="bnav-tab-label">Profile</span>
          </Link>

        </div>
      </div>
    </>
  );
}
