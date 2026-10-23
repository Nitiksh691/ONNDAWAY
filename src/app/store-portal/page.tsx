"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Store,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Power,
  Zap,
  Search,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  TrendingUp,
  Boxes,
  Bell,
  Volume2,
  VolumeX,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

interface StoreSession {
  id: string;
  name: string;
  slug: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  isAcceptingOrders: boolean;
  isBusy: boolean;
  openingTime: string;
  closingTime: string;
  serviceRadiusKm: number;
  serviceAreas: string[];
}

interface StoreOrder {
  id: string;
  userName: string;
  userPhone: string;
  items: Array<{
    item: { name: string; price: number; image?: string; category?: string };
    quantity: number;
    unitPrice?: number;
    lineDetails?: string;
    vendorPacked?: boolean;
  }>;
  location: string;
  locationNotes?: string;
  total: number;
  status: "payment_pending" | "placed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: "COD" | "RAZORPAY";
  paymentStatus: "PENDING" | "PAID";
  scheduledTime?: string;
  deliveryOtp?: string;
  deliveryPersonName?: string;
  vendorPackedAt?: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  image?: string;
  basePrice: number;
  baseAvailable: boolean;
  isAvailable: boolean;
  storePrice: number;
  storeStock: number | null;
  hasOverride: boolean;
}

export default function StorePortalPage() {
  const [session, setSession] = useState<StoreSession | null>(null);
  const [tab, setTab] = useState<"orders" | "inventory" | "reports">("orders");
  const [loading, setLoading] = useState(true);

  // Login form state
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Load session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("otw_store_session");
      if (saved) {
        setSession(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !pin.trim()) {
      toast.error("Please enter both phone number and PIN");
      return;
    }
    setSubmittingLogin(true);
    try {
      const res = await fetch("/api/store-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      setSession(data.store);
      localStorage.setItem("otw_store_session", JSON.stringify(data.store));
      toast.success(`Welcome to ${data.store.name}!`);
    } catch {
      toast.error("Network error during login");
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("otw_store_session");
    setSession(null);
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", color: "white" }}>
        <RefreshCw size={28} className="animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0B1120 0%, #020617 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 420, background: "#1E293B", borderRadius: 24, padding: "36px 28px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Store size={26} />
            </div>
            <div>
              <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 900, margin: 0 }}>Store Partner Portal</h1>
              <p style={{ color: "#94A3B8", fontSize: "0.82rem", margin: "4px 0 0" }}>Collaborated Store Hub Manager</p>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#CBD5E1", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>
                STORE REGISTERED PHONE
              </label>
              <input
                type="tel"
                placeholder="e.g. 9999000001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#0F172A", border: "1.5px solid #334155", color: "white", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#CBD5E1", fontSize: "0.78rem", fontWeight: 700, marginBottom: 6 }}>
                STORE PIN (4 DIGITS)
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#0F172A", border: "1.5px solid #334155", color: "white", fontSize: "0.95rem", letterSpacing: 4, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={submittingLogin}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "15px",
                borderRadius: 12,
                background: "#0135FB",
                color: "white",
                border: "none",
                fontWeight: 900,
                fontSize: "1rem",
                cursor: submittingLogin ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(1,53,251,0.4)",
              }}
            >
              {submittingLogin ? "Verifying..." : "Login to Store"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", color: "#64748B", fontSize: "0.75rem" }}>
            ONN DA WAY Multi-Store Quick Commerce • Store Partner Gateway
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoreDashboardView
      session={session}
      setSession={setSession}
      tab={tab}
      setTab={setTab}
      onLogout={handleLogout}
    />
  );
}

function StoreDashboardView({
  session,
  setSession,
  tab,
  setTab,
  onLogout,
}: {
  session: StoreSession;
  setSession: React.Dispatch<React.SetStateAction<StoreSession | null>>;
  tab: "orders" | "inventory" | "reports";
  setTab: (t: "orders" | "inventory" | "reports") => void;
  onLogout: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggleAccepting = async () => {
    if (toggling) return;
    setToggling(true);
    const nextVal = !session.isAcceptingOrders;
    try {
      const res = await fetch("/api/store-portal/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: session.id, isAcceptingOrders: nextVal }),
      });
      if (res.ok) {
        setSession((prev) => (prev ? { ...prev, isAcceptingOrders: nextVal } : null));
        toast.success(nextVal ? "Store is now LIVE and accepting orders!" : "Store order acceptance PAUSED.");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  const handleToggleBusy = async () => {
    if (toggling) return;
    setToggling(true);
    const nextVal = !session.isBusy;
    try {
      const res = await fetch("/api/store-portal/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: session.id, isBusy: nextVal }),
      });
      if (res.ok) {
        setSession((prev) => (prev ? { ...prev, isBusy: nextVal } : null));
        toast.success(nextVal ? "Busy / Rush-Hour mode activated (+10m buffer)" : "Normal pace restored");
      }
    } catch {
      toast.error("Failed to update busy mode");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#F8FAFC", fontFamily: "inherit" }}>
      {/* ── TOP HEADER ── */}
      <header style={{ background: "#1E293B", borderBottom: "1px solid #334155", position: "sticky", top: 0, zIndex: 50, padding: "12px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0, color: "white" }}>{session.name}</h2>
                <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 6, background: "#334155", color: "#94A3B8", fontWeight: 800 }}>
                  {session.code}
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <MapPin size={12} /> {session.address.slice(0, 36)}... • {session.serviceRadiusKm} km radius
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Live Toggle */}
            <button
              onClick={handleToggleAccepting}
              disabled={toggling}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: session.isAcceptingOrders ? "#16A34A" : "#DC2626",
                color: "white",
                fontWeight: 800,
                fontSize: "0.78rem",
                cursor: "pointer",
                boxShadow: session.isAcceptingOrders ? "0 2px 10px rgba(22,163,74,0.4)" : "none",
              }}
            >
              <Power size={14} />
              {session.isAcceptingOrders ? "Accepting Orders (Live)" : "Orders Paused"}
            </button>

            {/* Busy Toggle */}
            <button
              onClick={handleToggleBusy}
              disabled={toggling}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: session.isBusy ? "1.5px solid #F59E0B" : "1.5px solid #475569",
                background: session.isBusy ? "rgba(245,158,11,0.15)" : "#0F172A",
                color: session.isBusy ? "#F59E0B" : "#94A3B8",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              <Zap size={14} />
              {session.isBusy ? "Rush Hour Active" : "Normal Rush"}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#334155", border: "none", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── NAVIGATION TABS ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, background: "#1E293B", padding: 6, borderRadius: 14, width: "fit-content" }}>
          {([
            { id: "orders", label: "Live Orders", icon: <Package size={16} /> },
            { id: "inventory", label: "Store Stock & Menu", icon: <Boxes size={16} /> },
            { id: "reports", label: "Store Reports", icon: <TrendingUp size={16} /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: tab === t.id ? "#0135FB" : "transparent",
                color: tab === t.id ? "white" : "#94A3B8",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
        {tab === "orders" && <StoreOrdersTab session={session} />}
        {tab === "inventory" && <StoreInventoryTab session={session} />}
        {tab === "reports" && <StoreReportsTab session={session} />}
      </main>
    </div>
  );
}

/* ─────────────────────────── ORDERS TAB ─────────────────────────── */
function StoreOrdersTab({ session }: { session: StoreSession }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("active");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/store-portal/orders?storeId=${session.id}`);
      if (res.ok) {
        const data: StoreOrder[] = await res.json();
        // Check if there are new unacknowledged orders
        const activeOrders = data.filter((o) => o.status === "placed" || o.status === "preparing");
        if (soundEnabled && activeOrders.length > prevCountRef.current && prevCountRef.current !== 0) {
          playOrderChime();
        }
        prevCountRef.current = activeOrders.length;
        setOrders(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session.id, soundEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const playOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // audio block
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: StoreOrder["status"]) => {
    try {
      const res = await fetch("/api/store-portal/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, storeId: session.id, status }),
      });
      if (res.ok) {
        toast.success(`Order marked as ${status}`);
        fetchOrders();
      }
    } catch {
      toast.error("Failed to update order");
    }
  };

  const handleTogglePacked = async (orderId: string, currentPacked: boolean) => {
    try {
      const res = await fetch("/api/store-portal/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, storeId: session.id, isPacked: !currentPacked }),
      });
      if (res.ok) {
        toast.success(!currentPacked ? "📦 Marked PACKED! Ready for delivery partner." : "Packing status reset");
        fetchOrders();
      }
    } catch {
      toast.error("Failed to update packing status");
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === "active") return o.status === "placed" || o.status === "preparing" || o.status === "out_for_delivery";
    if (filter === "delivered") return o.status === "delivered" || o.status === "cancelled";
    return true;
  });

  return (
    <div>
      {/* Sub-header controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["active", "delivered", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: filter === f ? "1px solid #0135FB" : "1px solid #334155",
                background: filter === f ? "rgba(1,53,251,0.2)" : "#1E293B",
                color: filter === f ? "#60A5FA" : "#94A3B8",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "active" ? `Active Orders (${orders.filter((o) => o.status === "placed" || o.status === "preparing" || o.status === "out_for_delivery").length})` : f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSoundEnabled((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#1E293B",
            border: "1px solid #334155",
            color: soundEnabled ? "#4ADE80" : "#64748B",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {soundEnabled ? "Alert Sound ON" : "Sound Muted"}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading store orders...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#1E293B", borderRadius: 16, border: "1px solid #334155" }}>
          <Package size={42} style={{ color: "#475569", margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#CBD5E1" }}>No {filter} orders right now</div>
          <div style={{ fontSize: "0.82rem", color: "#64748B", marginTop: 4 }}>
            New customer orders assigned to this store will appear here automatically.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filtered.map((order) => {
            const isPacked = !!order.vendorPackedAt;
            return (
              <div
                key={order.id}
                style={{
                  background: "#1E293B",
                  borderRadius: 16,
                  border: isPacked ? "1.5px solid #16A34A" : "1.5px solid #334155",
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                <div>
                  {/* Order Top Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "white" }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 2 }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {order.scheduledTime || "ASAP"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: order.paymentMethod === "COD" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                          color: order.paymentMethod === "COD" ? "#FACC15" : "#4ADE80",
                          border: order.paymentMethod === "COD" ? "1px solid #CA8A04" : "1px solid #16A34A",
                        }}
                      >
                        {order.paymentMethod} {order.paymentStatus === "PAID" ? "• PAID" : "• COLLECT ₹" + order.total}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div style={{ background: "#0F172A", padding: 10, borderRadius: 10, marginBottom: 12, border: "1px solid #334155" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#E2E8F0" }}>{order.userName}</div>
                    <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} color="#0135FB" /> {order.location}
                    </div>
                    {order.locationNotes && (
                      <div style={{ fontSize: "0.74rem", color: "#F59E0B", marginTop: 3 }}>
                        ⚠️ Landmark/Gate: {order.locationNotes}
                      </div>
                    )}
                  </div>

                  {/* Items Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      PACKING CHECKLIST ({order.items.length} ITEMS)
                    </div>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          borderRadius: 8,
                          background: "#0B1120",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 900, color: "#0135FB", fontSize: "0.85rem", minWidth: 20 }}>
                            {item.quantity}×
                          </span>
                          <span style={{ fontSize: "0.84rem", color: "#F1F5F9", fontWeight: 700 }}>
                            {item.item.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 700 }}>
                          ₹{(item.unitPrice || item.item.price) * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions & Status Controls */}
                <div style={{ borderTop: "1px solid #334155", paddingTop: 12, marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {/* Mark Packed Button */}
                    <button
                      onClick={() => handleTogglePacked(order.id, isPacked)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        background: isPacked ? "#16A34A" : "#334155",
                        color: "white",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {isPacked ? "Packed ✓" : "Mark as Packed"}
                    </button>

                    {/* Progress to Out for Delivery / Dispatch */}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: "#0135FB",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        Handed to Rider →
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#94A3B8" }}>
                    <span>
                      Total: <strong style={{ color: "white", fontSize: "0.9rem" }}>₹{order.total}</strong>
                    </span>
                    <span style={{ textTransform: "capitalize", color: "#60A5FA", fontWeight: 700 }}>
                      Status: {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── INVENTORY TAB ─────────────────────────── */
function StoreInventoryTab({ session }: { session: StoreSession }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`/api/store-portal/inventory?storeId=${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      toast.error("Failed to load store inventory");
    } finally {
      setLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleToggleAvailable = async (item: InventoryItem) => {
    setUpdatingId(item.id);
    const nextVal = !item.isAvailable;
    try {
      const res = await fetch("/api/store-portal/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: session.id,
          menuItemId: item.id,
          isAvailable: nextVal,
        }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextVal, hasOverride: true } : i))
        );
        toast.success(`${item.name} is now ${nextVal ? "IN STOCK" : "OUT OF STOCK"}`);
      }
    } catch {
      toast.error("Failed to update item availability");
    } finally {
      setUpdatingId(null);
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category || "General")));

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "all" || item.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search items to toggle stock..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: 10, background: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 10, background: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "0.85rem", outline: "none" }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading catalog...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {filtered.map((item) => {
            const isBusy = updatingId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: "#1E293B",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: item.isAvailable ? "1px solid #334155" : "1.5px solid #EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: item.isAvailable ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {item.image ? (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 }}>
                      <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                      🍽️
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "white" }}>{item.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                      ₹{item.storePrice} • {item.category}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAvailable(item)}
                  disabled={isBusy}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: item.isAvailable ? "#16A34A" : "#EF4444",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.74rem",
                    cursor: isBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {isBusy ? "..." : item.isAvailable ? "In Stock" : "Out of Stock"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── REPORTS TAB ─────────────────────────── */
function StoreReportsTab({ session }: { session: StoreSession }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/store-portal/orders?storeId=${session.id}`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.id]);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalSales = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const codCollected = deliveredOrders.filter((o) => o.paymentMethod === "COD").reduce((sum, o) => sum + (o.total || 0), 0);
  const onlineCollected = deliveredOrders.filter((o) => o.paymentMethod === "RAZORPAY").reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#1E293B", padding: 18, borderRadius: 14, border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>TOTAL COMPLETED ORDERS</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", marginTop: 4 }}>{deliveredOrders.length}</div>
        </div>

        <div style={{ background: "#1E293B", padding: 18, borderRadius: 14, border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>TOTAL STORE REVENUE</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#4ADE80", marginTop: 4 }}>₹{totalSales.toLocaleString()}</div>
        </div>

        <div style={{ background: "#1E293B", padding: 18, borderRadius: 14, border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>CASH ON DELIVERY (COD)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FACC15", marginTop: 4 }}>₹{codCollected.toLocaleString()}</div>
        </div>

        <div style={{ background: "#1E293B", padding: 18, borderRadius: 14, border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>ONLINE PREPAID (RAZORPAY)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#60A5FA", marginTop: 4 }}>₹{onlineCollected.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: "#1E293B", padding: 20, borderRadius: 16, border: "1px solid #334155" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "white", marginBottom: 12 }}>Store Operating Parameters</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: "0.85rem", color: "#CBD5E1" }}>
          <div>📍 Service Radius: <strong>{session.serviceRadiusKm} km</strong></div>
          <div>⏰ Hours: <strong>{session.openingTime} - {session.closingTime}</strong></div>
          <div>📞 Store Contact: <strong>{session.phone}</strong></div>
          <div>🏷️ Pre-configured Zones: <strong>{session.serviceAreas.length} zones</strong></div>
        </div>
      </div>
    </div>
  );
}
