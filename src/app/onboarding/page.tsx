"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { User, BookOpen, Home, ChevronDown, Check, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "PG / Masters", "PhD"];

const ACCOMMODATION_LOCATIONS: Record<string, string[]> = {
  Hostel: [
    "Boys Hostel Block A",
    "Boys Hostel Block B",
    "Boys Hostel Block C",
    "Girls Hostel Block A",
    "Girls Hostel Block B",
    "Girls Hostel Block C",
    "Hostel Mess Area",
  ],
  PG: [
    "PG Area – North Campus",
    "PG Area – South Campus",
    "PG Area – East Gate",
    "PG Area – West Gate",
    "City PG – Sector 1",
    "City PG – Sector 2",
    "Faculty Quarters",
  ],
};

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", year: "", accommodation: "" as "Hostel" | "PG" | "", location: "" });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
    if (!loading && profile?.name) router.push("/menu");
  }, [user, profile, loading, router]);

  const locationOptions = form.accommodation ? ACCOMMODATION_LOCATIONS[form.accommodation] : [];

  const handleSave = async () => {
    if (!user || !form.name.trim() || !form.year || !form.accommodation || !form.location) return;
    setSaving(true);
    try {
      const profileData = {
        userId: user.uid,
        name: form.name.trim(),
        year: form.year,
        accommodation: form.accommodation,
        location: form.location,
        phone: "",
        role: "user" as const,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      await refreshProfile();
      toast.success("Welcome to ONN D A WAY! 🎉");
      router.push("/menu");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile. Try again.");
    } finally { setSaving(false); }
  };

  const fields = [
    {
      icon: <User size={22}/>,
      title: "What's your name?",
      subtitle: "We'll use this to personalise your experience",
      content: (
        <div>
          <label className="otw-label">Full Name</label>
          <input
            id="name-input"
            type="text"
            className="otw-input"
            placeholder="e.g. Arjun Sharma"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ fontSize: "1.05rem" }}
            autoFocus
          />
        </div>
      ),
      valid: !!form.name.trim(),
    },
    {
      icon: <BookOpen size={22}/>,
      title: "What year are you in?",
      subtitle: "Helps us recommend the right things",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {YEARS.map(y => (
            <button
              key={y}
              id={`year-${y.replace(/\s+/g, "-")}`}
              onClick={() => setForm(f => ({ ...f, year: y }))}
              style={{
                padding: "14px 16px", borderRadius: "12px", border: "2px solid",
                borderColor: form.year === y ? "var(--primary)" : "var(--border)",
                background: form.year === y ? "var(--accent)" : "white",
                color: form.year === y ? "var(--primary)" : "var(--text-mid)",
                fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                transition: "all 0.15s", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              {y}
              {form.year === y && <Check size={16}/>}
            </button>
          ))}
        </div>
      ),
      valid: !!form.year,
    },
    {
      icon: <Home size={22}/>,
      title: "Where do you stay?",
      subtitle: "So we can deliver right to you",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="otw-label">Accommodation Type</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {(["Hostel", "PG"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, accommodation: type, location: "" }))}
                  style={{
                    flex: 1, padding: "14px", borderRadius: "12px", border: "2px solid",
                    borderColor: form.accommodation === type ? "var(--primary)" : "var(--border)",
                    background: form.accommodation === type ? "var(--accent)" : "white",
                    color: form.accommodation === type ? "var(--primary)" : "var(--text-mid)",
                    fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                    transition: "all 0.15s", fontFamily: "inherit",
                  }}
                >
                  {type === "Hostel" ? "🏠 Hostel" : "🏢 PG"}
                </button>
              ))}
            </div>
          </div>
          {form.accommodation && (
            <div>
              <label className="otw-label">Select Location</label>
              <div style={{ position: "relative" }}>
                <select
                  id="location-select"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="otw-input"
                  style={{ appearance: "none", paddingRight: "40px" }}
                >
                  <option value="">-- Select your {form.accommodation} --</option>
                  {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={16} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", pointerEvents: "none",
                }}/>
              </div>
            </div>
          )}
        </div>
      ),
      valid: !!form.accommodation && !!form.location,
    },
  ];

  const current = fields[step];
  const canProceed = current.valid;

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Progress */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            {fields.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: "999px", marginRight: i < fields.length - 1 ? "8px" : 0,
                background: i <= step ? "var(--primary)" : "var(--border)",
                transition: "background 0.3s",
              }}/>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Step {step + 1} of {fields.length}
          </p>
        </div>

        <div className="otw-card" style={{ padding: "40px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "16px",
            background: "var(--accent)", color: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px",
          }}>
            {current.icon}
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px" }}>{current.title}</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "0.9rem" }}>{current.subtitle}</p>

          {current.content}

          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="otw-btn otw-btn-outline" style={{ flex: 1 }}>
                Back
              </button>
            )}
            {step < fields.length - 1 ? (
              <button
                id="next-step-btn"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed}
                className="otw-btn otw-btn-primary"
                style={{ flex: 1 }}
              >
                Continue <ArrowRight size={16}/>
              </button>
            ) : (
              <button
                id="complete-onboarding-btn"
                onClick={handleSave}
                disabled={!canProceed || saving}
                className="otw-btn otw-btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? "Saving..." : "🎉 Let's Go!"}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Your information is stored securely and never sold.
        </p>
      </div>
    </div>
  );
}
