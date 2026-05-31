"use client";
import { useEffect, useState } from "react";

export default function Loader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for 1.8s
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
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
      animation: loading ? "none" : "fadeOut 0.5s ease forwards",
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes walk {
          0% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
          100% { transform: rotate(-20deg); }
        }
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
        .leg-left { transform-origin: 50% 60%; animation: walk 0.6s infinite ease-in-out; }
        .leg-right { transform-origin: 50% 60%; animation: walk 0.6s infinite ease-in-out; animation-delay: -0.3s; }
        .arm-left { transform-origin: 50% 30%; animation: walk 0.6s infinite ease-in-out; animation-delay: -0.3s; }
        .arm-right { transform-origin: 50% 30%; animation: walk 0.6s infinite ease-in-out; }
      `}}/>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "white" }}>
        {/* Text */}
        <div style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontWeight: 900, 
          fontSize: "3rem", 
          lineHeight: 0.9, 
          display: "flex", 
          flexDirection: "column",
          letterSpacing: "-0.03em"
        }}>
          <span>ONN</span>
          <span>DA</span>
          <span>WAY</span>
        </div>
        
        {/* Animated Stick Figure */}
        <svg width="80" height="120" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <circle cx="50" cy="30" r="20" fill="currentColor" stroke="none" />
          {/* Body */}
          <line x1="50" y1="50" x2="50" y2="90" />
          {/* Arms */}
          <g className="arm-left"><line x1="50" y1="60" x2="20" y2="90" /></g>
          <g className="arm-right"><line x1="50" y1="60" x2="80" y2="90" /></g>
          {/* Legs */}
          <g className="leg-left"><line x1="50" y1="90" x2="30" y2="140" /></g>
          <g className="leg-right"><line x1="50" y1="90" x2="70" y2="140" /></g>
        </svg>
      </div>
      <div style={{ marginTop: "24px", fontFamily: "'Outfit', sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "0.2em", fontSize: "0.9rem" }}>
        COFFEE
      </div>
    </div>
  );
}
