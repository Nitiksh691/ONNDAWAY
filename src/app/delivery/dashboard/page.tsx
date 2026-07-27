"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { buildLineDetails } from "@/lib/orderLine";
import { Truck, MapPin, Phone, User, Check, Package, LogOut, ArrowRight, MessageCircle, Lock, Navigation, Clock, Tag, X, ChevronRight } from "lucide-react";
import { getOrderMapsUrl, getOrderMapsEmbedUrl } from "@/lib/maps";
import toast from "react-hot-toast";

const RIDER_QUICK_MESSAGES = [
  "I'm 2 mins away 🛵",
  "Just reached your location 📍",
  "Stuck in traffic, slight delay ⏳",
  "On my way, almost there! 💨",
  "Please come to the gate 🚪",
];

export default function DeliveryDashboard() {
  const { user, profile, loading } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "delivery") && !localStorage.getItem("otw_delivery_id")) {
      router.push("/delivery/login");
    }
  }, [user, profile, loading, router]);

  const DELIVERY_ID = typeof window !== "undefined"
    ? (localStorage.getItem("otw_delivery_id") || (profile?.role === "delivery" ? profile.uid : "dp1"))
    : "dp1";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?deliveryPersonId=${DELIVERY_ID}&status=preparing,out_for_delivery`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();

    let eventSource: EventSource;
    const setupSSE = () => {
      eventSource = new EventSource("/api/orders/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "order_change") fetchOrders();
        } catch (e) {}
      };
      eventSource.onerror = () => {
        eventSource.close();
        setTimeout(setupSSE, 5000);
      };
    };
    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Auto-scroll chat
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
        body: JSON.stringify({ status: newStatus, otp: otpInput }),
      });
      if (res.ok) {
        await fetchOrders();
        toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
        if (newStatus === "delivered") {
          setSelectedOrderId(null);
        }
        setOtpInput("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
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
      await fetchOrders();
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

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh" }}>
      <style>{`
        @keyframes chat-pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .queue-row:hover { background: #f8fafc; }
      `}</style>

      {/* Header */}
      <div style={{ background: "var(--primary)", color: "white", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="otw-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>Partner Dashboard</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{profile?.name || "Demo Partner"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
            <LogOut size={14} /> <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </div>

      <div className="otw-container" style={{ padding: "20px" }}>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button onClick={() => router.push('/')} style={{ flex: 1, minWidth: "140px", padding: "12px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(0,85,255,0.2)", fontSize: "0.85rem" }}>
            <MapPin size={16} /> Explore Site
          </button>
          <button onClick={() => router.push('/delivery/walkin')} style={{ flex: 1, minWidth: "140px", padding: "12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(245,158,11,0.2)", fontSize: "0.85rem" }}>
            <User size={16} /> Walk-in
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "#FEF3C7", color: "#92400E", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={20} /></div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>To Pickup</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>{orders.filter(o => o.status === "preparing").length}</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "#E0F2FE", color: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center" }}><Truck size={20} /></div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>In Transit</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>{orders.filter(o => o.status === "out_for_delivery").length}</div>
            </div>
          </div>
        </div>

        {/* Queue View */}
        <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>Order Queue</h2>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{orders.length} Active</span>
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>☕</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px", color: "#334155" }}>Queue is empty</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>Waiting for new orders to arrive.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {orders.map((order, idx) => {
                const isTransit = order.status === "out_for_delivery";
                return (
                  <div
                    key={order.id}
                    className="queue-row"
                    onClick={() => { setSelectedOrderId(order.id); setOtpInput(""); }}
                    style={{
                      padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: idx < orders.length - 1 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer", transition: "background 0.2s"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>#{order.id.slice(-6).toUpperCase()}</span>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", padding: "2px 6px", borderRadius: "4px",
                          background: isTransit ? "#dbeafe" : "#fef3c7",
                          color: isTransit ? "#1e40af" : "#b45309"
                        }}>
                          {isTransit ? "Transit" : "Preparing"}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.userName} • {order.location}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.95rem" }}>₹{order.total}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>{order.items.length} items</div>
                      </div>
                      <ChevronRight size={18} color="#94a3b8" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", animation: "fade-in 0.2s ease" }}>
          
          {/* Backdrop click to close */}
          <div style={{ position: "absolute", inset: 0 }} onClick={() => setSelectedOrderId(null)} />
          
          {/* Modal Content */}
          <div style={{ background: "#f8fafc", width: "100%", maxHeight: "90vh", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", position: "relative", zIndex: 101, display: "flex", flexDirection: "column", animation: "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                  {selectedOrder.status === "preparing" ? "Pickup Task" : "Delivery Task"}
                </div>
                <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>#{selectedOrder.id.slice(-6).toUpperCase()}</div>
              </div>
              <button onClick={() => setSelectedOrderId(null)} style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              
              {/* Customer Contact Card */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}><User size={20} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>{selectedOrder.userName}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>+91 {selectedOrder.userPhone}</div>
                    </div>
                  </div>
                  <a href={`tel:+91${selectedOrder.userPhone}`} style={{ width: 40, height: 40, borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <Phone size={18} />
                  </a>
                </div>
              </div>

              {/* Location Card */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                  <MapPin size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Delivery Address</div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", lineHeight: 1.4 }}>{selectedOrder.location}</div>
                    {selectedOrder.locationNotes && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
                        Note: {selectedOrder.locationNotes}
                      </div>
                    )}
                  </div>
                  <a href={getOrderMapsUrl(selectedOrder)} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 12px", background: "#eff6ff", borderRadius: "8px", color: "#3b82f6", textDecoration: "none", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Navigation size={14} /> Maps
                  </a>
                </div>
                {getOrderMapsEmbedUrl(selectedOrder) && (
                  <iframe title={`Map ${selectedOrder.id}`} src={getOrderMapsEmbedUrl(selectedOrder)!} width="100%" height="140" style={{ border: 0, borderRadius: "10px", display: "block" }} loading="lazy" />
                )}
              </div>

              {/* Items Card */}
              <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>Order Items ({selectedOrder.items.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedOrder.items.map((item, idx) => {
                    const details = item.lineDetails || buildLineDetails(item.selectedCustomizations, item.specialInstructions);
                    const unit = item.unitPrice ?? item.item.price ?? 0;
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: idx < selectedOrder.items.length - 1 ? "12px" : "0" }}>
                        <div>
                          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{item.quantity}× {item.item.name}</span>
                          {details && <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>{details}</div>}
                        </div>
                        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "0.95rem" }}>₹{unit * item.quantity}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: "12px", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#64748b" }}>To Collect (Cash)</span>
                  <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a" }}>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Chat Card (In Transit) */}
              {selectedOrder.status === "out_for_delivery" && (
                <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MessageCircle size={14} /> Chat with Customer
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
                    {(!selectedOrder.messages || selectedOrder.messages.length === 0) ? (
                      <div style={{ color: "#94a3b8", fontSize: "0.8rem", textAlign: "center" }}>Send a quick update to the customer</div>
                    ) : (
                      selectedOrder.messages.map((msg, i) => (
                        <div key={i} style={{
                          alignSelf: msg.sender === "delivery" ? "flex-end" : "flex-start",
                          background: msg.sender === "delivery" ? "var(--primary)" : "#fff",
                          color: msg.sender === "delivery" ? "#fff" : "#1e293b",
                          padding: "6px 12px", borderRadius: msg.sender === "delivery" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                          fontSize: "0.85rem", fontWeight: 600, maxWidth: "85%",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}>
                          {msg.text}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {RIDER_QUICK_MESSAGES.slice(0, 4).map(msg => (
                      <button key={msg} onClick={() => sendRiderMessage(selectedOrder.id, msg)} disabled={sendingMsg} style={{ background: "#f1f5f9", border: "none", color: "#475569", padding: "6px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Sticky Footer Action */}
            <div style={{ padding: "16px 24px 32px", background: "#fff", borderTop: "1px solid #e2e8f0", borderBottomLeftRadius: "24px", borderBottomRightRadius: "24px" }}>
              {selectedOrder.status === "preparing" ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "out_for_delivery")}
                  style={{ width: "100%", padding: "16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(0,85,255,0.3)" }}
                >
                  Confirm Pickup <ArrowRight size={18} />
                </button>
              ) : (
                <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "16px", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 800, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Lock size={16} /> Enter 4-Digit Delivery OTP
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "16px" }}>
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        type="tel"
                        maxLength={1}
                        value={otpInput[i] || ""}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          const newOtp = otpInput.split("");
                          newOtp[i] = val;
                          setOtpInput(newOtp.join("").slice(0, 4));
                          if (val && i < 3) {
                            document.getElementById(`modal-otp-${i + 1}`)?.focus();
                          }
                        }}
                        id={`modal-otp-${i}`}
                        style={{ width: 56, height: 64, textAlign: "center", fontSize: "1.8rem", fontWeight: 900, border: "2px solid #4ade80", borderRadius: "12px", background: "#fff", color: "#166534", outline: "none" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#16a34a"}
                        onBlur={e => e.currentTarget.style.borderColor = "#4ade80"}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => { if (otpInput.length === 4) handleUpdateStatus(selectedOrder.id, "delivered"); }}
                    disabled={otpInput.length !== 4}
                    style={{ width: "100%", padding: "16px", background: otpInput.length === 4 ? "#16a34a" : "#94a3b8", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1rem", cursor: otpInput.length === 4 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
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
