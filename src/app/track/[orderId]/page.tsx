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
import WalkingLoader from "@/components/WalkingLoader";

const STATUS_STEPS = [
  { id: "placed", label: "Order Placed", subLabel: "We've received your order", icon: "📋", color: "#6366F1" },
  { id: "confirmed", label: "Confirmed", subLabel: "Admin verified & accepted", icon: "✅", color: "#0EA5E9" },
  { id: "preparing", label: "In Kitchen", subLabel: "Freshly being prepared", icon: "🍳", color: "#F59E0B" },
  { id: "out_for_delivery", label: "On the Way", subLabel: "Rider heading to you", icon: "🛵", color: "#10B981" },
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
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);



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
    
    if (order?.status === "delivered" || order?.status === "cancelled") return;

    let eventSource: EventSource;
    const setupSSE = () => {
      eventSource = new EventSource("/api/orders/stream");
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "order_change" && data.documentKey?._id === orderId) {
            fetchOrder();
          }
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
  }, [orderId, loading, router, order?.status]);

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
      // optimistically add
      setOrder(prev => {
        if (!prev) return prev;
        return { ...prev, messages: [...(prev.messages || []), { id: Date.now().toString(), sender: "user", text, timestamp: new Date().toISOString() }] };
      });
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };


  const handleFeedbackSubmit = async () => {
    if (!orderId || !feedbackText.trim() || feedbackLoading) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbackText }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        toast.success("Feedback submitted! Thank you.");
      } else {
        toast.error("Failed to submit feedback");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading || fetching || !order) {
    return (
      <div style={{ background: "#F5F7FF", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <WalkingLoader size={60} color="#0135FB" />
        <span style={{ color: "#6B7280", fontWeight: 600, fontSize: "0.9rem" }}>Loading order details…</span>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = isCancelled ? -1 : getStepIndex(order.status, order.confirmed);
  const isDelivered = order.status === "delivered";
  const isOnWay = order.status === "out_for_delivery";

  const mapEmbed = getOrderMapsEmbedUrl(order);
  const currentStep = STATUS_STEPS[Math.max(0, currentStepIndex)];

  /* Shared card style */
  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 16px rgba(1,53,251,0.06)",
  };

  return (
    <div style={{ background: "#F5F7FF", minHeight: "100vh", color: "#0A0F2E", fontFamily: "inherit" }}>
      <style>{`
        @keyframes spin-track { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes bounce-rider { 0%, 100% { transform: translate(-50%, -65%) translateY(0) rotate(-3deg); } 50% { transform: translate(-50%, -65%) translateY(-6px) rotate(3deg); } }
        @keyframes glow-step { 0%, 100% { box-shadow: 0 0 0 0 rgba(1,53,251,0.3); } 50% { box-shadow: 0 0 0 8px rgba(1,53,251,0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes road-move { from { background-position: 0 0; } to { background-position: -48px 0; } }
        @keyframes star-pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        @keyframes otp-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } }
        @keyframes chat-pop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cloud-drift { from { transform: translateX(0); } to { transform: translateX(24px); } }
        .otw-chat-quick:hover { border-color: #0135FB !important; color: #0135FB !important; background: #EEF1FF !important; }
        .otw-track-back:hover { color: #0135FB !important; }
        .otw-otp-toggle:hover { background: rgba(16,185,129,0.15) !important; }
      `}</style>

      {/* ── Hero Status Banner ── */}
      <div style={{
        background: isCancelled
          ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
          : `linear-gradient(135deg, #0135FB 0%, #0060D6 60%, #0075FF 100%)`,
        padding: "16px 20px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: "1.6rem", background: "rgba(255,255,255,0.15)", width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isCancelled ? "❌" : currentStep?.icon || "📦"}
              </div>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: "1.25rem", color: isCancelled ? "#DC2626" : "#fff", margin: 0, letterSpacing: "0.5px" }}>
                  {isCancelled ? "Cancelled" : currentStep?.label}
                </h1>
                <p style={{ color: isCancelled ? "#6B7280" : "rgba(255,255,255,0.85)", marginTop: 2, fontSize: "0.8rem", margin: 0 }}>
                  {isCancelled ? "This order was cancelled." : currentStep?.subLabel}
                </p>
              </div>
            </div>
            {!isCancelled && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>#{order.id.slice(-6).toUpperCase()}</div>
                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#fff", marginTop: 4 }}>₹{order.total}</div>
                <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.65)", marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px 100px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {isCancelled ? (
          <div style={{ ...cardStyle, padding: "40px 32px", textAlign: "center", animation: "fade-up 0.5s ease" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>❌</div>
            <h3 style={{ fontWeight: 900, fontSize: "1.3rem", color: "#EF4444", marginBottom: "8px" }}>Order Cancelled</h3>
            <p style={{ color: "#6B7280", fontSize: "0.92rem", lineHeight: 1.6 }}>
              This order has been cancelled. If you have any queries, please contact support.
            </p>
            <Link href="/" style={{ display: "inline-block", marginTop: "24px", background: "#0135FB", color: "#fff", padding: "12px 28px", borderRadius: "10px", fontWeight: 700, textDecoration: "none", textTransform: "uppercase", boxShadow: "0 4px 0 #0028D4" }}>
              Order Again
            </Link>
          </div>
        ) : (
          <>
            {/* ── Delivery OTP (out_for_delivery) ── */}
            {isOnWay && order.deliveryOtp && (
              <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: "16px", padding: "24px", animation: "fade-up 0.4s ease, otp-glow 2s ease-in-out infinite", textAlign: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "#6ee7b7", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
                  🔐 Delivery OTP — Share with rider upon arrival
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", marginBottom: "12px" }}>
                  {showOtp ? (
                    order.deliveryOtp.split("").map((digit, i) => (
                      <div key={i} style={{ width: 52, height: 64, borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", fontWeight: 900, color: "#fff" }}>{digit}</div>
                    ))
                  ) : (
                    order.deliveryOtp.split("").map((_, i) => (
                      <div key={i} style={{ width: 52, height: 64, borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "2px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", fontWeight: 900, color: "#10B981" }}>●</div>
                    ))
                  )}
                </div>
                <button
                  className="otw-otp-toggle"
                  onClick={() => setShowOtp(v => !v)}
                  style={{ background: "rgba(0,0,0,0.25)", border: "1px solid #10B981", color: "#6ee7b7", padding: "7px 18px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px", transition: "background 0.15s" }}
                >
                  {showOtp ? "🙈 Hide OTP" : "👁 Reveal OTP"}
                </button>
                <p style={{ color: "#a7f3d0", fontSize: "0.76rem", marginTop: "10px", lineHeight: 1.5 }}>
                  Share this 4-digit code with your rider to confirm delivery. <strong>Do not share with anyone else.</strong>
                </p>
              </div>
            )}

            {/* ── Premium Progress Indicator ── */}
            {!isDelivered && (
              <div style={{ ...cardStyle, padding: "20px", animation: "fade-up 0.4s ease", overflow: "hidden", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(1, 53, 251, 0.1)", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: "rgba(1, 53, 251, 0.2)", animation: "pulse-dot 2s ease-in-out infinite 0.5s" }} />
                  <div style={{ position: "absolute", inset: 12, borderRadius: "50%", background: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.75rem", color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1s ease-in-out infinite" }} />
                    Live ETA
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0A0F2E" }}>
                    {isOnWay ? "~5-10 Minutes" : "Preparing..."}
                  </div>
                </div>
                {order.deliveryPersonName && isOnWay && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0A0F2E" }}>{order.deliveryPersonName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>Delivery Partner</div>
                  </div>
                )}
              </div>
            )}

            {/* ── Map Preview ── */}
            {mapEmbed && !isDelivered && (
              <div style={{ ...cardStyle, overflow: "hidden", animation: "fade-up 0.45s ease" }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <Navigation size={15} color="#0135FB" />
                  <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "#0A0F2E" }}>Your delivery pin</span>
                </div>
                <iframe title="Delivery location" src={mapEmbed} width="100%" height="180" style={{ border: 0, display: "block" }} loading="lazy" />
              </div>
            )}

            {/* ── Quick Chat (out_for_delivery only) ── */}
            {isOnWay && (
              <div style={{ ...cardStyle, padding: "22px 20px", animation: "fade-up 0.45s ease" }}>
                <div style={{ fontSize: "0.7rem", color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <MessageCircle size={13} color="#0135FB" /> Chat with Rider
                </div>
                <div ref={chatScrollRef} style={{ maxHeight: "190px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px", padding: "2px" }}>
                  {(!order.messages || order.messages.length === 0) ? (
                    <div style={{ color: "#9ca3af", fontSize: "0.83rem", textAlign: "center", padding: "16px" }}>No messages yet. Send a quick update below!</div>
                  ) : (
                    order.messages.map((msg, i) => (
                      <div key={i} style={{
                        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        background: msg.sender === "user" ? "#0135FB" : "#f3f4f6",
                        color: msg.sender === "user" ? "#fff" : "#0A0F2E",
                        padding: "8px 13px", borderRadius: msg.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        fontSize: "0.86rem", fontWeight: 600, maxWidth: "78%",
                        animation: "chat-pop 0.2s ease",
                      }}>
                        {msg.text}
                        <div style={{ fontSize: "0.66rem", opacity: 0.6, marginTop: "3px" }}>
                          {msg.sender === "user" ? "You" : "Rider"} · {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {USER_QUICK_MESSAGES.map(msg => (
                    <button
                      key={msg}
                      className="otw-chat-quick"
                      onClick={() => sendMessage(msg)}
                      disabled={sendingMsg}
                      style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: "#374151", padding: "7px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── HORIZONTAL 5-Step Progress Timeline ── */}
            <div style={{ ...cardStyle, padding: "24px 20px", animation: "fade-up 0.5s ease" }}>
              <div style={{ fontSize: "0.7rem", color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0135FB", animation: !isDelivered ? "pulse-dot 1s ease-in-out infinite" : "none" }} />
                Order Progress
              </div>

              {/* Scrollable horizontal stepper */}
              <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
                <div style={{ position: "relative", display: "flex", minWidth: "480px" }}>

                  {/* Track line (background) */}
                  <div style={{
                    position: "absolute",
                    top: "21px",
                    left: "10%",
                    right: "10%",
                    height: "2px",
                    background: "#e5e7eb",
                    zIndex: 0,
                  }} />

                  {/* Progress fill */}
                  <div style={{
                    position: "absolute",
                    top: "21px",
                    left: "10%",
                    width: currentStepIndex <= 0 ? "0%" : `${Math.min((currentStepIndex / (STATUS_STEPS.length - 1)) * 80, 80)}%`,
                    height: "2px",
                    background: "linear-gradient(90deg, #0135FB, #22C55E)",
                    zIndex: 1,
                    transition: "width 1s ease",
                  }} />

                  {STATUS_STEPS.map((step, index) => {
                    const isPast = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const isFuture = index > currentStepIndex;
                    return (
                      <div key={step.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>
                        {/* Step circle */}
                        <div style={{
                          width: 42, height: 42, borderRadius: "50%",
                          background: isPast ? "#059669" : isActive ? "#0135FB" : "#fff",
                          border: `2px solid ${isPast ? "#059669" : isActive ? "#0135FB" : "#e5e7eb"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1rem",
                          animation: isActive ? "glow-step 1.5s ease-in-out infinite" : "none",
                          transition: "all 0.4s ease",
                          boxShadow: isActive ? "0 0 0 5px rgba(1,53,251,0.1)" : isPast ? "0 0 0 3px rgba(5,150,105,0.1)" : "none",
                        }}>
                          {isPast ? <CheckCircle size={18} color="#fff" /> : <span>{step.icon}</span>}
                        </div>

                        {/* Label */}
                        <div style={{ textAlign: "center", marginTop: "10px", padding: "0 2px" }}>
                          <div style={{
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            color: isPast ? "#059669" : isActive ? "#0135FB" : "#9ca3af",
                            transition: "color 0.4s",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            lineHeight: 1.3,
                          }}>
                            {step.label}
                          </div>
                          {isActive && !isFuture && (
                            <div style={{ marginTop: "5px", display: "inline-flex", alignItems: "center", gap: "3px", background: "rgba(1,53,251,0.08)", borderRadius: "999px", padding: "2px 7px" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0135FB", display: "inline-block", animation: "pulse-dot 1s ease-in-out infinite" }} />
                              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#0135FB" }}>LIVE</span>
                            </div>
                          )}
                          {!isFuture && step.id === "out_for_delivery" && order.deliveryPersonName && (
                            <div style={{ marginTop: "3px", fontSize: "0.62rem", color: "#10B981", fontWeight: 700 }}>{order.deliveryPersonName}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Change Item (only within 1.5 minutes of placement) ── */}
            {currentStepIndex >= 0 && currentStepIndex <= 1 && (Date.now() - new Date(order.createdAt).getTime() <= 90 * 1000) && (
              <div style={{ ...cardStyle, padding: "20px", animation: "fade-up 0.65s ease", textAlign: "center" }}>
                <p style={{ color: "#6B7280", fontSize: "0.85rem", marginBottom: "12px" }}>
                  Need to replace an item? You can request a change within 1.5 minutes of placing your order.
                </p>
                <button
                  onClick={() => {
                    sendMessage("URGENT: I need to change an item in my order. Please call me ASAP!");
                    toast.success("Request sent to admin! Please call the restaurant directly if needed.");
                  }}
                  style={{ background: "#EEF1FF", color: "#0135FB", border: "1px solid #0135FB", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s" }}
                >
                  Request Item Change
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Order Items Summary ── */}
        <div style={{ ...cardStyle, padding: "22px 20px", animation: "fade-up 0.7s ease" }}>
          <div style={{ fontSize: "0.7rem", color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "14px" }}>Your Items</div>

          {/* Delivery address */}
          <div style={{ marginBottom: 14, padding: "12px 14px", background: "#F5F7FF", borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: "0.85rem" }}>
              <MapPin size={15} color="#0135FB" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ color: "#9ca3af", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>Delivering to</div>
                <strong style={{ color: "#0A0F2E", display: "block", fontSize: "0.9rem" }}>{order.location}</strong>
                {order.locationNotes && <div style={{ color: "#0135FB", marginTop: 5, fontSize: "0.78rem" }}>📝 {order.locationNotes}</div>}
                {order.scheduledTime && order.scheduledTime !== "ASAP" && (
                  <div style={{ color: "#F59E0B", marginTop: 5, fontSize: "0.78rem" }}>🕐 {order.scheduledTime}</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 46, height: 46, borderRadius: "8px", position: "relative", overflow: "hidden", background: "#f3f4f6", flexShrink: 0 }}>
                  <Image src={item.item.image} alt={item.item.name} fill sizes="46px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0A0F2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.item.name}</div>
                  <div style={{ fontSize: "0.76rem", color: "#9ca3af" }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#0135FB", fontSize: "0.9rem", flexShrink: 0 }}>₹{item.item.price * item.quantity}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #e5e7eb", marginTop: "14px", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#6B7280" }}>Total Paid</span>
            <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0135FB" }}>₹{order.total}</span>
          </div>
        </div>

        {/* ── Order Feedback (Only if delivered) ── */}
        {isDelivered && !isCancelled && (
          <div style={{ ...cardStyle, padding: "22px 20px", animation: "fade-up 0.7s ease" }}>
            <div style={{ fontSize: "0.7rem", color: "#6B7280", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "14px" }}>
              How was your order?
            </div>
            {feedbackSubmitted || order.feedback ? (
              <div style={{ background: "#F0FDF4", color: "#16A34A", padding: "14px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle size={18} /> Thank you for your feedback!
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Share a quick thought..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    background: "#F5F7FF",
                    border: "1.5px solid #E0E7FF",
                    borderRadius: "10px",
                    outline: "none",
                    fontSize: "0.9rem",
                    color: "#0A0F2E",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0135FB")}
                  onBlur={(e) => (e.target.style.borderColor = "#E0E7FF")}
                />
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim() || feedbackLoading}
                  style={{
                    background: "#0135FB",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 18px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: feedbackText.trim() && !feedbackLoading ? "pointer" : "not-allowed",
                    opacity: feedbackText.trim() && !feedbackLoading ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                >
                  {feedbackLoading ? "..." : "Send"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Support Helpline ── */}
        <div style={{ ...cardStyle, padding: "20px", animation: "fade-up 0.7s ease" }}>
          <div style={{ fontSize: "0.68rem", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
            Need help?
          </div>
          <p style={{ color: "#6B7280", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "14px" }}>
            {COMPANY_NAME} is bootstrapped and serving fresh food daily. Call us for any enquiry about your order.
          </p>
          <a href={SUPPORT_TEL} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0135FB", color: "#fff", padding: "11px 20px", borderRadius: "10px", fontWeight: 800, textDecoration: "none", fontSize: "0.88rem", boxShadow: "0 4px 0 #0028D4" }}>
            <Phone size={16} /> Call {SUPPORT_PHONE_DISPLAY}
          </a>
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: 10, lineHeight: 1.5 }}>{COMPANY_BLURB}</p>
        </div>

      </div>
    </div>
  );
}
