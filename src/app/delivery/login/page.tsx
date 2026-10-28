"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Truck, ArrowRight, Lock, Phone, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function DeliveryLogin() {
  const { user, profile, loading } = useApp();
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");

  // Phone login
  const [phoneNumber, setPhoneNumber] = useState("");

  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user && profile?.role === "delivery") {
      router.push("/delivery/dashboard");
    }
  }, [user, profile, loading, router]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSigningIn(true);
    try {
      const res = await fetch("/api/delivery-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, action: "login" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("otw_delivery_id", data.uid);
        localStorage.setItem("otw_delivery_name", data.name);
        toast.success(`Welcome back, ${data.name}!`);
        router.push("/delivery/dashboard");
      } else {
        toast.error(data.error || "Rider not found. Ask admin to register your phone.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    try {
      if (email === "demo@delivery.com" && password === "demo123") {
        localStorage.setItem("otw_delivery_id", "demo1");
        toast.success("Logged in as Demo Partner!");
        router.push("/delivery/dashboard");
        return;
      }

      const res = await fetch("/api/delivery-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const dp = await res.json();
        localStorage.setItem("otw_delivery_id", dp.uid);
        toast.success("Login successful!");
        router.push("/delivery/dashboard");
      } else {
        toast.error("Invalid credentials.");
      }
    } catch {
      toast.error("Invalid credentials.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F1F5F9" }}>
      {/* Left decoration */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0135FB 0%, #0028D4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
        className="hide-mobile"
      >
        <div style={{ color: "white", textAlign: "center" }}>
          <Truck size={80} style={{ marginBottom: "24px", opacity: 0.9 }} />
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "16px", color: "white" }}>Delivery Partner Portal</h1>
          <p style={{ opacity: 0.85, fontSize: "1.1rem", maxWidth: 420, color: "white" }}>
            Live customer drop map, route direction vectors, and instant OTP verification.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "36px 32px", background: "white", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.08)", border: "1.5px solid #E2E8F0" }}>
          <div style={{ marginBottom: 16 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#64748B",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={16} /> Back to Store
            </Link>
          </div>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                background: "#EEF1FF",
                color: "#0135FB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Truck size={26} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Rider Sign In</h2>
            <p style={{ color: "#64748B", fontSize: "0.85rem", marginTop: "6px" }}>
              Enter your registered mobile number to start deliveries
            </p>
          </div>

          {/* Login Method Toggle */}
          <div style={{ display: "flex", gap: 6, background: "#F1F5F9", padding: 4, borderRadius: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setLoginMethod("phone")}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: loginMethod === "phone" ? "white" : "transparent",
                color: loginMethod === "phone" ? "#0135FB" : "#64748B",
                fontWeight: 800,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: loginMethod === "phone" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              📱 Mobile Number
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: loginMethod === "email" ? "white" : "transparent",
                color: loginMethod === "email" ? "#0135FB" : "#64748B",
                fontWeight: 800,
                fontSize: "0.82rem",
                cursor: "pointer",
                boxShadow: loginMethod === "email" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              }}
            >
              ✉️ Email & Pass
            </button>
          </div>

          {loginMethod === "phone" ? (
            <form onSubmit={handlePhoneLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: 6, textTransform: "uppercase" }}>
                  Registered Mobile Number
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", fontWeight: 800, fontSize: "0.9rem", color: "#334155" }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={signingIn}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  background: "#0135FB",
                  color: "white",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "1rem",
                  cursor: signingIn ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(1,53,251,0.3)",
                  marginTop: 6,
                }}
              >
                {signingIn ? "Verifying Rider..." : "Sign In & Open Dashboard"}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="partner@onndaway.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={signingIn}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  background: "#0135FB",
                  color: "white",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "1rem",
                  cursor: signingIn ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {signingIn ? "Signing In..." : "Login"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: "center", fontSize: "0.75rem", color: "#64748B" }}>
            New riders are registered directly by the Admin or Store Hub Partner.
          </div>
        </div>
      </div>
    </div>
  );
}
