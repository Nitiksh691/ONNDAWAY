"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Truck } from "lucide-react";
import { useApp } from "@/lib/context";
import toast from "react-hot-toast";
import AuthModal from "./AuthModal";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cart", label: "Cart" },
];

export default function Navbar() {
  const { user, profile, cartCount } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect delivery personnel to their dashboard
  useEffect(() => {
    if (profile?.role === "delivery" && !pathname.startsWith("/delivery")) {
      router.push("/delivery/dashboard");
    }
  }, [profile, pathname, router]);

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
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "3px solid var(--primary)",
        boxShadow: "none",
      }}>
        <div className="otw-container" style={{ display: "flex", alignItems: "center", height: "60px", justifyContent: "space-between" }}>

          {/* Left: Hamburger (mobile) + Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="mobile-only" onClick={() => setMobileOpen(!mobileOpen)} style={{
              width: 38, height: 38, border: "none", background: "var(--accent)",
              borderRadius: "10px", color: "var(--primary)", cursor: "pointer",
              display: "none", alignItems: "center", justifyContent: "center",
            }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "10px",
                background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 10px rgba(0,74,173,0.3)",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="2.5" fill="white" />
                  <path d="M12 8.5 L9 12 L12 11 L15 12 Z" fill="white" />
                  <path d="M12 11 L10 16 M12 11 L14 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 16 L8.5 20 M14 16 L15.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary)", lineHeight: 1.1 }}>ONN D A WAY</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.05em" }}>COFFEE</div>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="desktop-only">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={{
                padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
                fontWeight: 600, fontSize: "0.88rem", transition: "all 0.15s",
                background: pathname === l.href ? "var(--accent)" : "transparent",
                color: pathname === l.href ? "var(--primary)" : "var(--text-mid)",
              }}>{l.label}</Link>
            ))}
            {profile?.role === "admin" && (
              <Link href="/admin" style={{ padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-mid)" }}>
                Admin
              </Link>
            )}
          </div>

          {/* Right: Cart + Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Cart */}
            <Link href="/cart" style={{ position: "relative", textDecoration: "none" }}>
              <div id="cart-button" style={{
                width: 38, height: 38, borderRadius: "10px", border: "none",
                background: "var(--accent)", color: "var(--primary)", cursor: "pointer",
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
              <div style={{ width: 120, height: 38, background: "rgba(0,0,0,0.05)", borderRadius: "10px" }} />
            ) : user ? (
              <div style={{ position: "relative" }}>
                <button id="profile-button" onClick={() => setProfileOpen(!profileOpen)} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 10px", borderRadius: "10px", border: "2px solid var(--primary)",
                  background: "white", cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--primary)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, overflow: "hidden"
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
                      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
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
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          {item.icon}{item.label}
                        </Link>
                      ))}
                      <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "12px 16px", width: "100%", border: "none",
                        background: "transparent", cursor: "pointer",
                        color: "var(--error)", fontSize: "0.85rem", fontWeight: 500,
                        borderTop: "1px solid var(--border)", transition: "background 0.15s",
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
                onClick={() => setShowAuthModal(true)} 
                className="otw-btn otw-btn-primary otw-btn-sm" 
                style={{ borderRadius: "10px", padding: "8px 16px", textTransform: "none", letterSpacing: 0 }}
              >
                Login / Sign Up
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
            window.location.reload(); // Quickest way to refresh context for demo
          }} 
        />
      )}

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
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>ONN D A WAY</div>
              <button onClick={() => setMobileOpen(false)} style={{
                width: 36, height: 36, border: "none", background: "var(--accent)",
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
                  background: pathname === l.href ? "var(--accent)" : "transparent",
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
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", background: "var(--primary)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.95rem", fontWeight: 700, overflow: "hidden"
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
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "auto" }}>
                <button 
                  onClick={() => { setMobileOpen(false); setShowAuthModal(true); }} 
                  className="otw-btn otw-btn-primary" 
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "10px" }}
                >
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
