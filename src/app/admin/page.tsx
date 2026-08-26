"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSSEWithFallback } from "@/lib/useSSEWithFallback";
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

export type BentoSlideGroup = {
  position: number;
  slides: BannerSlide[];
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
  { label: "Coffee", value: "/?category=coffee" },
  { label: "Snacks", value: "/?category=snacks" },
  { label: "Meals", value: "/?category=meals" },
  { label: "Drinks", value: "/?category=drinks" },
  { label: "Desserts", value: "/?category=desserts" },
  { label: "Menu", value: "/menu" },
];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [bentoSlides, setBentoSlides] = useState<BentoSlideGroup[]>([
    { position: 0, slides: [] }, { position: 1, slides: [] }, { position: 2, slides: [] }, { position: 3, slides: [] }, { position: 4, slides: [] }
  ]);
  const [bannerMode, setBannerMode] = useState<"single" | "bento">("single");
  const [activeBentoTab, setActiveBentoTab] = useState(0);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [uploadingIdx, setUploadingIdx] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/settings/banner", {
          headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
        });
        if (res.ok) {
          const bannerData = await res.json();
          setBannerEnabled(bannerData.bannerEnabled ?? true);
          if (bannerData.bannerSlides && Array.isArray(bannerData.bannerSlides)) {
            setSlides(bannerData.bannerSlides);
          }
          if (bannerData.bentoSlides && Array.isArray(bannerData.bentoSlides)) {
            const fetched = bannerData.bentoSlides;
            setBentoSlides([0, 1, 2, 3, 4].map(pos => fetched.find((g: any) => g.position === pos) || { position: pos, slides: [] }));
          }
          setBannerMode(bannerData.bannerMode || "single");
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
        const res = await fetch("/api/admin/analytics", {
          headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
        });
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // SSE with automatic polling fallback when MongoDB is unavailable
  const stableFetchStats = useCallback(() => {
    fetch("/api/admin/analytics", {
      headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setData(data); })
      .catch(() => {});
  }, []);

  useSSEWithFallback(
    stableFetchStats,
    {
      onMessage: useCallback((data: any) => {
        if (data.type === "order_change") stableFetchStats();
      }, [stableFetchStats]),
      pollIntervalMs: 10000,
    }
  );

  const handleImageUpload = async (file: File, idx: number, isBento?: boolean, bentoPos?: number) => {
    const uploadId = isBento ? `bento_${bentoPos}_${idx}` : `single_${idx}`;
    setUploadingIdx(uploadId);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-admin-token": sessionStorage.getItem("otw_admin_token") || ""
          },
          body: JSON.stringify({ image: reader.result }),
        });
        const uploadData = await res.json();
        if (res.ok && uploadData.url) {
          if (isBento && bentoPos !== undefined) {
            setBentoSlides(prev => prev.map(g => g.position === bentoPos ? { ...g, slides: g.slides.map((s, i) => i === idx ? { ...s, image: uploadData.url } : s) } : g));
          } else {
            setSlides(prev => prev.map((s, i) => i === idx ? { ...s, image: uploadData.url } : s));
          }
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
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": sessionStorage.getItem("otw_admin_token") || ""
        },
        body: JSON.stringify({ bannerEnabled, bannerMode, bannerSlides: slides, bentoSlides })
      });
      if (res.ok) {
        import("react-hot-toast").then(({ default: toast }) =>
          toast.success("Banner settings saved! 🎉", { style: { background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0" } })
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


  if (loading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#334155", gap: "12px", fontWeight: 700 }}>
        <div style={{ width: 24, height: 24, border: "3px solid #333", borderTop: "3px solid #0055ff", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
        Loading Dashboard...
      </div>
    );
  }

  const { summary, bestSellers, ordersByHour } = data;
  const popularItem = bestSellers?.[0] || { name: "None", count: 0 };
  const chartData: { orders: number; time: string }[] = ordersByHour || [];
  const chartMax = Math.max(...chartData.map((c) => c.orders), 1);

  const STAT_CARDS = [
    { title: "Total Orders", value: summary.totalOrders, icon: <Package size={22} />, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
    { title: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
    { title: "Unique Customers", value: summary.uniqueUsers, icon: <Users size={22} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
    { title: "Top Item", value: popularItem.name, sub: `${popularItem.count} portions sold`, icon: <TrendingUp size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  ];

  const renderSlideEditor = (slide: BannerSlide, idx: number, isBento: boolean, bentoPos?: number) => {
    const updateSlide = (updates: Partial<BannerSlide>) => {
      if (isBento && bentoPos !== undefined) {
        setBentoSlides(prev => prev.map(g => g.position === bentoPos ? { ...g, slides: g.slides.map((s, i) => i === idx ? { ...s, ...updates } : s) } : g));
      } else {
        setSlides(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
      }
    };
    const move = (dir: -1 | 1) => {
      if (isBento && bentoPos !== undefined) {
        setBentoSlides(prev => prev.map(g => {
          if (g.position !== bentoPos) return g;
          const arr = [...g.slides];
          const next = idx + dir;
          if (next < 0 || next >= arr.length) return g;
          [arr[idx], arr[next]] = [arr[next], arr[idx]];
          return { ...g, slides: arr };
        }));
      } else {
        const arr = [...slides];
        const next = idx + dir;
        if (next < 0 || next >= arr.length) return;
        [arr[idx], arr[next]] = [arr[next], arr[idx]];
        setSlides(arr);
      }
    };
    const del = () => {
      if (isBento && bentoPos !== undefined) {
        setBentoSlides(prev => prev.map(g => g.position === bentoPos ? { ...g, slides: g.slides.filter((_, i) => i !== idx) } : g));
      } else {
        setSlides(prev => prev.filter((_, i) => i !== idx));
      }
    };

    const isUploading = uploadingIdx === (isBento ? `bento_${bentoPos}_${idx}` : `single_${idx}`);
    const isFirst = idx === 0;
    const isLast = isBento ? idx === bentoSlides[bentoPos!].slides.length - 1 : idx === slides.length - 1;

    return (
      <div key={slide.id} style={{ background: "#ffffff", border: `1px solid ${slide.active ? "rgba(0,85,255,0.4)" : "#e2e8f0"}`, borderRadius: "12px", overflow: "hidden" }}>
        {/* Slide header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ background: "#e2e8f0", color: "#94a3b8", borderRadius: "6px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 800 }}>SLIDE {idx + 1}</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => updateSlide({ active: !slide.active })}
            title={slide.active ? "Active" : "Inactive"}
            style={{ background: "none", border: "none", cursor: "pointer", color: slide.active ? "#10b981" : "#52525b", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", fontWeight: 700, padding: "4px 8px" }}>
            {slide.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            {slide.active ? "Active" : "Off"}
          </button>
          <button onClick={() => move(-1)} disabled={isFirst} style={{ background: "#e2e8f0", border: "none", cursor: isFirst ? "not-allowed" : "pointer", color: isFirst ? "#cbd5e1" : "#a1a1aa", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronUp size={15} /></button>
          <button onClick={() => move(1)} disabled={isLast} style={{ background: "#e2e8f0", border: "none", cursor: isLast ? "not-allowed" : "pointer", color: isLast ? "#cbd5e1" : "#a1a1aa", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronDown size={15} /></button>
          <button onClick={del} style={{ background: "#450a0a", border: "1px solid #7f1d1d", color: "#ef4444", borderRadius: "6px", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Trash2 size={13} />
          </button>
        </div>

        {/* Slide body */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", padding: "16px" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Banner Image</label>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "2px dashed #cbd5e1", borderRadius: "10px", height: "160px",
              background: "#f8fafc", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.2s"
            }}>
              <input type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, idx, isBento, bentoPos); }} />
              {isUploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#0055ff", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
                  <span style={{ color: "#0055ff", fontWeight: 700, fontSize: "0.85rem" }}>Uploading...</span>
                </div>
              ) : slide.image ? (
                <>
                  <img src={slide.image} alt="preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                  <div style={{ position: "relative", zIndex: 1, background: "rgba(0,0,0,0.55)", borderRadius: "8px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>
                    <Upload size={13} /> Change Image
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

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Headline Text</label>
            <input type="text" placeholder="SALE ON THE COLD COFFEE" value={slide.text}
              onChange={e => updateSlide({ text: e.target.value })}
              style={{ width: "100%", padding: "11px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Sub-text (Optional)</label>
            <input type="text" placeholder="Shop now, limited offer" value={slide.subText || ""}
              onChange={e => updateSlide({ subText: e.target.value })}
              style={{ width: "100%", padding: "11px 14px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Link / URL</label>
            <input
              type="text"
              placeholder="https://onndaway.vercel.app/item/... or /?category=coffee"
              value={slide.link}
              onChange={e => updateSlide({ link: e.target.value })}
              style={{ width: "100%", padding: "11px 14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", fontFamily: "monospace", marginBottom: "8px" }}
            />
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Quick pick:</span>
              <button onClick={() => updateSlide({ link: "" })} style={{ padding: "3px 10px", border: "1px solid #e2e8f0", borderRadius: "99px", background: slide.link === "" ? "#0055ff" : "#f8fafc", color: slide.link === "" ? "#fff" : "#64748b", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>None</button>
              {CAT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => updateSlide({ link: o.value })} style={{ padding: "3px 10px", border: "1px solid #e2e8f0", borderRadius: "99px", background: slide.link === o.value ? "#0055ff" : "#f8fafc", color: slide.link === o.value ? "#fff" : "#64748b", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{o.label}</button>
              ))}
            </div>
            {slide.link && (
              <div style={{ marginTop: "6px", fontSize: "0.73rem", color: "#10b981", fontWeight: 600, fontFamily: "monospace" }}>→ {slide.link}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "inherit", maxWidth: "1200px", margin: "0 auto", padding: "0 12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "1px", textTransform: "uppercase" }}>Dashboard</h1>
        <div style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> LIVE
        </div>
      </div>
      <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.95rem" }}>Welcome back. Here's your business overview.</p>

      {/* Admin Track Feature */}
      <div style={{ marginBottom: "32px", background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <Package size={20} color="#0f172a" />
        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>Track Specific Order:</div>
        <input 
          type="text" 
          placeholder="Enter Order ID" 
          id="adminTrackInput"
          style={{ flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.9rem" }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) window.location.href = `/track/${val}`;
            }
          }}
        />
        <button 
          onClick={() => {
            const val = (document.getElementById('adminTrackInput') as HTMLInputElement).value.trim();
            if (val) window.location.href = `/track/${val}`;
          }}
          style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
        >
          Track Order
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} style={{ background: "#ffffff", border: `1px solid ${stat.border}`, borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${stat.bg}`; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 52, height: 52, borderRadius: "12px", background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{stat.title}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.value}</div>
              {stat.sub && <div style={{ fontSize: "0.72rem", color: stat.color, marginTop: "4px", fontWeight: 700 }}>{stat.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "24px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="#0055ff" /> Peak Order Times
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", height: "160px", gap: "6px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", position: "relative", overflowX: "auto" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "25%", borderTop: "1px dashed #e2e8f0", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #e2e8f0", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "75%", borderTop: "1px dashed #e2e8f0", zIndex: 0 }} />
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
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Tag size={18} color="#f59e0b" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>Banner Manager</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
              <button onClick={() => setBannerMode("single")} style={{ padding: "6px 14px", border: "none", borderRadius: "6px", background: bannerMode === "single" ? "#ffffff" : "transparent", boxShadow: bannerMode === "single" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", fontWeight: 700, cursor: "pointer", color: bannerMode === "single" ? "#0f172a" : "#64748b" }}>Single Slider</button>
              <button onClick={() => setBannerMode("bento")} style={{ padding: "6px 14px", border: "none", borderRadius: "6px", background: bannerMode === "bento" ? "#ffffff" : "transparent", boxShadow: bannerMode === "bento" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", fontWeight: 700, cursor: "pointer", color: bannerMode === "bento" ? "#0f172a" : "#64748b" }}>Bento Grid</button>
            </div>

            {/* Global Master Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: bannerEnabled ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "6px 14px", borderRadius: "8px", border: `1px solid ${bannerEnabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: bannerEnabled ? "#10b981" : "#ef4444", textTransform: "uppercase" }}>Master Switch:</span>
              <button onClick={() => setBannerEnabled(!bannerEnabled)}
                style={{ background: "none", border: "none", cursor: "pointer", color: bannerEnabled ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}>
                {bannerEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                <span style={{ fontWeight: 800 }}>{bannerEnabled ? "ON" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {bannerMode === "single" ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <p style={{ color: "#64748b", fontSize: "0.85rem", maxWidth: "600px", margin: 0 }}>Manage the single full-width banner slider.</p>
              <button onClick={() => setSlides(prev => [...prev, EMPTY_SLIDE()])} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0055ff", color: "#ffffff", border: "none", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}><Plus size={16} /> Add Slide</button>
            </div>
            {slides.length === 0 && (
              <div style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🖼️</div>
                <div style={{ fontWeight: 700, color: "#334155", marginBottom: "6px" }}>No slides yet</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Click "Add Slide" to create your first banner.</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {slides.map((slide, idx) => renderSlideEditor(slide, idx, false))}
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "16px" }}>Manage the 5-cell Bento Grid layout. Each cell can act as an independent slider.</p>
            {/* Bento Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              {["Large Cell (Hero)", "Top Right", "Top Far-Right", "Bottom Right", "Bottom Far-Right"].map((label, i) => (
                <button key={i} onClick={() => setActiveBentoTab(i)} style={{ padding: "8px 16px", border: "1px solid", borderColor: activeBentoTab === i ? "#0055ff" : "#e2e8f0", borderRadius: "99px", background: activeBentoTab === i ? "rgba(0,85,255,0.1)" : "#f8fafc", color: activeBentoTab === i ? "#0055ff" : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
              <h4 style={{ margin: 0, color: "#0f172a", fontWeight: 800 }}>Slides for {["Large Cell (Hero)", "Top Right", "Top Far-Right", "Bottom Right", "Bottom Far-Right"][activeBentoTab]}</h4>
              <button onClick={() => setBentoSlides(prev => prev.map(g => g.position === activeBentoTab ? { ...g, slides: [...g.slides, EMPTY_SLIDE()] } : g))} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#0055ff", color: "#ffffff", border: "none", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}><Plus size={16} /> Add Slide</button>
            </div>

            {bentoSlides[activeBentoTab].slides.length === 0 && (
              <div style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "48px 24px", textAlign: "center", background: "#f8fafc" }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📦</div>
                <div style={{ fontWeight: 700, color: "#334155", marginBottom: "6px" }}>This grid cell is empty</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Add a slide to display an image here. Otherwise, it will show a grey placeholder.</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {bentoSlides[activeBentoTab].slides.map((slide, idx) => renderSlideEditor(slide, idx, true, activeBentoTab))}
            </div>
          </>
        )}

        {/* Save button */}
        <button onClick={saveSlides}
          style={{ marginTop: "32px", width: "100%", padding: "14px", background: saving ? "#334155" : "#0055ff", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,85,255,0.3)", transition: "background 0.2s" }}>
          {saving ? "Saving..." : "💾 Save Banner Settings"}
        </button>
      </div>
    </div>
  );
}
