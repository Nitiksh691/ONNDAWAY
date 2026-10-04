"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function LaunchingSoonPage() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated floating particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vy: number; vx: number; r: number; alpha: number; }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vy: -(0.2 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 3,
        alpha: 0.1 + Math.random() * 0.4,
      });
    }

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.alpha})`;
        ctx.fill();
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener("resize", handleResize); };
  }, []);

  // Countdown timer — targeting a launch date (you can change this)
  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 7); // 7 days from now — change as needed

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, launchDate.getTime() - now);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    // Optionally post to your waitlist API
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      color: "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
      padding: "32px 24px",
      textAlign: "center",
    }}>
      {/* Animated background particles */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />

      {/* Blue glow radial behind content */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80vw",
        height: "80vw",
        maxWidth: 700,
        maxHeight: 700,
        background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, width: "100%" }}>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 999, padding: "10px 22px",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #2563EB, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 16 }}>☕</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "1px", textTransform: "uppercase", color: "#E2E8F0" }}>
              ONN DA WAY
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          marginBottom: 24,
          fontFamily: "'Outfit', sans-serif",
          background: "linear-gradient(to bottom right, #FFFFFF 40%, rgba(255,255,255,0.5))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Something<br />Brewing 🚀
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
          marginBottom: 48,
          maxWidth: 460,
          margin: "0 auto 48px",
        }}>
          We&apos;re working hard to get things ready for you. Fresh coffee and a brand new experience is on its way.
        </p>

        {/* Countdown */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "clamp(12px, 3vw, 32px)",
          marginBottom: 56,
        }}>
          {[
            { label: "Days", val: timeLeft.d },
            { label: "Hours", val: timeLeft.h },
            { label: "Minutes", val: timeLeft.m },
            { label: "Seconds", val: timeLeft.s },
          ].map(({ label, val }) => (
            <div key={label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              minWidth: "clamp(64px, 15vw, 90px)",
            }}>
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                width: "100%",
                paddingTop: 16,
                paddingBottom: 16,
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}>
                {String(val).padStart(2, "0")}
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Email Notify Form */}
        {!submitted ? (
          <form onSubmit={handleNotify} style={{
            display: "flex", gap: 12, maxWidth: 460, margin: "0 auto",
            flexWrap: "wrap", justifyContent: "center",
          }}>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: "16px 20px",
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#FFFFFF", fontSize: "1rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button type="submit" style={{
              padding: "16px 28px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #2563EB, #3B82F6)",
              color: "white", fontWeight: 800, fontSize: "1rem",
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
              fontFamily: "inherit",
            }}>
              Notify Me
            </button>
          </form>
        ) : (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 14, padding: "16px 28px", color: "#4ADE80",
            fontWeight: 700, fontSize: "1rem",
          }}>
            ✅ You&apos;re on the list! We&apos;ll let you know.
          </div>
        )}

        {/* Footer note */}
        <p style={{
          marginTop: 48, fontSize: "0.85rem",
          color: "rgba(255,255,255,0.2)", fontWeight: 500,
        }}>
          © {new Date().getFullYear()} ONN DA WAY Coffee. All rights reserved.
        </p>
      </div>
    </div>
  );
}
