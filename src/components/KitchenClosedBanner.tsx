"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { Clock } from "lucide-react";

export default function KitchenClosedBanner() {
  const { profile } = useApp();
  const pathname = usePathname();
  const [status, setStatus] = useState<{ closed: boolean; openTime: string }>({ closed: false, openTime: "7:00 AM" });

  useEffect(() => {
    fetch("/api/settings/status")
      .then(res => res.json())
      .then(data => {
        setStatus({
          closed: data.kitchenClosed,
          openTime: data.kitchenOpenTime,
        });
      })
      .catch(() => {});
  }, []);

  // Hide for admins
  if (profile?.role === "admin") return null;
  if (!status.closed) return null;
  // Don't show in admin paths or delivery paths
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  return (
    <div style={{
      background: "#EF4444", color: "white", padding: "12px 16px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      fontSize: "0.9rem", fontWeight: 700, position: "sticky", top: 0, zIndex: 1001,
      boxShadow: "0 2px 10px rgba(239,68,68,0.3)"
    }}>
      <Clock size={18} />
      <span>Kitchen is Closed 🍳 · We'll be open from {status.openTime}</span>
    </div>
  );
}
