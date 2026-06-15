"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Truck, MapPin, ChevronDown } from "lucide-react";
import { useApp } from "@/lib/context";
import toast from "react-hot-toast";
import AuthModal from "./AuthModal";
import { LocationModal, useDeliveryLocation } from "./LocationModal";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
];

export default function Navbar() {
  const { user, profile, cartCount } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const { location, saveLocation } = useDeliveryLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide navbar on admin/delivery pages
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
    setMobileOpen(false);
  };

  return (
    <>
      <style>{`
        .nav-inner {
          display: flex;
          align-items: center;
          height: 60px;
          justify-content: space-between;
          gap: 8px;
        }
        .nav-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .nav-location-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1.5px solid rgba(1,53,251,0.2);
          background: #EEF1FF;
          color: #0135FB;
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.76rem;
          transition: all 0.2s;
          white-space: nowrap;
          max-width: 160px;
          overflow: hidden;
        }
        .nav-location-pill:hover { background: #E0E7FF; }
        .nav-location-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* On mobile: show icon-only location pill (no text) */
        @media (max-width: 480px) {
          .nav-location-pill {
            padding: 6px 8px;
            max-width: unset;
            width: 34px;
            height: 34px;
            border-radius: 10px;
            justify-content: center;
          }
          .nav-location-text { display: none; }
          .nav-location-chevron { display: none; }
        }
      `}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "3px solid var(--primary)",
        boxShadow: "none",
      }}>
        <div className="otw-container nav-inner">

          {/* Left: Hamburger (mobile) + Logo */}
          <div className="nav-left">
            <button className="mobile-only" onClick={() => setMobileOpen(!mobileOpen)} style={{
              width: 36, height: 36, border: "none", background: "var(--accent)",
              borderRadius: "10px", color: "var(--primary)", cursor: "pointer",
              display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "10px",
                background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 10px rgba(0,74,173,0.3)", flexShrink: 0,
              }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                {/* Head */}
                <circle cx="16" cy="5.5" r="3" fill="white"/>
                {/* Body/Torso */}
                <path d="M16 9 L13.5 17 L18.5 17 Z" fill="white"/>
                {/* Left arm swinging forward */}
                <path d="M13.5 11 L10 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                {/* Right arm swinging back */}
                <path d="M18.5 11 L22 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                {/* Left leg forward */}
                <path d="M14 17 L11 23 L9 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Right leg back */}
                <path d="M18 17 L20 22 L22 26" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              </div>
              <div className="hide-mobile">
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)", lineHeight: 1.1 }}>ONN D A WAY</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.05em" }}>COFFEE</div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="desktop-only">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={{
                padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
                fontWeight: 600, fontSize: "0.88rem", transition: "all 0.15s",
                background: pathname === l.href ? "var(--accent-2)" : "transparent",
                color: pathname === l.href ? "var(--primary)" : "var(--text-mid)",
              }}>{l.label}</Link>
            ))}
            {profile?.role === "admin" && (
              <Link href="/admin" style={{ padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-mid)" }}>
                Admin
              </Link>
            )}
          </div>

          {/* Right: Location + Cart + Auth */}
          <div className="nav-right">

            {/* Location Pill — visible on all sizes, icon-only on xs mobile */}
            <button
              id="location-picker-btn"
              onClick={() => setLocationOpen(true)}
              className="nav-location-pill"
            >
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span className="nav-location-text">
                {location ? location : "Delivering to?"}
              </span>
              <ChevronDown size={11} className="nav-location-chevron" style={{ flexShrink: 0 }} />
            </button>

            {/* Cart */}
            <Link href="/cart" style={{ position: "relative", textDecoration: "none" }}>
              <div id="cart-button" style={{
                width: 36, height: 36, borderRadius: "10px", border: "none",
                background: "var(--accent-2)", color: "var(--primary)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShoppingCart size={17} />
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    background: "var(--primary)", color: "white",
                    width: 18, height: 18, borderRadius: "50%",
                    fontSize: "0.65rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid white",
                  }}>{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </div>
            </Link>

            {/* User / Auth */}
            {!mounted ? (
              <div style={{ width: 36, height: 36, background: "rgba(0,0,0,0.05)", borderRadius: "10px" }} />
            ) : user ? (
              <div style={{ position: "relative" }}>
                <button id="profile-button" onClick={() => setProfileOpen(!profileOpen)} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "4px 8px 4px 4px", borderRadius: "10px", border: "2px solid var(--primary)",
                  background: "white", cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--primary)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", flexShrink: 0,
                  }}>
                    {(profile as any)?.image ? (
                      <img src={(profile as any).image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-dark)" }} className="desktop-only">
                    {profile?.name?.split(" ")[0] || "User"}
                  </span>
                </button>
                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      background: "white", borderRadius: "12px",
                      border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
                      minWidth: 200, zIndex: 100, overflow: "hidden",
                    }}>
                      <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E7EB" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{profile?.name || "User"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{profile?.college || "Welcome"}</div>
                      </div>
                      {[
                        { href: "/orders", icon: <ShoppingCart size={15} />, label: "My Orders" },
                        ...(profile?.role === "admin" ? [{ href: "/admin", icon: <LayoutDashboard size={15} />, label: "Admin Panel" }] : []),
                        ...(profile?.role === "delivery" ? [{ href: "/delivery/dashboard", icon: <Truck size={15} />, label: "Deliveries" }] : []),
                      ].map(item => (
                        <Link key={item.label} href={item.href} onClick={() => setProfileOpen(false)} style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "12px 16px", textDecoration: "none",
                          color: "var(--text-dark)", fontSize: "0.85rem", fontWeight: 500,
                          transition: "background 0.15s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent-2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          {item.icon}{item.label}
                        </Link>
                      ))}
                      <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "12px 16px", width: "100%", border: "none",
                        background: "transparent", cursor: "pointer",
                        color: "var(--error)", fontSize: "0.85rem", fontWeight: 500,
                        borderTop: "1px solid #E5E7EB", transition: "background 0.15s",
                        fontFamily: "inherit",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <LogOut size={15} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="nav-auth-btn"
                onClick={() => setShowAuthModal(true)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  padding: "7px 10px", borderRadius: "10px",
                  border: "2px solid var(--primary)",
                  background: "var(--primary)", color: "white",
                  cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 700, fontSize: "0.82rem",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                <User size={15} />
                <span className="desktop-only">Log in</span>
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

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 998,
            backdropFilter: "blur(2px)",
          }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: "280px",
            background: "white", zIndex: 999, padding: "24px",
            boxShadow: "8px 0 32px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>ONN DA WAY</div>
              <button onClick={() => setMobileOpen(false)} style={{
                width: 36, height: 36, border: "none", background: "var(--accent-2)",
                borderRadius: "10px", color: "var(--primary)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{
                  padding: "14px 16px", borderRadius: "10px", textDecoration: "none",
                  fontWeight: 600, fontSize: "0.95rem",
                  color: pathname === l.href ? "var(--primary)" : "var(--text-mid)",
                  background: pathname === l.href ? "var(--accent-2)" : "transparent",
                }}>{l.label}</Link>
              ))}
              {profile?.role === "admin" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} style={{
                  padding: "14px 16px", borderRadius: "10px", textDecoration: "none",
                  fontWeight: 600, fontSize: "0.95rem", color: "var(--text-mid)",
                  display: "flex", alignItems: "center", gap: "10px",
                }}><LayoutDashboard size={18} /> Admin</Link>
              )}
            </div>

            {user ? (
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px", marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", background: "var(--primary)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.95rem", fontWeight: 700, overflow: "hidden",
                  }}>
                    {(profile as any)?.image ? (
                      <img src={(profile as any).image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{profile?.name || "User"}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{profile?.college || ""}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={{
                  display: "flex", alignItems: "center", gap: "8px", width: "100%",
                  padding: "12px 16px", borderRadius: "10px", border: "none",
                  background: "#FEE2E2", color: "var(--error)", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.9rem", fontFamily: "inherit",
                }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px", marginTop: "auto" }}>
                <button
                  id="mobile-drawer-auth-btn"
                  onClick={() => { setMobileOpen(false); setShowAuthModal(true); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    width: "100%", padding: "13px 16px", borderRadius: "12px",
                    border: "2px solid var(--primary)",
                    background: "var(--primary)", color: "white",
                    cursor: "pointer", fontFamily: "inherit",
                    fontWeight: 700, fontSize: "0.95rem",
                    transition: "all 0.15s",
                  }}
                >
                  <User size={18} />
                  Login / Sign Up
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
