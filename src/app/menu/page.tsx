"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ChevronRight as ChevRight } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { MenuItem } from "@/lib/types";

import BannerSlider from "@/components/BannerSlider";
import { useApp } from "@/lib/context";
import { useMenu } from "@/hooks/useMenu";

const CATEGORIES = ["all", "coffee", "snacks", "meals", "drinks", "desserts"] as const;
const CAT_EMOJI: Record<string, string> = {
  all: "🍽️", coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤", desserts: "🍰",
};
const CAT_LABEL: Record<string, string> = {
  all: "All", coffee: "Coffee", snacks: "Snacks", meals: "Meals", drinks: "Drinks", desserts: "Desserts",
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

/* Horizontal scroll row for a list of items */
function HScrollRow({ items, label, emoji, viewAllCategory, emptyText, layout, cart, onAdd, onUpdateQuantity, onViewAll }: {
  items: MenuItem[];
  label: string;
  emoji: string;
  viewAllCategory?: string;
  emptyText?: string;
  layout: "horizontal" | "vertical";
  cart: any[];
  onAdd: any;
  onUpdateQuantity: any;
  onViewAll: (cat: string) => void;
}) {
  if (items.length === 0) {
    return emptyText ? (
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "8px 0" }}>{emptyText}</p>
    ) : null;
  }

  return (
    <section style={{ marginBottom: "40px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
            {emoji} {label}
          </h2>
        </div>
        {viewAllCategory && (
          <button
            onClick={() => onViewAll(viewAllCategory)}
            style={{
              display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)",
              padding: "5px 10px", borderRadius: "8px", background: "var(--accent-2)",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#D6DDFF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-2)"; }}
          >
            View All <ChevRight size={13} />
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div style={{
        display: "flex", gap: "14px", overflowX: "auto",
        paddingBottom: "8px", WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        {items.map(item => (
          <div key={item.id} style={{ minWidth: layout === "horizontal" ? "280px" : "185px", maxWidth: layout === "horizontal" ? "280px" : "185px", flexShrink: 0 }}>
            <FoodCard
              item={item}
              layout={layout}
              cartItem={cart.find(c => c.item.id === item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
            />
          </div>
        ))}

        {/* "See all" end card */}
        {viewAllCategory && (
          <button
            onClick={() => onViewAll(viewAllCategory)}
            style={{
              minWidth: "110px", maxWidth: "110px", flexShrink: 0, border: "2px dashed rgba(1,53,251,0.25)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "8px", borderRadius: "12px",
              color: "var(--primary)", fontWeight: 700,
              fontSize: "0.8rem", background: "rgba(1,53,251,0.03)",
              transition: "background 0.2s", padding: "16px 8px", textAlign: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(1,53,251,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(1,53,251,0.03)"; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "var(--accent-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight size={16} />
            </div>
            See all {label}
          </button>
        )}
      </div>
    </section>
  );
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [menuLayout, setMenuLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const { cart, addToCart, updateQuantity } = useApp();
  const { menuItems: rawMenuItems, isLoading: loading } = useMenu();

  const timeOfDay = getTimeOfDay();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/settings/banner");
        if (res.ok) {
          const data = await res.json();
          setBannerEnabled(data.bannerEnabled ?? true);
          if (data.bannerSlides && Array.isArray(data.bannerSlides)) {
            setBannerSlides(data.bannerSlides.filter((s: any) => s.active && s.image));
          }
        }
      } catch (err) {
        console.error("Failed to load banner settings:", err);
      }
    };
    fetchBanner();

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat && CATEGORIES.includes(cat as any)) {
      setActiveCategory(cat);
    }
  }, []);

  const menu = useMemo(() => rawMenuItems.filter(item => item.available), [rawMenuItems]);

  const handleViewAll = useCallback((cat: string) => {
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const popular = useMemo(() => menu.filter(i => i.isPopular), [menu]);
  const recommended = useMemo(() => menu.filter(i => i.isRecommended), [menu]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return menu;
    return menu.filter(i => i.category === activeCategory);
  }, [activeCategory, menu]);

  // Group menu by category for the "All" sectioned view
  const byCategory = useMemo(() => {
    const PRIORITY: string[] = ["coffee", "snacks", "meals", "drinks", "desserts"];
    const allCats: string[] = Array.from(new Set(menu.map(i => i.category as string)));
    const ordered = [
      ...PRIORITY.filter(c => allCats.includes(c)),
      ...allCats.filter(c => !PRIORITY.includes(c)),
    ];
    return ordered.map(cat => ({
      cat,
      items: menu.filter(i => i.category === cat),
    })).filter(g => g.items.length > 0);
  }, [menu]);

  const showSections = activeCategory === "all";

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .hscroll::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .food-grid-filtered { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
        @media (max-width: 400px) {
          .food-grid-filtered { grid-template-columns: 1fr !important; }
        }
      ` }} />

      {/* ─── BANNER SLIDER ─── */}
      {bannerEnabled && bannerSlides.length > 0 ? (
        <BannerSlider slides={bannerSlides} variant="menu" />
      ) : (
        <div className="otw-page-header">
          <div className="otw-container">
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "6px" }}>Our Menu</h1>
            <p style={{ opacity: 0.85, fontSize: "0.9rem" }}>Fresh campus food, curated daily.</p>
          </div>
        </div>
      )}

      {/* ─── Sticky Category Filters ─── */}
      <div style={{
        position: "sticky", top: "60px", zIndex: 100,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div className="otw-container" style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1, padding: "10px 0", scrollbarWidth: "none" as any }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                id={`filter-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`cat-btn ${activeCategory === cat ? "active" : ""}`}
              >
                {CAT_EMOJI[cat]} {CAT_LABEL[cat]}
              </button>
            ))}
          </div>
          {activeCategory !== "all" && (
            <div style={{ display: "flex", gap: 2, background: "#f1f5f9", padding: 3, borderRadius: 10, flexShrink: 0, border: "1px solid #e2e8f0" }}>
              <button title="List" onClick={() => setMenuLayout("horizontal")} style={{ width: 34, height: 32, borderRadius: 8, border: "none", background: menuLayout === "horizontal" ? "#fff" : "transparent", boxShadow: menuLayout === "horizontal" ? "0 1px 3px rgba(0,0,0,0.12)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: menuLayout === "horizontal" ? "#0135FB" : "#94a3b8", transition: "all 0.15s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
              <button title="Grid" onClick={() => setMenuLayout("vertical")} style={{ width: 34, height: 32, borderRadius: 8, border: "none", background: menuLayout === "vertical" ? "#fff" : "transparent", boxShadow: menuLayout === "vertical" ? "0 1px 3px rgba(0,0,0,0.12)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: menuLayout === "vertical" ? "#0135FB" : "#94a3b8", transition: "all 0.15s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ background: "#F8FAFF", minHeight: "60vh" }}>
        <div className="otw-container" style={{ padding: "28px 24px" }}>

          {loading ? (
            /* Skeleton */
            <div style={{ display: "flex", gap: "14px", overflowX: "hidden" }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  minWidth: 185, height: 240, borderRadius: 12, background: "#E2E8F0", flexShrink: 0,
                  backgroundImage: "linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite"
                }}
                />
              ))}
            </div>
          ) : showSections ? (
            <>
              {/* Popular — Horizontal scroll */}
              {popular.length > 0 && (
                <HScrollRow
                  items={popular}
                  label="Popular Right Now"
                  emoji="🔥"
                  layout={menuLayout}
                  cart={cart}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onViewAll={handleViewAll}
                />
              )}

              {/* Recommended — Horizontal scroll */}
              {recommended.length > 0 && (
                <HScrollRow
                  items={recommended}
                  label={`Perfect for ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`}
                  emoji="🎯"
                  layout={menuLayout}
                  cart={cart}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onViewAll={handleViewAll}
                />
              )}

              {/* Divider */}
              <div style={{ borderTop: "2px solid rgba(1,53,251,0.08)", margin: "8px 0 32px", position: "relative" }}>
                <span style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  background: "#F8FAFF", padding: "0 12px",
                  fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>Explore by Category</span>
              </div>

              {/* Per-category horizontal scroll rows */}
              {byCategory.map(({ cat, items }) => (
                <HScrollRow
                  key={cat}
                  items={items}
                  label={CAT_LABEL[cat]}
                  emoji={CAT_EMOJI[cat]}
                  viewAllCategory={cat}
                  layout={menuLayout}
                  cart={cart}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                  onViewAll={handleViewAll}
                />
              ))}
            </>
          ) : (
            /* Filtered category grid */
            <div>
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)" }}>
                  {CAT_EMOJI[activeCategory]} {CAT_LABEL[activeCategory]}
                </span>
                <span style={{
                  fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600,
                  background: "white", padding: "3px 10px", borderRadius: "999px", border: "1px solid #E5E7EB",
                }}>
                  {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 24px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>No items found</h3>
                  <p style={{ color: "var(--text-muted)" }}>Try a different category.</p>
                </div>
              ) : (
                <div className={menuLayout === "vertical" ? "food-grid" : "food-grid-filtered"} style={
                  menuLayout === "vertical" ? { width: "100%" } : {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 10,
                    width: "100%",
                  }
                }>
                  {filtered.map(item => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      layout={menuLayout}
                      cartItem={cart.find(c => c.item.id === item.id)}
                      onAdd={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
