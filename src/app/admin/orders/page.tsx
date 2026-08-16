"use client";
import { useState, useCallback } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { Order, DeliveryPerson, CartItem } from "@/lib/types";
import { buildLineDetails } from "@/lib/orderLine";
import { useSSEWithFallback } from "@/lib/useSSEWithFallback";
import { Filter, Phone, MapPin, Truck, CheckSquare, Square, Users, Clock, Package, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  placed:            { bg: "#F0F9FF", border: "#BAE6FD" },
  preparing:         { bg: "#FEFCE8", border: "#FEF08A" },
  out_for_delivery:  { bg: "#F0FDF4", border: "#BBF7D0" },
  delivered:         { bg: "#F8FAFC", border: "#E2E8F0" },
  cancelled:         { bg: "#FEF2F2", border: "#FECACA" },
};

const STATUS_SELECT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  placed:            { bg: "#E0F2FE", color: "#0369A1", border: "#7DD3FC" },
  preparing:         { bg: "#FEF9C3", color: "#A16207", border: "#FDE047" },
  out_for_delivery:  { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  delivered:         { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
  cancelled:         { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" },
};

function OrderLineItem({ line }: { line: CartItem }) {
  const unit = line.unitPrice ?? line.item.price ?? 0;
  const lineTotal = unit * line.quantity;
  const details = line.lineDetails || buildLineDetails(line.selectedCustomizations, line.specialInstructions);

  return (
    <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px", marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A", textTransform: "capitalize" }}>
            {line.quantity}× {line.item.name}
          </div>
          {line.item.category && <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px", textTransform: "capitalize" }}>{line.item.category}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#0135FB" }}>₹{lineTotal}</div>
          {line.unitPrice != null && line.unitPrice !== line.item.price && (
            <div style={{ fontSize: "0.68rem", color: "#64748B" }}>₹{unit} each</div>
          )}
        </div>
      </div>
      {details && (
        <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "#334155", lineHeight: 1.5, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 10px" }}>
          {details}
        </div>
      )}
      {line.selectedCustomizations && line.selectedCustomizations.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
          {line.selectedCustomizations.map((c, i) => (
            <span key={i} style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1E40AF", background: "#DBEAFE", border: "1px solid #BFDBFE", padding: "3px 10px", borderRadius: "999px" }}>
              {c.category}: {c.option}{c.price > 0 ? ` +₹${c.price}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchPartnerId, setBatchPartnerId] = useState("");
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(30);

  const fetchUrl = statusFilter === "all" 
    ? "/api/orders?status=placed,preparing,out_for_delivery" 
    : `/api/orders?status=${statusFilter}`;

  const { data: orders = [], mutate: mutateOrders } = useSWR<Order[]>(fetchUrl, fetcher, { revalidateOnFocus: true });
  const { data: deliveryPersons = [] } = useSWR<DeliveryPerson[]>("/api/delivery-persons", fetcher, { refreshInterval: 30000 });

  // Debounce SSE updates
  useSSEWithFallback(
    useCallback(() => mutateOrders(), [mutateOrders]),
    { 
      onMessage: useCallback((data: any) => { 
        if (data.type === "order_change") {
          mutateOrders();
        } 
      }, [mutateOrders]), 
      pollIntervalMs: 15000 // Increased from 8s to 15s to reduce load
    }
  );

  const handleStartPreparing = async (orderId: string) => {
    setPreparingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "preparing" }),
      });
      if (res.ok) {
        mutateOrders();
        toast.success("✅ Order is now preparing!", { style: { background: "#065F46", color: "white" }});
        setExpandedOrders(prev => new Set(prev).add(orderId));
      } else {
        toast.error("Failed to update order");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setPreparingId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: Order["status"]) => {
    mutateOrders(current => {
      if (!current) return [];
      if (statusFilter === "all" && (status === "delivered" || status === "cancelled")) {
        return current.filter(o => o.id !== orderId);
      }
      return current.map(o => o.id === orderId ? { ...o, status } : o);
    }, false);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) toast.success("Status updated");
      else toast.error("Failed to update status");
    } catch {
      toast.error("Failed to update status");
    } finally {
      mutateOrders();
    }
  };

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    const partner = deliveryPersons.find(p => p.uid === partnerId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPersonId: partnerId, deliveryPersonName: partner?.name || "Partner" }),
      });
      if (res.ok) {
        mutateOrders();
        toast.success(`Assigned to ${partner?.name}`);
      } else toast.error("Failed to assign partner");
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
          body: JSON.stringify({ deliveryPersonId: batchPartnerId, deliveryPersonName: partner?.name || "Partner" }),
        })
      ));
      mutateOrders();
      setSelectedOrders([]);
      setBatchPartnerId("");
      toast.success(`${selectedOrders.length} orders assigned!`);
    } catch {
      toast.error("Failed to assign batch orders");
    }
  };

  const toggleSelect = (orderId: string) => setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  const toggleExpand = (orderId: string) => setExpandedOrders(prev => { const newSet = new Set(prev); if (newSet.has(orderId)) newSet.delete(orderId); else newSet.add(orderId); return newSet; });

  const filtered = orders.filter(o => {
    const term = debouncedSearch.toLowerCase();
    return o.id?.toLowerCase().includes(term) || o.userName?.toLowerCase().includes(term) || o.userPhone?.includes(term);
  });
  
  const visibleOrders = filtered.slice(0, visibleCount);
  const pendingOrders = orders.filter(o => o.status === "placed");

  return (
    <div style={{ paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0F172A", marginBottom: "4px" }}>Live Orders</h1>
          <p style={{ color: "#64748B", fontSize: "0.9rem" }}>
            Auto-refreshes every 8s • <span style={{ color: pendingOrders.length > 0 ? "#EF4444" : "#10B981", fontWeight: 700 }}>{pendingOrders.length} pending</span>
          </p>
        </div>
      </div>

      {selectedOrders.length > 0 && (
        <div style={{ background: "#0135FB", borderRadius: "16px", padding: "16px 24px", marginBottom: "20px", color: "white", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", boxShadow: "0 4px 12px rgba(1,53,251,0.2)" }}>
          <Users size={20} />
          <span style={{ fontWeight: 700 }}>{selectedOrders.length} selected</span>
          <select
            value={batchPartnerId}
            onChange={e => setBatchPartnerId(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: "8px", border: "none", fontFamily: "inherit", fontWeight: 600, color: "#0F172A" }}
          >
            <option value="">-- Select Delivery Partner --</option>
            {deliveryPersons.map(dp => <option key={dp.uid} value={dp.uid}>{dp.name} ({dp.phone})</option>)}
          </select>
          <button onClick={handleBatchAssign} style={{ background: "white", color: "#0135FB", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Assign All 🚀</button>
          <button onClick={() => setSelectedOrders([])} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      <div style={{ background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: "220px" }}>
            <Filter size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", zIndex: 1 }} />
            <select style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#0F172A", borderRadius: "10px", padding: "14px 16px 14px 48px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box", appearance: "none", cursor: "pointer" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
          {visibleOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
              <div style={{ fontWeight: 600 }}>No orders found</div>
            </div>
          ) : visibleOrders.map(order => {
            const colors = STATUS_COLORS[order.status] || { bg: "#ffffff", border: "#E2E8F0" };
            const isExpanded = expandedOrders.has(order.id) || order.status === "placed";

            return (
              <div
                key={order.id}
                style={{
                  border: `1.5px solid ${selectedOrders.includes(order.id) ? "#0135FB" : colors.border}`,
                  borderRadius: "14px", background: colors.bg, transition: "all 0.2s", overflow: "hidden",
                  boxShadow: selectedOrders.includes(order.id) ? "0 4px 12px rgba(1,53,251,0.1)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 20px", borderBottom: isExpanded ? `1px solid ${colors.border}` : "none", flexWrap: "wrap", cursor: "pointer" }} onClick={() => toggleExpand(order.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#0135FB", flexShrink: 0 }}>
                      {selectedOrders.includes(order.id) ? <CheckSquare size={20} /> : <Square size={20} color="#94A3B8" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(order.id); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center" }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#0F172A" }}>#{order.id?.slice(-8).toUpperCase()}</span>
                    
                    <select
                      value={order.status}
                      onChange={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, e.target.value as Order["status"]); }}
                      onClick={e => e.stopPropagation()}
                      style={{ padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${(STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).border}`, fontSize: "0.8rem", fontWeight: 700, background: (STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).bg, color: (STATUS_SELECT_COLORS[order.status] || STATUS_SELECT_COLORS.placed).color, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      <option value="payment_pending">⚪ Payment Pending</option>
                      <option value="placed">🔴 Placed</option>
                      <option value="preparing">🟡 Preparing</option>
                      <option value="out_for_delivery">🔵 Out for Delivery</option>
                      <option value="delivered">🟢 Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>

                    {/* Payment Tag */}
                    {order.paymentMethod === "RAZORPAY" ? (
                      <span style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 800, background: "#DCFCE7", border: "1px solid #86EFAC", padding: "4px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        🟢 RAZORPAY {order.paymentStatus}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: order.paymentStatus === "PAID" ? "#15803D" : "#A16207", fontWeight: 800, background: order.paymentStatus === "PAID" ? "#DCFCE7" : "#FEF9C3", border: `1px solid ${order.paymentStatus === "PAID" ? "#86EFAC" : "#FDE047"}`, padding: "4px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                        {order.paymentStatus === "PAID" ? "🟢 COD PAID" : "🟡 COD PENDING"}
                      </span>
                    )}
                    
                    {!isExpanded && <span style={{ fontSize: "0.85rem", color: "#64748B", marginLeft: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Package size={14} /> {order.items.length} items</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.78rem", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={13} /> {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    {order.scheduledTime && <span style={{ fontSize: "0.78rem", color: "#1E40AF", fontWeight: 700, background: "#DBEAFE", padding: "4px 10px", borderRadius: "6px" }}>🕒 {order.scheduledTime}</span>}
                    <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0135FB" }}>₹{order.total}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", padding: "20px", alignItems: "start" }}>
                    <div style={{ background: "#ffffff", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.08em", marginBottom: "12px" }}>CUSTOMER</div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0F172A", marginBottom: "10px" }}>{order.userName}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}><Phone size={14} color="#64748B" /><a href={`tel:+91${order.userPhone}`} style={{ color: "#0135FB", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>+91 {order.userPhone}</a></div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#334155", fontSize: "0.88rem" }}><MapPin size={14} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} /><span>{order.location}</span></div>
                    </div>
                    {order.feedback && (
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#16A34A", letterSpacing: "0.08em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><MessageCircle size={13} /> CUSTOMER FEEDBACK</div>
                        <p style={{ color: "#15803D", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4, margin: 0 }}>"{order.feedback}"</p>
                      </div>
                    )}
                    <div style={{ background: "#ffffff", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Package size={13} /> ORDER ITEMS ({order.items.length})</div>
                      {order.items.map((line, idx) => <OrderLineItem key={line.cartItemId || idx} line={line} />)}
                      {order.discount ? <div style={{ fontSize: "0.82rem", color: "#15803D", marginTop: "8px", fontWeight: 600 }}>Coupon discount: −₹{order.discount}</div> : null}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {order.status === "placed" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartPreparing(order.id); }}
                          disabled={preparingId === order.id}
                          style={{
                            width: "100%", padding: "14px 16px", background: "linear-gradient(135deg, #10B981, #059669)",
                            color: "white", border: "none", borderRadius: "10px", fontWeight: 900, fontSize: "0.9rem",
                            cursor: preparingId === order.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            boxShadow: "0 4px 12px rgba(16,185,129,0.3)", opacity: preparingId === order.id ? 0.7 : 1,
                          }}
                        >
                          🍳 {preparingId === order.id ? "Updating..." : "Start Preparing"}
                        </button>
                      )}
                      
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Cancel this order?")) handleUpdateStatus(order.id, "cancelled"); }} disabled={preparingId === order.id} style={{ width: "100%", padding: "10px 16px", background: "transparent", color: "#EF4444", border: "1.5px solid #FCA5A5", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>❌ Cancel Order</button>
                      )}

                      <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.06em" }}><Truck size={14} /> ASSIGN PARTNER</div>
                        <select style={{ background: "#ffffff", border: "1px solid #E2E8F0", color: "#0F172A", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontFamily: "inherit", fontSize: "0.85rem" }} value={order.deliveryPersonId || ""} onClick={e => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); handleAssignPartner(order.id, e.target.value); }}>
                          <option value="">-- Unassigned --</option>
                          {deliveryPersons.map(dp => <option key={dp.uid} value={dp.uid}>{dp.name}</option>)}
                        </select>
                        {order.deliveryPersonName && <div style={{ fontSize: "0.78rem", color: "#15803D", fontWeight: 700, marginTop: "8px" }}>✓ {order.deliveryPersonName}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {visibleCount < filtered.length && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button 
              onClick={() => setVisibleCount(prev => prev + 30)}
              style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #E2E8F0", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
            >
              Load More Orders ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
