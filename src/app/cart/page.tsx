"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { setActiveOrderId, getActiveOrderId } from "@/lib/activeOrder";
import { STORAGE_KEYS } from "@/lib/constants";
import { normalizeCartLines } from "@/lib/orderLine";
import { Minus, Plus, Trash2, MapPin, Tag, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const CAMPUS_LOCATIONS = [
  "Boys Hostel Block A", "Boys Hostel Block B", "Boys Hostel Block C",
  "Girls Hostel Block A", "Girls Hostel Block B", "Girls Hostel Block C",
  "PG Area – North Campus", "PG Area – South Campus", "PG Area – East Gate", "PG Area – West Gate",
  "City PG – Sector 1", "City PG – Sector 2", "Faculty Quarters",
  "Library Block", "Main Gate", "Sports Complex", "Cafeteria", "Admin Block", "Auditorium",
];

export default function CartPage() {
  const { user, profile, cart, updateQuantity, removeFromCart, clearCart, cartTotal, syncProfile } = useApp();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount: number; type: "percentage" | "flat"; label: string } | null>(null);
  const [name, setName] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [scheduledTime, setScheduledTime] = useState("ASAP");
  const [customTime, setCustomTime] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  // Restore post-checkout screen after refresh (only when cart is empty)
  useEffect(() => {
    const activeId = getActiveOrderId();
    if (!activeId) return;
    try {
      const savedCart = localStorage.getItem(STORAGE_KEYS.cart);
      if (savedCart && JSON.parse(savedCart).length > 0) return;
    } catch { /* ignore */ }
    setPlacedOrderId(activeId);
    fetch(`/api/orders/${activeId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.confirmed) setIsConfirmed(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.deliveryFee !== undefined) {
          setDeliveryFee(data.deliveryFee);
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

  const isCustomLoc = location === "Other (Type below)";
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

  const canPlace = cart.length > 0 && location && (!isCustomLoc || customLocation.trim()) && isPhoneValid && name.trim().length > 0 && isTimeValid();

  const handleApplyCoupon = async () => {
    const code = couponCode.toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`/api/coupons?code=${code}`);
      if (res.ok) {
        const coupon = await res.json();
        setAppliedCoupon(coupon);
        toast.success("Coupon applied!");
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

  const handleConfirmAndPlace = async () => {
    setPlacing(true);
    try {
      const finalLoc = isCustomLoc ? customLocation.trim() : location;
      const finalUserId = phoneDigits;

      let latitude: number | null = null;
      let longitude: number | null = null;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 60000 })
          );
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          /* GPS optional — campus location string is still saved */
        }
      }

      const orderData = {
        userId: finalUserId,
        userName: name.trim(),
        userPhone: phoneDigits,
        items: normalizeCartLines(cart),
        location: finalLoc,
        locationNotes: locationNotes.trim() || null,
        latitude,
        longitude,
        total: grandTotal,
        couponCode: appliedCoupon ? couponCode : null,
        discount: finalDiscount,
        status: "placed",
        scheduledTime: scheduledTime === "Custom Time" ? customTime : scheduledTime,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("One or more items are out of stock or currently unavailable. Please refresh your cart.");
        }
        throw new Error("Failed to place order");
      }
      const orderResult = await res.json();
      
      // Rotate idempotency key on success
      setIdempotencyKey(crypto.randomUUID());

      // Auto-create/update user profile
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phoneDigits, location: finalLoc, userId: finalUserId }),
      });

      localStorage.setItem("otw_user_id", finalUserId);
      setActiveOrderId(orderResult.id);
      await syncProfile(finalUserId);

      clearCart();
      setShowConfirm(false);
      setPlacedOrderId(orderResult.id);

      // Start polling for confirmation
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/orders/${orderResult.id}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.confirmed) {
              setIsConfirmed(true);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } catch { /* silent */ }
      }, 3000);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to place order");
    } finally { setPlacing(false); }
  };

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }, []);

  /* ─── POST-ORDER SCREEN ─── */
  if (placedOrderId) {
    return (
      <div style={{ background: "#F5F7FF", minHeight: "100vh", color: "#0A0F2E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <style>{`
          @keyframes phone-ring {
            0%, 100% { transform: rotate(0deg) scale(1); }
            10% { transform: rotate(-15deg) scale(1.1); }
            20% { transform: rotate(15deg) scale(1.1); }
            30% { transform: rotate(-12deg) scale(1.05); }
            40% { transform: rotate(12deg) scale(1.05); }
            50% { transform: rotate(-8deg); }
            60% { transform: rotate(8deg); }
            70% { transform: rotate(-4deg); }
            80% { transform: rotate(4deg); }
            90% { transform: rotate(0deg); }
          }
          @keyframes pulse-ring-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(34,197,94,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          @keyframes slide-up-post { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin-wait { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {isConfirmed ? (
          <div style={{ textAlign: "center", animation: "slide-up-post 0.5s ease", background: "#fff", borderRadius: "24px", padding: "48px 36px", maxWidth: "440px", width: "100%", boxShadow: "0 8px 0 rgba(1,53,251,0.9), 0 20px 40px rgba(1,53,251,0.12)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "12px" }}>🎉</div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pulse-ring-green 1.5s ease-in-out infinite" }}>
              <CheckCircle size={40} color="#22C55E" />
            </div>
            <h2 style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#22C55E" }}>Order Confirmed!</h2>
            <p style={{ color: "#6B7280", marginBottom: "32px", fontSize: "0.95rem", lineHeight: 1.7 }}>
              Your order has been <strong style={{ color: "#0A0F2E" }}>verified and accepted</strong>. Our team is now preparing it — track it live!
            </p>
            <Link
              href={`/track/${placedOrderId}`}
              style={{ background: "#0135FB", color: "#fff", padding: "16px 36px", borderRadius: "10px", fontWeight: 900, textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "1rem", boxShadow: "0 4px 0 #0028D4" }}
            >
              Track My Order <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: "center", maxWidth: "460px", animation: "slide-up-post 0.5s ease", background: "#fff", borderRadius: "24px", padding: "40px 32px", width: "100%", boxShadow: "0 8px 0 rgba(1,53,251,0.9), 0 20px 40px rgba(1,53,251,0.12)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px", display: "inline-block", animation: "phone-ring 2s ease-in-out infinite" }}>📞</div>
            <h2 style={{ fontSize: "1.7rem", fontWeight: 900, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#0A0F2E" }}>Order Received!</h2>
            <p style={{ color: "#6B7280", marginBottom: "24px", fontSize: "0.9rem", lineHeight: 1.7 }}>
              Thanks <strong style={{ color: "#0A0F2E" }}>{name}</strong>! Our team will call you at{" "}
              <strong style={{ color: "#0135FB" }}>+91 {phoneDigits}</strong> shortly to confirm.
            </p>

            <div style={{ background: "#EEF1FF", borderRadius: "999px", padding: "12px 22px", display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "3px solid #c7d2fe", borderTop: "3px solid #0135FB", animation: "spin-wait 1s linear infinite" }} />
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#2A3060" }}>Waiting for admin confirmation</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", background: "#F5F7FF", borderRadius: "12px", padding: "18px 20px" }}>
              {[
                { icon: "✅", text: "Order placed successfully", done: true },
                { icon: "📞", text: "Awaiting admin call & confirmation", done: false, active: true },
                { icon: "🍳", text: "Order preparation starts", done: false },
                { icon: "🛵", text: "Rider assigned & dispatched", done: false },
                { icon: "📍", text: "Delivered to your location", done: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", opacity: step.done || step.active ? 1 : 0.35 }}>
                  <div style={{ fontSize: "1.1rem", width: 26, textAlign: "center", flexShrink: 0 }}>{step.icon}</div>
                  <span style={{ fontWeight: step.active ? 700 : 600, color: step.active ? "#0135FB" : step.done ? "#22C55E" : "#9ca3af", fontSize: "0.88rem" }}>
                    {step.text}{step.active && <span style={{ color: "#9ca3af" }}> …</span>}
                  </span>
                  {step.done && <CheckCircle size={15} color="#22C55E" style={{ marginLeft: "auto", flexShrink: 0 }} />}
                </div>
              ))}
            </div>

            <Link
              href={`/track/${placedOrderId}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "24px", background: "#0135FB", color: "#fff", padding: "14px 28px", borderRadius: "10px", fontWeight: 800, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.88rem", boxShadow: "0 4px 0 #0028D4" }}
            >
              Track Order Live <ArrowRight size={18} />
            </Link>
            <p style={{ marginTop: "14px", fontSize: "0.75rem", color: "#9ca3af", lineHeight: 1.6 }}>
              This page auto-updates every 3 seconds.
            </p>
          </div>
        )}
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
        .otw-cart-input:focus { border-color: #0135FB !important; box-shadow: 0 0 0 3px rgba(1,53,251,0.1) !important; }
        .otw-qty-btn:hover { background: #EEF1FF !important; }
        .otw-del-btn:hover { background: #FEE2E2 !important; border-color: #fca5a5 !important; }
        .otw-apply-btn:hover { background: #0028D4 !important; }
        .otw-back-btn:hover { background: #EEF1FF !important; }
      `}</style>

      {/* ── Phone Confirmation Modal ── */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,46,0.55)", backdropFilter: "blur(6px)" }} onClick={() => setShowConfirm(false)} />
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px 28px", width: "100%", maxWidth: "390px", position: "relative", zIndex: 101, animation: "slide-up 0.3s ease", textAlign: "center", boxShadow: "0 8px 0 rgba(1,53,251,0.9), 0 24px 48px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "14px" }}>📱</div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 900, marginBottom: "8px", color: "#0A0F2E" }}>Confirm Your Number</h3>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0135FB", letterSpacing: "2px", marginBottom: "16px" }}>+91 {phoneDigits}</div>
            <div style={{ background: "#FEF3C7", borderRadius: "10px", padding: "12px 14px", fontSize: "0.84rem", color: "#92400E", lineHeight: 1.55, textAlign: "left", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <div>Our rider will call this exact number for delivery. <strong>Wrong numbers will cause your order to be cancelled and your account to be blocked.</strong></div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button disabled={placing} onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "14px", background: "#f3f4f6", color: "#0A0F2E", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>Edit Number</button>
              <button disabled={placing} onClick={handleConfirmAndPlace} style={{ flex: 1, padding: "14px", background: "#0135FB", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 0 #0028D4", fontFamily: "inherit", fontSize: "0.9rem" }}>
                {placing ? "Placing..." : "Yes, correct!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="cart-grid" style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 370px", gap: "24px", alignItems: "start" }}>

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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.97rem", color: "#0A0F2E", letterSpacing: "0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.item.name}</div>
                    <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "2px", textTransform: "capitalize" }}>{c.item.category || "Item"}</div>

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

                    {/* Price + controls row — all inside the card, never overflows */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", gap: "8px" }}>
                      <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0135FB", flexShrink: 0 }}>₹{c.unitPrice ?? c.item.price}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        {/* Quantity stepper */}
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
                        {/* Delete button */}
                        <button
                          className="otw-del-btn"
                          onClick={() => removeFromCart(c.cartItemId || c.item.id)}
                          style={{ width: 32, height: 32, borderRadius: "8px", border: "1.5px solid #fecaca", background: "transparent", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                        ><Trash2 size={14} /></button>
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

              <div>
                <label style={labelStyle}>Campus Location</label>
                <select style={inputStyle} className="otw-cart-input" value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="">-- Select Spot --</option>
                  {CAMPUS_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="Other (Type below)">Other (Type below)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Scheduled Time</label>
                <select style={inputStyle} className="otw-cart-input" value={scheduledTime} onChange={e => { setScheduledTime(e.target.value); setCustomTime(""); }}>
                  <option value="ASAP">ASAP (~15 mins)</option>
                  <option value="In 25 mins">In 25 mins</option>
                  <option value="In 45 mins">In 45 mins</option>
                  <option value="In 1 hr 15 mins">In 1 hr 15 mins</option>
                  <option value="Custom Time">Custom Time</option>
                </select>
                {scheduledTime === "Custom Time" && (
                  <div style={{ marginTop: "10px" }}>
                    <input type="time" style={inputStyle} className="otw-cart-input" value={customTime} onChange={e => setCustomTime(e.target.value)} />
                    {!isTimeValid() && customTime && (
                      <p style={{ color: "#EF4444", fontSize: "0.73rem", marginTop: "5px", fontWeight: 600 }}>Time must be within the next 3 hours.</p>
                    )}
                  </div>
                )}
              </div>

              {isCustomLoc && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Specify Location</label>
                  <input type="text" style={inputStyle} className="otw-cart-input" placeholder="e.g. Near Basketball Court" value={customLocation} onChange={e => setCustomLocation(e.target.value)} />
                </div>
              )}

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Delivery Notes (optional)</label>
                <input type="text" style={inputStyle} className="otw-cart-input" placeholder="e.g. Gate 2, call when you arrive, room 204" value={locationNotes} onChange={e => setLocationNotes(e.target.value)} />
              </div>
            </div>

            {!isLoggedIn && (
              <div style={{ marginTop: "18px", padding: "12px 14px", borderRadius: "10px", background: "#FEF3C7", fontSize: "0.83rem", color: "#92400E", lineHeight: 1.55, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
                <div>
                  <strong style={{ color: "#D97706" }}>Please enter your real number.</strong> Our delivery partner will call this number to confirm your order. Fake numbers result in a permanent block.
                </div>
              </div>
            )}
          </div>
        </div>

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

            <button
              id="place-order-btn"
              onClick={() => { if (canPlace) setShowConfirm(true); }}
              disabled={!canPlace || placing}
              style={{
                width: "100%", marginTop: "22px", padding: "16px", fontSize: "0.97rem", fontWeight: 900,
                background: canPlace ? "#0135FB" : "#e5e7eb",
                color: canPlace ? "#fff" : "#9ca3af",
                border: "none", borderRadius: "10px",
                cursor: canPlace ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                textTransform: "uppercase", letterSpacing: "1px",
                transition: "all 0.15s",
                boxShadow: canPlace ? "0 4px 0 #0028D4" : "none",
                fontFamily: "inherit",
              }}
              onMouseOver={(e) => { if (canPlace) { e.currentTarget.style.background = "#0028D4"; e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 2px 0 #0028D4"; } }}
              onMouseOut={(e) => { if (canPlace) { e.currentTarget.style.background = "#0135FB"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 0 #0028D4"; } }}
            >
              {placing ? "Processing..." : <>Place Order <ArrowRight size={18} /></>}
            </button>
            {!location && (
              <p style={{ textAlign: "center", fontSize: "0.77rem", color: "#EF4444", marginTop: "10px", fontWeight: 600 }}>
                Please select a delivery location
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
