"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Package,
  Heart,
  ShoppingCart,
  MapPin,
  Tag,
  Settings,
  HelpCircle,
  ShieldCheck,
  Box,
  ClipboardList,
  User,
  LogOut,
  Home,
  UtensilsCrossed,
  ChevronRight,
  Truck,
} from "lucide-react";
import { useApp } from "@/lib/context";
import toast from "react-hot-toast";
import AuthModal from "./AuthModal";

export default function GlobalSidebar() {
  const { user, profile, isSidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50; 

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    if (isLeftSwipe && isSidebarOpen) {
      setSidebarOpen(false);
    }
  }

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = async () => {
    localStorage.removeItem("otw_user_id");
    localStorage.removeItem("otw_cart");
    localStorage.removeItem("otw_profile");
    toast.success("Logged out successfully");
    router.push("/");
    setProfileOpen(false);
    window.location.reload();
  };

  if (pathname.startsWith("/delivery") || pathname.startsWith("/admin")) return null;

  return (
    <>
      <style>{`
        /* ── Sidebar container ── */
        .gsb-root {
          width: var(--sidebar-width, 260px);
          height: calc(100vh - var(--nav-height, 68px));
          position: fixed;
          top: var(--nav-height, 68px);
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg, rgba(245,247,255,0.98));
          border-right: 1px solid var(--border-subtle, rgba(1,53,251,0.1));
          padding: 16px 10px 16px;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 90;
          gap: 6px;
          flex-shrink: 0;
          box-shadow: 2px 0 24px rgba(1,53,251,0.04);
          scrollbar-width: none;
        }
        .gsb-root::-webkit-scrollbar { display: none; }



        /* ── Logo strip at top ── */
        .gsb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px 14px;
          border-bottom: 1px solid var(--border-light, #E2E8F0);
          margin-bottom: 6px;
          flex-shrink: 0;
        }
        .gsb-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(1,53,251,0.3);
          flex-shrink: 0;
        }
        .gsb-brand-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 0.88rem;
          color: var(--primary);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .gsb-brand-sub {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 1px;
        }
        
        /* ── Mobile Sidebar Styles ── */
        @media (max-width: 1023px) {
          .gsb-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 280px !important;
            height: 100vh !important;
            display: flex !important;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001 !important;
            visibility: hidden;
          }
          .gsb-root.mobile-open {
            transform: translateX(0) !important;
            visibility: visible;
          }
          .gsb-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.28s;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          .gsb-overlay.mobile-open {
            opacity: 1;
            pointer-events: auto;
          }
        }
        
        /* Desktop hide — only applies on large screens */
        @media (min-width: 1024px) {
          .gsb-root.desktop-closed {
            display: none !important;
          }
          .app-sidebar-slot.desktop-closed {
            width: 0 !important;
          }
        }

        /* ── Section label ── */
        .gsb-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          padding: 10px 10px 6px;
          margin-top: 6px;
        }
        .gsb-section-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          flex-shrink: 0;
        }

        /* ── Nav item ── */
        .gsb-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 10px;
          border-radius: 11px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.83rem;
          color: var(--text-muted);
          transition: all 0.18s ease;
          position: relative;
          letter-spacing: 0.1px;
          overflow: hidden;
        }
        .gsb-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          border-radius: 0 3px 3px 0;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          transition: height 0.2s ease;
        }
        .gsb-item:hover {
          color: var(--text-dark);
          background: var(--sidebar-item-hover, rgba(1,53,251,0.05));
        }
        .gsb-item:hover::before { height: 60%; }
        .gsb-item.active {
          color: var(--primary);
          background: var(--sidebar-item-active, rgba(1,53,251,0.08));
          font-weight: 800;
        }
        .gsb-item.active::before { height: 70%; }

        .gsb-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s;
          background: transparent;
          color: inherit;
        }
        .gsb-item.active .gsb-item-icon {
          background: var(--primary);
          color: white;
          box-shadow: 0 3px 10px rgba(1,53,251,0.28);
        }
        .gsb-item:hover:not(.active) .gsb-item-icon {
          background: var(--accent-2);
          color: var(--primary);
        }
        .gsb-item-label { flex: 1; min-width: 0; }
        .gsb-item-arrow {
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          color: var(--primary);
          transform: translateX(-4px);
        }
        .gsb-item:hover .gsb-item-arrow,
        .gsb-item.active .gsb-item-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Admin badge ── */
        .gsb-admin-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 999px;
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-left: auto;
          flex-shrink: 0;
        }

        /* ── Spacer ── */
        .gsb-spacer { flex: 1; min-height: 16px; }

        /* ── User card ── */
        .gsb-user-card {
          position: relative;
          border-radius: 14px;
          background: white;
          border: 1px solid var(--border-light, #E2E8F0);
          box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.06));
          overflow: hidden;
          margin-top: 8px;
          flex-shrink: 0;
        }
        .gsb-user-card-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gsb-user-card-inner:hover { background: var(--accent-2); }
        .gsb-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(1,53,251,0.25);
        }
        .gsb-user-info { flex: 1; min-width: 0; }
        .gsb-user-name {
          font-size: 0.83rem;
          font-weight: 900;
          color: var(--text-dark);
          text-transform: uppercase;
          letter-spacing: 0.1px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gsb-user-sub {
          font-size: 0.64rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 1px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gsb-user-more {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .gsb-user-card-inner:hover .gsb-user-more {
          background: var(--primary);
          color: white;
        }

        /* User popup */
        .gsb-user-popup {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border-radius: 14px;
          border: 1px solid var(--border-light, #E2E8F0);
          box-shadow: 0 16px 48px rgba(1,53,251,0.14), 0 4px 12px rgba(0,0,0,0.06);
          z-index: 100;
          overflow: hidden;
          animation: fadeUp 0.18s ease both;
        }
        .gsb-popup-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          text-decoration: none;
          color: var(--text-dark);
          font-size: 0.84rem;
          font-weight: 700;
          transition: background 0.15s;
          border: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
        }
        .gsb-popup-item:hover { background: var(--accent-2); }
        .gsb-popup-item.danger { color: var(--error); }
        .gsb-popup-item.danger:hover { background: var(--error-light, #FEE2E2); }
        .gsb-popup-divider { height: 1px; background: var(--border-light, #E2E8F0); }

        /* Login button */
        .gsb-login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          color: white;
          border: none;
          border-radius: 13px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(1,53,251,0.3);
          margin-top: 8px;
          flex-shrink: 0;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .gsb-login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(1,53,251,0.4);
        }
      `}</style>

      {/* Mobile Overlay */}
      <div 
        className={`gsb-overlay ${isSidebarOpen ? 'mobile-open' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      <div className={`app-sidebar-slot ${isSidebarOpen ? '' : 'desktop-closed'}`}>
        <aside 
          className={`gsb-root ${isSidebarOpen ? 'mobile-open' : 'desktop-closed'}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >

        {/* Brand strip */}
        <div className="gsb-brand">
          <div className="gsb-brand-icon">
            <svg width="19" height="19" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="5.5" r="3" fill="white"/>
              <path d="M16 9 L13.5 17 L18.5 17 Z" fill="white"/>
              <path d="M13.5 11 L10 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 11 L22 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 17 L11 23 L9 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 17 L20 22 L22 26" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="gsb-brand-text">ONN DA WAY</div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: "1.3rem",
              lineHeight: 1,
            }}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* SHOP GROUP */}
        <div className="gsb-section-label">
          <div className="gsb-section-dot" />
          Shop
        </div>
        <SidebarItem href="/" icon={<Home size={17} />} label="Home" active={pathname === "/"} />
        <SidebarItem href="/menu" icon={<UtensilsCrossed size={17} />} label="Menu" active={pathname.startsWith("/menu")} />
        <SidebarItem href="/orders" icon={<Package size={17} />} label="My Orders" active={pathname.startsWith("/orders")} />
        <SidebarItem href="/wishlist" icon={<Heart size={17} />} label="Wishlist" active={pathname.startsWith("/wishlist")} />
        <SidebarItem href="/cart" icon={<ShoppingCart size={17} />} label="Cart" active={pathname.startsWith("/cart")} />

        {/* ACCOUNT GROUP */}
        <div className="gsb-section-label">
          <div className="gsb-section-dot" />
          Account
        </div>
        <SidebarItem href="/orders" icon={<MapPin size={17} />} label="Track Order" active={pathname.startsWith("/orders")} />
        {mounted && (profile?.role === "delivery" || (typeof window !== "undefined" && !!localStorage.getItem("otw_delivery_id"))) && (
          <SidebarItem href="/delivery/dashboard" icon={<Truck size={17} />} label="Deliveries" active={pathname.startsWith("/delivery")} />
        )}
        <SidebarItem href="/offers" icon={<Tag size={17} />} label="Offers" active={pathname.startsWith("/offers")} />
        <SidebarItem href="/support" icon={<HelpCircle size={17} />} label="Help & Support" active={pathname.startsWith("/support")} />

        {/* ADMIN GROUP */}
        {profile?.role === "admin" && (
          <>
            <div className="gsb-section-label">
              <div className="gsb-section-dot" />
              Admin
              <span className="gsb-admin-badge">Panel</span>
            </div>
            <SidebarItem href="/admin" icon={<ShieldCheck size={17} />} label="Dashboard" active={pathname === "/admin"} />
            <SidebarItem href="/admin/menu" icon={<Box size={17} />} label="Products" active={pathname.startsWith("/admin/menu")} />
            <SidebarItem href="/admin/offers" icon={<Tag size={17} />} label="Offers" active={pathname.startsWith("/admin/offers")} />
            <SidebarItem href="/admin/orders" icon={<ClipboardList size={17} />} label="Orders" active={pathname.startsWith("/admin/orders")} />
          </>
        )}

        <div className="gsb-spacer" />

        {/* User Card */}
        {mounted && user ? (
          <div className="gsb-user-card">
            <Link href="/profile" className="gsb-user-card-inner" style={{ textDecoration: "none" }}>
              <div className="gsb-user-avatar">
                {profile?.image
                  ? <img src={profile.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (profile?.name?.[0]?.toUpperCase() || "U")}
              </div>
              <div className="gsb-user-info">
                <div className="gsb-user-name">{profile?.name || "User"}</div>
                <div className="gsb-user-sub">{profile?.phone || profile?.college || "Campus Member"}</div>
              </div>
              <div className="gsb-user-more">
                <ChevronRight size={15} />
              </div>
            </Link>
          </div>
        ) : mounted ? (
          <button onClick={() => setShowAuthModal(true)} className="gsb-login-btn">
            <User size={17} /> Log In to Continue
          </button>
        ) : null}
      </aside>
      </div>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(uid) => {
            localStorage.setItem("otw_user_id", uid);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function SidebarItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href} className={`gsb-item${active ? " active" : ""}`}>
      <div className="gsb-item-icon">{icon}</div>
      <span className="gsb-item-label">{label}</span>
      <ChevronRight size={13} className="gsb-item-arrow" />
    </Link>
  );
}
