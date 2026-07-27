"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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

function StandardInput({
  id, label, value, onChange, error
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        autoComplete="off"
        style={{
          width: "100%", padding: "14px 16px", background: "#111111",
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#81A1FF" : "#27272A"}`,
          borderRadius: 14, outline: "none", fontSize: "1rem", fontFamily: "'Inter', sans-serif",
          fontWeight: 500, color: "#FFFFFF", transition: "all 0.2s ease", boxSizing: "border-box",
        }}
      />
      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, marginTop: 6, marginLeft: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function StandardTextarea({
  id, label, value, onChange, error
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        style={{
          width: "100%", padding: "14px 16px", background: "#111111", minHeight: "100px", resize: "vertical",
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#81A1FF" : "#27272A"}`,
          borderRadius: 14, outline: "none", fontSize: "1rem", fontFamily: "'Inter', sans-serif",
          fontWeight: 500, color: "#FFFFFF", transition: "all 0.2s ease", boxSizing: "border-box",
        }}
      />
      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, marginTop: 6, marginLeft: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function StandardSelect({
  id, label, value, onChange, options, error
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "14px 16px", background: "#111111",
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#81A1FF" : "#27272A"}`,
          borderRadius: 14, outline: "none", fontSize: "1rem", fontFamily: "'Inter', sans-serif",
          fontWeight: 500, color: value ? "#FFFFFF" : "#71717A", transition: "all 0.2s ease",
          cursor: "pointer", appearance: "none", WebkitAppearance: "none", boxSizing: "border-box",
        }}
      >
        <option value="" disabled>{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={value ? "#FFFFFF" : "#71717A"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.78rem", fontWeight: 600, marginTop: 6, marginLeft: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function InternPage() {
  const [form, setForm] = useState({ name: "", year: "", branch: "", skills: "", project: "", reason: "" });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  
  const { user } = useApp();
  const [completedOrders, setCompletedOrders] = useState<number>(0);
  const [fetchingOrders, setFetchingOrders] = useState(true);

  useEffect(() => {
    if (!user) {
      setFetchingOrders(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          // Count only delivered orders
          const count = data.filter((o: any) => o.status === "delivered").length;
          setCompletedOrders(count);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setFetchingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const ordersLeft = Math.max(0, 3 - completedOrders);


  const updateField = (f: string, v: string) => {
    setForm((p) => ({ ...p, [f]: v }));
    if (errors[f]) setErrors((p: any) => ({ ...p, [f]: undefined }));
  };

  const validate = () => {
    const errs: any = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.year) errs.year = "Please select your year";
    if (!form.branch) errs.branch = "Please select your branch";
    if (!form.skills.trim()) errs.skills = "Skills are required";
    if (!form.project.trim()) errs.project = "Project description is required";
    if (!form.reason.trim()) errs.reason = "Please tell us why you want to join";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all fields correctly");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/intern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        toast.error(data.error || "Failed to submit application");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intern-page-root">
      <style>{`
        .intern-page-root {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          background: #0A0A0A; padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }
        .intern-page-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .intern-container {
          display: flex; flex-direction: column; width: 100%; max-width: 550px;
          height: 100%; max-height: 100vh; overflow-y: auto; padding: 40px 24px;
        }
        .intern-container::-webkit-scrollbar { display: none; }
        .intern-form-wrapper { width: 100%; }
        .intern-form-wrapper input::placeholder,
        .intern-form-wrapper textarea::placeholder,
        .intern-form-wrapper select:invalid {
          color: #71717A;
        }
        .submit-btn {
          position: relative; width: 100%; padding: 16px 24px;
          background: #EAF122; color: #000000; border: none; border-radius: 14px;
          font-family: 'Inter', sans-serif; font-size: 1.05rem; font-weight: 700;
          cursor: pointer; overflow: hidden; transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-btn:not(:disabled):hover { transform: translateY(-2px); background: #DCE318; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ripple-circle {
          position: absolute; border-radius: 50%; background: rgba(0,0,0,0.1);
          transform: scale(0); animation: rippleAnim 0.6s ease-out; pointer-events: none;
        }
        @keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }
        .btn-spinner {
          width: 20px; height: 20px; border: 2.5px solid rgba(0,0,0,0.3);
          border-top: 2.5px solid black; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="intern-container">
        <div className="intern-form-wrapper">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", minHeight: 400, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #22C55E, #16A34A)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17L4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>Application Submitted!</h2>
                <p style={{ color: "#A1A1AA", fontSize: "1rem", fontWeight: 500 }}>We will review your profile and get back to you shortly.</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                <motion.div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 100, marginBottom: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#81A1FF", boxShadow: "0 0 10px #81A1FF" }} />
                  <span style={{ color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Hiring Interns Now
                  </span>
                </motion.div>

                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                  Join our Team
                </h2>
                <p style={{ color: "#A1A1AA", fontSize: "1rem", fontWeight: 500, marginBottom: 36, lineHeight: 1.5, maxWidth: "90%" }}>
                  We are looking for passionate individuals to build the future of campus delivery. Apply below to become an intern.
                </p>

                <div style={{ background: "rgba(234, 241, 34, 0.1)", border: "1px solid rgba(234, 241, 34, 0.2)", padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
                  <h3 style={{ color: "#EAF122", fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>Eligibility Criteria</h3>
                  <p style={{ color: "#A1A1AA", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    To be eligible for this internship, you must have successfully completed at least <strong>3 orders</strong> using our service. We want team members who truly understand the ONN DA WAY experience!
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <StandardInput id="name" label="Full Name" value={form.name} onChange={(v) => updateField("name", v)} error={errors.name} />
                  
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <StandardSelect id="branch" label="Branch" value={form.branch} onChange={(v) => updateField("branch", v)} options={BRANCHES} error={errors.branch} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <StandardSelect id="year" label="Year" value={form.year} onChange={(v) => updateField("year", v)} options={YEARS} error={errors.year} />
                    </div>
                  </div>

                  <StandardInput id="skills" label="Core Skills (e.g. React, Node, Design)" value={form.skills} onChange={(v) => updateField("skills", v)} error={errors.skills} />
                  
                  <StandardTextarea id="project" label="Tell us about a project you've built" value={form.project} onChange={(v) => updateField("project", v)} error={errors.project} />
                  
                  <StandardTextarea id="reason" label="Why do you want to join our team?" value={form.reason} onChange={(v) => updateField("reason", v)} error={errors.reason} />

                  {!user ? (
                    <button type="button" className="submit-btn" onClick={() => document.getElementById("nav-auth-btn")?.click()} style={{ marginTop: 8, background: "#333", color: "#FFF", opacity: 0.8 }}>
                      Log In to check eligibility
                    </button>
                  ) : fetchingOrders ? (
                    <button type="button" className="submit-btn" disabled style={{ marginTop: 8, background: "#333", color: "#FFF", opacity: 0.8 }}>
                      Checking eligibility...
                    </button>
                  ) : ordersLeft > 0 ? (
                    <button type="button" className="submit-btn" disabled style={{ marginTop: 8, background: "#333", color: "#FFF", opacity: 0.8, cursor: "not-allowed" }}>
                      {ordersLeft} {ordersLeft === 1 ? "order" : "orders"} left to unlock
                    </button>
                  ) : (
                    <button ref={btnRef} type="submit" className="submit-btn" disabled={loading} onClick={handleRipple} style={{ marginTop: 8 }}>
                      {ripple && <span className="ripple-circle" style={{ left: ripple.x - 50, top: ripple.y - 50, width: 100, height: 100 }} />}
                      {loading ? "Submitting..." : "Submit Application"}
                    </button>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
