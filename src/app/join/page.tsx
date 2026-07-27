"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Biotechnology",
  "Mathematics",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Alumni"];

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MYSTERIOUS_SLIDES = [
  "Not just another campus app.",
  "Redefining late-night cravings.",
  "The fuel for your next big idea.",
  "Built in stealth. Launching soon.",
  "Something revolutionary is brewing.",
];

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface FormData {
  username: string;
  email: string;
  phoneNumber: string;
  branch: string;
  year: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  phoneNumber?: string;
  branch?: string;
  year?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   FLOATING CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

function FeatureCard({
  emoji,
  text,
  delay,
}: {
  emoji: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.05, y: -4 }}
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "default",
        transition: "background 0.3s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.08)";
      }}
    >
      <span style={{ fontSize: "1.4rem" }}>{emoji}</span>
      <span
        style={{
          color: "rgba(255,255,255,0.9)",
          fontWeight: 600,
          fontSize: "0.95rem",
          letterSpacing: "-0.01em",
        }}
      >
        {text}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STANDARD INPUT
   ═══════════════════════════════════════════════════════════════════ */

function StandardInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        placeholder={label}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "14px 16px",
          background: "#111111",
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#81A1FF" : "#27272A"}`,
          borderRadius: 14,
          outline: "none",
          fontSize: "1rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          color: "#FFFFFF",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            style={{
              color: "#ef4444",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginTop: 6,
              marginLeft: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STANDARD SELECT
   ═══════════════════════════════════════════════════════════════════ */

function StandardSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "#111111",
            border: `1.5px solid ${error ? "#ef4444" : focused ? "#81A1FF" : "#27272A"}`,
            borderRadius: 14,
            outline: "none",
            fontSize: "1rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: value ? "#FFFFFF" : "#71717A",
            transition: "all 0.2s ease",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            boxSizing: "border-box",
          }}
        >
          <option value="" disabled>
            {label}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {/* Dropdown arrow */}
        <div
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#9CA3AF",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            style={{
              color: "#ef4444",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginTop: 6,
              marginLeft: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFETTI PARTICLE (Success animation)
   ═══════════════════════════════════════════════════════════════════ */

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#0135FB", "#22C55E", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
  const color = colors[index % colors.length];
  const randomX = (Math.random() - 0.5) * 300;
  const randomY = -(Math.random() * 200 + 100);
  const randomRotate = Math.random() * 720 - 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: randomX,
        y: [randomY, randomY + 200],
        rotate: randomRotate,
        scale: [1, 1.2, 0.5],
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: color,
        borderRadius: Math.random() > 0.5 ? "50%" : 2,
        top: "50%",
        left: "50%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function JoinWaitlistPage() {
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    phoneNumber: "",
    branch: "",
    year: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % MYSTERIOUS_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // ── Validate on change ──
  const validate = useCallback(
    (data: FormData): FormErrors => {
      const e: FormErrors = {};
      if (!data.username.trim()) e.username = "Username is required";
      if (!data.email.trim()) e.email = "Email is required";
      else if (!EMAIL_REGEX.test(data.email)) e.email = "Enter a valid email";
      if (!data.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
      else if (!PHONE_REGEX.test(data.phoneNumber))
        e.phoneNumber = "Enter a valid 10-digit Indian number";
      if (!data.branch) e.branch = "Select your branch";
      if (!data.year) e.year = "Select your year";
      return e;
    },
    []
  );

  useEffect(() => {
    const newErrors = validate(form);
    // Only show errors for touched fields
    const filtered: FormErrors = {};
    for (const key of Object.keys(newErrors) as (keyof FormErrors)[]) {
      if (touched[key]) filtered[key] = newErrors[key];
    }
    setErrors(filtered);
  }, [form, touched, validate]);

  const allValid =
    Object.keys(validate(form)).length === 0 &&
    form.username.trim() !== "" &&
    form.email.trim() !== "";

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (serverError) setServerError("");
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields to reveal any errors
    setTouched({
      username: true,
      email: true,
      phoneNumber: true,
      branch: true,
      year: true,
    });

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setForm({
            username: "",
            email: "",
            phoneNumber: "",
            branch: "",
            year: "",
          });
          setTouched({});
          setErrors({});
        }, 4000);
      } else {
        setServerError(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Ripple effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <div className="join-page-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .join-page-root {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0A0A0A; /* Solid dark background */
          padding: 30px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .join-page-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .join-container {
          display: flex;
          width: 100%;
          max-width: 1100px;
          height: 100%;
          max-height: 850px;
          background: #0A0A0A;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          position: relative;
        }

        /* ── LEFT PANEL ── */
        .join-left {
          width: 45%;
          background: linear-gradient(135deg, #0135FB 0%, #1F6DFF 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          overflow: hidden;
          flex-shrink: 0;
        }



        /* ── RIGHT PANEL ── */
        .join-right {
          flex: 1;
          background: #0A0A0A;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 40px;
          overflow-y: auto;
          position: relative;
        }
        
        /* Hide scrollbar */
        .join-right::-webkit-scrollbar {
          display: none;
        }
        .join-right {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        .join-form-wrapper {
          width: 100%;
          max-width: 420px;
        }
        
        .join-form-wrapper input::placeholder,
        .join-form-wrapper select:invalid {
          color: #71717A;
        }

        /* ── PROGRESS BAR ── */
        .progress-track {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.12);
          border-radius: 100px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          width: 82%;
          background: linear-gradient(90deg, #22C55E, #4ADE80);
          border-radius: 100px;
          animation: progressGlow 2s ease-in-out infinite;
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 16px rgba(34,197,94,0.7); }
        }

        /* ── SUBMIT BTN ── */
        .join-submit-btn {
          position: relative;
          width: 100%;
          padding: 16px 24px;
          background: #EAF122;
          color: #000000;
          border: none;
          border-radius: 14px;
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          letter-spacing: 0;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .join-submit-btn:not(:disabled):hover {
          transform: translateY(-1px);
          background: #DCE318;
        }
        .join-submit-btn:not(:disabled):active {
          transform: translateY(0);
        }
        .join-submit-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Ripple */
        .ripple-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.35);
          transform: scale(0);
          animation: rippleAnim 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes rippleAnim {
          to { transform: scale(4); opacity: 0; }
        }

        /* Spinner */
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top: 2.5px solid white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FLOATING ANIMATION ── */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float-anim {
          animation: float 4s ease-in-out infinite;
        }
        .float-anim-slow {
          animation: float 5s ease-in-out infinite;
          animation-delay: 1s;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .join-page-root {
            padding: 0;
            background: #0A0A0A;
          }
          .join-container {
            flex-direction: column;
            border-radius: 0;
            max-height: 100vh;
            height: 100vh;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            margin: 0;
          }
          .join-left {
            display: none !important;
          }
          .join-right {
            padding: 40px 24px 48px;
            border-radius: 0;
            flex: 1;
            box-shadow: none;
          }
          .join-form-wrapper {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .join-page-root {
            padding: 0;
          }
          .join-right {
            padding: 32px 20px 40px;
          }
        }
      `}</style>

      <div className="join-container">
        {/* ════════════════════ LEFT PANEL (Now below on mobile) ════════════════════ */}
        <div className="join-left">
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 40 }}
            >
              <h1
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  marginBottom: 16,
                }}
              >
                Something
                <br />
                mysterious is
                <br />
                brewing.
              </h1>
            </motion.div>

            {/* Slider for text */}
            <div style={{ height: "100px", position: "relative", marginBottom: 30 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
                    }}
                  >
                    {MYSTERIOUS_SLIDES[slideIndex]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "20px 24px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>🚀</span>
                  <span
                    style={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase"
                    }}
                  >
                    Launch Status
                  </span>
                </div>
                <span style={{ color: "white", fontWeight: 800, fontSize: "0.9rem" }}>82%</span>
              </div>
              <div className="progress-track" style={{ marginBottom: 12 }}>
                <div className="progress-fill" />
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                Building something students will actually love.
              </p>
            </motion.div>

            
          </div>
        </div>

        {/* ════════════════════ RIGHT PANEL ════════════════════ */}
        <div className="join-right">
          <div className="join-form-wrapper">
            <AnimatePresence mode="wait">
              {success ? (
                /* ── SUCCESS STATE ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: 400,
                    position: "relative",
                  }}
                >
                  {/* Confetti */}
                  <div
                    style={{
                      position: "absolute",
                      top: "40%",
                      left: "50%",
                      pointerEvents: "none",
                    }}
                  >
                    {[...Array(30)].map((_, i) => (
                      <ConfettiParticle key={i} index={i} />
                    ))}
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.15,
                    }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #22C55E, #16A34A)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 28,
                      boxShadow: "0 8px 30px rgba(34,197,94,0.3)",
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path
                        d="M20 6L9 17L4 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.35 }}
                      />
                    </svg>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      fontSize: "clamp(1.3rem, 3vw, 1.6rem)",
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: 12,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    🎉 You&apos;re officially on the waitlist!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    style={{
                      color: "#6B7280",
                      fontSize: "1rem",
                      fontWeight: 500,
                      lineHeight: 1.6,
                    }}
                  >
                    We&apos;ll let you know before everyone else.
                  </motion.p>
                </motion.div>
              ) : (
                /* ── FORM STATE ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Top Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.6 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      padding: "6px 14px",
                      borderRadius: 100,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#81A1FF", boxShadow: "0 0 10px #81A1FF" }} />
                    <span style={{ color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Available in early 2026
                    </span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    style={{
                      fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginBottom: 12,
                    }}
                  >
                    Get early Access
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    style={{
                      color: "#A1A1AA",
                      fontSize: "1rem",
                      fontWeight: 500,
                      marginBottom: 36,
                      lineHeight: 1.5,
                      maxWidth: "90%",
                    }}
                  >
                    Be among the first to experience the future of campus beverage delivery. Join the waitlist to get notified when we launch.
                  </motion.p>

                  {/* Server error */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        style={{
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          borderRadius: 12,
                          padding: "14px 18px",
                          marginBottom: 24,
                          color: "#DC2626",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {serverError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.5 }}
                    >
                      <StandardInput
                        id="wl-username"
                        label="Username"
                        value={form.username}
                        onChange={(v) => updateField("username", v)}
                        error={errors.username}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <StandardInput
                        id="wl-email"
                        label="Email Address"
                        type="email"
                        value={form.email}
                        onChange={(v) => updateField("email", v)}
                        error={errors.email}
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.5 }}
                    >
                      <StandardInput
                        id="wl-phone"
                        label="Phone Number"
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(v) => updateField("phoneNumber", v)}
                        error={errors.phoneNumber}
                        maxLength={10}
                      />
                    </motion.div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        style={{ flex: "1 1 calc(50% - 8px)", minWidth: "140px" }}
                      >
                        <StandardSelect
                          id="wl-branch"
                          label="Branch"
                          value={form.branch}
                          onChange={(v) => updateField("branch", v)}
                          options={BRANCHES}
                          error={errors.branch}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.5 }}
                        style={{ flex: "1 1 calc(50% - 8px)", minWidth: "140px" }}
                      >
                        <StandardSelect
                          id="wl-year"
                          label="Year"
                          value={form.year}
                          onChange={(v) => updateField("year", v)}
                          options={YEARS}
                          error={errors.year}
                        />
                      </motion.div>
                    </div>

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      style={{ marginTop: 8 }}
                    >
                      <button
                        ref={btnRef}
                        type="submit"
                        className="join-submit-btn"
                        disabled={!allValid || loading}
                        onClick={handleRipple}
                      >
                        {ripple && (
                          <span
                            className="ripple-circle"
                            style={{
                              left: ripple.x - 50,
                              top: ripple.y - 50,
                              width: 100,
                              height: 100,
                            }}
                          />
                        )}
                        {loading ? (
                          <>
                            <span className="btn-spinner" />
                          </>
                        ) : (
                          <>
                            Continue
                          </>
                        )}
                      </button>
                    </motion.div>

                    {/* Footer Avatars */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {[
                          "https://i.pravatar.cc/150?img=11",
                          "https://i.pravatar.cc/150?img=12",
                          "https://i.pravatar.cc/150?img=13",
                          "https://i.pravatar.cc/150?img=14",
                        ].map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt="avatar"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              border: "2.5px solid #0A0A0A",
                              marginLeft: i === 0 ? 0 : -14,
                              zIndex: 10 - i,
                              position: "relative",
                            }}
                          />
                        ))}
                      </div>
                      <p style={{ color: "#71717A", fontSize: "0.9rem" }}>
                        Join <span style={{ color: "#FFFFFF", fontWeight: 700 }}>305+</span> others on the waitlist
                      </p>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
