"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { buildLineDetails } from "@/lib/orderLine";
import {
  Truck, MapPin, Phone, User, Check, Package,
  LogOut, ArrowRight, MessageCircle, Lock,
  Navigation, Clock, ChevronRight, X,
  AlertCircle, Banknote, CreditCard, RefreshCw
} from "lucide-react";
import { getOrderMapsUrl } from "@/lib/maps";
import toast from "react-hot-toast";

const RIDER_QUICK_MESSAGES = [
  "I'm 2 mins away 🛵",
  "Just reached your location 📍",
  "Stuck in traffic, slight delay ⏳",
  "On my way, almost there! 💨",
  "Please come to the gate 🚪",
];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function DeliveryDashboard() {
  const { user, profile, loading } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "delivery") && !localStorage.getItem("otw_delivery_id")) {
      router.push("/delivery/login");
    }
  }, [user, profile, loading, router]);

  const DELIVERY_ID =
    typeof window !== "undefined"
      ? localStorage.getItem("otw_delivery_id") || (profile?.role === "delivery" ? profile.uid : "dp1")
      : "dp1";

  const fetchOrders = async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const res = await fetch(`/api/orders?deliveryPersonId=${DELIVERY_ID}&status=preparing,out_for_delivery`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // silent fail
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    let eventSource: EventSource;
    let timeoutId: NodeJS.Timeout;
    const setupSSE = () => {
      eventSource = new EventSource("/api/orders/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "order_change") fetchOrders(true);
        } catch { /* ignore */ }
      };
      eventSource.onerror = () => {
        eventSource.close();
        timeoutId = setTimeout(setupSSE, 5000);
      };
    };
    setupSSE();
    return () => {
      if (eventSource) eventSource.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  useEffect(() => {
    if (selectedOrder && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedOrder?.messages]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          otp: otpInput,
          deliveryPersonId: DELIVERY_ID, // identify as delivery person
        }),
      });
      if (res.ok) {
        await fetchOrders(true);
        toast.success(newStatus === "delivered" ? "✅ Delivery complete!" : "📦 Pickup confirmed!");
        if (newStatus === "delivered") setSelectedOrderId(null);
        setOtpInput("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error. Try again.");
    }
  };

  const sendRiderMessage = async (orderId: string, text: string) => {
    if (sendingMsg) return;
    setSendingMsg(true);
    try {
      await fetch(`/api/orders/${orderId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "delivery", text }),
      });
      await fetchOrders(true);
    } catch {
      toast.error("Could not send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("otw_delivery_id");
    router.push("/delivery/login");
  };

  const preparing = orders.filter((o) => o.status === "preparing");
  const inTransit = orders.filter((o) => o.status === "out_for_delivery");

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
        @keyframes fade-in  { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .queue-row { transition: background 0.15s; cursor: pointer; }
        .queue-row:active { background: #f0f4ff; }
        .otp-box:focus { border-color: #0135FB !important; box-shadow: 0 0 0 3px rgba(1,53,251,0.15); }
        .msg-btn { transition: all 0.15s; }
        .msg-btn:active { transform: scale(0.96); }
        .refresh-spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0135FB 0%, #0051FF 100%)",
        color: "white", padding: "20px 20px 24px",
        position: "sticky", top: 0, zIndex: 10,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        boxShadow: "0 4px 24px rgba(1,53,251,0.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.15rem", letterSpacing: -0.3 }}>Delivery Dashboard</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.85, fontWeight: 600 }}>{profile?.name || "Demo Partner"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fetchOrders()}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              title="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? "refresh-spin" : ""} />
            </button>
            <button
              onClick={handleLogout}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Package size={18} />
            <div>
              <div style={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 700, textTransform: "uppercase" }}>To Pickup</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, lineHeight: 1 }}>{preparing.length}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={18} />
            <div>
              <div style={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 700, textTransform: "uppercase" }}>In Transit</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, lineHeight: 1 }}>{inTransit.length}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <Banknote size={18} />
            <div>
              <div style={{ fontSize: "0.65rem", opacity: 0.8, fontWeight: 700, textTransform: "uppercase" }}>Cash Due</div>
              <div style={{ fontSize: "1rem", fontWeight: 900, lineHeight: 1 }}>
                ₹{inTransit.filter(o => o.paymentMethod === "COD").reduce((s, o) => s + o.total, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Queue ── */}
      <div style={{ padding: "20px 16px" }}>

        {orders.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>☕</div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1e293b", marginBottom: 6 }}>Queue is empty</div>
            <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Waiting for new orders...</div>
          </div>
        ) : (
          <>
            {/* Preparing section */}
            {preparing.length > 0 && (
              <>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={12} /> Ready to Pickup ({preparing.length})
                </div>
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 16 }}>
                  {preparing.map((order, idx) => (
                    <OrderRow key={order.id} order={order} isLast={idx === preparing.length - 1} onClick={() => { setSelectedOrderId(order.id); setOtpInput(""); }} />
                  ))}
                </div>
              </>
            )}

            {/* In transit section */}
            {inTransit.length > 0 && (
              <>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Truck size={12} /> In Transit ({inTransit.length})
                </div>
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  {inTransit.map((order, idx) => (
                    <OrderRow key={order.id} order={order} isLast={idx === inTransit.length - 1} onClick={() => { setSelectedOrderId(order.id); setOtpInput(""); }} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Order Detail Bottom Sheet ── */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", animation: "fade-in 0.2s ease" }}>
          <div style={{ position: "absolute", inset: 0 }} onClick={() => setSelectedOrderId(null)} />

          <div style={{
            background: "#f8fafc", width: "100%", maxWidth: 480, margin: "0 auto",
            maxHeight: "93vh", borderTopLeftRadius: 24, borderTopRightRadius: 24,
            position: "relative", zIndex: 101, display: "flex", flexDirection: "column",
            animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {/* Sheet handle */}
            <div style={{ width: 40, height: 4, background: "#cbd5e1", borderRadius: 9999, margin: "12px auto 0" }} />

            {/* Sheet Header */}
            <div style={{
              padding: "14px 20px 14px",
              background: "#fff",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#0135FB", textTransform: "uppercase", letterSpacing: 1 }}>
                  {selectedOrder.status === "preparing" ? "📦 Pickup Task" : "🚗 Delivery Task"}
                </div>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a" }}>
                  #{selectedOrder.id.slice(-6).toUpperCase()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                  <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
                  {timeAgo(selectedOrder.createdAt)}
                </span>
                <button onClick={() => setSelectedOrderId(null)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>

              {/* ── PAYMENT BADGE ── */}
              <div style={{
                padding: "10px 16px",
                borderRadius: 12,
                marginBottom: 12,
                background: selectedOrder.paymentMethod === "COD" ? "#fef3c7" : "#f0fdf4",
                border: `1.5px solid ${selectedOrder.paymentMethod === "COD" ? "#fcd34d" : "#86efac"}`,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedOrder.paymentMethod === "COD"
                    ? <Banknote size={18} color="#92400e" />
                    : <CreditCard size={18} color="#166534" />}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: selectedOrder.paymentMethod === "COD" ? "#92400e" : "#166534" }}>
                      {selectedOrder.paymentMethod === "COD" ? "💵 COLLECT CASH" : "✅ ALREADY PAID"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: selectedOrder.paymentMethod === "COD" ? "#b45309" : "#15803d", fontWeight: 600 }}>
                      {selectedOrder.paymentMethod === "COD" ? "Collect payment on delivery" : "Online payment received"}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: "1.3rem", color: selectedOrder.paymentMethod === "COD" ? "#92400e" : "#166534" }}>
                  ₹{selectedOrder.total}
                </div>
              </div>

              {/* ── ADDRESS CARD ── */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>📍 Delivery Address</div>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a", lineHeight: 1.35, marginBottom: selectedOrder.locationNotes ? 10 : 14 }}>
                  {selectedOrder.location}
                </div>
                {selectedOrder.locationNotes && (
                  <div style={{ background: "#fef9c3", borderRadius: 10, padding: "10px 12px", fontSize: "0.85rem", color: "#854d0e", fontWeight: 700, marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{selectedOrder.locationNotes}</span>
                  </div>
                )}
                <a
                  href={getOrderMapsUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px 0",
                    background: "#0135FB", color: "#fff",
                    borderRadius: 12, fontWeight: 800, fontSize: "0.95rem",
                    textDecoration: "none", boxShadow: "0 4px 12px rgba(1,53,251,0.3)"
                  }}
                >
                  <Navigation size={16} /> Open in Google Maps
                </a>
              </div>

              {/* ── CUSTOMER CARD ── */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>👤 Customer</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={20} color="#475569" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{selectedOrder.userName}</div>
                      <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>+91 {selectedOrder.userPhone}</div>
                    </div>
                  </div>
                  <a
                    href={`tel:+91${selectedOrder.userPhone}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#dcfce7", color: "#15803d",
                      padding: "10px 16px", borderRadius: 10,
                      fontWeight: 800, fontSize: "0.85rem", textDecoration: "none",
                      border: "1.5px solid #86efac"
                    }}
                  >
                    <Phone size={15} /> Call
                  </a>
                </div>
              </div>

              {/* ── ITEMS CARD ── */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                  🧾 Order Items ({selectedOrder.items.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedOrder.items.map((item, idx) => {
                    const details = item.lineDetails || buildLineDetails(item.selectedCustomizations, item.specialInstructions);
                    const unit = item.unitPrice ?? item.item.price ?? 0;
                    return (
                      <div key={idx} style={{
                        borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid #f1f5f9" : "none",
                        paddingBottom: idx < selectedOrder.items.length - 1 ? 10 : 0
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
                            {item.quantity}× {item.item.name}
                          </div>
                          <div style={{ fontWeight: 800, color: "#0135FB", fontSize: "0.95rem", flexShrink: 0, marginLeft: 8 }}>
                            ₹{unit * item.quantity}
                          </div>
                        </div>
                        {details && (
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>{details}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1.5px dashed #cbd5e1", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#64748b" }}>
                    {selectedOrder.paymentMethod === "COD" ? "💰 Collect" : "Total"}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* ── CHAT (In Transit) ── */}
              {selectedOrder.status === "out_for_delivery" && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <MessageCircle size={12} /> Message Customer
                  </div>
                  {/* Chat history */}
                  {selectedOrder.messages && selectedOrder.messages.length > 0 && (
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 10, maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, border: "1px solid #e2e8f0" }}>
                      {selectedOrder.messages.map((msg, i) => (
                        <div key={i} style={{
                          alignSelf: msg.sender === "delivery" ? "flex-end" : "flex-start",
                          background: msg.sender === "delivery" ? "#0135FB" : "#fff",
                          color: msg.sender === "delivery" ? "#fff" : "#1e293b",
                          padding: "6px 11px", borderRadius: msg.sender === "delivery" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                          fontSize: "0.82rem", fontWeight: 600, maxWidth: "85%",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
                        }}>
                          {msg.text}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                  {/* Quick message buttons */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {RIDER_QUICK_MESSAGES.map(msg => (
                      <button
                        key={msg}
                        className="msg-btn"
                        onClick={() => sendRiderMessage(selectedOrder.id, msg)}
                        disabled={sendingMsg}
                        style={{
                          background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569",
                          padding: "7px 11px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
                          cursor: "pointer", opacity: sendingMsg ? 0.6 : 1
                        }}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky Action Footer ── */}
            <div style={{ padding: "14px 16px 28px", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
              {selectedOrder.status === "preparing" ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "out_for_delivery")}
                  style={{
                    width: "100%", padding: "17px 0",
                    background: "linear-gradient(135deg, #0135FB, #0051FF)",
                    color: "#fff", border: "none", borderRadius: 14,
                    fontWeight: 900, fontSize: "1.05rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 6px 20px rgba(1,53,251,0.35)"
                  }}
                >
                  ✅ Picked Up — Start Delivery <ArrowRight size={18} />
                </button>
              ) : (
                <div>
                  {/* OTP section */}
                  <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 16, padding: "18px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, justifyContent: "center" }}>
                      <Lock size={14} color="#166534" />
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#166534" }}>Enter 4-Digit OTP from Customer</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 4 }}>
                      {[0, 1, 2, 3].map(i => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="tel"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpInput[i] || ""}
                          className="otp-box"
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "").slice(-1);
                            const chars = otpInput.split("");
                            chars[i] = val;
                            const newOtp = chars.join("").slice(0, 4);
                            setOtpInput(newOtp);
                            if (val && i < 3) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={e => {
                            if (e.key === "Backspace" && !otpInput[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          style={{
                            width: 58, height: 66, textAlign: "center",
                            fontSize: "2rem", fontWeight: 900,
                            border: "2px solid #4ade80", borderRadius: 14,
                            background: "#fff", color: "#166534", outline: "none",
                            transition: "border-color 0.15s, box-shadow 0.15s"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { if (otpInput.length === 4) handleUpdateStatus(selectedOrder.id, "delivered"); }}
                    disabled={otpInput.length !== 4}
                    style={{
                      width: "100%", padding: "17px 0",
                      background: otpInput.length === 4 ? "linear-gradient(135deg, #16a34a, #15803d)" : "#cbd5e1",
                      color: "white", border: "none", borderRadius: 14,
                      fontWeight: 900, fontSize: "1.05rem",
                      cursor: otpInput.length === 4 ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "background 0.2s",
                      boxShadow: otpInput.length === 4 ? "0 6px 20px rgba(22,163,74,0.35)" : "none"
                    }}
                  >
                    <Check size={18} /> Complete Delivery
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, isLast, onClick }: { order: Order; isLast: boolean; onClick: () => void }) {
  const isTransit = order.status === "out_for_delivery";
  return (
    <div
      className="queue-row"
      onClick={onClick}
      style={{
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{ fontWeight: 900, fontSize: "0.95rem", color: "#0f172a" }}>
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span style={{
            fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 5,
            background: isTransit ? "#dbeafe" : "#fef3c7",
            color: isTransit ? "#1e40af" : "#b45309"
          }}>
            {isTransit ? "🚗 Transit" : "📦 Pickup"}
          </span>
          {order.paymentMethod === "COD" && (
            <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, background: "#fef9c3", color: "#854d0e" }}>
              💵 COD
            </span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <MapPin size={11} style={{ display: "inline", marginRight: 3 }} />
          {order.location}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>
          {order.userName} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, color: "#0135FB", fontSize: "1rem" }}>₹{order.total}</div>
        </div>
        <ChevronRight size={18} color="#94a3b8" />
      </div>
    </div>
  );
}
