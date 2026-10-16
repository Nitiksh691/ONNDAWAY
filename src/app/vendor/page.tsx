"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package, BarChart2, LogOut, CheckCircle, Clock, ChevronRight,
  RefreshCw, TrendingUp, ShoppingBag, IndianRupee,
  Volume2, VolumeX, Bell, BellRing, BellOff, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import {
  playVendorOrderSound,
  unlockAudio,
  requestNotificationPermission,
  triggerBrowserNotification,
} from "@/lib/orderSounds";

type Tab = "orders" | "reports";
type Period = "7" | "30" | "90" | "all";

interface VendorSession {
  vendorId: string;
  name: string;
  businessName: string;
  revenueSharePct: number;
}

/* ─────────────────────────────── LOGIN / REGISTER ─────────────────────────────── */
function VendorLogin({ onLogin }: { onLogin: (s: VendorSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleDemoFill = () => {
    setPhone("9876543210");
    setPin("1234");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (mode === "login") {
        const res = await fetch("/api/vendor/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, pin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        onLogin(data);
      } else {
        // Register new vendor
        if (!name.trim() || !businessName.trim()) {
          throw new Error("Name and Business Name are required");
        }
        const createRes = await fetch("/api/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            businessName: businessName.trim(),
            phone: phone.trim(),
            pin: pin.trim(),
            revenueSharePct: 70,
            notes: "Self-registered via Vendor Portal",
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || "Registration failed");

        // Now auto login
        const authRes = await fetch("/api/vendor/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), pin: pin.trim() }),
        });
        const authData = await authRes.json();
        if (!authRes.ok) throw new Error("Account created, please sign in.");
        onLogin(authData);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0028D4 0%, #0135FB 60%, #2A55FF 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "36px 30px", width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "2.8rem", marginBottom: 8 }}>🏪</div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.55rem", fontWeight: 900, color: "#0F172A", margin: "0 0 4px" }}>
            Vendor Portal
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.85rem", margin: 0 }}>ONN DA WAY · Partner Dashboard</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: "flex", background: "#F1F5F9", padding: "4px", borderRadius: "12px",
          marginBottom: 20, border: "1px solid #E2E8F0"
        }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1, padding: "8px", border: "none", borderRadius: "8px",
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.84rem",
              cursor: "pointer", transition: "all 0.15s",
              background: mode === "login" ? "#FFFFFF" : "transparent",
              color: mode === "login" ? "#0135FB" : "#64748B",
              boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            style={{
              flex: 1, padding: "8px", border: "none", borderRadius: "8px",
              fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.84rem",
              cursor: "pointer", transition: "all 0.15s",
              background: mode === "register" ? "#FFFFFF" : "transparent",
              color: mode === "register" ? "#0135FB" : "#64748B",
              boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
            }}
          >
            + Register Business
          </button>
        </div>

        {/* Demo Account Quick-Fill helper */}
        {mode === "login" && (
          <div style={{
            background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12,
            padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 10
          }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1E40AF" }}>Demo Vendor Account</div>
              <div style={{ fontSize: "0.72rem", color: "#3B82F6", fontWeight: 600 }}>Phone: 9876543210 · PIN: 1234</div>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              style={{
                background: "#0135FB", color: "#FFFFFF", border: "none",
                borderRadius: 8, padding: "5px 10px", fontSize: "0.72rem",
                fontWeight: 800, cursor: "pointer", flexShrink: 0
              }}
            >
              Fill Demo
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#475569", display: "block", marginBottom: 5 }}>Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  style={{
                    width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                    fontSize: "0.92rem", fontFamily: "'Outfit', sans-serif", fontWeight: 600, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#475569", display: "block", marginBottom: 5 }}>Shop / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Campus Corner Snacks"
                  required
                  style={{
                    width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                    fontSize: "0.92rem", fontFamily: "'Outfit', sans-serif", fontWeight: 600, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#475569", display: "block", marginBottom: 5 }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              required
              style={{
                width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                fontSize: "0.95rem", fontFamily: "'Outfit', sans-serif", fontWeight: 600, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#475569", display: "block", marginBottom: 5 }}>
              {mode === "register" ? "Create 4-Digit Login PIN" : "Login PIN"}
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              required
              maxLength={8}
              style={{
                width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #E2E8F0",
                fontSize: "1.15rem", fontFamily: "monospace", fontWeight: 700, outline: "none", boxSizing: "border-box",
                letterSpacing: "0.25em",
              }}
            />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#DC2626", fontSize: "0.82rem", fontWeight: 700 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: "#0135FB", color: "white", border: "none", borderRadius: 12,
              padding: "13px", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              boxShadow: "0 6px 20px rgba(1,53,251,0.32)",
            }}
          >
            {loading ? "Processing..." : mode === "register" ? "Create Partner Account →" : "Sign In to Portal →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: "0.75rem", color: "#94A3B8" }}>
          {mode === "login"
            ? "Need help? Contact the ONN DA WAY admin team"
            : "Vendors get dedicated packing and sales reports"}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── ORDERS TAB ─────────────────────────── */
function OrdersTab({ session }: { session: VendorSession }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [packingId, setPackingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "packed">("all");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifGranted, setNotifGranted] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
  const prevOrdersRef = useRef<string[] | null>(null);

  // Initialize sound preference & notification status
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vendor_sound_enabled");
      if (stored !== null) setSoundEnabled(stored === "true");
    } catch {}

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("vendor_sound_enabled", String(next));
    } catch {}
    if (next) {
      unlockAudio();
      playVendorOrderSound();
      toast.success("Sound alerts enabled! 🔊");
    } else {
      toast("Sound alerts muted 🔇");
    }
  };

  const handleTestSound = () => {
    unlockAudio();
    playVendorOrderSound();
    toast.success("🔔 Order chime played! (Audio unlocked on this device)");
  };

  const handleEnableNotifications = async () => {
    const ok = await requestNotificationPermission();
    setNotifGranted(ok);
    if (ok) {
      toast.success("Push notifications enabled! 🔔");
      triggerBrowserNotification("ONN DA WAY Notifications Active! 🔔", {
        body: "You will be alerted when new orders arrive to pack.",
      });
    } else {
      toast.error("Notification permission not granted");
    }
  };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/vendor/orders?vendorId=${session.vendorId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      // Check for freshly arrived unpacked orders
      if (prevOrdersRef.current !== null) {
        const freshOrders = list.filter((o: any) =>
          !prevOrdersRef.current?.includes(o._id) &&
          !o.vendorPackedAt &&
          ["placed", "pending", "preparing"].includes(o.status)
        );

        if (freshOrders.length > 0) {
          const newest = freshOrders[0];
          setNewOrderAlert(newest);

          if (soundEnabled) {
            playVendorOrderSound();
          }

          toast.success(
            `🔔 NEW ORDER #${newest.orderId || newest._id?.slice(-6)}! Please pack now.`,
            { duration: 7000, icon: "📦" }
          );

          triggerBrowserNotification("ONN DA WAY - New Order! 🔔", {
            body: `Order #${newest.orderId || newest._id?.slice(-6)} received with ${newest.items?.length || 1} items to pack!`,
            tag: "vendor-new-order-" + newest._id,
          });
        }
      }

      prevOrdersRef.current = list.map((o: any) => o._id);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [session.vendorId, soundEnabled]);

  // Fast polling (every 6 seconds) for instant order alert
  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 6000);
    return () => clearInterval(timer);
  }, [load]);

  const handlePack = async (orderId: string) => {
    setPackingId(orderId);
    try {
      await fetch("/api/vendor/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: session.vendorId, orderId, action: "pack" }),
      });
      await load(true);
      if (newOrderAlert?._id === orderId) setNewOrderAlert(null);
      toast.success("Order marked as packed! ✅");
    } finally {
      setPackingId(null);
    }
  };

  const displayed = orders.filter(o => {
    if (filter === "packed") return !!o.vendorPackedAt;
    if (filter === "pending") return !o.vendorPackedAt;
    return true;
  });

  const statusColor: Record<string, string> = {
    pending: "#F59E0B", preparing: "#3B82F6", ready: "#10B981", delivered: "#6B7280", completed: "#6B7280",
  };

  return (
    <div>
      {/* ── Sound & Notification Controls Bar ── */}
      <div style={{
        background: "#FFFFFF",
        border: "1.5px solid #E2E8F0",
        borderRadius: 14,
        padding: "10px 14px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggleSound}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 10, border: "1.5px solid",
              borderColor: soundEnabled ? "#10B981" : "#CBD5E1",
              background: soundEnabled ? "#ECFDF5" : "#F8FAFC",
              color: soundEnabled ? "#047857" : "#64748B",
              fontWeight: 800, fontSize: "0.78rem", cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {soundEnabled ? <Volume2 size={15} color="#059669" /> : <VolumeX size={15} color="#94A3B8" />}
            <span>Sound {soundEnabled ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={handleTestSound}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 10px", borderRadius: 10, border: "1px solid #E2E8F0",
              background: "#F1F5F9", color: "#334155",
              fontWeight: 700, fontSize: "0.76rem", cursor: "pointer",
              fontFamily: "'Outfit', sans-serif"
            }}
            title="Test alert chime and unlock audio on this phone"
          >
            <BellRing size={13} color="#0135FB" /> Test
          </button>
        </div>

        <div>
          {!notifGranted ? (
            <button
              onClick={handleEnableNotifications}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 10, border: "1.5px solid #BFDBFE",
                background: "#EFF6FF", color: "#1D4ED8",
                fontWeight: 800, fontSize: "0.76rem", cursor: "pointer",
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              <Bell size={13} /> Enable Notifications
            </button>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              color: "#059669", fontSize: "0.75rem", fontWeight: 700
            }}>
              <CheckCircle size={14} /> Alerts Active
            </span>
          )}
        </div>
      </div>

      {/* ── Flashing New Order Alert Card ── */}
      {newOrderAlert && (
        <div style={{
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          color: "#FFFFFF",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
          boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          animation: "pulse 1.6s infinite ease-in-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.5rem" }}>🔔</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: "0.95rem", letterSpacing: "0.3px" }}>
                NEW ORDER #{newOrderAlert.orderId || newOrderAlert._id?.slice(-6)} ARRIVED!
              </div>
              <div style={{ fontSize: "0.78rem", opacity: 0.92, marginTop: 2 }}>
                {newOrderAlert.items?.length || 1} item{newOrderAlert.items?.length !== 1 ? "s" : ""} waiting for you to pack.
              </div>
            </div>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "none", color: "#FFFFFF",
              borderRadius: 8, padding: "6px 12px",
              fontSize: "0.75rem", fontWeight: 800,
              cursor: "pointer", flexShrink: 0
            }}
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {(["all", "pending", "packed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px", borderRadius: 999, border: "1.5px solid",
              borderColor: filter === f ? "#0135FB" : "#E2E8F0",
              background: filter === f ? "#0135FB" : "white",
              color: filter === f ? "white" : "#475569",
              fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {f === "all" ? "All Orders" : f === "packed" ? "✅ Packed" : "⏳ Pending"}
          </button>
        ))}
        <button onClick={() => load(false)} style={{ marginLeft: "auto", background: "#F1F5F9", border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", gap: 4, fontWeight: 600, fontSize: "0.8rem" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && !initialLoaded ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Loading orders...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📭</div>
          <p style={{ color: "#64748B", fontWeight: 600 }}>No orders found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayed.map(order => (
            <div key={order._id} style={{
              background: "white", borderRadius: 18, padding: "18px",
              border: order.vendorPackedAt ? "2px solid #DCFCE7" : "1px solid #E2E8F0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                    Order #{order.orderId || order._id?.slice(-6)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 800,
                    background: `${statusColor[order.status] || "#E2E8F0"}22`,
                    color: statusColor[order.status] || "#475569",
                    border: `1px solid ${statusColor[order.status] || "#E2E8F0"}`,
                    textTransform: "capitalize",
                  }}>
                    {order.status}
                  </span>
                  {order.vendorPackedAt && (
                    <CheckCircle size={20} color="#10B981" />
                  )}
                </div>
              </div>

              {/* Items */}
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
                {order.items.map((item: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < order.items.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{item.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Qty: {item.quantity || 1}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0135FB" }}>
                      ₹{((item.quantity || 1) * (item.price || 0)).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              {!order.vendorPackedAt && ["pending", "preparing"].includes(order.status) && (
                <button
                  onClick={() => handlePack(order._id)}
                  disabled={packingId === order._id}
                  style={{
                    width: "100%", background: "#10B981", color: "white", border: "none", borderRadius: 12,
                    padding: "12px", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.92rem",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
                  }}
                >
                  <CheckCircle size={18} />
                  {packingId === order._id ? "Marking..." : "Mark as Packed ✅"}
                </button>
              )}
              {order.vendorPackedAt && (
                <div style={{ textAlign: "center", color: "#10B981", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={16} /> Packed at {new Date(order.vendorPackedAt).toLocaleTimeString("en-IN")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── REPORTS TAB ─────────────────────────── */
function ReportsTab({ session }: { session: VendorSession }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/reports?vendorId=${session.vendorId}&period=${period}`);
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [session.vendorId, period]);

  useEffect(() => { load(); }, [load]);

  const myShare = report ? (report.totalRevenue * session.revenueSharePct) / 100 : 0;

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([["7", "7 Days"], ["30", "30 Days"], ["90", "3 Months"], ["all", "All Time"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setPeriod(val)}
            style={{
              padding: "6px 16px", borderRadius: 999, border: "1.5px solid",
              borderColor: period === val ? "#0135FB" : "#E2E8F0",
              background: period === val ? "#0135FB" : "white",
              color: period === val ? "white" : "#475569",
              fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Loading report...</div>
      ) : !report ? null : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Orders", value: report.totalOrders, icon: <ShoppingBag size={20} />, color: "#0135FB", bg: "#EEF2FF" },
              { label: "Units Sold", value: report.totalQty, icon: <Package size={20} />, color: "#7C3AED", bg: "#F3E8FF" },
              { label: "Gross Revenue", value: `₹${report.totalRevenue.toFixed(0)}`, icon: <IndianRupee size={20} />, color: "#059669", bg: "#ECFDF5" },
              { label: `Your Share (${session.revenueSharePct}%)`, value: `₹${myShare.toFixed(0)}`, icon: <TrendingUp size={20} />, color: "#D97706", bg: "#FEF3C7" },
            ].map(card => (
              <div key={card.label} style={{
                background: card.bg, borderRadius: 16, padding: "16px",
                border: `1px solid ${card.color}22`,
              }}>
                <div style={{ color: card.color, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Per-item breakdown */}
          {report.items.length > 0 && (
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  📦 Sales by Item
                </h3>
              </div>
              {report.items.map((item: any, i: number) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 18px", borderBottom: i < report.items.length - 1 ? "1px solid #F1F5F9" : "none",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{item.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{item.qty} units sold</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#059669" }}>₹{item.revenue.toFixed(0)}</div>
                    <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>your share: ₹{(item.revenue * session.revenueSharePct / 100).toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {report.items.length === 0 && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📊</div>
              <p style={{ color: "#64748B", fontWeight: 600 }}>No sales data for this period</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export default function VendorPortalPage() {
  const [session, setSession] = useState<VendorSession | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vendor_session");
      if (saved) setSession(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogin = (s: VendorSession) => {
    setSession(s);
    localStorage.setItem("vendor_session", JSON.stringify(s));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("vendor_session");
  };

  if (!session) return <VendorLogin onLogin={handleLogin} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0028D4 0%, #0135FB 100%)",
        padding: "20px 16px 20px",
        position: "relative",
        boxShadow: "0 4px 16px rgba(1,53,251,0.2)",
      }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>
                ONN DA WAY · Vendor Portal
              </div>
              <h1 style={{ color: "white", fontSize: "1.35rem", fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                👋 {session.name}
              </h1>
              {session.businessName && (
                <div style={{ color: "rgba(255,255,255,0.88)", fontSize: "0.82rem", fontWeight: 600, marginTop: 2 }}>{session.businessName}</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.32)",
                borderRadius: 10, padding: "7px 12px", cursor: "pointer", color: "white",
                display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: "0.78rem",
                fontFamily: "'Outfit', sans-serif", flexShrink: 0
              }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: 540, margin: "16px auto 0", padding: "0 16px" }}>
        {/* Tab switcher card */}
        <div style={{
          background: "white", borderRadius: 16, padding: "5px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 4, marginBottom: 18,
          border: "1px solid #E2E8F0"
        }}>
          {([
            { key: "orders", label: "Orders", icon: <Package size={16} /> },
            { key: "reports", label: "Reports", icon: <BarChart2 size={16} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.88rem",
                background: tab === t.key ? "#0135FB" : "transparent",
                color: tab === t.key ? "white" : "#64748B",
                boxShadow: tab === t.key ? "0 2px 8px rgba(1,53,251,0.25)" : "none",
                transition: "all 0.18s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && <OrdersTab session={session} />}
        {tab === "reports" && <ReportsTab session={session} />}

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
