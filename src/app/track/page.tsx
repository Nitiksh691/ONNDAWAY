"use client";
import { useApp } from "@/lib/context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "40px 24px" }}>
      <div className="otw-container" style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>
          Track Your Order
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "1.05rem" }}>
          Enter your Order ID below to see its live status.
        </p>

        <div className="item-glass-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 1735876352345"
            style={{
              width: "100%", padding: "16px 20px", borderRadius: "12px", border: "1.5px solid var(--border-light)",
              fontSize: "1rem", outline: "none", background: "white", fontFamily: "inherit"
            }}
          />
          <button
            onClick={() => {
              if (orderId.trim()) router.push(`/track/${orderId.trim()}`);
            }}
            style={{
              padding: "16px 24px", background: "var(--primary)", color: "white", borderRadius: "12px",
              fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            <Search size={18} /> Find Order
          </button>
        </div>
      </div>
    </div>
  );
}
