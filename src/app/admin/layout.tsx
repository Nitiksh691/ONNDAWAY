"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSSEWithFallback } from "@/lib/useSSEWithFallback";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "@/lib/context";
import {
  LayoutDashboard,
  Coffee,
  ShoppingBag,
  Tag,
  LogOut,
  Menu as MenuIcon,
  X,
  Truck,
  Users,
  DollarSign,
  Lock,
  AlertCircle,
  Bell,
  Store,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/lib/constants";
import AdminBottomNav from "@/components/AdminBottomNav";

function playAlarmBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playTone(880, 0,    0.18);
    playTone(1100, 0.22, 0.18);
    playTone(1320, 0.44, 0.28);
    playTone(880, 0.85,  0.18);
    playTone(1100, 1.07, 0.18);
    playTone(1320, 1.29, 0.28);
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
    audio.play().catch(() => {});
  } catch (e) {}
}

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/menu", label: "Menu Management", icon: <Coffee size={18} /> },
  { href: "/admin/orders", label: "Live Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/customers", label: "App Customers", icon: <Users size={18} /> },
  { href: "/admin/interns", label: "Interns", icon: <ClipboardList size={18} /> },
  { href: "/admin/expenses", label: "Expenses", icon: <DollarSign size={18} /> },
  { href: "/admin/coupons", label: "Coupons", icon: <Tag size={18} /> },
  { href: "/admin/settings", label: "Settings", icon: <LayoutDashboard size={18} /> },
];

/**
 * AdminPasscodeModal
 *
 * A professional Radix Dialog that gates admin access behind a server-validated
 * passcode. The passcode is never compared client-side — it is sent to
 * /api/admin/auth, which reads from process.env.ADMIN_PASSCODE.
 */
function AdminPasscodeModal({ onSuccess }: { onSuccess: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter the admin passcode.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        localStorage.setItem(STORAGE_KEYS.adminAuthorized, "true");
        onSuccess();
      } else {
        setError("Incorrect passcode. Access denied.");
        setPasscode("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    toast.error("Admin access cancelled.");
    router.push("/");
  };

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 9998,
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            width: "100%",
            maxWidth: 420,
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            animation: "admin-modal-in 0.25s cubic-bezier(0.16,1,0.3,1) both",
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <style>{`
            @keyframes admin-modal-in {
              from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
              to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #0055ff, #0033cc)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 8px 24px rgba(0,85,255,0.4)",
              }}
            >
              <Lock size={28} color="white" />
            </div>
            <Dialog.Title
              style={{
                fontWeight: 900,
                fontSize: "1.5rem",
                color: "#fff",
                marginBottom: 8,
                letterSpacing: "-0.01em",
              }}
            >
              Admin Access
            </Dialog.Title>
            <Dialog.Description style={{ color: "#e4e4e7", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Enter the admin passcode to access the ONN D A WAY control panel.
            </Dialog.Description>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label
                htmlFor="admin-passcode"
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#e4e4e7",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Passcode
              </label>
              <input
                id="admin-passcode"
                ref={inputRef}
                type="password"
                placeholder="••••••••••"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#111",
                  border: `1px solid ${error ? "#ef4444" : "#3f3f46"}`,
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  letterSpacing: "0.15em",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  if (!error) e.currentTarget.style.borderColor = "#0055ff";
                }}
                onBlur={(e) => {
                  if (!error) e.currentTarget.style.borderColor = "#3f3f46";
                }}
              />
              {/* Error message */}
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    color: "#ef4444",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "#27272a",
                  color: "#e4e4e7",
                  border: "1px solid #3f3f46",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#3f3f46")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#27272a")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "13px",
                  background: loading ? "#1a3a99" : "linear-gradient(135deg, #0055ff, #0033cc)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(0,85,255,0.35)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Enter Admin
                  </>
                )}
              </button>
            </div>
          </form>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Main admin layout — renders the sidebar + content area. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminStats, setAdminStats] = useState<any>(null);
  const prevPendingRef = useRef(0);

  useEffect(() => {
    const isAdmin =
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEYS.adminAuthorized) === "true";

    if (isAdmin) {
      setAuthorized(true);
    } else {
      setShowPasscodeModal(true);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;

    // Fetch stats for the sidebar
    fetch("/api/admin/analytics")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.summary) {
           setAdminStats({
              orders: data.summary.totalOrders,
              revenue: data.summary.totalRevenue,
              users: data.summary.uniqueUsers
           });
        }
      })
      .catch(() => {});

    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/orders?status=placed");
        if (res.ok) {
          const data = await res.json();
          const unconfirmed = data.filter((o: any) => o.status === "placed").length;
          if (unconfirmed > prevPendingRef.current) playAlarmBeep();
          prevPendingRef.current = unconfirmed;
          setPendingCount(unconfirmed);
        }
      } catch (e) {}
    };

    fetchPendingCount();
  }, [authorized]);

  // SSE with automatic polling fallback for pending order badge
  useSSEWithFallback(
    useCallback(async () => {
      if (!authorized) return;
      try {
        const res = await fetch("/api/orders?status=placed");
        if (res.ok) {
          const data = await res.json();
          const unconfirmed = data.filter((o: any) => o.status === "placed").length;
          if (unconfirmed > prevPendingRef.current) playAlarmBeep();
          prevPendingRef.current = unconfirmed;
          setPendingCount(unconfirmed);
        }
      } catch (e) {}
    }, [authorized]),
    {
      onMessage: useCallback((data: any) => {
        if (data.type === "orders_update") {
          const unconfirmed = data.count;
          if (unconfirmed > prevPendingRef.current) playAlarmBeep();
          prevPendingRef.current = unconfirmed;
          setPendingCount(unconfirmed);
        }
      }, []),
      pollIntervalMs: 8000,
    }
  );

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.adminAuthorized);
    router.push("/");
  };

  // Show modal until auth is resolved
  if (showPasscodeModal && !authorized) {
    return (
      <AdminPasscodeModal
        onSuccess={() => {
          setAuthorized(true);
          setShowPasscodeModal(false);
        }}
      />
    );
  }

  if (loading || !authorized) return null;

  return (
    <div className={`admin-theme ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>

      {/* Mobile Header */}
      <div
        className="show-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0055ff", letterSpacing: "1px" }}>
          ONN ADMIN
        </div>
        <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "#0f172a", cursor: "pointer" }}>
          <MenuIcon size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="show-mobile"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
        style={{
          width: sidebarCollapsed ? 80 : 260,
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden"
        }}
      >
        <div
          style={{
            padding: sidebarCollapsed ? "28px 0" : "28px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: sidebarCollapsed ? "none" : "block" }}>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0055ff", letterSpacing: "1px" }}>
              ONN D A WAY
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", letterSpacing: "0.15em", fontWeight: 700, marginTop: "4px" }}>
              ADMIN PORTAL
            </div>
          </div>
          {sidebarCollapsed && <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0055ff" }}>O</div>}
          <button className="show-mobile" onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", display: "none", cursor: "pointer" }}>
            <X size={20} color="#0f172a" />
          </button>
          <button className="hide-mobile" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <MenuIcon size={20} />
          </button>
        </div>

        {/* Sidebar Stats Summary */}
        {!sidebarCollapsed && adminStats && (
           <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: "12px", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                 <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px" }}>ORDERS</div>
                 <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a" }}>{adminStats.orders}</div>
              </div>
              <div style={{ textAlign: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                 <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px" }}>REVENUE</div>
                 <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#10b981" }}>₹{adminStats.revenue}</div>
              </div>
           </div>
        )}

        <div
          style={{
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {ADMIN_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  gap: sidebarCollapsed ? "0" : "14px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                  background: isActive
                    ? "rgba(0,85,255,0.08)"
                    : "transparent",
                  color: isActive ? "#0055ff" : "#64748b",
                  border: `1px solid ${isActive ? "rgba(0,85,255,0.15)" : "transparent"}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#0f172a";
                  if (!isActive) e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#64748b";
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.8, display: "flex", alignItems: "center" }}>{link.icon}</span>
                {!sidebarCollapsed && link.label}
              </Link>
            );
          })}
        </div>

        <div style={{ padding: "24px 16px", borderTop: "1px solid #e2e8f0" }}>
          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
              gap: sidebarCollapsed ? "0" : "12px",
              width: "100%",
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #fecdd3",
              background: "#fff1f2",
              color: "#e11d48",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe4e6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}
          >
            <LogOut size={18} /> {!sidebarCollapsed && "Log Out"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", position: "relative" }} className="admin-main">
        {pendingCount > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #DC2626, #B91C1C)",
            color: "white", padding: "14px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(220,38,38,0.4)", zIndex: 10, flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Bell size={24} />
              <div style={{ fontWeight: 900 }}>
                🚨 {pendingCount} NEW ORDER{pendingCount > 1 ? "S" : ""} WAITING FOR CONFIRMATION!
              </div>
            </div>
            <Link href="/admin/orders" style={{ background: "white", color: "#DC2626", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, textDecoration: "none" }}>
              View Orders
            </Link>
          </div>
        )}
        <div className="admin-content-pad">
          <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>{children}</div>
        </div>
        
        {/* New Flowing/Attached Admin Bottom Nav */}
        <AdminBottomNav />
      </div>

      <style>{`
        .admin-theme {
          --text-dark: #0f172a !important;
          --text-mid: #334155 !important;
          --text-muted: #64748b !important;
          --border: #e2e8f0 !important;
        }
        .admin-content-pad {
          flex: 1;
          padding: 32px;
          position: relative;
        }
        .admin-theme .otw-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
        }
        .admin-theme .otw-input {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .admin-theme .otw-input:focus {
          border-color: #0055ff !important;
          box-shadow: 0 0 0 3px rgba(0,85,255,0.2) !important;
          background: #ffffff !important;
        }
        .admin-theme .otw-label {
          color: #64748b !important;
        }
        .admin-theme .otw-btn-primary {
          background: #0055ff !important;
          border-color: #0055ff !important;
          color: #ffffff !important;
          box-shadow: 0 4px 0 #0033cc !important;
        }
        .admin-theme .otw-btn-primary:hover {
          background: #0044cc !important;
          box-shadow: 0 2px 0 #0033cc !important;
          transform: translateY(2px) !important;
        }
        @media(min-width: 901px) {
           .hide-mobile { display: block; }
        }
        @media(max-width: 900px) {
          .show-mobile { display: flex !important; }
          .hide-mobile { display: none !important; }
          .admin-sidebar { position: fixed !important; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { padding-top: 60px !important; }
          .admin-content-pad { padding: 16px !important; }
        }
        /* Modern Scrollbar for Admin */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* ── FORCE LIGHT THEME on all admin child pages ── */
        /* All backgrounds inside admin content */
        .admin-content-pad,
        .admin-content-pad > div,
        .admin-content-pad div[style] {
          --admin-bg: #ffffff;
          --admin-bg-subtle: #f8fafc;
          --admin-border: #e2e8f0;
          --admin-text: #0f172a;
          --admin-text-mid: #334155;
          --admin-text-muted: #64748b;
        }

        /* Headings */
        .admin-content-pad h1 { color: #0f172a !important; }
        .admin-content-pad h2 { color: #0f172a !important; }
        .admin-content-pad h3 { color: #0f172a !important; }
        .admin-content-pad p { color: #64748b !important; }

        /* Table styling */
        .admin-content-pad table { border-collapse: collapse; }
        .admin-content-pad thead tr {
          background: #f8fafc !important;
        }
        .admin-content-pad thead th {
          color: #64748b !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .admin-content-pad tbody tr {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .admin-content-pad tbody td {
          border-color: #f1f5f9 !important;
        }

        /* Inputs inside admin pages */
        .admin-content-pad input,
        .admin-content-pad select,
        .admin-content-pad textarea {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .admin-content-pad input:focus,
        .admin-content-pad select:focus,
        .admin-content-pad textarea:focus {
          border-color: #0055ff !important;
          box-shadow: 0 0 0 3px rgba(0,85,255,0.15) !important;
          background: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
