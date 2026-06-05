"use client";
import { useState, useEffect, useRef } from "react";
import { Order } from "@/lib/types";
import { TrendingUp, Package, Users, DollarSign, Activity, Tag, Plus, Trash2, Upload, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from "lucide-react";

type BannerSlide = {
  id: string;
  text: string;
  subText?: string;
  image: string;
  link: string;
  active: boolean;
};

const EMPTY_SLIDE = (): BannerSlide => ({
  id: Math.random().toString(36).slice(2),
  text: "",
  subText: "",
  image: "",
  link: "",
  active: true,
});

const CAT_OPTIONS = [
  { label: "No link (info only)", value: "" },
  { label: "Coffee", value: "/?category=coffee" },
  { label: "Snacks", value: "/?category=snacks" },
  { label: "Meals", value: "/?category=meals" },
  { label: "Drinks", value: "/?category=drinks" },
  { label: "Desserts", value: "/?category=desserts" },
];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/settings/banner");
        if (res.ok) {
          const bannerData = await res.json();
          setBannerEnabled(bannerData.bannerEnabled ?? true);
          if (bannerData.bannerSlides && Array.isArray(bannerData.bannerSlides)) {
            setSlides(bannerData.bannerSlides);
          }
        }
      } catch (err) {
        console.error("Failed to load banner settings:", err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchBanner();

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = async (file: File, idx: number) => {
    setUploadingIdx(idx);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });
        const uploadData = await res.json();
        if (res.ok && uploadData.url) {
          setSlides(prev => prev.map((s, i) => i === idx ? { ...s, image: uploadData.url } : s));
          import("react-hot-toast").then(({ default: toast }) => toast.success("Image uploaded!"));
        } else {
          import("react-hot-toast").then(({ default: toast }) => toast.error(uploadData.error || "Upload failed"));
        }
        setUploadingIdx(null);
      };
    } catch {
      import("react-hot-toast").then(({ default: toast }) => toast.error("Error reading image"));
      setUploadingIdx(null);
    }
  };

  const saveSlides = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerEnabled, bannerSlides: slides })
      });
      if (res.ok) {
        import("react-hot-toast").then(({ default: toast }) =>
          toast.success("Banner settings saved! 🎉", { style: { background: "#18181b", color: "#fff", border: "1px solid #27272a" } })
        );
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      import("react-hot-toast").then(({ default: toast }) => toast.error("Error saving banner settings"));
    } finally {
      setSaving(false);
    }
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setSlides(arr);
  };

  if (loading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#e4e4e7", gap: "12px", fontWeight: 700 }}>
        <div style={{ width: 24, height: 24, border: "3px solid #333", borderTop: "3px solid #0055ff", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
        Loading Dashboard...
      </div>
    );
  }

  const { summary, bestSellers, ordersByHour } = data;
  const popularItem = bestSellers?.[0] || { name: "None", count: 0 };
  const chartData = ordersByHour || [];
  const chartMax = Math.max(...chartData.map((c: any) => c.orders), 1);

  const STAT_CARDS = [
    { title: "Total Orders", value: summary.totalOrders, icon: <Package size={22}/>, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
    { title: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString()}`, icon: <DollarSign size={22}/>, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
    { title: "Unique Customers", value: summary.uniqueUsers, icon: <Users size={22}/>, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
    { title: "Top Item", value: popularItem.name, sub: `${popularItem.count} portions sold`, icon: <TrendingUp size={22}/>, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  ];

  return (
    <div style={{ fontFamily: "inherit", maxWidth: "1200px", margin: "0 auto", padding: "0 12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 900, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>Dashboard</h1>
        <div style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> LIVE
        </div>
      </div>
      <p style={{ color: "#71717a", marginBottom: "32px", fontSize: "0.95rem" }}>Welcome back. Here's your business overview.</p>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} style={{ background: "#18181b", border: `1px solid ${stat.border}`, borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${stat.bg}`; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 52, height: 52, borderRadius: "12px", background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.78rem", color: "#71717a", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.title}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.value}</div>
              {stat.sub && <div style={{ fontSize: "0.72rem", color: stat.color, marginTop: "4px", fontWeight: 700 }}>{stat.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "24px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="#0055ff"/> Peak Order Times
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", height: "160px", gap: "6px", borderBottom: "1px solid #27272a", paddingBottom: "8px", position: "relative", overflowX: "auto" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "25%", borderTop: "1px dashed #27272a", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #27272a", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "75%", borderTop: "1px dashed #27272a", zIndex: 0 }} />
          {chartData.map((d, i) => {
            const h = (d.orders / chartMax) * 100;
            return (
              <div key={i} style={{ flex: "1 0 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative", zIndex: 1 }} title={`${d.orders} orders`}>
                <div style={{ width: "100%", maxWidth: "32px", height: `${h}%`, background: "linear-gradient(180deg, #0055ff, rgba(0,85,255,0.15))", borderRadius: "5px 5px 0 0", minHeight: h > 0 ? "3px" : "0", transition: "height 0.5s ease" }} />
                <div style={{ fontSize: "0.6rem", color: "#52525b", transform: "rotate(-40deg)", marginTop: "8px", fontWeight: 600, whiteSpace: "nowrap" }}>{d.time}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Banner Manager ─── */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Tag size={18} color="#f59e0b"/>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", margin: 0 }}>Banner Manager</h3>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Global Master Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: bannerEnabled ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "6px 14px", borderRadius: "8px", border: `1px solid ${bannerEnabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: bannerEnabled ? "#10b981" : "#ef4444", textTransform: "uppercase" }}>Master Switch:</span>
              <button onClick={() => setBannerEnabled(!bannerEnabled)}
                style={{ background: "none", border: "none", cursor: "pointer", color: bannerEnabled ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
                {bannerEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                <span style={{ fontWeight: 800 }}>{bannerEnabled ? "ON" : "OFF"}</span>
              </button>
            </div>

            <button
              onClick={() => setSlides(prev => [...prev, EMPTY_SLIDE()])}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0055ff", color: "#fff", border: "none", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0044cc"}
              onMouseLeave={e => e.currentTarget.style.background = "#0055ff"}
            >
              <Plus size={16}/> Add Slide
            </button>
          </div>
        </div>
        <p style={{ color: "#71717a", fontSize: "0.85rem", marginBottom: "24px", maxWidth: "800px" }}>
          Toggle the "Master Switch" to globally enable or disable the entire banner feature on your website. When enabled, the banners below will replace the standard Hero Section. Keep the marquee always visible.
        </p>

        {slides.length === 0 && (
          <div style={{ border: "2px dashed #3f3f46", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🖼️</div>
            <div style={{ fontWeight: 700, color: "#e4e4e7", marginBottom: "6px" }}>No banner slides yet</div>
            <div style={{ color: "#71717a", fontSize: "0.85rem" }}>Click "Add Slide" to create your first banner.</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {slides.map((slide, idx) => (
            <div key={slide.id} style={{ background: "#111", border: `1px solid ${slide.active ? "rgba(0,85,255,0.4)" : "#27272a"}`, borderRadius: "12px", overflow: "hidden" }}>
              {/* Slide header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #1f1f22" }}>
                <span style={{ background: "#27272a", color: "#a1a1aa", borderRadius: "6px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 800 }}>SLIDE {idx + 1}</span>
                <div style={{ flex: 1 }} />
                {/* Toggle active */}
                <button onClick={() => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s))}
                  title={slide.active ? "Active" : "Inactive"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: slide.active ? "#10b981" : "#52525b", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", fontWeight: 700, padding: "4px 8px" }}>
                  {slide.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {slide.active ? "Active" : "Off"}
                </button>
                {/* Move up/down */}
                <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0} style={{ background: "#27272a", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", color: idx === 0 ? "#3f3f46" : "#a1a1aa", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronUp size={15}/></button>
                <button onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} style={{ background: "#27272a", border: "none", cursor: idx === slides.length - 1 ? "not-allowed" : "pointer", color: idx === slides.length - 1 ? "#3f3f46" : "#a1a1aa", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronDown size={15}/></button>
                <button onClick={() => setSlides(prev => prev.filter((_, i) => i !== idx))}
                  style={{ background: "#450a0a", border: "1px solid #7f1d1d", color: "#ef4444", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Trash2 size={13}/>
                </button>
              </div>

              {/* Slide body */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", padding: "16px" }}>
                {/* Image upload */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Banner Image</label>
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: "2px dashed #3f3f46", borderRadius: "10px", height: "160px",
                    background: "#0a0a0a", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.2s"
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#0055ff")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#3f3f46")}>
                    <input ref={el => { fileRefs.current[idx] = el; }} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, idx); }} />
                    {uploadingIdx === idx ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 28, height: 28, border: "3px solid #27272a", borderTopColor: "#0055ff", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
                        <span style={{ color: "#0055ff", fontWeight: 700, fontSize: "0.85rem" }}>Uploading...</span>
                      </div>
                    ) : slide.image ? (
                      <>
                        <img src={slide.image} alt="preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                        <div style={{ position: "relative", zIndex: 1, background: "rgba(0,0,0,0.55)", borderRadius: "8px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>
                          <Upload size={13}/> Change Image
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "#52525b" }}>
                        <Upload size={28} />
                        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Click to upload photo</span>
                        <span style={{ fontSize: "0.75rem" }}>JPG, PNG, WEBP</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Text */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Headline Text</label>
                  <input type="text" placeholder="SALE ON THE COLD COFFEE" value={slide.text}
                    onChange={e => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, text: e.target.value } : s))}
                    style={{ width: "100%", padding: "11px 14px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>

                {/* Sub text */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Sub-text (Optional)</label>
                  <input type="text" placeholder="Shop now, limited offer" value={slide.subText || ""}
                    onChange={e => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, subText: e.target.value } : s))}
                    style={{ width: "100%", padding: "11px 14px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>

                {/* Link */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Link to Category</label>
                  <select value={slide.link}
                    onChange={e => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, link: e.target.value } : s))}
                    style={{ width: "100%", padding: "11px 14px", background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }}>
                    {CAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Always show save button if we have master state to save, or slides */}
        <button onClick={saveSlides}
          style={{ marginTop: "24px", width: "100%", padding: "14px", background: saving ? "#334155" : "#0055ff", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,85,255,0.3)", transition: "background 0.2s" }}>
          {saving ? "Saving..." : "💾 Save Banner Settings"}
        </button>
      </div>
    </div>
  );
}
