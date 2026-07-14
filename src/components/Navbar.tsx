"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, LogOut, LayoutDashboard, Truck, MapPin, ChevronDown, Menu, X } from "lucide-react";
import { useApp } from "@/lib/context";
import toast from "react-hot-toast";
import AuthModal from "./AuthModal";
import { LocationModal, useDeliveryLocation } from "./LocationModal";
import WalkingLoader from "./WalkingLoader";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
];

export default function Navbar() {
  const { user, profile, cartCount, isSidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const [cartAnim, setCartAnim] = useState(false);
  const { location, saveLocation } = useDeliveryLocation();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && cartCount > prevCount) {
      setCartAnim(true);
      setTimeout(() => setCartAnim(false), 600);
    }
    setPrevCount(cartCount);
  }, [cartCount, mounted]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const handleLogout = async () => {
    localStorage.removeItem("otw_user_id");
    localStorage.removeItem("otw_cart");
    localStorage.removeItem("otw_profile");
    localStorage.removeItem("otw_demo_profile");
    localStorage.removeItem("otw_demo_banner");
    toast.success("Logged out successfully");
    router.push("/");
    setProfileOpen(false);
  };

  const showSidebarToggle = !pathname.startsWith("/admin") && !pathname.startsWith("/delivery");

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <style>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          height: var(--nav-height, 68px);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          height: var(--nav-height, 68px);
          justify-content: space-between;
          gap: 8px;
          padding: 0 12px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Sidebar toggle */
        .nav-sidebar-toggle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid transparent;
          background: transparent;
          color: var(--text-mid);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }
        .nav-sidebar-toggle:hover {
          background: var(--accent-2);
          color: var(--primary);
          border-color: rgba(1,53,251,0.15);
        }
        .nav-sidebar-toggle.active {
          background: var(--accent-2);
          color: var(--primary);
          border-color: rgba(1,53,251,0.2);
        }
        /* On mobile, hamburger is hidden — sidebar opens via drawer */
        @media (max-width: 1023px) {
          .nav-sidebar-toggle {
            display: flex;
          }
        }

        /* Logo */
        .nav-logo-wrap {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
          position: relative;
        }
        .nav-logo-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
          flex-shrink: 0;
        }
        .nav-logo-wrap:hover .nav-logo-icon {
          transform: scale(1.08) rotate(-3deg);
        }
        .nav-logo-text {
          font-weight: 900;
          font-size: 1.05rem;
          color: var(--primary);
          line-height: 1;
          letter-spacing: -0.03em;
          font-family: 'Outfit', sans-serif;
        }
        .nav-logo-sub {
          font-size: 0.58rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* Nav links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .nav-link {
          position: relative;
          padding: 8px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.87rem;
          transition: all 0.18s;
          color: var(--text-muted);
          letter-spacing: 0.1px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 14px;
          right: 14px;
          height: 2px;
          border-radius: 999px;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }
        .nav-link:hover {
          color: var(--text-dark);
          background: rgba(1,53,251,0.04);
        }
        .nav-link.active {
          color: var(--primary);
          background: var(--accent-2);
        }
        .nav-link.active::after {
          transform: scaleX(1);
        }

        /* Location pill */
        .nav-location-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 11px;
          border-radius: 10px;
          border: 1.5px solid var(--border-subtle, rgba(1,53,251,0.12));
          background: var(--accent-2);
          color: var(--primary);
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.76rem;
          transition: all 0.2s;
          white-space: nowrap;
          max-width: 155px;
          overflow: hidden;
        }
        .nav-location-pill:hover {
          background: var(--accent-3, #E0E9FF);
          box-shadow: 0 2px 8px rgba(1,53,251,0.1);
        }
        .nav-location-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .nav-location-pill {
            padding: 7px 8px;
            max-width: unset;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            justify-content: center;
          }
          .nav-location-text { display: none; }
          .nav-location-chevron { display: none; }
        }

        /* Cart button */
        .nav-cart-btn {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: var(--accent-2);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .nav-cart-btn:hover {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(1,53,251,0.3);
        }
        .nav-cart-btn.bounce {
          animation: cart-bounce 0.55s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cart-bounce {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.28) rotate(-6deg); }
          60% { transform: scale(0.93) rotate(3deg); }
        }
        .nav-cart-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--primary);
          color: white;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          font-size: 0.62rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(1,53,251,0.35);
          transition: background 0.2s;
        }
        .nav-cart-btn:hover .nav-cart-badge {
          background: var(--primary-dark);
        }

        /* Auth / profile button */
        .nav-auth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 10px;
          border: 2px solid var(--primary);
          background: var(--primary);
          color: white;
          cursor: pointer;
          font-family: inherit;
          font-weight: 800;
          font-size: 0.82rem;
          white-space: nowrap;
          transition: all 0.18s;
          letter-spacing: 0.2px;
        }
        .nav-auth-btn:hover {
          background: var(--primary-dark);
          border-color: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(1,53,251,0.3);
        }
        .nav-profile-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px 4px 4px;
          border-radius: 11px;
          border: 2px solid var(--accent-2);
          background: white;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.06));
        }
        .nav-profile-btn:hover {
          border-color: var(--border-subtle, rgba(1,53,251,0.12));
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(1,53,251,0.08));
        }
        .nav-profile-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--primary-gradient, linear-gradient(135deg,#0135FB,#2A55FF));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          overflow: hidden;
          flex-shrink: 0;
        }
        .nav-profile-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        /* Profile dropdown */
        .nav-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border-light, #E2E8F0);
          box-shadow: 0 16px 48px rgba(1,53,251,0.14), 0 4px 12px rgba(0,0,0,0.06);
          min-width: 210px;
          z-index: 100;
          overflow: hidden;
          animation: fadeUp 0.2s ease both;
        }
        .nav-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-light, #E2E8F0);
          background: linear-gradient(135deg, var(--accent-2), white);
        }
        .nav-dropdown-name {
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-dark);
        }
        .nav-dropdown-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          text-decoration: none;
          color: var(--text-dark);
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.15s;
          border: none;
          background: transparent;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
        }
        .nav-dropdown-item:hover { background: var(--accent-2); }
        .nav-dropdown-item.danger { color: var(--error); }
        .nav-dropdown-item.danger:hover { background: var(--error-light, #FEE2E2); }
        .nav-dropdown-divider {
          height: 1px;
          background: var(--border-light, #E2E8F0);
        }
      `}</style>

      <nav className="nav-root">
        <div className="nav-inner">

          {/* Left: Sidebar toggle + Logo */}
          <div className="nav-left">
            {showSidebarToggle && (
              <button
                className={`nav-sidebar-toggle${isSidebarOpen ? " active" : ""}`}
                onClick={() => setSidebarOpen?.(!isSidebarOpen)}
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <Link href="/" className="nav-logo-wrap">
              <WalkingLoader size={36} color="#0135FB" />
              <div className="hide-mobile">
                <div className="nav-logo-text">ONN DA WAY</div>
              </div>
            </Link>
          </div>

          {/* Center: Nav Links */}
          <nav className="nav-links desktop-only">
            {NAV_LINKS.map(l => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}`}>
                  {l.label}
                </Link>
              );
            })}
            {user && (
              <Link href="/profile" className={`nav-link${pathname.startsWith("/profile") ? " active" : ""}`}>
                Profile
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link href="/admin" className={`nav-link${pathname.startsWith("/admin") ? " active" : ""}`}>
                Admin
              </Link>
            )}
          </nav>

          {/* Right: Location + Cart + Auth */}
          <div className="nav-right">
            {/* Location Pill */}
            <button id="location-picker-btn" onClick={() => setLocationOpen(true)} className="nav-location-pill">
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span className="nav-location-text">{location || "Delivering to?"}</span>
              <ChevronDown size={11} className="nav-location-chevron" style={{ flexShrink: 0 }} />
            </button>

            {/* Cart */}
            <Link href="/cart" className={`nav-cart-btn${cartAnim ? " bounce" : ""}`}>
              <ShoppingCart size={18} strokeWidth={2.2} />
              {cartCount > 0 && (
                <span className="nav-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
              )}
            </Link>

            {/* User / Auth */}
            {!mounted ? (
              <div style={{ width: 38, height: 38, background: "rgba(0,0,0,0.05)", borderRadius: 11 }} />
            ) : user ? (
              <div style={{ position: "relative" }}>
                <button id="profile-button" onClick={() => setProfileOpen(!profileOpen)} className="nav-profile-btn">
                  <div className="nav-profile-avatar">
                    {profile?.image ? (
                      <img src={profile.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : profile?.gender ? (
                      <img src={`/avatars/${profile.gender}.png`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <span className="nav-profile-name desktop-only" style={{ display: "block" }}>
                    {profile?.name?.split(" ")[0] || "User"}
                  </span>
                </button>

                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div className="nav-dropdown">
                      <div className="nav-dropdown-header">
                        <div className="nav-dropdown-name">{profile?.name || "User"}</div>
                        <div className="nav-dropdown-sub">{profile?.college || "Welcome back 👋"}</div>
                      </div>
                      {[
                        { href: "/orders", icon: <ShoppingCart size={15} />, label: "My Orders" },
                        ...(profile?.role === "admin" ? [{ href: "/admin", icon: <LayoutDashboard size={15} />, label: "Admin Panel" }] : []),
                        ...(profile?.role === "delivery" ? [{ href: "/delivery/dashboard", icon: <Truck size={15} />, label: "Deliveries" }] : []),
                      ].map(item => (
                        <Link key={item.label} href={item.href} onClick={() => setProfileOpen(false)} className="nav-dropdown-item">
                          {item.icon} {item.label}
                        </Link>
                      ))}
                      <div className="nav-dropdown-divider" />
                      <button onClick={handleLogout} className="nav-dropdown-item danger">
                        <LogOut size={15} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button id="nav-auth-btn" onClick={() => setShowAuthModal(true)} className="nav-auth-btn">
                <User size={15} />
                <span className="desktop-only" style={{ display: "block" }}>Log in</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(uid) => {
            localStorage.setItem("otw_user_id", uid);
            window.location.reload();
          }}
        />
      )}

      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSave={saveLocation}
      />
    </>
  );
}
