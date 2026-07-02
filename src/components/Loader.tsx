"use client";
import { useEffect, useState } from "react";

export default function Loader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for a much shorter time (300ms) just to mask initial mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--primary)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      animation: loading ? "none" : "fadeOut 0.4s ease forwards",
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseLogo {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
      `}}/>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: "white", animation: "pulseLogo 1.5s infinite ease-in-out" }}>
        
        {/* Simple elegant logo text */}
        <div style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontWeight: 900, 
          fontSize: "2.5rem", 
          lineHeight: 1, 
          display: "flex", 
          alignItems: "center",
          gap: "8px",
          letterSpacing: "-0.02em"
        }}>
          ONN <span style={{ color: "#FDE68A" }}>DA</span> WAY
        </div>
        
        {/* Tiny delivery icon / dot */}
        <div style={{ width: 8, height: 8, background: "#FDE68A", borderRadius: "50%" }}></div>

      </div>
    </div>
  );
}
