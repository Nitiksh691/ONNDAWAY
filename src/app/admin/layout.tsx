"use client";
import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/lib/constants";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/menu", label: "Menu Management", icon: <Coffee size={18} /> },
  { href: "/admin/orders", label: "Live Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
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
            <Dialog.Description style={{ color: "#a0a0a0", fontSize: "0.9rem", lineHeight: 1.5 }}>
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
                  color: "#a0a0a0",
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
                  color: "#a0a0a0",
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
  const [authorized, setAuthorized] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a", color: "#e4e4e7" }}>

      {/* Mobile Header */}
      <div
        className="show-mobile"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#111",
          borderBottom: "1px solid #27272a",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#fff", letterSpacing: "1px" }}>
          ONN ADMIN
        </div>
        <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
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
          width: 260,
          background: "#111",
          borderRight: "1px solid #27272a",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid #27272a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0055ff", letterSpacing: "1px" }}>
              ONN D A WAY
            </div>
            <div style={{ fontSize: "0.75rem", color: "#a0a0a0", letterSpacing: "0.15em", fontWeight: 700, marginTop: "4px" }}>
              ADMIN PORTAL
            </div>
          </div>
          <button className="show-mobile" onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", display: "none", cursor: "pointer" }}>
            <X size={20} color="#fff" />
          </button>
        </div>

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
                  gap: "14px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,85,255,0.15), transparent)"
                    : "transparent",
                  color: isActive ? "#0055ff" : "#a0a0a0",
                  border: `1px solid ${isActive ? "rgba(0,85,255,0.3)" : "transparent"}`,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#a0a0a0";
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.7 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        <div style={{ padding: "24px 16px", borderTop: "1px solid #27272a" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #3f1111",
              background: "#180a0a",
              color: "#ef4444",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a0a0a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#180a0a")}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto", position: "relative" }} className="admin-main">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
      </div>

      <style>{`
        @media(max-width: 900px) {
          .show-mobile { display: flex !important; }
          .admin-sidebar { position: fixed !important; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { padding: 90px 24px 40px !important; }
        }
        /* Modern Scrollbar for Admin */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}
