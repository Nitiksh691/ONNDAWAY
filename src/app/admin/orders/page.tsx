"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Order, DeliveryPerson } from "@/lib/types";
import { Search, Filter, Phone, MapPin, Truck, CheckSquare, Square, Users, Bell, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  placed:            { bg: "#FFF7ED", border: "#FED7AA" },
  preparing:         { bg: "#EFF6FF", border: "#BFDBFE" },
  out_for_delivery:  { bg: "#F0FDF4", border: "#BBF7D0" },
  delivered:         { bg: "#F9FAFB", border: "#E5E7EB" },
  cancelled:         { bg: "#FFF1F2", border: "#FECDD3" },
};

// Plays a beep using the Web Audio API — works without any audio file
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
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Three rising beeps: ding ding ding!
    playTone(880, 0,    0.18);
    playTone(1100, 0.22, 0.18);
    playTone(1320, 0.44, 0.28);
    // Repeat once
    playTone(880, 0.85,  0.18);
    playTone(1100, 1.07, 0.18);
    playTone(1320, 1.29, 0.28);
    // Also try mp3 if present
    const audio = new Audio("/ringtone.mp3");
    audio.play().catch(() => {});
  } catch (e) {
    console.log("Audio error:", e);
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchPartnerId, setBatchPartnerId] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [alarmActive, setAlarmActive] = useState(false);

  const prevPlacedIds = useRef<Set<string>>(new Set());
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchDeliveryPersons = async () => {
    try {
      const res = await fetch("/api/delivery-persons");
      if (res.ok) {
        const data = await res.json();
        setDeliveryPersons(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersons();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Alarm: detect newly arrived unconfirmed placed orders
  useEffect(() => {
    const currentPlacedIds = new Set(
      orders.filter(o => o.status === "placed" && !o.confirmed).map(o => o.id)
    );
    let hasNew = false;
    currentPlacedIds.forEach(id => {
      if (!prevPlacedIds.current.has(id)) hasNew = true;
    });

    if (hasNew) {
      setAlarmActive(true);
      playAlarmBeep();
      // Keep repeating alarm every 8s while unconfirmed orders exist
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = setInterval(() => {
        const stillPending = orders.some(o => o.status === "placed" && !o.confirmed);
        if (stillPending) playAlarmBeep();
        else {
          clearInterval(alarmIntervalRef.current!);
          setAlarmActive(false);
        }
      }, 8000);
    }

    if (currentPlacedIds.size === 0) {
      setAlarmActive(false);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    }

    prevPlacedIds.current = currentPlacedIds;
  }, [orders]);

  // Cleanup alarm on unmount
  useEffect(() => () => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, status: "preparing" }),
      });
      if (res.ok) {
        fetchOrders();
        toast.success("✅ Order confirmed & moved to Preparing!", {
          style: { background: "#065F46", color: "#fff", fontWeight: 700 },
        });
      } else {
        toast.error("Failed to confirm order");
      }
    } catch {
      toast.error("Failed to confirm order");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
        toast.success("Status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    const partner = deliveryPersons.find(p => p.uid === partnerId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPersonId: partnerId,
          deliveryPersonName: partner?.name || "Partner",
          status: "preparing",
          confirmed: true,
        }),
      });
      if (res.ok) {
        fetchOrders();
        toast.success(`Assigned to ${partner?.name}`);
      } else {
        toast.error("Failed to assign partner");
      }
    } catch {
      toast.error("Failed to assign partner");
    }
  };

  const handleBatchAssign = async () => {
    if (!batchPartnerId || selectedOrders.length === 0) {
      toast.error("Select orders and a delivery partner first");
      return;
    }
    const partner = deliveryPersons.find(p => p.uid === batchPartnerId);
    try {
      await Promise.all(selectedOrders.map(orderId =>
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryPersonId: batchPartnerId,
            deliveryPersonName: partner?.name || "Partner",
            status: "preparing",
            confirmed: true,
          }),
        })
      ));
      fetchOrders();
      setSelectedOrders([]);
      setBatchPartnerId("");
      toast.success(`${selectedOrders.length} orders confirmed & assigned to ${partner?.name}! 🚀`);
    } catch {
      toast.error("Failed to assign batch orders");
    }
  };

  const toggleSelect = (orderId: string) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.id?.includes(search) || o.userName?.toLowerCase().includes(search.toLowerCase()) || o.userPhone?.includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingUnconfirmed = orders.filter(o => o.status === "placed" && !o.confirmed);
  const pendingOrders = orders.filter(o => o.status === "placed");

  return (
    <div>
      {/* ── Alarm Banner ── */}
      {alarmActive && pendingUnconfirmed.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #DC2626, #B91C1C)",
          color: "white",
          padding: "14px 24px",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          animation: "pulse-alarm 1s ease-in-out infinite",
          boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
        }}>
          <style>{`
            @keyframes pulse-alarm {
              0%, 100% { box-shadow: 0 4px 20px rgba(220,38,38,0.4); }
              50% { box-shadow: 0 4px 40px rgba(220,38,38,0.9); }
            }
            @keyframes bell-shake {
              0%, 100% { transform: rotate(0deg); }
              20% { transform: rotate(-15deg); }
              40% { transform: rotate(15deg); }
              60% { transform: rotate(-10deg); }
              80% { transform: rotate(10deg); }
            }
          `}</style>
          <Bell size={24} style={{ animation: "bell-shake 0.6s ease-in-out infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>
              🚨 {pendingUnconfirmed.length} NEW ORDER{pendingUnconfirmed.length > 1 ? "S" : ""} — CALL CUSTOMER TO CONFIRM!
            </div>
            <div style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: "2px" }}>
              Orders are waiting for admin verification before processing
            </div>
          </div>
          <button
            onClick={() => { setAlarmActive(false); if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current); }}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}
          >
            Mute
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "4px" }}>Live Orders</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Auto-refreshes every 3s •{" "}
            <span style={{ color: pendingOrders.length > 0 ? "#DC2626" : "#059669", fontWeight: 700 }}>
              {pendingOrders.length} pending
            </span>
            {pendingUnconfirmed.length > 0 && (
              <span style={{ color: "#DC2626", fontWeight: 700, marginLeft: "4px" }}>
                ({pendingUnconfirmed.length} unconfirmed)
              </span>
            )}
          </p>
        </div>
        {pendingUnconfirmed.length > 0 && (
          <div style={{
            background: "#FEF2F2", border: "2px solid #FCA5A5", borderRadius: "12px",
            padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC2626", animation: "pulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontWeight: 700, color: "#DC2626", fontSize: "0.9rem" }}>
              {pendingUnconfirmed.length} order{pendingUnconfirmed.length > 1 ? "s" : ""} need confirmation!
            </span>
          </div>
        )}
      </div>

      {/* Batch Assign Panel */}
      {selectedOrders.length > 0 && (
        <div className="otw-card" style={{ padding: "16px 24px", marginBottom: "20px", background: "var(--primary)", color: "white", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <Users size={20} />
          <span style={{ fontWeight: 700 }}>{selectedOrders.length} orders selected</span>
          <select
            value={batchPartnerId}
            onChange={e => setBatchPartnerId(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: 600 }}
          >
            <option value="">-- Select Delivery Partner --</option>
            {deliveryPersons.map(dp => (
              <option key={dp.uid} value={dp.uid}>{dp.name} ({dp.phone})</option>
            ))}
          </select>
          <button onClick={handleBatchAssign} style={{ background: "white", color: "var(--primary)", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            Confirm & Assign All 🚀
          </button>
          <button onClick={() => setSelectedOrders([])} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        </div>
      )}

      <div className="otw-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by Order ID, Name, or Phone..."
              className="otw-input"
              style={{ paddingLeft: "48px" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: "relative", width: "220px" }}>
            <Filter size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", zIndex: 1 }} />
            <select className="otw-input" style={{ paddingLeft: "48px", appearance: "none" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="placed">🔴 Placed (Pending)</option>
              <option value="preparing">🟡 Preparing</option>
              <option value="out_for_delivery">🔵 Out for Delivery</option>
              <option value="delivered">🟢 Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
              <div style={{ fontWeight: 600 }}>No orders found</div>
            </div>
          ) : filtered.map(order => {
            const isUnconfirmed = order.status === "placed" && !order.confirmed;
            const colors = STATUS_COLORS[order.status] || { bg: "white", border: "#E5E7EB" };

            return (
              <div
                key={order.id}
                style={{
                  border: `2px solid ${isUnconfirmed ? "#FCA5A5" : selectedOrders.includes(order.id) ? "var(--primary)" : colors.border}`,
                  borderRadius: "12px",
                  padding: "20px",
                  background: isUnconfirmed ? "#FFF7F7" : colors.bg,
                  transition: "all 0.2s",
                  position: "relative",
                  animation: isUnconfirmed ? "pulse-alarm 2s ease-in-out infinite" : "none",
                }}
              >
                {/* Unconfirmed Badge */}
                {isUnconfirmed && (
                  <div style={{
                    position: "absolute", top: -12, left: 20,
                    background: "#DC2626", color: "white",
                    fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.08em",
                    padding: "3px 10px", borderRadius: "999px",
                  }}>
                    📞 AWAITING CONFIRMATION
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(order.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--primary)", flexShrink: 0 }}>
                    {selectedOrders.includes(order.id) ? <CheckSquare size={22} /> : <Square size={22} color="var(--border)" />}
                  </button>

                  {/* Order Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>#{order.id?.slice(-8).toUpperCase()}</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order["status"])}
                        style={{ padding: "4px 10px", borderRadius: "8px", border: "1.5px solid rgba(0,0,0,0.1)", fontSize: "0.8rem", fontWeight: 700, background: "white", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        <option value="placed">🔴 Placed</option>
                        <option value="preparing">🟡 Preparing</option>
                        <option value="out_for_delivery">🔵 Out for Delivery</option>
                        <option value="delivered">🟢 Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {order.scheduledTime && (
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700, background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px" }}>
                          🕒 {order.scheduledTime}
                        </span>
                      )}
                      {order.confirmed && (
                        <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700, background: "#D1FAE5", padding: "2px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle size={12} /> Confirmed
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.9rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-dark)", fontSize: "1rem" }}>{order.userName}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                        <Phone size={14} />
                        <a href={`tel:+91${order.userPhone}`} style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>+91 {order.userPhone}</a>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                        <MapPin size={14} /> {order.location}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.05em" }}>ITEMS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.quantity}× {item.item.name}</div>
                      ))}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: "1.15rem", color: "var(--primary)", marginTop: "10px" }}>₹{order.total}</div>
                  </div>

                  {/* Right panel: Confirm + Assign */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "220px" }}>
                    {/* CONFIRM BUTTON — only for unconfirmed placed orders */}
                    {isUnconfirmed && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={confirmingId === order.id}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "linear-gradient(135deg, #059669, #047857)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: 900,
                          fontSize: "0.9rem",
                          cursor: confirmingId === order.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
                          transition: "all 0.2s",
                          opacity: confirmingId === order.id ? 0.7 : 1,
                        }}
                        onMouseOver={e => { if (confirmingId !== order.id) e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        <CheckCircle size={18} />
                        {confirmingId === order.id ? "Confirming..." : "✅ Confirm Order"}
                      </button>
                    )}

                    {/* Assign Partner */}
                    <div style={{ background: "rgba(255,255,255,0.8)", padding: "14px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.05em" }}>
                        <Truck size={14} /> ASSIGN PARTNER
                      </div>
                      <select
                        className="otw-input"
                        style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                        value={order.deliveryPersonId || ""}
                        onChange={(e) => handleAssignPartner(order.id, e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {deliveryPersons.map(dp => (
                          <option key={dp.uid} value={dp.uid}>{dp.name}</option>
                        ))}
                      </select>
                      {order.deliveryPersonName && (
                        <div style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700, marginTop: "6px" }}>
                          ✓ {order.deliveryPersonName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
