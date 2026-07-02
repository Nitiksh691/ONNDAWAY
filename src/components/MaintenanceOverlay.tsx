"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { Phone, Wrench } from "lucide-react";

export default function MaintenanceOverlay() {
  const { profile, loading } = useApp();
  const pathname = usePathname();
  const [status, setStatus] = useState<{ mode: boolean; phone: string; message: string }>({ mode: false, phone: "", message: "" });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/settings/status")
      .then(res => res.json())
      .then(data => {
        setStatus({
          mode: data.maintenanceMode,
          phone: data.maintenancePhone,
          message: data.maintenanceMessage,
        });
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  // Don't show while checking or if user profile is loading
  if (checking || loading) return null;
  // If no maintenance mode, return nothing
  if (!status.mode) return null;
  // Admins bypass maintenance mode
  if (profile?.role === "admin") return null;
  // Admins might need to access /admin even if profile is slow to load, but we wait for loading above.

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999, background: "var(--primary)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", textAlign: "center", color: "white"
    }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
        <Wrench size={40} color="white" />
      </div>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "16px", lineHeight: 1.2 }}>
        We are under maintenance 🔧
      </h1>
      <p style={{ fontSize: "1.1rem", opacity: 0.9, maxWidth: "500px", marginBottom: "32px", lineHeight: 1.6 }}>
        {status.message || "We're currently making some improvements to our platform. We'll be back shortly!"}
      </p>
      
      {status.phone && (
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "400px", backdropFilter: "blur(10px)" }}>
          <p style={{ fontSize: "0.9rem", opacity: 0.8, fontWeight: 700, textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }}>Need to order right now?</p>
          <a href={`tel:${status.phone}`} style={{ 
            display: "inline-flex", alignItems: "center", gap: "10px", 
            background: "white", color: "var(--primary)", padding: "16px 24px", 
            borderRadius: "12px", fontWeight: 800, textDecoration: "none", fontSize: "1.1rem",
            boxShadow: "0 6px 16px rgba(0,0,0,0.1)"
          }}>
            <Phone size={20} /> Call {status.phone}
          </a>
        </div>
      )}
    </div>
  );
}
