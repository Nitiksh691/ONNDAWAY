"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Order, DeliveryPerson, CartItem } from "@/lib/types";
import { buildLineDetails } from "@/lib/orderLine";
import { Search, Filter, Phone, MapPin, Truck, CheckSquare, Square, Users, Bell, CheckCircle, Clock, Package, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  placed:            { bg: "#271c19", border: "#522c22" },
  preparing:         { bg: "#1a2436", border: "#c7d2fe" },
  out_for_delivery:  { bg: "#143324", border: "#114c33" },
  delivered:         { bg: "#ffffff", border: "#e2e8f0" },
  cancelled:         { bg: "#3a1318", border: "#5c1923" },
};

const STATUS_SELECT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  placed:            { bg: "#450a0a", color: "#fca5a5", border: "#7f1d1d" },
  preparing:         { bg: "#1a2436", color: "#93c5fd", border: "#c7d2fe" },
  out_for_delivery:  { bg: "#143324", color: "#86efac", border: "#114c33" },
  delivered:         { bg: "#ffffff", color: "#94a3b8", border: "#cbd5e1" },
  cancelled:         { bg: "#3a1318", color: "#fca5a5", border: "#5c1923" },
};

function OrderLineItem({ line }: { line: CartItem }) {
  const unit = line.unitPrice ?? line.item.price ?? 0;
  const lineTotal = unit * line.quantity;
  const details =
    line.lineDetails ||
    buildLineDetails(line.selectedCustomizations, line.specialInstructions);

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px",
      padding: "12px 14px", marginBottom: "8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#fafafa", textTransform: "capitalize" }}>
            {line.quantity}× {line.item.name}
          </div>
          {line.item.category && (
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px", textTransform: "capitalize" }}>{line.item.category}</div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#60a5fa" }}>₹{lineTotal}</div>
          {line.unitPrice != null && line.unitPrice !== line.item.price && (
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>₹{unit} each</div>
          )}
        </div>
      </div>

      {details && (
        <div style={{
          marginTop: "8px", fontSize: "0.8rem", color: "#334155", lineHeight: 1.5,
          background: "#1a1a1e", border: "1px solid #cbd5e1", borderRadius: "8px",
          padding: "8px 10px",
        }}>
          {details}
        </div>
      )}

      {line.selectedCustomizations && line.selectedCustomizations.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
          {line.selectedCustomizations.map((c, i) => (
            <span key={i} style={{
              fontSize: "0.72rem", fontWeight: 600, color: "#dbeafe",
              background: "#c7d2fe", border: "1px solid #2563eb33",
              padding: "3px 10px", borderRadius: "999px",
            }}>
              {c.category}: {c.option}{c.price > 0 ? ` +₹${c.price}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const prevPlacedIds = useRef<Set<string>>(new Set());
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      let url = "/api/orders";
      if (statusFilter === "all") {
        url = "/api/orders?status=placed,preparing,out_for_delivery";
      } else {
        url = `/api/orders?status=${statusFilter}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [statusFilter]);

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
          style: { background: "#065F46", color: "#0f172a", fontWeight: 700 },
        });
        setExpandedOrders(prev => new Set(prev).add(orderId));
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
    // Optimistic UI update to hide instantly if it's set to delivered/cancelled in 'all' view
    if (statusFilter === "all" && (status === "delivered" || status === "cancelled")) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success("Order removed from live view");
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
        if (statusFilter !== "all" || (status !== "delivered" && status !== "cancelled")) {
          toast.success("Status updated");
        }
      } else {
        toast.error("Failed to update status");
        fetchOrders();
      }
    } catch {
      toast.error("Failed to update status");
      fetchOrders();
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) newSet.delete(orderId);
      else newSet.add(orderId);
      return newSet;
    });
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
        <div style={{ background: "var(--primary)", border: "1px solid #0044cc", borderRadius: "16px", padding: "16px 24px", marginBottom: "20px", color: "white", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
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

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by Order ID, Name, or Phone..."
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px 14px 48px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: "relative", width: "220px" }}>
            <Filter size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", zIndex: 1 }} />
            <select style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px 14px 48px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box", appearance: "none" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Live Orders (Pending)</option>
              <option value="placed">🔴 Placed</option>
              <option value="preparing">🟡 Preparing</option>
              <option value="out_for_delivery">🔵 Out for Delivery</option>
              <option value="delivered">🟢 Delivered (History)</option>
              <option value="cancelled">❌ Cancelled (History)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
              <div style={{ fontWeight: 600 }}>No orders found</div>
            </div>
          ) : filtered.map(order => {
            const isUnconfirmed = order.status === "placed" && !order.confirmed;
            const colors = STATUS_COLORS[order.status] || { bg: "white", border: "#E5E7EB" };
            const isExpanded = expandedOrders.has(order.id) || isUnconfirmed;

            return (
              <div
                key={order.id}
                style={{
                  border: `2px solid ${isUnconfirmed ? "#FCA5A5" : selectedOrders.includes(order.id) ? "var(--primary)" : colors.border}`,
                  borderRadius: "14px",
                  padding: "0",
                  background: isUnconfirmed ? "#450a0a" : colors.bg,
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                  animation: isUnconfirmed ? "pulse-alarm 2s ease-in-out infinite" : "none",
                }}
              >
                {isUnconfirmed && (
                  <div style={{
                    background: "#DC2626", color: "white",
                    fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em",
                    padding: "6px 20px", textAlign: "center",
                  }}>
                    📞 AWAITING CONFIRMATION — CALL CUSTOMER
                  </div>
                )}

                {/* Header row (Clickable to expand) */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "12px", padding: "16px 20px",
                  borderBottom: isExpanded ? "1px solid #e2e8f0" : "none", flexWrap: "wrap",
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(order.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }} 
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--primary)", flexShrink: 0 }}
                    >
                      {selectedOrders.includes(order.id) ? <CheckSquare size={20} /> : <Square size={20} color="#52525b" />}
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(order.id); }}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#fafafa" }}>#{order.id?.slice(-8).toUpperCase()}</span>
                    <select
                      value={order.status}
                      onChange={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, e.target.value as Order["status"]); }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        padding: "6px 12px", borderRadius: "8px",
                        border: `1.5px solid ${(STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).border}`,
                        fontSize: "0.8rem", fontWeight: 700,
                        background: (STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).bg,
                        color: (STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).color,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <option value="placed">🔴 Placed</option>
                      <option value="preparing">🟡 Preparing</option>
                      <option value="out_for_delivery">🔵 Out for Delivery</option>
                      <option value="delivered">🟢 Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    {order.confirmed && (
                      <span style={{ fontSize: "0.75rem", color: "#86efac", fontWeight: 700, background: "#14532d", padding: "4px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle size={12} /> Confirmed
                      </span>
                    )}
                    {!isExpanded && (
                       <span style={{ fontSize: "0.85rem", color: "#94a3b8", marginLeft: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Package size={14} /> {order.items.length} items
                       </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} /> {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {order.scheduledTime && (
                      <span style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 700, background: "#c7d2fe", padding: "4px 10px", borderRadius: "6px" }}>
                        🕒 {order.scheduledTime}
                      </span>
                    )}
                    <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#60a5fa" }}>₹{order.total}</span>
                  </div>
                </div>

                {/* Body grid (Collapsible) */}
                {isExpanded && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "20px",
                    padding: "20px",
                    alignItems: "start",
                  }}>
                    {/* Customer */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", marginBottom: "12px" }}>CUSTOMER</div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fafafa", marginBottom: "10px" }}>{order.userName}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <Phone size={14} color="#71717a" />
                        <a href={`tel:+91${order.userPhone}`} style={{ color: "#60a5fa", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>+91 {order.userPhone}</a>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#94a3b8", fontSize: "0.88rem" }}>
                        <MapPin size={14} color="#71717a" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{order.location}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Package size={13} /> ORDER ITEMS ({order.items.length})
                      </div>
                      {order.items.map((line, idx) => (
                        <OrderLineItem key={line.cartItemId || idx} line={line} />
                      ))}
                      {order.discount ? (
                        <div style={{ fontSize: "0.82rem", color: "#86efac", marginTop: "8px" }}>Coupon discount: −₹{order.discount}</div>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {isUnconfirmed && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirmOrder(order.id); }}
                            disabled={confirmingId === order.id}
                            style={{
                              width: "100%", padding: "14px 16px",
                              background: "linear-gradient(135deg, #059669, #047857)",
                              color: "white", border: "none", borderRadius: "10px",
                              fontWeight: 900, fontSize: "0.9rem",
                              cursor: confirmingId === order.id ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                              boxShadow: "0 4px 12px rgba(5,150,105,0.4)",
                              opacity: confirmingId === order.id ? 0.7 : 1,
                            }}
                          >
                            <CheckCircle size={18} />
                            {confirmingId === order.id ? "Confirming..." : "✅ Confirm Order"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Cancel this unconfirmed order?")) handleUpdateStatus(order.id, "cancelled");
                            }}
                            disabled={confirmingId === order.id}
                            style={{
                              width: "100%", padding: "10px 16px",
                              background: "transparent", color: "#f87171",
                              border: "1px solid #7f1d1d", borderRadius: "10px",
                              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                            }}
                          >
                            ❌ Cancel Order
                          </button>
                        </>
                      )}

                      <div style={{ background: "#e2e8f0", padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.06em" }}>
                          <Truck size={14} /> ASSIGN PARTNER
                        </div>
                        <select
                          style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontFamily: "inherit", fontSize: "0.85rem" }}
                          value={order.deliveryPersonId || ""}
                          onClick={e => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); handleAssignPartner(order.id, e.target.value); }}
                        >
                          <option value="">-- Unassigned --</option>
                          {deliveryPersons.map(dp => (
                            <option key={dp.uid} value={dp.uid}>{dp.name}</option>
                          ))}
                        </select>
                        {order.deliveryPersonName && (
                          <div style={{ fontSize: "0.78rem", color: "#86efac", fontWeight: 700, marginTop: "8px" }}>
                            ✓ {order.deliveryPersonName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
