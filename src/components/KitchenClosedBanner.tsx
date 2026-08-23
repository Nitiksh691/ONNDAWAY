"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { Clock } from "lucide-react";

export default function KitchenClosedBanner() {
  const { profile, settings } = useApp();
  const pathname = usePathname();
  const status = settings ? {
    closed: settings.kitchenClosed,
    openTime: settings.kitchenOpenTime,
    paused: settings.ordersPaused,
  } : { closed: false, openTime: "7:00 AM", paused: false };

  // Hide for admins
  if (profile?.role === "admin") return null;
  if (!status.closed && !status.paused) return null;
  // Don't show in admin paths or delivery paths
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  return (
    <div style={{
      background: "linear-gradient(90deg, #1D4ED8, #3B82F6, #1D4ED8)",
      backgroundSize: "200% 100%",
      color: "#FFFFFF",
      padding: "12px 0",
      position: "sticky", top: 0, zIndex: 1001,
      boxShadow: "0 4px 12px rgba(29, 78, 216, 0.4)",
      borderBottom: "1px solid #93C5FD",
      fontSize: "0.95rem", fontWeight: 800,
      letterSpacing: "0.5px",
      overflow: "hidden",
      whiteSpace: "nowrap",
      display: "flex", alignItems: "center"
    }} className="marquee-container">
      <style>{`
        @keyframes scroll-bounce {
          0% { transform: translateX(100vw); }
          50% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        @keyframes bg-shift {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .marquee-container {
          animation: bg-shift 10s linear infinite;
        }
        .marquee-content {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          animation: scroll-bounce 15s linear infinite;
          padding: 0 20px;
        }
      `}</style>

      <div className="marquee-content">
        {status.closed ? (
          <>
            <Clock size={18} color="#FFFFFF" />
            <span>🍳 KITCHEN IS CLOSED! WE WILL BE OPEN FROM {status.openTime} 🚀</span>
          </>
        ) : (
          <>
            <AlertTriangle size={18} color="#FEF08A" />
            <span style={{ color: "#FFFFFF" }}>🚨 HEAVY TRAFFIC! 🚦 ORDERS ARE TEMPORARILY PAUSED. WE WILL RESUME SHORTLY! ⏳</span>
          </>
        )}
      </div>
    </div>
  );
}
