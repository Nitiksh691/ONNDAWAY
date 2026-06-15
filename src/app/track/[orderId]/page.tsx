"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { clearActiveOrderId, getActiveOrderId } from "@/lib/activeOrder";
import { getOrderMapsEmbedUrl } from "@/lib/maps";
import { CheckCircle, MapPin, Clock, MessageCircle, Navigation, Phone } from "lucide-react";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, COMPANY_BLURB, COMPANY_NAME } from "@/lib/company";
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

  const { loading } = useApp();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [animTick, setAnimTick] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Animate rider position smoothly while on the way
  useEffect(() => {
    const t = setInterval(() => setAnimTick(v => v + 1), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data: Order = await res.json();
          const sessionUid = localStorage.getItem(STORAGE_KEYS.userId);
          const isOwner = sessionUid && data.userId === sessionUid;
          const isActive = getActiveOrderId() === orderId;
          if (!isOwner && !isActive) {
            toast.error("You don't have access to this order");
            router.push("/orders");
            return;
          }
          setOrder(data);
          if (data.status === "delivered" || data.status === "cancelled") {
            clearActiveOrderId();
          }
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
    if (!loading) fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId, loading, router]);

  // Scroll only inside chat panel — never jump the whole page
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || !order?.messages?.length) return;
    el.scrollTop = el.scrollHeight;
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

  const submitReview = async () => {
    if (!rating) {
      toast.error("Please select a rating first.");
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: reviewText }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
        toast.success("Thanks for rating! ⭐", { style: { background: "#18181b", color: "#fff" } });
        // Update local order object so the UI reflects it immediately
        setOrder(prev => prev ? { ...prev, rating, review: reviewText } : prev);
      } else {
        toast.error("Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
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
    ? Math.min(88, 18 + ((Date.now() - new Date(order.updatedAt).getTime()) / 1000 / 60) * 9 + (animTick % 3))
    : isDelivered ? 100 : order.status === "preparing" ? 35 : order.confirmed ? 22 : 8;

  const mapEmbed = getOrderMapsEmbedUrl(order);
  const currentStep = STATUS_STEPS[Math.max(0, currentStepIndex)];

  return (
    <div style={{ background: "linear-gradient(180deg, #0a0a12 0%, #111 40%, #111 100%)", minHeight: "100vh", color: "#e4e4e7", fontFamily: "inherit" }}>
      <style>{`
        @keyframes spin-track { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes bounce-rider { 0%, 100% { transform: translate(-50%, -65%) translateY(0) rotate(-3deg); } 50% { transform: translate(-50%, -65%) translateY(-6px) rotate(3deg); } }
        @keyframes glow-step { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,85,255,0.4); } 50% { box-shadow: 0 0 0 8px rgba(0,85,255,0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes road-move { from { background-position: 0 0; } to { background-position: -48px 0; } }
        @keyframes star-pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        @keyframes otp-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } }
        @keyframes chat-pop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cloud-drift { from { transform: translateX(0); } to { transform: translateX(24px); } }
      `}</style>

      {/* Hero status banner */}
      <div style={{
        background: isCancelled ? "linear-gradient(135deg, #450a0a, #7f1d1d)" : `linear-gradient(135deg, ${currentStep?.color || "#0055ff"}22, #01235F 50%, #0044ff33)`,
        borderBottom: "1px solid #27272a",
        padding: "28px 24px 24px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <Link href="/orders" style={{ color: "#93c5fd", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                ← My Orders
              </Link>
              <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{currentStep?.icon || "📦"}</div>
              <h1 style={{ fontWeight: 900, fontSize: "clamp(1.4rem, 4vw, 1.9rem)", color: "#fff", margin: 0 }}>
                {isCancelled ? "Order Cancelled" : currentStep?.label}
              </h1>
              <p style={{ color: "#a1a1aa", marginTop: 8, fontSize: "0.95rem", lineHeight: 1.5 }}>
                {isCancelled ? "This order was cancelled." : currentStep?.subLabel}
              </p>
            </div>
            {!isCancelled && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "#71717a", letterSpacing: "1px", textTransform: "uppercase" }}>#{order.id.slice(-6).toUpperCase()}</div>
                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#60a5fa", marginTop: 4 }}>₹{order.total}</div>
                <div style={{ fontSize: "0.78rem", color: "#71717a", marginTop: 6, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
          </div>
          {!isCancelled && !isDelivered && (
            <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,85,255,0.15)", border: "1px solid rgba(96,165,250,0.35)", borderRadius: 999, padding: "6px 14px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#93c5fd", letterSpacing: "1px" }}>LIVE UPDATES</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px 100px", display: "flex", flexDirection: "column", gap: "24px" }}>

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

            {/* ── Cartoon delivery scene ── */}
            {!isDelivered && (
              <div style={{ background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)", border: "1px solid #334155", borderRadius: "20px", padding: "20px", animation: "fade-up 0.4s ease", overflow: "hidden" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1s ease-in-out infinite" }} />
                  {isOnWay ? "Rider en route to you" : "Preparing your order"}
                </div>
                <div style={{ position: "relative", height: 120, borderRadius: 14, overflow: "hidden", background: "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 35%, #86efac 35%, #4ade80 100%)" }}>
                  <span style={{ position: "absolute", top: 12, left: 24, fontSize: "1.4rem", opacity: 0.7, animation: "cloud-drift 4s ease-in-out infinite alternate" }}>☁️</span>
                  <span style={{ position: "absolute", top: 20, right: 60, fontSize: "1rem", opacity: 0.5, animation: "cloud-drift 5s ease-in-out infinite alternate-reverse" }}>☁️</span>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 44, background: "#374151" }} />
                  <div style={{ position: "absolute", bottom: 44, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #fbbf24 0, #fbbf24 16px, #1f2937 16px, #1f2937 32px)", animation: isOnWay ? "road-move 0.7s linear infinite" : "none" }} />
                  <span style={{ position: "absolute", bottom: 48, left: 12, fontSize: "1.8rem" }}>🏪</span>
                  <span style={{ position: "absolute", bottom: 50, right: 12, fontSize: "1.6rem" }}>🏠</span>
                  <span style={{ position: "absolute", bottom: 52, left: `${riderProgress}%`, fontSize: "2rem", transition: "left 2.5s ease", animation: isOnWay ? "bounce-rider 0.55s ease-in-out infinite" : "none", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))", transform: "translateX(-50%)" }}>🛵</span>
                  {isOnWay && (
                    <span style={{ position: "absolute", bottom: 78, left: `${riderProgress}%`, transform: "translateX(-50%)", fontSize: "0.65rem", fontWeight: 800, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {order.deliveryPersonName || "Your rider"}
                    </span>
                  )}
                </div>
                {order.deliveryPersonName && (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0044ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🏍️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>{order.deliveryPersonName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Delivery partner</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map preview when GPS captured */}
            {mapEmbed && !isDelivered && (
              <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", overflow: "hidden", animation: "fade-up 0.45s ease" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #27272a" }}>
                  <Navigation size={16} color="#60a5fa" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#e4e4e7" }}>Your delivery pin</span>
                </div>
                <iframe title="Delivery location" src={mapEmbed} width="100%" height="180" style={{ border: 0, display: "block" }} loading="lazy" />
              </div>
            )}

            {/* ── Quick Chat (only when out_for_delivery) ── */}
            {isOnWay && (
              <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", animation: "fade-up 0.45s ease" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageCircle size={14} /> Chat with Rider
                </div>

                {/* Messages */}
                <div ref={chatScrollRef} style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", padding: "4px" }}>
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
                {(order.rating || ratingSubmitted) ? (
                  <div>
                    <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🙏</div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#4ade80" }}>Thanks for your feedback!</div>
                    <div style={{ color: "#e4e4e7", marginTop: "12px", fontSize: "1.4rem" }}>
                      {Array(order.rating || rating).fill("⭐").join("")}
                    </div>
                    {(order.review || reviewText) && (
                      <div style={{ background: "#27272a", padding: "12px", borderRadius: "8px", marginTop: "12px", fontSize: "0.9rem", color: "#a0a0a0", fontStyle: "italic" }}>
                        "{order.review || reviewText}"
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "1.8rem", marginBottom: "8px", fontWeight: 800 }}>How was your order?</div>
                    <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "20px" }}>Rate your experience with ONN DA WAY</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "2.4rem", transition: "transform 0.15s", animation: star <= rating ? "star-pop 0.3s ease" : "none" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        >
                          {star <= rating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <div style={{ animation: "fade-up 0.4s ease" }}>
                        <textarea
                          placeholder="Tell us what you liked or how we can improve (optional)"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          style={{
                            width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #3f3f46",
                            background: "#111", color: "#fff", resize: "none", height: "80px", marginBottom: "16px",
                            fontFamily: "inherit", fontSize: "0.95rem"
                          }}
                        />
                        <button 
                          onClick={submitReview}
                          style={{
                            background: "#0055ff", color: "#fff", border: "none", padding: "12px 24px",
                            borderRadius: "8px", fontWeight: 800, fontSize: "1rem", cursor: "pointer", width: "100%",
                            textTransform: "uppercase", letterSpacing: "1px"
                          }}
                        >
                          Submit Feedback
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Order Items Summary ── */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", animation: "fade-up 0.7s ease" }}>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px" }}>Your Items</div>
          <div style={{ marginBottom: 16, padding: "14px 16px", background: "#111", borderRadius: "10px", border: "1px solid #27272a" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.88rem", color: "#a0a0a0", fontWeight: 600 }}>
              <MapPin size={16} color="#0055ff" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ color: "#71717a", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Delivering to</div>
                <strong style={{ color: "#fff", display: "block" }}>{order.location}</strong>
                {order.locationNotes && <div style={{ color: "#93c5fd", marginTop: 6, fontSize: "0.82rem" }}>📝 {order.locationNotes}</div>}
                {order.scheduledTime && order.scheduledTime !== "ASAP" && (
                  <div style={{ color: "#fbbf24", marginTop: 6, fontSize: "0.82rem" }}>🕐 {order.scheduledTime}</div>
                )}
              </div>
            </div>
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

        {/* Support helpline */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20, animation: "fade-up 0.7s ease" }}>
          <div style={{ fontSize: "0.72rem", color: "#71717a", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
            Need help?
          </div>
          <p style={{ color: "#a1a1aa", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 14 }}>
            {COMPANY_NAME} is bootstrapped and serving fresh food daily. Call us for any enquiry about your order.
          </p>
          <a href={SUPPORT_TEL} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#01235F", color: "#fff", padding: "11px 20px", borderRadius: 10,
            fontWeight: 800, textDecoration: "none", fontSize: "0.9rem",
          }}>
            <Phone size={17} /> Call {SUPPORT_PHONE_DISPLAY}
          </a>
          <p style={{ color: "#52525b", fontSize: "0.78rem", marginTop: 10, lineHeight: 1.5 }}>{COMPANY_BLURB}</p>
        </div>

      </div>
    </div>
  );
}
