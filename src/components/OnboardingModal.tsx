"use client";
import { useState, useEffect } from "react";
import { X, Search, Coffee, User as UserIcon, ArrowRight } from "lucide-react";

export default function OnboardingModal({ onLoginClick }: { onLoginClick: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem("otw_onboarded");
    const userId = localStorage.getItem("otw_user_id");
    // Only show to non-logged in users who haven't seen it yet
    if (!hasOnboarded && !userId) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("otw_onboarded", "true");
    setShow(false);
  };

  const handleLogin = () => {
    handleClose();
    onLoginClick();
  };

  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }} onClick={handleClose} />
      
      <div className="otw-card animate-fade-up" style={{
        position: "relative", width: "100%", maxWidth: "450px", zIndex: 10000, 
        padding: "0", background: "white", borderRadius: "24px", overflow: "hidden"
      }}>
        <div style={{ background: "var(--primary)", padding: "32px 24px", color: "white", textAlign: "center", position: "relative" }}>
          <button onClick={handleClose} style={{
            position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", color: "white", border: "none", 
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>
            <X size={18} />
          </button>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚀</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Welcome to <br/>Onn Da Way</h2>
          <p style={{ opacity: 0.9, fontSize: "0.95rem", lineHeight: 1.5 }}>We are here to serve you the best food and coffee right to your campus.</p>
        </div>

        <div style={{ padding: "32px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--accent-2)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Search size={20}/></div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-dark)", marginBottom: "4px" }}>Discover Great Food</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>Search our curated menu for your favorite snacks, meals, and beverages.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--accent-2)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={20}/></div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-dark)", marginBottom: "4px" }}>Create Your Profile</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>Create an account using just your mobile number, name, and profile picture. You can do this now or later during checkout.</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleLogin} className="otw-btn otw-btn-primary" style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "1.05rem" }}>
              Login / Create Account <ArrowRight size={18} />
            </button>
            <button onClick={handleClose} className="otw-btn otw-btn-outline" style={{ width: "100%", padding: "16px", borderRadius: "12px", fontSize: "1.05rem", border: "none", color: "var(--text-muted)" }}>
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
