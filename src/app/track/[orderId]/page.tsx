"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { CheckCircle, Package, ChefHat, Truck, MapPin, Star, Phone, Clock, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_STEPS = [
  { id: "placed", label: "Order Placed", subLabel: "We've received your order", icon: "📋", color: "#6366F1" },
  { id: "confirmed", label: "Order Confirmed", subLabel: "Admin verified & accepted your order", icon: "✅", color: "#0EA5E9" },
  { id: "preparing", label: "In the Kitchen", subLabel: "Your food is being freshly prepared", icon: "🍳", color: "#F59E0B" },
  { id: "out_for_delivery", label: "On the Way", subLabel: "Rider is heading to your location", icon: "🛵", color: "#10B981" },
  { id: "delivered", label: "Delivered!", subLabel: "Enjoy your order 😊", icon: "🎉", color: "#22C55E" },
];

function getStepIndex(status: string, confirmed?: boolean): number {
  if (status === "placed" && !confirmed) return 0;
  if (status === "placed" && confirmed) return 1;
  if (status === "preparing") return 2;
  if (status === "out_for_delivery") return 3;
  if (status === "delivered") return 4;
  return 0;
}

const USER_QUICK_MESSAGES = [
  "Where are you? 📍",
  "How much time? ⏱️",
  "I'm waiting at the gate 🚪",
  "Please hurry! 🙏",
];

export default function TrackOrderPage(props: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    props.params.then(p => setOrderId(p.orderId));
  }, [props.params]);

  const { user, loading } = useApp();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (!orderId || !user) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data: Order = await res.json();
          setOrder(data);
        } else {
          toast.error("Order not found");
          router.push("/orders");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId, user, router]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages]);

  const sendMessage = async (text: string) => {
    if (!orderId || sendingMsg) return;
    setSendingMsg(true);
    try {
      await fetch(`/api/orders/${orderId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", text }),
      });
    } catch {
      toast.error("Could not send message");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading || fetching || !order) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #27272a", borderTop: "4px solid #0055ff", animation: "spin-track 1s linear infinite" }} />
        <style>{`@keyframes spin-track { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#6b7280", fontWeight: 600 }}>Loading order details…</span>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = isCancelled ? -1 : getStepIndex(order.status, order.confirmed);
  const isDelivered = order.status === "delivered";
  const isOnWay = order.status === "out_for_delivery";
  const riderProgress = isOnWay
    ? Math.min(85, 20 + ((Date.now() - new Date(order.updatedAt).getTime()) / 1000 / 60) * 8)
    : isDelivered ? 100 : 0;

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#e4e4e7", fontFamily: "inherit" }}>
      <style>{`
        @keyframes spin-track { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes bounce-rider { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes glow-step { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,85,255,0.4); } 50% { box-shadow: 0 0 0 8px rgba(0,85,255,0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes road-move { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes star-pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        @keyframes otp-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } }
        @keyframes chat-pop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Top Header */}
      <div style={{ background: "#18181b", borderBottom: "1px solid #27272a", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/orders" style={{ color: "#6b7280", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 600 }}>
          ← Orders
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Track Order #{order.id.slice(-6).toUpperCase()}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={12} />
            Placed {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            {order.scheduledTime && order.scheduledTime !== "ASAP" && (
              <> · 🕐 {order.scheduledTime}</>
            )}
            {" · "}
            <MapPin size={12} />
            {order.location}
          </div>
        </div>
        {!isCancelled && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" }}>Total</div>
            <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0055ff" }}>₹{order.total}</div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {isCancelled ? (
          <div style={{ background: "#18181b", border: "1px solid #3f1111", borderRadius: "16px", padding: "40px", textAlign: "center", animation: "fade-up 0.5s ease" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>❌</div>
            <h3 style={{ fontWeight: 900, fontSize: "1.4rem", color: "#ef4444", marginBottom: "8px" }}>Order Cancelled</h3>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6 }}>
              This order has been cancelled. If you have any queries, please contact support.
            </p>
            <Link href="/" style={{ display: "inline-block", marginTop: "24px", background: "#0044ff", color: "#fff", padding: "12px 28px", borderRadius: "8px", fontWeight: 700, textDecoration: "none", textTransform: "uppercase" }}>
              Order Again
            </Link>
          </div>
        ) : (
          <>
            {/* ── Delivery OTP Card (shows when out_for_delivery) ── */}
            {isOnWay && order.deliveryOtp && (
              <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", border: "1px solid #10B981", borderRadius: "16px", padding: "24px", animation: "fade-up 0.4s ease, otp-glow 2s ease-in-out infinite", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#6ee7b7", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                  🔐 Delivery OTP — Share with rider upon arrival
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center", marginBottom: "12px" }}>
                  {showOtp ? (
                    order.deliveryOtp.split("").map((digit, i) => (
                      <div key={i} style={{
                        width: 56, height: 68, borderRadius: "12px", background: "rgba(0,0,0,0.3)",
                        border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "2px"
                      }}>{digit}</div>
                    ))
                  ) : (
                    order.deliveryOtp.split("").map((_, i) => (
                      <div key={i} style={{
                        width: 56, height: 68, borderRadius: "12px", background: "rgba(0,0,0,0.3)",
                        border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", fontWeight: 900, color: "#10B981"
                      }}>●</div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowOtp(v => !v)}
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid #10B981", color: "#6ee7b7", padding: "8px 20px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px" }}
                >
                  {showOtp ? "🙈 Hide OTP" : "👁 Reveal OTP"}
                </button>
                <p style={{ color: "#a7f3d0", fontSize: "0.78rem", marginTop: "10px", lineHeight: 1.5 }}>
                  Your rider will ask for this 4-digit code to confirm delivery. <strong>Do not share with anyone else.</strong>
                </p>
              </div>
            )}

            {/* ── Rider Animation Strip (only when out_for_delivery) ── */}
            {(isOnWay || isDelivered) && (
              <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", animation: "fade-up 0.4s ease", overflow: "hidden" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse-dot 1s ease-in-out infinite" }} />
                  {isDelivered ? "Delivered" : "Rider is on the way"}
                </div>
                <div style={{ position: "relative", height: "60px", background: "#0f0f0f", borderRadius: "12px", overflow: "hidden", border: "1px solid #27272a" }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", display: "flex", gap: "0", overflow: "hidden" }}>
                    <div style={{ height: "2px", width: "200%", background: "repeating-linear-gradient(90deg, #333 0, #333 20px, transparent 20px, transparent 40px)", animation: isDelivered ? "none" : "road-move 1s linear infinite" }} />
                  </div>
                  <div style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "1.6rem" }}>🏪</div>
                  <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-55%)", fontSize: "1.6rem" }}>📍</div>
                  <div style={{
                    position: "absolute", top: "50%",
                    left: isDelivered ? "calc(100% - 48px)" : `${riderProgress}%`,
                    transform: "translateY(-60%)", fontSize: "1.8rem",
                    transition: "left 3s ease-in-out",
                    animation: isDelivered ? "none" : "bounce-rider 0.6s ease-in-out infinite",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                  }}>🛵</div>
                </div>
                {order.deliveryPersonName && (
                  <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0044ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🏍️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{order.deliveryPersonName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>Your delivery partner</div>
                    </div>
                    <a href={`tel:+91${order.userPhone}`} style={{ marginLeft: "auto", background: "#18181b", border: "1px solid #27272a", color: "#fff", padding: "8px 14px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "0.85rem" }}>
                      <Phone size={14} /> Call
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── Quick Chat (only when out_for_delivery) ── */}
            {isOnWay && (
              <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", animation: "fade-up 0.45s ease" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageCircle size={14} /> Chat with Rider
                </div>

                {/* Messages */}
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", padding: "4px" }}>
                  {(!order.messages || order.messages.length === 0) ? (
                    <div style={{ color: "#4b5563", fontSize: "0.85rem", textAlign: "center", padding: "16px" }}>No messages yet. Send a quick update below!</div>
                  ) : (
                    order.messages.map((msg, i) => (
                      <div key={i} style={{
                        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        background: msg.sender === "user" ? "#0044ff" : "#27272a",
                        color: "#fff",
                        padding: "8px 14px", borderRadius: msg.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        fontSize: "0.88rem", fontWeight: 600, maxWidth: "80%",
                        animation: "chat-pop 0.2s ease",
                      }}>
                        {msg.text}
                        <div style={{ fontSize: "0.68rem", opacity: 0.6, marginTop: "3px" }}>
                          {msg.sender === "user" ? "You" : "Rider"} · {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Send Buttons */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {USER_QUICK_MESSAGES.map(msg => (
                    <button
                      key={msg}
                      onClick={() => sendMessage(msg)}
                      disabled={sendingMsg}
                      style={{
                        background: "#1a1a1a", border: "1px solid #3f3f46", color: "#e4e4e7",
                        padding: "8px 14px", borderRadius: "999px", fontSize: "0.82rem",
                        fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "4px",
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = "#0055ff"; e.currentTarget.style.color = "#fff"; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#e4e4e7"; }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5-Step Timeline ── */}
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "28px", animation: "fade-up 0.5s ease" }}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "24px" }}>Order Progress</div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "21px", top: "10px", bottom: "10px", width: "2px", background: "#27272a", zIndex: 0 }} />
                <div style={{
                  position: "absolute", left: "21px", top: "10px",
                  width: "2px",
                  height: `${Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                  background: "linear-gradient(180deg, #0055ff, #10B981)",
                  zIndex: 1, transition: "height 1s ease",
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "32px", position: "relative", zIndex: 2 }}>
                  {STATUS_STEPS.map((step, index) => {
                    const isPast = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const isFuture = index > currentStepIndex;
                    return (
                      <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: "18px", animation: isActive ? "slide-in 0.5s ease" : "none" }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                          background: isPast ? "#059669" : isActive ? "#0055ff" : "#1a1a1a",
                          border: `2px solid ${isPast ? "#059669" : isActive ? "#0055ff" : "#3f3f46"}`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                          animation: isActive ? "glow-step 1.5s ease-in-out infinite" : "none",
                          transition: "all 0.4s ease",
                        }}>
                          {isPast ? <CheckCircle size={20} color="#fff" /> : <span>{step.icon}</span>}
                        </div>
                        <div style={{ paddingTop: "4px", flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "1rem", color: isPast ? "#4ade80" : isActive ? "#fff" : "#3f3f46", transition: "color 0.4s" }}>
                            {step.label}
                          </div>
                          {!isFuture && (
                            <div style={{ fontSize: "0.82rem", color: isActive ? "#a0a0a0" : "#6b7280", marginTop: "3px", lineHeight: 1.4 }}>
                              {step.subLabel}
                              {step.id === "out_for_delivery" && order.deliveryPersonName && (
                                <span> · <strong style={{ color: "#10B981" }}>{order.deliveryPersonName}</strong> is on the way</span>
                              )}
                            </div>
                          )}
                          {isActive && (
                            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,85,255,0.12)", border: "1px solid rgba(0,85,255,0.3)", borderRadius: "999px", padding: "4px 12px" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0055ff", display: "inline-block", animation: "pulse-dot 1s ease-in-out infinite" }} />
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6090ff", letterSpacing: "0.5px" }}>LIVE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Rating (delivered) ── */}
            {isDelivered && (
              <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "28px", textAlign: "center", animation: "fade-up 0.6s ease" }}>
                {ratingSubmitted ? (
                  <div>
                    <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🙏</div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#4ade80" }}>Thanks for your feedback!</div>
                    <div style={{ color: "#6b7280", marginTop: "6px", fontSize: "0.9rem" }}>Your rating has been recorded.</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>How was your order?</div>
                    <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "20px" }}>Rate your experience with ONN DA WAY</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => { setRating(star); setRatingSubmitted(true); toast.success("Thanks for rating! ⭐", { style: { background: "#18181b", color: "#fff" } }); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "2.2rem", transition: "transform 0.15s", animation: star <= rating ? "star-pop 0.3s ease" : "none" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {star <= rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Order Items Summary ── */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", animation: "fade-up 0.7s ease" }}>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px" }}>Your Items</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", padding: "10px 14px", background: "#111", borderRadius: "8px", fontSize: "0.88rem", color: "#a0a0a0", fontWeight: 600 }}>
            <MapPin size={14} color="#0055ff" />
            Delivering to: <strong style={{ color: "#fff", marginLeft: "4px" }}>{order.location}</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "8px", position: "relative", overflow: "hidden", background: "#fff", flexShrink: 0 }}>
                  <Image src={item.item.image} alt={item.item.name} fill sizes="48px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{item.item.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#a0a0a0", fontSize: "0.95rem" }}>₹{item.item.price * item.quantity}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #27272a", marginTop: "16px", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#a0a0a0" }}>Total Paid</span>
            <span style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0055ff" }}>₹{order.total}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
