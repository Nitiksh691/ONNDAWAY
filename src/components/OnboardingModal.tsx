"use client";
import { useState, useEffect } from "react";
import { X, ArrowRight, MapPin, Coffee, Shield, Clock } from "lucide-react";
import { LocationModal, useDeliveryLocation } from "./LocationModal";

export default function OnboardingModal({ onLoginClick }: { onLoginClick: () => void }) {
  const [show, setShow] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { location, saveLocation } = useDeliveryLocation();

  useEffect(() => {
    const hasOnboarded = localStorage.getItem("otw_onboarded");
    const userId = localStorage.getItem("otw_user_id");
    if (!hasOnboarded && !userId) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("otw_onboarded", "true");
    setShow(false);
  };

  const handleSetLocation = () => {
    setShowLocationModal(true);
  };

  const handleLocationSaved = (loc: string) => {
    saveLocation(loc);
    setShowLocationModal(false);
    // Auto-close onboarding after location is set
    setTimeout(() => handleClose(), 600);
  };

  const handleLogin = () => {
    handleClose();
    onLoginClick();
  };

  if (!show) return null;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9998,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}>
        {/* Backdrop */}
        <div
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        />

        <div style={{
          position: "relative", width: "100%", maxWidth: "440px", zIndex: 9999,
          background: "white", borderRadius: "24px", overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          animation: "onboard-pop 0.35s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <style>{`
            @keyframes onboard-pop {
              from { opacity: 0; transform: scale(0.93) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Close button */}
          <button onClick={handleClose} style={{
            position: "absolute", top: 16, right: 16, zIndex: 2,
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "rgba(255,255,255,0.25)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <X size={16} />
          </button>

          {/* Hero Header */}
          <div style={{
            background: "linear-gradient(135deg, #0135FB 0%, #0028D4 60%, #001899 100%)",
            padding: "40px 28px 32px", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Decorative blobs */}
            <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -60, right: -40, pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -30, left: -20, pointerEvents: "none" }} />

            {/* Emoji */}
            <div style={{ fontSize: "3.2rem", marginBottom: "16px" }}>☕</div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 900,
              fontSize: "1.75rem", color: "white", lineHeight: 1.1,
              textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "8px",
            }}>
              Welcome to<br />ONN D A WAY
            </h2>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.9rem", lineHeight: 1.55 }}>
              Fresh Meals & Café Favourites,<br />delivered to your door in Rohini.
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 28px 24px" }}>
            {/* Trust pills */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
              {[
                { icon: <Clock size={13} />, text: "30–45 min delivery" },
                { icon: <Coffee size={13} />, text: "Freshly prepared" },
                { icon: <MapPin size={13} />, text: "Rohini, Delhi" },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 10px", borderRadius: "99px",
                  background: "#EEF1FF", color: "#0135FB",
                  fontSize: "0.75rem", fontWeight: 700,
                }}>
                  {icon} {text}
                </div>
              ))}
            </div>

            {/* Info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "10px",
                  background: "#EEF1FF", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <MapPin size={18} color="#0135FB" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0A0F2E", marginBottom: "3px" }}>Serving selected areas of Rohini, Delhi</h4>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.5 }}>
                    Set your location below to confirm we deliver to you before browsing.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "10px",
                  background: "#FEF3C7", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <Shield size={18} color="#92400E" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0A0F2E", marginBottom: "3px" }}>Secure, flexible payment</h4>
                  <p style={{ fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.5 }}>
                    Pay a small 20% UPI advance to confirm your order. The remaining 80% is collected at your door.
                  </p>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleSetLocation}
              style={{
                width: "100%", padding: "15px", borderRadius: "12px",
                background: "linear-gradient(135deg, #0135FB, #0028D4)",
                color: "white", border: "none", fontWeight: 800,
                fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 6px 20px rgba(1,53,251,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(1,53,251,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(1,53,251,0.35)"; }}
            >
              <MapPin size={17} /> Set Delivery Location <ArrowRight size={17} />
            </button>

            {/* Secondary CTAs */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={handleLogin}
                style={{
                  flex: 1, padding: "11px", borderRadius: "10px",
                  border: "1.5px solid #0135FB", background: "white",
                  color: "#0135FB", fontWeight: 700, fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Log in
              </button>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, padding: "11px", borderRadius: "10px",
                  border: "1.5px solid #E5E7EB", background: "white",
                  color: "#6B7280", fontWeight: 700, fontSize: "0.85rem",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Browse first
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location modal nested above */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={handleLocationSaved}
      />
    </>
  );
}
