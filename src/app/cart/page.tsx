"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { setActiveOrderId, getActiveOrderId } from "@/lib/activeOrder";
import { STORAGE_KEYS } from "@/lib/constants";
import { normalizeCartLines } from "@/lib/orderLine";
import { Minus, Plus, Trash2, MapPin, Tag, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import RazorpayButton from "@/components/RazorpayButton";

export default function CartPage() {
  const { user, profile, cart, updateQuantity, removeFromCart, clearCart, cartTotal, syncProfile } = useApp();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);

  // Meme Coupon State
  const [memePopup, setMemePopup] = useState<{ image: string; sound: string; visible: boolean } | null>(null);
  const [name, setName] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(false);
  const [paymentFailures, setPaymentFailures] = useState(0);
  const [showCodModal, setShowCodModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("ASAP");
  const [customTime, setCustomTime] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const CAMPUS_LOCATIONS = [
    "Civil Engineering Department",
    "Computer Science Department",
    "Electronics & Communication Department",
    "Mechanical Engineering Department",
    "Electrical Engineering Department",
    "Architecture Department",
    "Admin Block",
    "Main Gate",
    "Library",
    "Boys Hostel Block A",
    "Boys Hostel Block B",
    "Girls Hostel",
    "Sports Ground / Gym",
    "Main Canteen",
    "MBA Block",
    "Workshop / Lab Block",
    "Parking Area",
    "College Garden / Lawn",
    "Auditorium",
    "Medical Centre",
  ];

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (val.trim().length === 0) {
      // show all when empty
      setLocationSuggestions(CAMPUS_LOCATIONS);
      setShowLocationSuggestions(true);
    } else {
      const q = val.toLowerCase();
      const matches = CAMPUS_LOCATIONS.filter(l => l.toLowerCase().includes(q));
      setLocationSuggestions(matches);
      setShowLocationSuggestions(matches.length > 0);
    }
  };

  const TIME_SLOTS = [
    { label: "ASAP", sub: "~15 mins", icon: "⚡" },
    { label: "In 25 mins", sub: "Quick delivery", icon: "🕐" },
    { label: "In 45 mins", sub: "Standard", icon: "🕑" },
    { label: "In 1 hr 15 mins", sub: "Scheduled", icon: "🕒" },
    { label: "Custom Time", sub: "Pick a time", icon: "🗓️" },
  ];

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, [cart]);

  // Restore post-checkout screen after refresh (only when cart is empty)
  useEffect(() => {
    const activeId = getActiveOrderId();
    if (!activeId) return;
    try {
      const savedCart = localStorage.getItem(STORAGE_KEYS.cart);
      if (savedCart && JSON.parse(savedCart).length > 0) return;
    } catch { /* ignore */ }
    setPlacedOrderId(activeId);
  }, []);

  // Pre-fill location from storage
  useEffect(() => {
    const saved = localStorage.getItem("otw_delivery_location");
    if (saved) {
      if (saved.includes("(Near ")) {
        const parts = saved.split("(Near ");
        setLocation(parts[0].trim());
        const landmarkPart = parts[1].split(")")[0].trim();
        setLocationNotes(landmarkPart);
      } else {
        setLocation(saved.replace("[GPS attached]", "").trim());
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.deliveryFee !== undefined) setDeliveryFee(data.deliveryFee);
          if (data.onlinePaymentEnabled !== undefined) setOnlinePaymentEnabled(data.onlinePaymentEnabled);
          if (data.codEnabled !== undefined) setCodEnabled(data.codEnabled);
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
    }
  }, [profile]);

  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  const isTimeValid = () => {
    if (scheduledTime !== "Custom Time") return true;
    if (!customTime) return false;
    const now = new Date();
    const [hours, minutes] = customTime.split(":").map(Number);
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);
    const diffMs = selectedTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 3;
  };

  const canPlace = cart.length > 0 && location.trim().length > 0 && isPhoneValid && name.trim().length > 0 && isTimeValid();

  const handleApplyCoupon = async () => {
    const code = couponCode.toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`/api/coupons?code=${code}`);
      if (res.ok) {
        const coupon = await res.json();
        setAppliedCoupon(coupon);
        toast.success("Coupon applied!");

        // Meme logic
        if (coupon.memeImage || coupon.memeSound) {
          setMemePopup({ image: coupon.memeImage, sound: coupon.memeSound, visible: true });
          setTimeout(() => {
            setMemePopup(prev => prev ? { ...prev, visible: false } : null);
            setTimeout(() => setMemePopup(null), 300); // Wait for fade out
          }, 3500); // Show for 3.5 seconds
        }
      } else {
        setAppliedCoupon(null);
        toast.error("Invalid or expired coupon code");
      }
    } catch {
      setAppliedCoupon(null);
      toast.error("Failed to verify coupon");
    }
  };

  const finalDiscount = appliedCoupon
    ? appliedCoupon.type === "percentage" ? (cartTotal * appliedCoupon.discount) / 100 : appliedCoupon.discount
    : 0;
  const grandTotal = Math.max(0, cartTotal - finalDiscount + deliveryFee);

  const prepareOrderPayload = () => {
    return {
      userId: phoneDigits,
      userName: name.trim(),
      userPhone: phoneDigits,
      items: normalizeCartLines(cart),
      location: location.trim(),
      locationNotes: locationNotes.trim() || null,
      total: grandTotal,
      couponCode: appliedCoupon ? couponCode : null,
      discount: finalDiscount,
      scheduledTime: scheduledTime === "Custom Time" ? customTime : scheduledTime,
    };
  };

  const finalizeOrderClientSide = async (orderId: string, userId: string, locationStr: string) => {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phoneDigits, location: locationStr, userId }),
    });
    localStorage.setItem("otw_user_id", userId);
    setActiveOrderId(orderId);
    await syncProfile(userId);
    clearCart();
    setPlacedOrderId(orderId);
  };

  const handlePlaceCOD = async () => {
    setPlacing(true);
    try {
      const payload = prepareOrderPayload();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) throw new Error("One or more items are currently unavailable. Please refresh your cart.");
        throw new Error("Failed to place order");
      }

      const orderResult = await res.json();
      setIdempotencyKey(crypto.randomUUID());
      await finalizeOrderClientSide(orderResult.id, payload.userId, payload.location);
      setShowCodModal(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    } finally { setPlacing(false); }
  };

  const createRazorpayOrder = async () => {
    const payload = prepareOrderPayload();
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to initiate payment");
    }

    setIdempotencyKey(crypto.randomUUID());
    return res.json();
  };

  /* ─── POST-ORDER SCREEN ─── */
  if (placedOrderId) {
    return (
      <div style={{ background: "#F5F7FF", minHeight: "100vh", color: "#0A0F2E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <style>{`
          @keyframes pulse-ring-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(34,197,94,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          @keyframes slide-up-post { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{ textAlign: "center", animation: "slide-up-post 0.5s ease", background: "#fff", borderRadius: "24px", padding: "48px 36px", maxWidth: "440px", width: "100%", boxShadow: "0 8px 0 rgba(1,53,251,0.9), 0 20px 40px rgba(1,53,251,0.12)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "12px" }}>🎉</div>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pulse-ring-green 1.5s ease-in-out infinite" }}>
            <CheckCircle size={40} color="#22C55E" />
          </div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#22C55E" }}>Order Placed!</h2>
          <p style={{ color: "#6B7280", marginBottom: "32px", fontSize: "0.95rem", lineHeight: 1.7 }}>
            Your order has been <strong style={{ color: "#0A0F2E" }}>placed successfully</strong>. Our team is now preparing it — track it live!
          </p>
          <div style={{ padding: "16px 36px" }} /> {/* Spacer since button moved to bottom */}
        </div>

        {/* ── Fixed Bottom Track Order Bar ── */}
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(20px)",
          padding: "12px 16px 12px 20px", borderRadius: "999px",
          display: "flex", alignItems: "center", gap: "20px",
          boxShadow: "0 10px 40px rgba(1, 53, 251, 0.15), 0 0 0 1px rgba(1, 53, 251, 0.1)", zIndex: 999,
          width: "90%", maxWidth: "420px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EEF1FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
              🛵
            </div>
            <div>
              <div style={{ color: "#0A0F2E", fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.2 }}>Order Active</div>
              <div style={{ color: "#6B7280", fontSize: "0.75rem", fontWeight: 500 }}>Track your delivery</div>
            </div>
          </div>
          <Link
            href={`/track/${placedOrderId}`}
            style={{
              background: "#0135FB", color: "#ffffff",
              padding: "12px 24px", borderRadius: "999px",
              fontWeight: 800, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px",
              display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem",
              boxShadow: "0 4px 14px rgba(1,53,251,0.4)", flexShrink: 0, transition: "transform 0.2s"
            }}
          >
            Track <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  /* ─── EMPTY CART ─── */
  if (cart.length === 0) {
    return (
      <div style={{ background: "#F5F7FF", minHeight: "100vh", color: "#0A0F2E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px", opacity: 0.3 }}>🛒</div>
        <h2 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Your cart is empty</h2>
        <p style={{ color: "#6B7280", marginBottom: "32px", textAlign: "center" }}>Looks like you haven't added any items yet.</p>
        <Link href="/" style={{ background: "#0135FB", color: "#fff", padding: "14px 32px", borderRadius: "10px", fontWeight: 900, textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 4px 0 #0028D4" }}>
          Browse Menu
        </Link>
      </div>
    );
  }

  /* ─── SHARED STYLES ─── */
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px",
    background: "#fff", border: "1.5px solid #e5e7eb",
    borderRadius: "8px", color: "#0A0F2E", outline: "none",
    fontSize: "0.93rem", transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", fontWeight: 700,
    color: "#2A3060", marginBottom: "7px",
    textTransform: "uppercase", letterSpacing: "0.8px",
  };
  const cardStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "16px",
    padding: "22px 20px", boxShadow: "0 2px 16px rgba(1,53,251,0.06)",
  };
  const isLoggedIn = !!user;

  return (
    <div style={{ background: "#F5F7FF", minHeight: "100vh", color: "#0A0F2E", padding: "28px 0 100px", fontFamily: "inherit", position: "relative" }}>
      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin-wait { to { transform: rotate(360deg); } }
        .otw-cart-input:focus { border-color: #0135FB !important; box-shadow: 0 0 0 3px rgba(1,53,251,0.1) !important; }
        .otw-qty-btn:hover { background: #EEF1FF !important; }
        .otw-del-btn:hover { background: #FEE2E2 !important; border-color: #fca5a5 !important; }
        .otw-apply-btn:hover { background: #0028D4 !important; }
        .otw-back-btn:hover { background: #EEF1FF !important; }
        .cart-grid { display: grid; gap: 24px; align-items: start; grid-template-columns: 1fr 370px; }
        @media (max-width: 900px) { .cart-grid { grid-template-columns: 1fr !important; } }
        .time-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
        .time-slot-btn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1px;
          padding: 10px 8px; border-radius: 12px;
          border: 1.5px solid #e5e7eb; background: #fff;
          cursor: pointer; transition: all 0.18s; text-align: center;
          font-family: inherit;
        }
        .time-slot-btn:hover { border-color: #0135FB; background: #EEF1FF; }
        .time-slot-btn.active { border-color: #0135FB; background: #0135FB; }
        .time-slot-btn.active .ts-label { color: #fff; }
        .time-slot-btn.active .ts-sub { color: rgba(255,255,255,0.7); }
        .ts-label { font-size: 0.8rem; font-weight: 800; color: #0A0F2E; line-height: 1.2; }
        .ts-sub { font-size: 0.65rem; color: #9ca3af; font-weight: 500; margin-top: 1px; }
        .loc-wrap { position: relative; }
        .loc-suggestions {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #fff; border: 1.5px solid #0135FB;
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 8px 24px rgba(1,53,251,0.12);
          z-index: 200; max-height: 220px; overflow-y: auto;
          animation: slide-up 0.15s ease;
        }
        .loc-suggestion-item {
          padding: 10px 14px; font-size: 0.87rem; cursor: pointer;
          color: #0A0F2E; font-weight: 500;
          transition: background 0.12s;
          border-bottom: 1px solid #f3f4f6;
        }
        .loc-suggestion-item:last-child { border-bottom: none; }
        .loc-suggestion-item:hover { background: #EEF1FF; color: #0135FB; font-weight: 700; }
        .loc-suggestion-match { color: #0135FB; font-weight: 800; }
      `}</style>

      {/* ── Main Grid ── */}
      <div className="cart-grid" style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 16px" }}>

        {/* ── Left Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Page Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link
              href="/"
              className="otw-back-btn"
              style={{ width: 40, height: 40, borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", color: "#0A0F2E", textDecoration: "none", transition: "background 0.2s" }}
            >
              <ArrowLeft size={18} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, color: "#0A0F2E", lineHeight: 1.1 }}>My Cart</h1>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0", fontWeight: 500 }}>Review your order and place</p>
            </div>
          </div>

          {/* ── Cart Items Card ── */}
          <div style={cardStyle}>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2A3060", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" }}>
              Order Summary &nbsp;·&nbsp; {cart.length} {cart.length === 1 ? "item" : "items"}
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cart.map((c, idx) => (
                <div
                  key={c.cartItemId ?? `cart-${c.item.id}-${idx}`}
                  style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 0", borderBottom: idx < cart.length - 1 ? "1px solid #f9fafb" : "none" }}
                >
                  {/* Product image */}
                  <div style={{ width: 68, height: 68, borderRadius: "10px", background: "#f3f4f6", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                    <Image src={c.item.image} alt={c.item.name} fill style={{ objectFit: "cover" }} sizes="68px" />
                  </div>

                  {/* Details + controls (flex column keeps everything in-bounds) */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "68px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ paddingRight: "10px" }}>
                        <div style={{ fontWeight: 800, fontSize: "0.97rem", color: "#0A0F2E", letterSpacing: "0.2px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.item.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "2px", textTransform: "capitalize" }}>{c.item.category || "Item"}</div>
                      </div>
                      <button
                        className="otw-del-btn"
                        onClick={() => removeFromCart(c.cartItemId || c.item.id)}
                        style={{ width: 32, height: 32, borderRadius: "8px", border: "1.5px solid #fecaca", background: "transparent", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                      ><Trash2 size={14} /></button>
                    </div>

                    {c.lineDetails && (
                      <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "#0135FB", lineHeight: 1.4 }}>{c.lineDetails}</div>
                    )}
                    {!c.lineDetails && c.selectedCustomizations && c.selectedCustomizations.length > 0 && (
                      <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "#0135FB" }}>
                        {c.selectedCustomizations.map(sc => `${sc.category}: ${sc.option}`).join(" · ")}
                      </div>
                    )}
                    {!c.lineDetails && c.specialInstructions && (
                      <div style={{ marginTop: "5px", fontSize: "0.78rem", color: "#92400E", background: "#FEF3C7", padding: "3px 8px", borderRadius: "5px", display: "inline-block", fontWeight: 600 }}>
                        <span style={{ color: "#D97706", marginRight: "3px" }}>Note:</span>{c.specialInstructions}
                      </div>
                    )}

                    {/* Price + controls row */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto", paddingTop: "8px" }}>
                      <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0135FB", flexShrink: 0 }}>₹{c.unitPrice ?? c.item.price}</div>
                      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                        <button
                          className="otw-qty-btn"
                          onClick={() => updateQuantity(c.cartItemId || c.item.id, c.quantity - 1)}
                          style={{ width: 30, height: 30, border: "none", background: "transparent", color: "#0A0F2E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                        ><Minus size={13} /></button>
                        <span style={{ fontWeight: 700, width: "26px", textAlign: "center", fontSize: "0.9rem", color: "#0A0F2E" }}>{c.quantity}</span>
                        <button
                          className="otw-qty-btn"
                          onClick={() => updateQuantity(c.cartItemId || c.item.id, c.quantity + 1)}
                          style={{ width: 30, height: 30, border: "none", background: "transparent", color: "#0A0F2E", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                        ><Plus size={13} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Delivery Details Card ── */}
          <div style={cardStyle}>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2A3060", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "7px" }}>
              <MapPin size={14} color="#0135FB" /> Delivery Details
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {!isLoggedIn ? (
                <>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Your Name</label>
                    <input type="text" style={inputStyle} className="otw-cart-input" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Phone Number</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ padding: "13px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#f9fafb", fontWeight: 700, fontSize: "0.88rem", color: "#0A0F2E", flexShrink: 0 }}>🇮🇳 +91</div>
                      <input type="tel" style={{ ...inputStyle, flex: 1 }} className="otw-cart-input" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: "1 / -1", background: "#EEF1FF", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0135FB", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", overflow: "hidden", flexShrink: 0 }}>
                    {(profile as any)?.image ? (
                      <img src={(profile as any).image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0A0F2E", fontSize: "0.95rem", textTransform: "capitalize" }}>{profile?.name || name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "2px" }}>+91 {profile?.phone || phone}</div>
                  </div>
                </div>
              )}

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Exact Campus Location</label>
                  <button type="button" onClick={() => {
                    if (navigator.geolocation) {
                      setIsGpsLoading(true);
                      toast.loading("Fetching precise location...", { id: "gps" });
                      navigator.geolocation.getCurrentPosition(
                        async pos => {
                          try {
                            const { latitude, longitude } = pos.coords;
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`);
                            const data = await res.json();
                            let addrStr = "";
                            if (data && data.address) {
                              const a = data.address;
                              const localArea = a.neighbourhood || a.suburb || a.residential || a.village || "";
                              const city = a.city || a.town || a.state_district || "";
                              addrStr = [localArea, city].filter(Boolean).join(", ");
                            }
                            if (!addrStr) addrStr = data?.display_name?.split(",")[0] || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                            setLocation(addrStr);
                            setShowLocationSuggestions(false);
                            toast.success("Location found!", { id: "gps" });
                          } catch {
                            setLocation(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                            toast.success("Coordinates found!", { id: "gps" });
                          } finally {
                            setIsGpsLoading(false);
                          }
                        },
                        err => {
                          setIsGpsLoading(false);
                          const msg = err.code === 1 ? "Location access denied. Please enable in settings." : err.code === 3 ? "Location request timed out." : "Failed to get precise location.";
                          toast.error(msg, { id: "gps" });
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                      );
                    } else {
                      toast.error("Geolocation is not supported by your browser");
                    }
                  }} disabled={isGpsLoading} style={{ background: "transparent", border: "none", color: isGpsLoading ? "#9CA3AF" : "#0135FB", fontSize: "0.75rem", fontWeight: 700, cursor: isGpsLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    {isGpsLoading ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #9CA3AF", borderTopColor: "transparent", animation: "spin-wait 1s linear infinite" }} /> : <MapPin size={12} />}
                    {isGpsLoading ? "Locating..." : "Use GPS"}
                  </button>
                </div>
                <div className="loc-wrap">
                  <input
                    type="text"
                    style={inputStyle}
                    className="otw-cart-input"
                    placeholder="e.g. Civil Dept, Admin Block, Boys Hostel..."
                    value={location}
                    onChange={e => handleLocationChange(e.target.value)}
                    onFocus={() => {
                      // Show all options on focus, even when empty
                      setLocationSuggestions(location.trim() ? locationSuggestions : CAMPUS_LOCATIONS);
                      setShowLocationSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 180)}
                    autoComplete="off"
                  />
                  {showLocationSuggestions && (
                    <div className="loc-suggestions">
                      {locationSuggestions.map(sugg => {
                        const q = location.toLowerCase();
                        const idx = sugg.toLowerCase().indexOf(q);
                        return (
                          <div
                            key={sugg}
                            className="loc-suggestion-item"
                            onMouseDown={() => {
                              setLocation(sugg);
                              setShowLocationSuggestions(false);
                            }}
                          >
                            {idx >= 0 ? (
                              <>
                                {sugg.slice(0, idx)}
                                <span className="loc-suggestion-match">{sugg.slice(idx, idx + location.length)}</span>
                                {sugg.slice(idx + location.length)}
                              </>
                            ) : sugg}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Nearby Landmark (Optional)</label>
                <input type="text" style={inputStyle} className="otw-cart-input" placeholder="e.g. Near Main Canteen, Next to Library" value={locationNotes} onChange={e => setLocationNotes(e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Scheduled Time</label>
                <div className="time-slot-grid">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.label}
                      type="button"
                      className={`time-slot-btn${scheduledTime === slot.label ? " active" : ""}`}
                      onClick={() => { setScheduledTime(slot.label); setCustomTime(""); }}
                    >
                      <span className="ts-label">{slot.label}</span>
                      <span className="ts-sub">{slot.sub}</span>
                    </button>
                  ))}
                </div>
                {scheduledTime === "Custom Time" && (
                  <div style={{ marginTop: "10px" }}>
                    <input type="time" style={inputStyle} className="otw-cart-input" value={customTime} onChange={e => setCustomTime(e.target.value)} />
                    {!isTimeValid() && customTime && (
                      <p style={{ color: "#EF4444", fontSize: "0.73rem", marginTop: "5px", fontWeight: 600 }}>Time must be within the next 3 hours.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isLoggedIn && (
              <div style={{ marginTop: "18px", padding: "12px 14px", borderRadius: "10px", background: "#FEF3C7", fontSize: "0.83rem", color: "#92400E", lineHeight: 1.55, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
                <div>
                  <strong style={{ color: "#D97706" }}>Please enter your real number.</strong> Our delivery partner will call this number to coordinate delivery. Fake numbers result in a permanent block.
                </div>
              </div>
            )}
          </div>
        </div>
        {/* end Left Column */}

        {/* ── Right Column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Coupon */}
          <div style={cardStyle}>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2A3060", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "7px" }}>
              <Tag size={14} color="#0135FB" /> Offers & Coupons
            </p>
            {appliedCoupon ? (
              <div style={{ background: "#EEF1FF", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0135FB", fontSize: "0.88rem" }}>{couponCode} APPLIED ✓</div>
                  <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "2px" }}>{appliedCoupon.label}</div>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.78rem", fontWeight: 800, whiteSpace: "nowrap" }}>REMOVE</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" style={{ ...inputStyle, flex: 1 }} className="otw-cart-input" placeholder="Promo code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                <button
                  className="otw-apply-btn"
                  onClick={handleApplyCoupon}
                  style={{ background: "#0135FB", color: "#fff", border: "none", padding: "0 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", boxShadow: "0 3px 0 #0028D4", transition: "background 0.15s" }}
                >Apply</button>
              </div>
            )}
          </div>

          {/* Bill Details */}
          <div style={cardStyle}>
            <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2A3060", textTransform: "uppercase", letterSpacing: "1px", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6", marginBottom: "16px" }}>
              Bill Details
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px", fontSize: "0.92rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280" }}>Item Total</span>
                <span style={{ fontWeight: 600, color: "#0A0F2E" }}>₹{cartTotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280" }}>Delivery Fee</span>
                <span style={{ fontWeight: 600, color: "#0A0F2E" }}>₹{deliveryFee}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#22C55E" }}>
                  <span>Discount ({couponCode})</span>
                  <span style={{ fontWeight: 700 }}>-₹{finalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px dashed #e5e7eb", margin: "2px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 900 }}>
                <span style={{ color: "#0A0F2E" }}>To Pay</span>
                <span style={{ color: "#0135FB" }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ── PRIMARY: Razorpay Online Payment ── */}
            <div style={{ marginTop: "20px" }}>
              {onlinePaymentEnabled ? (
                <RazorpayButton
                  amountRupees={grandTotal}
                  customerName={name || (profile as any)?.name}
                  customerPhone={phoneDigits || (profile as any)?.phone}
                  disabled={!canPlace || placing}
                  createOrder={createRazorpayOrder}
                  onFailure={() => {
                    const newFailures = paymentFailures + 1;
                    setPaymentFailures(newFailures);
                    if (newFailures >= 2 && !codEnabled) {
                      setShowCodModal(true);
                    }
                  }}
                  onSuccess={async (paymentId, orderId, internalOrderId) => {
                    await finalizeOrderClientSide(internalOrderId, phoneDigits, location.trim());
                  }}
                />
              ) : (
                <div style={{ marginTop: "10px" }}>
                  {/* ── SECONDARY: Cash on Delivery (online payment off) ── */}
                  {(codEnabled || !onlinePaymentEnabled) && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          margin: "18px 0 0",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: "1px",
                            background: "#e5e7eb",
                          }}
                        />

                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          or pay on delivery
                        </span>

                        <div
                          style={{
                            flex: 1,
                            height: "1px",
                            background: "#e5e7eb",
                          }}
                        />
                      </div>

                      <button
                        id="place-order-btn"
                        onClick={handlePlaceCOD}
                        disabled={!canPlace || placing}
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          padding: "14px",
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          background:
                            !onlinePaymentEnabled && canPlace
                              ? "#0135FB"
                              : "transparent",
                          color:
                            !onlinePaymentEnabled && canPlace
                              ? "#ffffff"
                              : canPlace
                                ? "#0A0F2E"
                                : "#9ca3af",
                          border:
                            !onlinePaymentEnabled && canPlace
                              ? "1.5px solid #0028D4"
                              : canPlace
                                ? "1.5px solid #d1d5db"
                                : "1.5px solid #e5e7eb",
                          borderRadius: "10px",
                          cursor: canPlace ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          transition: "all 0.15s",
                          fontFamily: "inherit",
                        }}
                        onMouseOver={(e) => {
                          if (canPlace) {
                            if (!onlinePaymentEnabled) {
                              e.currentTarget.style.background = "#0028D4";
                            } else {
                              e.currentTarget.style.background = "#F5F7FF";
                              e.currentTarget.style.borderColor = "#0135FB";
                              e.currentTarget.style.color = "#0135FB";
                            }
                          }
                        }}
                        onMouseOut={(e) => {
                          if (canPlace) {
                            if (!onlinePaymentEnabled) {
                              e.currentTarget.style.background = "#0135FB";
                            } else {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor = "#d1d5db";
                              e.currentTarget.style.color = "#0A0F2E";
                            }
                          }
                        }}
                      >
                        {placing ? (
                          "Processing..."
                        ) : (
                          <>
                            Cash on Delivery <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {!location && (
                    <p style={{ textAlign: "center", fontSize: "0.77rem", color: "#EF4444", marginTop: "10px", fontWeight: 600 }}>
                      Please select a delivery location
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* end Right Column */}

      </div>
      {/* end .cart-grid */}

      {/* ── Cash-on-Delivery Fallback Modal (shown after repeated online-payment failures) ── */}
      {showCodModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,15,46,0.55)", backdropFilter: "blur(6px)", padding: "20px"
        }}>
          <div style={{
            background: "#fff", padding: "32px 24px", borderRadius: "24px",
            maxWidth: "360px", width: "90%", textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)", animation: "slide-up 0.3s ease-out"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>😅</div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0A0F2E", marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Trouble paying online?
            </h3>
            <p style={{ color: "#6B7280", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "24px", fontWeight: 500 }}>
              It seems you're having trouble with the online payment. Don't worry, you can place your order via <strong style={{ color: "#0A0F2E" }}>Cash on Delivery</strong> instead!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={handlePlaceCOD}
                disabled={placing}
                style={{
                  width: "100%", padding: "14px", background: "#0135FB", color: "#fff",
                  border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "0.95rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 0 #0028D4", textTransform: "uppercase", letterSpacing: "0.5px", transition: "transform 0.15s"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "translateY(4px)"}
                onMouseUp={e => e.currentTarget.style.transform = "translateY(0)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {placing ? "Processing..." : <>Pay on Delivery <ArrowRight size={18} /></>}
              </button>
              <button
                onClick={() => setShowCodModal(false)}
                style={{
                  width: "100%", padding: "12px", background: "transparent", color: "#6B7280",
                  border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                }}
              >
                Try Online Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Meme / Surprise Coupon Popup ── */}
      {memePopup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          pointerEvents: memePopup.visible ? "auto" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: memePopup.visible ? 1 : 0, transition: "opacity 0.3s ease",
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)"
        }}>
          {memePopup.sound && (
            <audio src={memePopup.sound} autoPlay />
          )}
          {memePopup.image && (
            <img
              src={memePopup.image}
              alt="Surprise!"
              style={{
                maxWidth: "90%", maxHeight: "80vh", borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                transform: memePopup.visible ? "scale(1) rotate(0deg)" : "scale(0.8) rotate(-10deg)",
                transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}