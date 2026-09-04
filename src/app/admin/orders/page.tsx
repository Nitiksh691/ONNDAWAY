"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { Order, DeliveryPerson, CartItem } from "@/lib/types";
import { buildLineDetails } from "@/lib/orderLine";
import { useSSEWithFallback } from "@/lib/useSSEWithFallback";
import {
  Filter,
  Phone,
  MapPin,
  Truck,
  CheckSquare,
  Square,
  Users,
  Clock,
  Package,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Search,
  AlertCircle,
  CheckCircle2,
  CookingPot,
  Bike,
  RefreshCw,
  LayoutGrid,
  List,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import toast from "react-hot-toast";

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("otw_admin_token") : "";
  return fetch(url, { headers: { "x-admin-token": token || "" } }).then((res) => res.json());
};

// Enhanced Color Palette & Tokens
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badgeBg: string }> = {
  placed: { label: "New Order", bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", badgeBg: "#EF4444" },
  preparing: { label: "Preparing", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", badgeBg: "#F59E0B" },
  out_for_delivery: { label: "On the Way", bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", badgeBg: "#3B82F6" },
  delivered: { label: "Delivered", bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", badgeBg: "#10B981" },
  cancelled: { label: "Cancelled", bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0", badgeBg: "#64748B" },
};

function OrderLineItem({ line }: { line: CartItem }) {
  const unit = line.unitPrice ?? line.item.price ?? 0;
  const lineTotal = unit * line.quantity;
  const details = line.lineDetails || buildLineDetails(line.selectedCustomizations, line.specialInstructions);

  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "10px 12px", marginBottom: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>
            <span style={{ color: "#2563EB", fontWeight: 800 }}>{line.quantity}×</span> {line.item.name}
          </div>
          {line.item.category && <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "1px" }}>{line.item.category}</div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0F172A" }}>₹{lineTotal}</div>
          {line.unitPrice != null && line.unitPrice !== line.item.price && (
            <div style={{ fontSize: "0.68rem", color: "#64748B" }}>₹{unit} ea</div>
          )}
        </div>
      </div>
      {details && (
        <div style={{ marginTop: "6px", fontSize: "0.78rem", color: "#334155", lineHeight: 1.4, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 8px" }}>
          💬 {details}
        </div>
      )}
      {line.selectedCustomizations && line.selectedCustomizations.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
          {line.selectedCustomizations.map((c, i) => (
            <span key={i} style={{ fontSize: "0.7rem", fontWeight: 600, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #DBEAFE", padding: "2px 8px", borderRadius: "12px" }}>
              {c.category}: {c.option}{c.price > 0 ? ` (+₹${c.price})` : ""}
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
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchPartnerId, setBatchPartnerId] = useState("");
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(30);

  const fetchUrl = statusFilter === "all"
    ? "/api/orders?status=placed,preparing,out_for_delivery"
    : `/api/orders?status=${statusFilter}`;

  const { data: orders = [], mutate: mutateOrders, isValidating } = useSWR<Order[]>(fetchUrl, fetcher, { revalidateOnFocus: true });
  const { data: deliveryPersons = [] } = useSWR<DeliveryPerson[]>("/api/delivery-persons", fetcher, { refreshInterval: 30000 });
  const { data: settings, mutate: mutateSettings } = useSWR("/api/settings", fetcher);

  const handleTogglePause = async () => {
    const newVal = !settings?.ordersPaused;
    toast.loading("Updating...", { id: "pause" });
    try {
      const token = sessionStorage.getItem("otw_admin_token") || "";
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": token
        },
        body: JSON.stringify({ ordersPaused: !settings?.ordersPaused }),
      });
      if (res.ok) {
        toast.success(newVal ? "Orders Paused 🛑" : "Orders Resumed ✅", { id: "pause" });
        mutateSettings();
      } else {
        toast.error("Failed to update", { id: "pause" });
      }
    } catch {
      toast.error("Failed to update", { id: "pause" });
    }
  };

  useSSEWithFallback(
    useCallback(() => mutateOrders(), [mutateOrders]),
    {
      onMessage: useCallback((data: any) => {
        if (data.type === "order_change") {
          mutateOrders();
        }
      }, [mutateOrders]),
      pollIntervalMs: 15000
    }
  );

  const handleStartPreparing = async (orderId: string) => {
    setPreparingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
        body: JSON.stringify({ status: "preparing" }),
      });
      if (res.ok) {
        mutateOrders();
        toast.success("Order moved to Kitchen Preparing!", { icon: "🍳" });
        setExpandedOrders(prev => new Set(prev).add(orderId));
      } else toast.error("Failed to update status");
    } catch {
      toast.error("Failed to update status");
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
        headers: { "Content-Type": "application/json", "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) toast.success(`Order status set to ${status.replace(/_/g, ' ')}`);
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
        headers: { "Content-Type": "application/json", "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
        body: JSON.stringify({ deliveryPersonId: partnerId, deliveryPersonName: partner?.name || "Partner" }),
      });
      if (res.ok) {
        mutateOrders();
        toast.success(`Assigned to ${partner?.name || "Delivery Partner"}`);
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
          headers: { "Content-Type": "application/json", "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
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

  const filtered = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter(o => {
      const term = debouncedSearch.toLowerCase();
      return o.id?.toLowerCase().includes(term) || o.userName?.toLowerCase().includes(term) || o.userPhone?.includes(term);
    });
  }, [orders, debouncedSearch]);

  const visibleOrders = filtered.slice(0, visibleCount);

  // Metrics & Stats
  const metrics = useMemo(() => {
    return {
      placed: orders.filter(o => o.status === "placed").length,
      preparing: orders.filter(o => o.status === "preparing").length,
      outForDelivery: orders.filter(o => o.status === "out_for_delivery").length,
      totalRevenue: orders.reduce((acc, curr) => acc + (curr.total || 0), 0)
    };
  }, [orders]);

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "20px 16px 120px 16px", fontFamily: "system-ui, -apple-system, sans-serif", background: "#F1F5F9", minHeight: "100vh" }}>

      {/* Top Header & Refresh Control */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Live Command Center</h1>
          <p style={{ color: "#64748B", fontSize: "0.88rem", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ height: 8, width: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }}></span>
            Real-time Sync Active
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {settings && (
            <button
              onClick={handleTogglePause}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: settings.ordersPaused ? "#FEF2F2" : "#F0FDF4",
                border: `1px solid ${settings.ordersPaused ? "#FECACA" : "#BBF7D0"}`,
                color: settings.ordersPaused ? "#DC2626" : "#16A34A",
                padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {settings.ordersPaused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
              {settings.ordersPaused ? "Resume Orders" : "Pause Orders"}
            </button>
          )}
          <button
            onClick={() => mutateOrders()}
            disabled={isValidating}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #CBD5E1", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}
          >
            <RefreshCw size={14} className={isValidating ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>New Orders</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#991B1B", marginTop: "4px" }}>{metrics.placed}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Kitchen Prep</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#92400E", marginTop: "4px" }}>{metrics.preparing}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Out for Delivery</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1E40AF", marginTop: "4px" }}>{metrics.outForDelivery}</div>
        </div>
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Active Volume</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0F172A", marginTop: "4px" }}>₹{metrics.totalRevenue}</div>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedOrders.length > 0 && (
        <div style={{ background: "#1E293B", borderRadius: "12px", padding: "12px 20px", marginBottom: "20px", color: "white", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          <Users size={18} color="#94A3B8" />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedOrders.length} Orders Selected</span>
          <select
            value={batchPartnerId}
            onChange={e => setBatchPartnerId(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: "8px", border: "1px solid #475569", background: "#334155", color: "white", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <option value="">-- Assign Delivery Partner --</option>
            {deliveryPersons.map(dp => <option key={dp.uid} value={dp.uid}>{dp.name} ({dp.phone})</option>)}
          </select>
          <button onClick={handleBatchAssign} style={{ background: "#2563EB", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>Assign Selected</button>
          <button onClick={() => setSelectedOrders([])} style={{ background: "transparent", color: "#94A3B8", border: "none", padding: "8px 12px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search by Order ID, Name, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #CBD5E1", borderRadius: "8px", outline: "none", fontSize: "0.88rem", boxSizing: "border-box" }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ position: "relative", width: "180px" }}>
            <Filter size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #CBD5E1", borderRadius: "8px", background: "#FFFFFF", fontSize: "0.85rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
            >
              <option value="all">Active Orders</option>
              <option value="placed">🔴 New Placed</option>
              <option value="preparing">🟡 Kitchen Prep</option>
              <option value="out_for_delivery">🔵 Out for Delivery</option>
              <option value="delivered">🟢 Delivered (History)</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Display — Grid on desktop, list on mobile */}
      <style>{`
        .adm-orders-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .adm-orders-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .adm-orders-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .adm-order-card {
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.15s, box-shadow 0.15s;
          display: flex;
          flex-direction: column;
          cursor: default;
        }
        .adm-order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        .adm-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .adm-card-body {
          padding: 12px 14px;
          flex: 1;
          background: #fff;
        }
        .adm-card-footer {
          padding: 10px 14px;
          background: #F8FAFC;
          border-top: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .adm-action-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: none;
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .adm-action-btn:hover { opacity: 0.88; transform: scale(0.99); }
        .adm-action-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .adm-item-chip {
          font-size: 0.72rem;
          font-weight: 700;
          background: #F1F5F9;
          color: #334155;
          border-radius: 6px;
          padding: 3px 8px;
          display: inline-block;
          margin: 2px;
          border: 1px solid #E2E8F0;
        }
        .adm-partner-select {
          width: 100%;
          padding: 7px 10px;
          border-radius: 7px;
          border: 1px solid #CBD5E1;
          background: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          color: #0F172A;
          outline: none;
        }
        .adm-empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          color: #64748B;
        }
      `}</style>

      <div className="adm-orders-grid">
        {visibleOrders.length === 0 ? (
          <div className="adm-empty-state">
            <Package size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>No Live Orders Found</div>
            <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Check back shortly or adjust your filters.</p>
          </div>
        ) : (
          visibleOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
            const isExpanded = expandedOrders.has(order.id) || order.status === "placed";

            return (
              <div
                key={order.id}
                className="adm-order-card"
                style={{
                  border: `1px solid ${selectedOrders.includes(order.id) ? "#2563EB" : statusConfig.border}`,
                  background: statusConfig.bg,
                  outline: selectedOrders.includes(order.id) ? "2px solid #2563EB" : "none",
                  outlineOffset: "1px",
                }}
              >
                {/* Colored top accent bar */}
                <div style={{ height: 4, background: statusConfig.badgeBg, flexShrink: 0 }} />

                {/* Card header */}
                <div className="adm-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#2563EB", flexShrink: 0 }}
                    >
                      {selectedOrders.includes(order.id) ? <CheckSquare size={17} /> : <Square size={17} color="#94A3B8" />}
                    </button>
                    <span style={{ fontWeight: 900, fontSize: "0.95rem", color: "#0F172A", letterSpacing: "0.02em" }}>
                      #{order.id?.slice(-8).toUpperCase()}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 800, padding: "3px 8px",
                      borderRadius: "20px", background: statusConfig.badgeBg,
                      color: "#fff", flexShrink: 0,
                    }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#0F172A" }}>₹{order.total}</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="adm-card-body">
                  {/* Customer info */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", marginBottom: 2 }}>{order.userName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <a href={`tel:+91${order.userPhone}`} style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 4 }}>
                        <Phone size={12} /> +91 {order.userPhone}
                      </a>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "2px 7px", borderRadius: "5px", background: order.paymentStatus === "PAID" ? "#DCFCE7" : "#FEF9C3", color: order.paymentStatus === "PAID" ? "#166534" : "#854D0E", border: `1px solid ${order.paymentStatus === "PAID" ? "#86EFAC" : "#FDE047"}` }}>
                        {order.paymentMethod === "RAZORPAY" ? "ONLINE" : "COD"} · {order.paymentStatus}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 6, fontSize: "0.8rem", color: "#475569" }}>
                      <MapPin size={12} color="#64748B" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ lineHeight: 1.4 }}>{order.location}</span>
                    </div>
                    {order.scheduledTime && (
                      <span style={{ fontSize: "0.72rem", color: "#1D4ED8", fontWeight: 700, background: "#EFF6FF", padding: "2px 7px", borderRadius: "4px", display: "inline-block", marginTop: 5 }}>
                        🕒 {order.scheduledTime}
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>
                      ITEMS ({order.items.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {order.items.slice(0, 4).map((line, idx) => (
                        <span key={idx} className="adm-item-chip">
                          {line.quantity}× {line.item.name}
                        </span>
                      ))}
                      {order.items.length > 4 && (
                        <span className="adm-item-chip" style={{ color: "#0135FB", borderColor: "#BFDBFE", background: "#EFF6FF" }}>
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand for full details */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    style={{ background: "none", border: "none", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? "Hide details" : "Full details"}
                  </button>

                  {/* Expanded: order line details + feedback */}
                  {isExpanded && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${statusConfig.border}`, paddingTop: 10 }}>
                      {order.items.map((line, idx) => (
                        <OrderLineItem key={line.cartItemId || idx} line={line} />
                      ))}
                      {order.discount ? (
                        <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700, marginTop: 4 }}>
                          Discount applied: −₹{order.discount}
                        </div>
                      ) : null}
                      {order.feedback && (
                        <div style={{ marginTop: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "8px 10px", borderRadius: "8px", fontSize: "0.8rem", color: "#166534" }}>
                          <MessageCircle size={12} style={{ display: "inline", marginRight: 4 }} />
                          "{order.feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer — actions */}
                <div className="adm-card-footer">
                  {/* Quick status select */}
                  <select
                    value={order.status}
                    onChange={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, e.target.value as Order["status"]); }}
                    onClick={e => e.stopPropagation()}
                    className="adm-partner-select"
                    style={{ fontWeight: 700, background: statusConfig.bg, color: statusConfig.text, border: `1px solid ${statusConfig.border}` }}
                  >
                    <option value="payment_pending">⚪ Payment Pending</option>
                    <option value="placed">🔴 Placed</option>
                    <option value="preparing">🟡 Preparing</option>
                    <option value="out_for_delivery">🔵 Out for Delivery</option>
                    <option value="delivered">🟢 Delivered</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>

                  {order.status === "placed" && (
                    <button
                      className="adm-action-btn"
                      onClick={(e) => { e.stopPropagation(); handleStartPreparing(order.id); }}
                      disabled={preparingId === order.id}
                      style={{ background: "#10B981", color: "white" }}
                    >
                      <CookingPot size={15} />
                      {preparingId === order.id ? "Updating…" : "Start Preparation"}
                    </button>
                  )}

                  {/* Delivery partner assignment */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bike size={13} color="#64748B" style={{ flexShrink: 0 }} />
                    <select
                      className="adm-partner-select"
                      style={{ flex: 1 }}
                      value={order.deliveryPersonId || ""}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); handleAssignPartner(order.id, e.target.value); }}
                    >
                      <option value="">-- Assign Partner --</option>
                      {deliveryPersons.map(dp => <option key={dp.uid} value={dp.uid}>{dp.name}</option>)}
                    </select>
                  </div>
                  {order.deliveryPersonName && (
                    <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={11} /> {order.deliveryPersonName}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination / Load More */}
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => setVisibleCount(prev => prev + 30)}
            style={{ background: "#FFFFFF", color: "#0F172A", border: "1px solid #CBD5E1", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}
          >
            Load More Orders ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}