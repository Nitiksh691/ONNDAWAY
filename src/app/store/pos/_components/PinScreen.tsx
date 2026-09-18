"use client";

import React from "react";
import { Coffee } from "lucide-react";

type Props = {
  pin: string;
  setPin: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function PinScreen({ pin, setPin, onSubmit }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#FFFFFF",
          padding: "48px 36px",
          borderRadius: 32,
          boxShadow: "0 20px 60px rgba(1, 53, 251, 0.12), 0 4px 16px rgba(0,0,0,0.04)",
          border: "1px solid rgba(1, 53, 251, 0.07)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #0135FB 0%, #60A5FA 100%)",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(1,53,251,0.25)",
            }}
          >
            <Coffee color="white" size={40} />
          </div>
          <h1
            style={{
              color: "#0A0F2E",
              fontSize: "1.9rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Store POS
          </h1>
          <p
            style={{
              color: "#94A3B8",
              fontSize: "1rem",
              marginTop: 8,
              fontWeight: 500,
            }}
          >
            Enter your PIN to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 16,
              border: "2px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#0A0F2E",
              fontSize: "2rem",
              textAlign: "center",
              fontWeight: 800,
              outline: "none",
              transition: "border-color 0.2s",
              letterSpacing: "0.3em",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0135FB")}
            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            autoFocus
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #0135FB 0%, #3B82F6 100%)",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(1,53,251,0.3)",
              letterSpacing: "0.02em",
            }}
          >
            Unlock Terminal
          </button>
        </form>
      </div>
    </div>
  );
}
