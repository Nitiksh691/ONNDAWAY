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
      background: "#050505",
      color: "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Outfit', sans-serif",
      padding: "32px 24px",
      textAlign: "center",
    }}>
      {/* Premium ambient light */}
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "120vw", height: "80vh",
        background: "radial-gradient(circle at 50% 0%, rgba(1, 53, 251, 0.25) 0%, rgba(0,0,0,0) 60%)",
        pointerEvents: "none", zIndex: 0, filter: "blur(60px)"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Sleek Logo pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 20px", borderRadius: 999, marginBottom: 50,
          backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: "#38BDF8",
            boxShadow: "0 0 12px #38BDF8", animation: "pulse 2s infinite"
          }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#E2E8F0" }}>
            ONN DA WAY
          </span>
        </div>

        {/* Massive Typeface */}
        <h1 style={{
          fontSize: "clamp(3rem, 10vw, 7rem)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em",
          background: "linear-gradient(180deg, #FFFFFF 20%, rgba(255,255,255,0.3) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 32, textTransform: "uppercase"
        }}>
          THE NEXT <br /> EVOLUTION.
        </h1>

        <p style={{
          fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "rgba(255,255,255,0.6)",
          lineHeight: 1.5, fontWeight: 500, maxWidth: 500, margin: "0 auto 60px",
          fontFamily: "'Inter', sans-serif"
        }}>
          Coffee was just the beginning. The ultimate campus store experience is dropping soon.
        </p>

        {/* Minimal Countdown */}
        <div style={{ display: "flex", gap: "clamp(16px, 4vw, 40px)", marginBottom: 60, justifyContent: "center" }}>
          {[
            { label: "DAYS", val: timeLeft.d },
            { label: "HOURS", val: timeLeft.h },
            { label: "MINS", val: timeLeft.m },
            { label: "SECS", val: timeLeft.s },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                fontSize: "clamp(2rem, 6vw, 4rem)", fontWeight: 900, color: "#FFFFFF",
                lineHeight: 1, marginBottom: 8, fontVariantNumeric: "tabular-nums"
              }}>
                {String(val).padStart(2, "0")}
              </div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Glassmorphic Form */}
        {!submitted ? (
          <form onSubmit={handleNotify} style={{
            display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 999, padding: "6px", maxWidth: 440, width: "100%", backdropFilter: "blur(20px)"
          }}>
            <input
              type="email" required placeholder="Enter your email for early access"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none", color: "#FFF",
                padding: "0 20px", fontSize: "0.95rem", outline: "none", fontFamily: "'Inter', sans-serif"
              }}
            />
            <button type="submit" style={{
              background: "#FFFFFF", color: "#000000", border: "none", borderRadius: 999,
              padding: "14px 28px", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer",
              transition: "transform 0.2s, background 0.2s", textTransform: "uppercase", letterSpacing: "1px"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Get Notified
            </button>
          </form>
        ) : (
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#4ADE80", padding: "16px 32px", borderRadius: 999, fontWeight: 700,
            fontSize: "0.95rem", letterSpacing: "0.5px"
          }}>
            ACCESS SECURED. WE'LL BE IN TOUCH.
          </div>
        )}

      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}</style>
    </div>
  );
}
