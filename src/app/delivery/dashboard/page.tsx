"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { Truck, MapPin, Phone, User, Check, Package, LogOut, ArrowRight, MessageCircle, Lock, Eye, EyeOff } from "lucide-react";
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
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [showOtpInput, setShowOtpInput] = useState<Record<string, boolean>>({});
  const [showChatPanel, setShowChatPanel] = useState<Record<string, boolean>>({});
  const [sendingMsg, setSendingMsg] = useState<Record<string, boolean>>({});
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of each chat
  useEffect(() => {
    Object.entries(showChatPanel).forEach(([orderId, visible]) => {
      if (visible && messagesEndRefs.current[orderId]) {
        messagesEndRefs.current[orderId]?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }, [orders, showChatPanel]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const otp = otpInputs[orderId] || "";
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, otp }),
      });
      if (res.ok) {
        fetchOrders();
        toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
        setOtpInputs(prev => ({ ...prev, [orderId]: "" }));
        setShowOtpInput(prev => ({ ...prev, [orderId]: false }));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const sendRiderMessage = async (orderId: string, text: string) => {
    if (sendingMsg[orderId]) return;
    setSendingMsg(prev => ({ ...prev, [orderId]: true }));
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
      setSendingMsg(prev => ({ ...prev, [orderId]: false }));
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
        @keyframes otp-shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
        .otp-shake { animation: otp-shake 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background: "var(--primary)", color: "white", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="otw-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Partner Dashboard</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>{profile?.name || "Demo Partner"}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
            <LogOut size={16} /> <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </div>

      <div className="otw-container" style={{ padding: "32px 24px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px", overflowX: "auto", paddingBottom: "8px" }}>
          <div className="otw-card" style={{ flex: 1, minWidth: 150, padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "12px", background: "#FEF3C7", color: "#92400E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={24} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>To Pickup</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{orders.filter(o => o.status === "preparing").length}</div>
            </div>
          </div>
          <div className="otw-card" style={{ flex: 1, minWidth: 150, padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "12px", background: "#E0F2FE", color: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={24} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>In Transit</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{orders.filter(o => o.status === "out_for_delivery").length}</div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "20px" }}>Active Assignments</h2>

        {orders.length === 0 ? (
          <div className="otw-card" style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>☕</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>No active orders</h3>
            <p style={{ color: "var(--text-muted)" }}>Grab a coffee, waiting for new orders to arrive.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map(order => {
              const chatVisible = !!showChatPanel[order.id];
              const otpVisible = !!showOtpInput[order.id];
              const currentOtp = otpInputs[order.id] || "";
              const isTransit = order.status === "out_for_delivery";

              return (
                <div key={order.id} className="otw-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* Order Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>#{order.id.slice(-6).toUpperCase()}</span>
                        {order.status === "preparing" ?
                          <span className="otw-badge otw-badge-yellow">Preparing</span> :
                          <span className="otw-badge otw-badge-blue">Out for Delivery</span>
                        }
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={14} /> {order.userName}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={14} /> {order.userPhone}</span>
                      </div>
                      {order.scheduledTime && order.scheduledTime !== "ASAP" && (
                        <div style={{ marginTop: "6px", fontSize: "0.82rem", color: "#f59e0b", fontWeight: 700 }}>
                          🕐 Requested: {order.scheduledTime}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)" }}>
                      ₹{order.total}
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ background: "var(--accent)", padding: "16px", borderRadius: "12px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <MapPin size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Delivery Location</div>
                      <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-dark)" }}>{order.location}</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>ITEMS TO DELIVER</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                        <span style={{ fontWeight: 600 }}>{item.quantity}x {item.item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Chat Panel (Transit Only) ── */}
                  {isTransit && (
                    <div>
                      <button
                        onClick={() => setShowChatPanel(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                        style={{ background: chatVisible ? "#e8f4fd" : "transparent", border: "1px solid #3b82f6", color: "#3b82f6", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center" }}
                      >
                        <MessageCircle size={16} />
                        {chatVisible ? "Hide Chat" : `Chat with Customer ${order.messages && order.messages.length > 0 ? `(${order.messages.length})` : ""}`}
                      </button>

                      {chatVisible && (
                        <div style={{ marginTop: "12px", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                          {/* Messages */}
                          <div style={{ maxHeight: "180px", overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", background: "#f8fafc" }}>
                            {(!order.messages || order.messages.length === 0) ? (
                              <div style={{ color: "#94a3b8", fontSize: "0.82rem", textAlign: "center", padding: "12px" }}>No messages yet</div>
                            ) : (
                              order.messages.map((msg, i) => (
                                <div key={i} style={{
                                  alignSelf: msg.sender === "delivery" ? "flex-end" : "flex-start",
                                  background: msg.sender === "delivery" ? "var(--primary)" : "#fff",
                                  color: msg.sender === "delivery" ? "#fff" : "#1e293b",
                                  padding: "7px 12px", borderRadius: msg.sender === "delivery" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                                  fontSize: "0.85rem", fontWeight: 600, maxWidth: "80%",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                  animation: "chat-pop 0.2s ease",
                                }}>
                                  {msg.text}
                                  <div style={{ fontSize: "0.66rem", opacity: 0.6, marginTop: "2px" }}>
                                    {msg.sender === "delivery" ? "You" : "Customer"} · {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              ))
                            )}
                            <div ref={el => { messagesEndRefs.current[order.id] = el; }} />
                          </div>

                          {/* Quick Replies */}
                          <div style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {RIDER_QUICK_MESSAGES.map(msg => (
                              <button
                                key={msg}
                                onClick={() => sendRiderMessage(order.id, msg)}
                                disabled={sendingMsg[order.id]}
                                style={{
                                  background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155",
                                  padding: "6px 12px", borderRadius: "999px", fontSize: "0.78rem",
                                  fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#3b82f6"; }}
                                onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                              >
                                {msg}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Action Buttons ── */}
                  <div style={{ marginTop: "4px" }}>
                    {order.status === "preparing" ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}
                        className="otw-btn otw-btn-primary"
                        style={{ width: "100%", padding: "14px", justifyContent: "center" }}
                      >
                        Mark as Picked Up <ArrowRight size={18} />
                      </button>
                    ) : (
                      <div>
                        {!otpVisible ? (
                          <button
                            onClick={() => setShowOtpInput(prev => ({ ...prev, [order.id]: true }))}
                            className="otw-btn"
                            style={{ width: "100%", padding: "14px", justifyContent: "center", background: "var(--success)", color: "white", boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)" }}
                          >
                            <Lock size={16} /> Enter Delivery OTP
                          </button>
                        ) : (
                          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700, marginBottom: "10px", textAlign: "center", letterSpacing: "0.5px" }}>
                              🔐 Enter 4-digit OTP from Customer
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
                              {[0, 1, 2, 3].map(i => (
                                <input
                                  key={i}
                                  type="tel"
                                  maxLength={1}
                                  value={currentOtp[i] || ""}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    const newOtp = currentOtp.split("");
                                    newOtp[i] = val;
                                    setOtpInputs(prev => ({ ...prev, [order.id]: newOtp.join("").slice(0, 4) }));
                                    // Auto-focus next
                                    if (val && i < 3) {
                                      const next = document.getElementById(`otp-${order.id}-${i + 1}`);
                                      next?.focus();
                                    }
                                  }}
                                  id={`otp-${order.id}-${i}`}
                                  style={{
                                    width: 52, height: 60, textAlign: "center", fontSize: "1.6rem", fontWeight: 900,
                                    border: "2px solid #86efac", borderRadius: "10px", background: "#fff",
                                    color: "#166534", outline: "none",
                                  }}
                                  onFocus={e => e.currentTarget.style.borderColor = "#16a34a"}
                                  onBlur={e => e.currentTarget.style.borderColor = "#86efac"}
                                />
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => { setShowOtpInput(prev => ({ ...prev, [order.id]: false })); setOtpInputs(prev => ({ ...prev, [order.id]: "" })); }}
                                style={{ flex: 1, padding: "12px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => { if (currentOtp.length === 4) handleUpdateStatus(order.id, "delivered"); }}
                                disabled={currentOtp.length !== 4}
                                style={{
                                  flex: 2, padding: "12px", background: currentOtp.length === 4 ? "#16a34a" : "#d1d5db",
                                  color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: currentOtp.length === 4 ? "pointer" : "not-allowed", fontSize: "0.9rem",
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                }}
                              >
                                <Check size={16} /> Confirm Delivered
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
