"use client";
import { useState, useMemo } from "react";
import { useEffect } from "react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { MenuItem } from "@/lib/types";

const CATEGORIES = ["all", "coffee", "snacks", "meals", "drinks", "desserts"] as const;
const CAT_EMOJI: Record<string, string> = {
  all: "🍽️", coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤", desserts: "🍰",
};
const TIME_RECS: Record<string, string[]> = {
  morning: ["coffee", "snacks"],
  afternoon: ["meals", "drinks"],
  evening: ["coffee", "desserts"],
  night: ["snacks", "meals"],
};

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const timeOfDay = getTimeOfDay();
  const recCategories = TIME_RECS[timeOfDay];

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminBanner, setAdminBanner] = useState<{ text: string, link: string, active: boolean } | null>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem("otw_demo_banner");
      if (b) setAdminBanner(JSON.parse(b));
    } catch (e) {}

    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        if (!res.ok) {
          throw new Error("Server returned " + res.status);
        }
        const data = await res.json();
        setMenu(data.filter((item: MenuItem) => item.available));
      } catch (e) {
        console.error("Failed to fetch menu:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const popular = useMemo(() => menu.filter(i => i.isPopular), [menu]);
  const recommended: MenuItem[] = useMemo(() => menu.filter(i => i.isRecommended), [menu]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return menu;
    return menu.filter(i => i.category === activeCategory);
  }, [activeCategory, menu]);

  const showSections = activeCategory === "all";

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .food-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 16px !important; }
        }
      `}} />

      {/* Dynamic Admin Banner */}
      {adminBanner?.active && (
        <div style={{ background: "#0055ff", color: "white", textAlign: "center", padding: "12px", fontSize: "0.9rem", fontWeight: 700 }}>
          {adminBanner.link ? (
            <a href={adminBanner.link} style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {adminBanner.text}
            </a>
          ) : (
            <span>{adminBanner.text}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="otw-page-header">
        <div className="otw-container">
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "8px" }}>Our Menu</h1>
          <p style={{ opacity: 0.85, fontSize: "0.9rem" }}>
            Fresh campus food, curated daily. Delivered to you.
          </p>
        </div>
      </div>

      {/* Sticky Category Filters */}
      <div style={{
        position: "sticky", top: "60px", zIndex: 100,
        background: "rgba(248,250,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)", padding: "12px 0",
      }}>
        <div className="otw-container">
          <div style={{
            display: "flex", gap: "8px", overflowX: "auto",
            paddingBottom: "4px", WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                id={`filter-${cat}`}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "10px 20px", borderRadius: "999px",
                  border: "1.5px solid",
                  borderColor: activeCategory === cat ? "var(--primary)" : "var(--border)",
                  background: activeCategory === cat ? "var(--primary)" : "white",
                  color: activeCategory === cat ? "white" : "var(--text-mid)",
                  fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                  transition: "all 0.2s", textTransform: "capitalize",
                  fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {CAT_EMOJI[cat]} {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "#F8FAFF", minHeight: "60vh" }}>
        <div className="otw-container" style={{ padding: "32px 24px" }}>

          {showSections ? (
            <>
              {/* Popular — Horizontal scroller */}
              <section style={{ marginBottom: "48px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)" }}>
                    🔥 Popular Items
                  </h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Most ordered by students like you</p>
                </div>
                <div style={{
                  display: "flex", gap: "16px", overflowX: "auto",
                  paddingBottom: "12px", WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}>
                  {popular.map(item => (
                    <div key={item.id} style={{ minWidth: "260px", maxWidth: "280px", flexShrink: 0 }}>
                      <FoodCard item={item} compact/>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recommended — Horizontal scroller */}
              <section style={{ marginBottom: "48px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)" }}>
                    🎯 Recommended For You
                  </h2>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Perfect picks for your afternoon break
                  </p>
                </div>
                <div style={{
                  display: "flex", gap: "16px", overflowX: "auto",
                  paddingBottom: "12px", WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}>
                  {recommended.map(item => (
                    <div key={item.id} style={{ minWidth: "260px", maxWidth: "280px", flexShrink: 0 }}>
                      <FoodCard item={item} compact/>
                    </div>
                  ))}
                </div>
              </section>

              {/* All items — Grid */}
              <section>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "20px" }}>
                  📋 Full Menu
                </h2>
                <div className="food-grid">
                  {menu.map(item => <FoodCard key={item.id} item={item}/>)}
                </div>
              </section>
            </>
          ) : (
            <div>
              <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {CAT_EMOJI[activeCategory]} {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
                </span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 24px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>No items found</h3>
                  <p style={{ color: "var(--text-muted)" }}>Try a different category.</p>
                </div>
              ) : (
                <div className="food-grid">
                  {filtered.map(item => <FoodCard key={item.id} item={item}/>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer/>
    </>
  );
}
