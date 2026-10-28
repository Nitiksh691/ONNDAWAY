"use client";
import React, { useEffect, useState } from "react";
import WalkingLoader from "./WalkingLoader";

export default function Loader() {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Dismiss as soon as initial hydration completes
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 350);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% 40%, #083fe0 0%, #0128b5 60%, #001b80 100%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
        transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s ease",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.04)" : "scale(1)",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes roadScroll {
          0% { background-position: 0 0; }
          100% { background-position: -48px 0; }
        }
        @keyframes speedLine {
          0% { transform: translateX(120px); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translateX(-120px); opacity: 0; }
        }
        @keyframes mascotBob {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes trackFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `,
        }}
      />

      {/* Ambient energetic glow behind mascot */}
      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(1,53,251,0) 70%)",
          filter: "blur(32px)",
          animation: "glowPulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Speed dash streaks flying past in background */}
      <div
        style={{
          position: "relative",
          width: 220,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 24,
            width: 50,
            height: 2,
            background: "rgba(255,255,255,0.7)",
            borderRadius: 99,
            animation: "speedLine 0.9s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
            animationDelay: "0.1s",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 56,
            width: 70,
            height: 2.5,
            background: "rgba(255,255,255,0.85)",
            borderRadius: 99,
            animation: "speedLine 0.75s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
            animationDelay: "0.35s",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 86,
            width: 40,
            height: 2,
            background: "rgba(255,255,255,0.6)",
            borderRadius: 99,
            animation: "speedLine 0.85s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
            animationDelay: "0.55s",
          }}
        />

        {/* Dynamic moving delivery mascot */}
        <div style={{ animation: "mascotBob 0.7s ease-in-out infinite", zIndex: 2 }}>
          <WalkingLoader size={86} color="#FFFFFF" />
        </div>
      </div>

      {/* Animated moving road strip under mascot */}
      <div
        style={{
          width: 180,
          height: 4,
          borderRadius: 99,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0, rgba(255,255,255,0.9) 16px, transparent 16px, transparent 32px)",
          animation: "roadScroll 0.55s linear infinite",
          boxShadow: "0 0 12px rgba(255,255,255,0.5)",
          marginTop: -6,
          marginBottom: 20,
        }}
      />

      {/* Brand title */}
      <div style={{ textAlign: "center", zIndex: 2 }}>
        <h2
          style={{
            color: "#FFFFFF",
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: "1.25rem",
            fontWeight: 900,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            margin: 0,
            textShadow: "0 2px 14px rgba(0,0,0,0.3)",
          }}
        >
          {/* ONN DA WAY */}
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.82)",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.5px",
            margin: "4px 0 14px",
          }}
        >
          {/* Speedy Campus Delivery ⚡ */}
        </p>

        {/* Micro progress line */}
        <div
          style={{
            width: 130,
            height: 3,
            background: "rgba(255,255,255,0.22)",
            borderRadius: 99,
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#FFFFFF",
              borderRadius: 99,
              animation: "trackFill 0.8s ease-out forwards",
              boxShadow: "0 0 8px rgba(255,255,255,0.8)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
