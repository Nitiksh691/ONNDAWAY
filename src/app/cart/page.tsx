"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { normalizeCartLines } from "@/lib/orderLine";
import { Minus, Plus, Trash2, MapPin, Tag, ArrowRight, ArrowLeft, Phone, CheckCircle } from "lucide-react";
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
  const { user, profile, cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useApp();
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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        toast.success("Coupon applied!", { style: { background: '#333', color: '#fff' } });
      } else {
        setAppliedCoupon(null);
        toast.error("Invalid or expired coupon code", { style: { background: '#333', color: '#fff' } });
      }
    } catch {
      setAppliedCoupon(null);
      toast.error("Failed to verify coupon", { style: { background: '#333', color: '#fff' } });
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
      const finalUserId = phoneDigits; // Use phone number as the unique user ID
      
      const orderData = {
        userId: finalUserId,
        userName: name.trim(),
        userPhone: phoneDigits,
        items: normalizeCartLines(cart),
        location: finalLoc,
        total: grandTotal,
        couponCode: appliedCoupon ? couponCode : null,
        discount: finalDiscount,
        status: "placed",
        scheduledTime: scheduledTime === "Custom Time" ? customTime : scheduledTime,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error("Failed to place order");
      const orderResult = await res.json();

      // Auto-create/update user profile so "My Orders" works via phone number
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phoneDigits, location: finalLoc, userId: finalUserId }),
      });

      // Log them in silently
      localStorage.setItem("otw_user_id", finalUserId);

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

    } catch (e) {
      console.error(e);
      toast.error("Failed to place order", { style: { background: '#333', color: '#fff' } });
    } finally { setPlacing(false); }
  };

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }, []);

  if (placedOrderId) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
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
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
            70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(34,197,94,0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
          @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {isConfirmed ? (
          // ── CONFIRMED STATE ──
          <div style={{ textAlign: "center", animation: "slide-up 0.5s ease" }}>
            <div style={{ fontSize: "5rem", marginBottom: "16px" }}>🎉</div>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "pulse-ring-green 1.5s ease-in-out infinite" }}>
              <CheckCircle size={48} color="#22C55E" />
            </div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#22C55E" }}>Order Confirmed!</h2>
            <p style={{ color: "#a0a0a0", marginBottom: "32px", fontSize: "1.05rem", maxWidth: "440px", lineHeight: 1.7, textAlign: "center" }}>
              Your order has been <strong style={{ color: "#fff" }}>verified and accepted</strong>. Our team is now preparing it. Track your order live!
            </p>
            <Link
              href={`/track/${placedOrderId}`}
              style={{ background: "#0044ff", color: "#fff", padding: "16px 40px", borderRadius: "8px", fontWeight: 900, textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "10px", fontSize: "1.05rem" }}
            >
              Track My Order <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          // ── AWAITING CONFIRMATION STATE ──
          <div style={{ textAlign: "center", maxWidth: "480px", animation: "slide-up 0.5s ease" }}>
            {/* Pulsing phone */}
            <div style={{ fontSize: "5rem", marginBottom: "24px", display: "inline-block", animation: "phone-ring 2s ease-in-out infinite" }}>📞</div>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Order Received!</h2>
            <p style={{ color: "#a0a0a0", marginBottom: "32px", fontSize: "1rem", lineHeight: 1.7 }}>
              Thanks <strong style={{ color: "#fff" }}>{name}</strong>! Our team will call you at{" "}
              <strong style={{ color: "#4ade80" }}>+91 {phoneDigits}</strong> shortly to confirm your order is genuine.
            </p>

            {/* Waiting pill */}
            <div style={{
              background: "#18181b", border: "1px solid #27272a", borderRadius: "999px",
              padding: "14px 28px", display: "inline-flex", alignItems: "center", gap: "12px",
              marginBottom: "32px",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "3px solid #27272a", borderTop: "3px solid #0055ff", animation: "spin-slow 1s linear infinite" }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#a0a0a0" }}>Waiting for admin confirmation</span>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "20px 24px" }}>
              {[
                { icon: "✅", text: "Order placed successfully", done: true },
                { icon: "📞", text: "Awaiting admin call & confirmation", done: false, active: true },
                { icon: "🍳", text: "Order preparation starts", done: false },
                { icon: "🛵", text: "Rider assigned & dispatched", done: false },
                { icon: "📍", text: "Delivered to your location", done: false },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", opacity: step.done || step.active ? 1 : 0.35 }}>
                  <div style={{ fontSize: "1.3rem", width: 32, textAlign: "center" }}>{step.icon}</div>
                  <span style={{ fontWeight: step.active ? 700 : 600, color: step.active ? "#fff" : step.done ? "#4ade80" : "#6b7280", fontSize: "0.92rem" }}>
                    {step.text}
                    {step.active && <span style={{ color: "#6b7280" }}> …</span>}
                  </span>
                  {step.done && <CheckCircle size={16} color="#4ade80" style={{ marginLeft: "auto" }} />}
                </div>
              ))}
            </div>

            <p style={{ marginTop: "24px", fontSize: "0.78rem", color: "#555", lineHeight: 1.6 }}>
              This page auto-updates every 3 seconds. Please keep it open.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ background: "#111", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px", opacity: 0.5 }}>🛒</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Your cart is empty</h2>
        <p style={{ color: "#a0a0a0", marginBottom: "32px" }}>Looks like you haven't added any items yet.</p>
        <Link href="/" style={{ background: "#0044ff", color: "#fff", padding: "14px 32px", borderRadius: "6px", fontWeight: "bold", textDecoration: "none", textTransform: "uppercase" }}>
          Browse Menu
        </Link>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", background: "#1a1a1a", border: "1px solid #333",
    borderRadius: "6px", color: "#fff", outline: "none", fontSize: "0.95rem", transition: "border 0.2s"
  };

  const labelStyle = { display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#888", marginBottom: "8px", textTransform: "uppercase" as const, letterSpacing: "1px" };
  const cardStyle = { background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "24px" };
  const isLoggedIn = !!user;

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#e4e4e7", padding: "40px 0", fontFamily: "inherit", position: "relative" }}>
      {/* ── Phone Confirmation Modal ── */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setPlacing(false)} />
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "400px", position: "relative", zIndex: 101, animation: "slide-up 0.3s ease", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📱</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "8px", color: "#fff" }}>Confirm Your Number</h3>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0055ff", letterSpacing: "1px", marginBottom: "16px" }}>+91 {phoneDigits}</div>
            <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", padding: "12px", fontSize: "0.85rem", color: "#fcd34d", lineHeight: 1.5, textAlign: "left", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span>⚠️</span>
              <div>Our rider will call this exact number for delivery. <strong>Wrong numbers will cause your order to be cancelled and your account to be blocked.</strong></div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button disabled={placing} onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "14px", background: "#27272a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Edit Number</button>
              <button disabled={placing} onClick={handleConfirmAndPlace} style={{ flex: 1, padding: "14px", background: "#0055ff", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>{placing ? "Placing..." : "Yes, it's correct"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-grid" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px", alignItems: "start" }}>
        
        {/* Left Col - Cart Items & Location */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <Link href="/" style={{ color: "#888", display: "flex", alignItems: "center", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "#fff"} onMouseOut={(e) => e.currentTarget.style.color = "#888"}><ArrowLeft size={20}/></Link>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", margin: 0, color: "#fff" }}>Checkout</h1>
          </div>

          {/* Items */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid #27272a", paddingBottom: "12px", textTransform: "uppercase", color: "#fff", letterSpacing: "1px" }}>
              Order Summary ({cart.length} items)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {cart.map((c) => (
                <div key={c.cartItemId} style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "8px", background: "#fff", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                    <Image src={c.item.image} alt={c.item.name} fill style={{ objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.item.name}</div>
                    <div style={{ fontWeight: 600, color: "#a0a0a0", fontSize: "0.85rem", marginTop: "4px" }}>{c.item.category || "Item"}</div>
                    {c.lineDetails && (
                      <div style={{ marginTop: "6px", fontSize: "0.82rem", color: "#93C5FD", lineHeight: 1.4 }}>
                        {c.lineDetails}
                      </div>
                    )}
                    {!c.lineDetails && c.selectedCustomizations && c.selectedCustomizations.length > 0 && (
                      <div style={{ marginTop: "6px", fontSize: "0.82rem", color: "#93C5FD" }}>
                        {c.selectedCustomizations.map(sc => `${sc.category}: ${sc.option}`).join(" · ")}
                      </div>
                    )}
                    {!c.lineDetails && c.specialInstructions && (
                      <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "6px 10px", borderRadius: "6px", display: "inline-block", fontWeight: 600 }}>
                        <span style={{ color: "#d97706", marginRight: "4px" }}>Note:</span> {c.specialInstructions}
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "8px" }}>₹{c.unitPrice ?? c.item.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", border: "1px solid #3f3f46", borderRadius: "6px", padding: "4px" }}>
                      <button onClick={() => updateQuantity(c.cartItemId || c.item.id, c.quantity - 1)} style={{ width: 32, height: 32, border: "none", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={16}/></button>
                      <span style={{ fontWeight: 700, width: "20px", textAlign: "center", fontSize: "1rem" }}>{c.quantity}</span>
                      <button onClick={() => updateQuantity(c.cartItemId || c.item.id, c.quantity + 1)} style={{ width: 32, height: 32, border: "none", background: "transparent", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16}/></button>
                    </div>
                    <button onClick={() => removeFromCart(c.cartItemId || c.item.id)} style={{ width: 40, height: 40, borderRadius: "6px", border: "1px solid #3f3f46", background: "transparent", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Location */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", color: "#fff", letterSpacing: "1px" }}>
              <MapPin size={20} color="#0055ff"/> Delivery Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {!isLoggedIn ? (
                <>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Your Name</label>
                    <input type="text" style={inputStyle} placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Phone Number</label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ padding: "14px 16px", borderRadius: "6px", border: "1px solid #333", background: "#1a1a1a", fontWeight: 700, fontSize: "0.95rem", color: "#fff", flexShrink: 0 }}>🇮🇳 +91</div>
                      <input type="tel" style={{...inputStyle, flex: 1}} placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: "1 / -1", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0055ff", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", overflow: "hidden" }}>
                    {(profile as any)?.image ? (
                      <img src={(profile as any).image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "white", fontSize: "1.05rem", textTransform: "capitalize" }}>{profile?.name || name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "4px" }}>+91 {profile?.phone || phone}</div>
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>Campus Location</label>
                <select style={inputStyle} value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="" style={{color: "#888"}}>-- Select Spot --</option>
                  {CAMPUS_LOCATIONS.map(l => <option key={l} value={l} style={{color: "#fff", background: "#1a1a1a"}}>{l}</option>)}
                  <option value="Other (Type below)" style={{color: "#fff", background: "#1a1a1a"}}>Other (Type below)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Scheduled Time</label>
                <select style={inputStyle} value={scheduledTime} onChange={e => { setScheduledTime(e.target.value); setCustomTime(""); }}>
                  <option value="ASAP" style={{color: "#fff", background: "#1a1a1a"}}>ASAP (~15 mins)</option>
                  <option value="In 25 mins" style={{color: "#fff", background: "#1a1a1a"}}>In 25 mins</option>
                  <option value="In 45 mins" style={{color: "#fff", background: "#1a1a1a"}}>In 45 mins</option>
                  <option value="In 1 hr 15 mins" style={{color: "#fff", background: "#1a1a1a"}}>In 1 hr 15 mins</option>
                  <option value="Custom Time" style={{color: "#fff", background: "#1a1a1a"}}>Custom Time</option>
                </select>
                {scheduledTime === "Custom Time" && (
                  <div style={{ marginTop: "12px" }}>
                    <input type="time" style={inputStyle} value={customTime} onChange={e => setCustomTime(e.target.value)} />
                    {!isTimeValid() && customTime && (
                      <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "6px" }}>Time must be within the next 3 hours.</p>
                    )}
                  </div>
                )}
              </div>
              {isCustomLoc && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Specify Location</label>
                  <input type="text" style={inputStyle} placeholder="e.g. Near Basketball Court" value={customLocation} onChange={e => setCustomLocation(e.target.value)} />
                </div>
              )}
            </div>
            {!isLoggedIn && (
              <div style={{ marginTop: "24px", padding: "14px 16px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", fontSize: "0.85rem", color: "#fcd34d", lineHeight: 1.5, display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <div>
                  <strong style={{ color: "#f59e0b" }}>Please enter your real number.</strong> Our delivery partner will call this number to confirm your order. Fake numbers will result in a permanent block.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col - Bill */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Coupon */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", color: "#fff", letterSpacing: "1px" }}>
              <Tag size={20} color="#0055ff"/> Offers
            </h3>
            {appliedCoupon ? (
              <div style={{ background: "#1a1a1a", border: "1px solid #0055ff", padding: "16px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#0055ff", fontSize: "0.95rem", letterSpacing: "0.5px" }}>{couponCode} APPLIED</div>
                  <div style={{ fontSize: "0.8rem", color: "#a0a0a0", marginTop: "4px" }}>{appliedCoupon.label}</div>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "1px" }}>REMOVE</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="text" style={{...inputStyle, flex: 1}} placeholder="Promo code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                <button onClick={handleApplyCoupon} style={{ background: "#27272a", color: "#fff", border: "1px solid #3f3f46", padding: "0 24px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#3f3f46"} onMouseOut={(e) => e.currentTarget.style.background = "#27272a"}>Apply</button>
              </div>
            )}
          </div>

          {/* Bill Details */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "24px", borderBottom: "1px solid #27272a", paddingBottom: "12px", textTransform: "uppercase", color: "#fff", letterSpacing: "1px" }}>
              Bill Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "0.95rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a0a0a0" }}>Item Total</span>
                <span style={{ fontWeight: 600, color: "#fff" }}>₹{cartTotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a0a0a0" }}>Delivery Fee</span>
                <span style={{ fontWeight: 600, color: "#fff" }}>₹{deliveryFee}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#22c55e" }}>
                  <span>Discount ({couponCode})</span>
                  <span style={{ fontWeight: 600 }}>-₹{finalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px dashed #3f3f46", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800 }}>
                <span style={{ color: "#fff" }}>To Pay</span>
                <span style={{ color: "#0055ff" }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="place-order-btn"
              onClick={() => { if (canPlace) setShowConfirm(true); }}
              disabled={!canPlace || placing}
              style={{
                width: "100%", marginTop: "32px", padding: "18px", fontSize: "1.05rem", fontWeight: "bold",
                background: canPlace ? "#0044ff" : "#27272a", color: canPlace ? "#fff" : "#a0a0a0",
                border: "none", borderRadius: "6px", cursor: canPlace ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                textTransform: "uppercase", letterSpacing: "1px", transition: "background 0.2s"
              }}
              onMouseOver={(e) => { if(canPlace) e.currentTarget.style.background = "#0033cc" }}
              onMouseOut={(e) => { if(canPlace) e.currentTarget.style.background = "#0044ff" }}
            >
              {placing ? "Processing..." : <>Place Order <ArrowRight size={18}/></>}
            </button>
            {!location && <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#ef4444", marginTop: "12px", fontWeight: 600 }}>Please select delivery location</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
