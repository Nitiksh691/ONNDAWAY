"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight as ChevRight } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { MenuItem } from "@/lib/types";
import BannerSlider from "@/components/BannerSlider";
import { useApp } from "@/lib/context";
import { useMenu } from "@/hooks/useMenu";

type World = "food" | "munchies";

const FOOD_CAT_EMOJI: Record<string, string> = {
  all: "🍽️", coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤", desserts: "🍰",
};

const MUNCHIES_EMOJI: Record<string, string> = {
  all: "🛒",
};

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

function CatLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

/* ── Horizontal scroll / 2-col grid section ── */
function HScrollRow({ items, label, emoji, viewAllCategory, layout, cart, onAdd, onUpdateQuantity, onViewAll }: {
  items: MenuItem[];
  label: string;
  emoji: string;
  viewAllCategory?: string;
  layout: "horizontal" | "vertical";
  cart: any[];
  onAdd: any;
  onUpdateQuantity: any;
  onViewAll: (cat: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          {emoji} {label}
        </h2>
        {viewAllCategory && (
          <button
            onClick={() => onViewAll(viewAllCategory)}
            style={{
              display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)",
              padding: "5px 10px", borderRadius: "8px", background: "var(--accent-2)",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            View All <ChevRight size={13} />
          </button>
        )}
      </div>
      <div className="hsr-grid">
        {items.slice(0, 6).map(item => (
          <div key={item.id}>
            <FoodCard
              item={item}
              layout="vertical"
              cartItem={cart.find(c => c.item.id === item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Munchies: brand-grouped discovery row ── */
function BrandRow({ brand, items, cart, onAdd, onUpdateQuantity, onViewAll }: {
  brand: string;
  items: MenuItem[];
  cart: any[];
  onAdd: any;
  onUpdateQuantity: any;
  onViewAll: (brand: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.01em" }}>
          {brand}
        </h2>
        {items.length > 4 && (
          <button
            onClick={() => onViewAll(brand)}
            style={{
              display: "flex", alignItems: "center", gap: "4px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)",
              padding: "5px 10px", borderRadius: "8px", background: "rgba(1,53,251,0.06)",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            View All <ChevRight size={13} />
          </button>
        )}
      </div>
      <div className="hsr-grid">
        {items.slice(0, 4).map(item => (
          <div key={item.id}>
            <FoodCard
              item={item}
              layout="vertical"
              cartItem={cart.find(c => c.item.id === item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const initialWorld = (searchParams.get("world") as World) || "food";

  const [world, setWorld] = useState<World>(initialWorld);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeBrand, setActiveBrand] = useState<string>("all");
  const [menuLayout, setMenuLayout] = useState<"horizontal" | "vertical">("vertical");
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const { cart, addToCart, updateQuantity } = useApp();
  const { menuItems: rawMenuItems, isLoading: loading } = useMenu();

  // When world switches, reset filters
  const handleWorldSwitch = (w: World) => {
    setWorld(w);
    setActiveCategory("all");
    setActiveBrand("all");
  };

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
      } catch {}
    };
    fetchBanner();

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setActiveCategory(cat.toLowerCase());
    const w = params.get("world") as World;
    if (w === "munchies") setWorld("munchies");
  }, []);

  const menu = useMemo(() => {
    return [...rawMenuItems]
      .filter(item => item.available)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [rawMenuItems]);

  // Separate by world — items without 'world' field default to 'food'
  const foodItems = useMemo(() => menu.filter(i => !i.world || i.world === "food"), [menu]);
  const munchiesItems = useMemo(() => menu.filter(i => i.world === "munchies"), [menu]);

  const activeItems = world === "food" ? foodItems : munchiesItems;

  // Food: dynamic categories from DB
  const foodCategories = useMemo(() => {
    const cats = Array.from(new Set(foodItems.map(i => (i.category || "").toLowerCase()))).filter(Boolean);
    return ["all", ...cats];
  }, [foodItems]);

  // Munchies: dynamic brands from DB
  const munchiesBrands = useMemo(() => {
    const brands = Array.from(new Set(munchiesItems.map(i => i.brand || "").filter(Boolean)));
    return ["all", ...brands];
  }, [munchiesItems]);

  // Munchies: dynamic categories from DB
  const munchiesCategories = useMemo(() => {
    const cats = Array.from(new Set(munchiesItems.map(i => (i.category || "").toLowerCase()))).filter(Boolean);
    return ["all", ...cats];
  }, [munchiesItems]);

  const handleViewAll = useCallback((cat: string) => {
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBrandViewAll = useCallback((brand: string) => {
    setActiveBrand(brand);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Food: filter by category
  const filteredFood = useMemo(() => {
    if (activeCategory === "all") return foodItems;
    return foodItems.filter(i => (i.category || "").toLowerCase() === activeCategory);
  }, [activeCategory, foodItems]);

  // Food: by category for sections view
  const foodByCategory = useMemo(() => {
    const PRIORITY = ["coffee", "snacks", "meals", "drinks", "desserts"];
    const allCats = foodCategories.filter(c => c !== "all");
    const ordered = [...PRIORITY.filter(c => allCats.includes(c)), ...allCats.filter(c => !PRIORITY.includes(c))];
    return ordered.map(cat => ({
      cat,
      items: foodItems.filter(i => (i.category || "").toLowerCase() === cat),
    })).filter(g => g.items.length > 0);
  }, [foodItems, foodCategories]);

  // Munchies: filter by brand
  const filteredMunchies = useMemo(() => {
    if (activeBrand === "all" && activeCategory === "all") return munchiesItems;
    let items = munchiesItems;
    if (activeBrand !== "all") items = items.filter(i => (i.brand || "") === activeBrand);
    if (activeCategory !== "all") items = items.filter(i => (i.category || "").toLowerCase() === activeCategory);
    return items;
  }, [activeBrand, activeCategory, munchiesItems]);

  // Munchies: grouped by brand for "all" view
  const munchiesByBrand = useMemo(() => {
    const brands = Array.from(new Set(munchiesItems.map(i => i.brand || "").filter(Boolean)));
    return brands.map(brand => ({
      brand,
      items: munchiesItems.filter(i => i.brand === brand),
    })).filter(g => g.items.length > 0);
  }, [munchiesItems]);

  const showFoodSections = world === "food" && activeCategory === "all";
  const showMunchiesBrandSections = world === "munchies" && activeBrand === "all" && activeCategory === "all";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hscroll::-webkit-scrollbar { display: none; }
        .hsr-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .hsr-grid { display: flex; flex-wrap: wrap; gap: 14px; }
          .hsr-grid > div { flex: 0 0 185px; max-width: 185px; }
        }
        .food-grid-filtered {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .food-grid-filtered { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
        }

        /* ── World Toggle ── */
        .world-toggle-wrap {
          display: flex;
          background: #F1F5F9;
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .world-toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .world-toggle-btn.active {
          background: #FFFFFF;
          color: #0F172A;
          box-shadow: 0 1px 6px rgba(0,0,0,0.12);
        }
        .world-toggle-btn:not(.active) {
          background: transparent;
          color: #94A3B8;
        }
        /* Brand pill */
        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1.5px solid #E2E8F0;
          background: white;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .brand-pill.active {
          background: #0F172A;
          color: white;
          border-color: #0F172A;
        }
        /* Munchies empty state */
        .munchies-empty {
          text-align: center;
          padding: 80px 24px;
        }
        @media (min-width: 769px) { .mobile-only-banner { display: none !important; } }
      ` }} />

      {/* ─── BANNER SLIDER ─── */}
      {bannerEnabled && bannerSlides.length > 0 ? (
        <div className="mobile-only-banner">
          <BannerSlider slides={bannerSlides} variant="menu" />
        </div>
      ) : (
        <div className="otw-page-header">
          <div className="otw-container">
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "6px" }}>
              {world === "food" ? "Our Menu" : "Munchies & More"}
            </h1>
            <p style={{ opacity: 0.85, fontSize: "0.9rem" }}>
              {world === "food" ? "Fresh campus food, curated daily." : "Snacks, drinks & everyday cravings."}
            </p>
          </div>
        </div>
      )}

      {/* ─── WORLD TOGGLE + CATEGORY FILTERS ─── */}
      <div style={{
        position: "sticky", top: "60px", zIndex: 100,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div className="otw-container" style={{ padding: "10px 16px" }}>
          {/* World toggle */}
          <div className="world-toggle-wrap" style={{ marginBottom: 10 }}>
            <button
              className={`world-toggle-btn ${world === "food" ? "active" : ""}`}
              onClick={() => handleWorldSwitch("food")}
            >
              ☕ Coffee &amp; Food
            </button>
            <button
              className={`world-toggle-btn ${world === "munchies" ? "active" : ""}`}
              onClick={() => handleWorldSwitch("munchies")}
            >
              🍿 Munchies &amp; Drinks
            </button>
          </div>

          {/* Sub-filters row */}
          {world === "food" && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
              {foodCategories.map(cat => (
                <button
                  key={cat}
                  id={`filter-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`cat-btn ${activeCategory === cat ? "active" : ""}`}
                >
                  {FOOD_CAT_EMOJI[cat] || "✨"} {cat === "all" ? "All" : CatLabel(cat)}
                </button>
              ))}
            </div>
          )}

          {world === "munchies" && munchiesBrands.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
              {munchiesBrands.map(b => (
                <button
                  key={b}
                  onClick={() => { setActiveBrand(b); setActiveCategory("all"); }}
                  className={`brand-pill ${activeBrand === b ? "active" : ""}`}
                >
                  {b === "all" ? "All Brands" : b}
                </button>
              ))}
              {/* Also show categories if filtering by a brand */}
              {activeBrand !== "all" && munchiesCategories.filter(c => c !== "all").map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? "all" : cat)}
                  className={`cat-btn ${activeCategory === cat ? "active" : ""}`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {CatLabel(cat)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ background: "#F8FAFF", minHeight: "60vh" }}>
        <div className="otw-container" style={{ padding: "24px 16px" }}>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: 240, borderRadius: 16, background: "#E2E8F0",
                  backgroundImage: "linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite"
                }} />
              ))}
            </div>
          ) : world === "food" ? (
            /* ─ FOOD WORLD ─ */
            showFoodSections ? (
              <>
                <div style={{ borderTop: "2px solid rgba(1,53,251,0.08)", margin: "4px 0 28px", position: "relative" }}>
                  <span style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    background: "#F8FAFF", padding: "0 12px",
                    fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>Explore by Category</span>
                </div>
                {foodByCategory.map(({ cat, items }) => (
                  <HScrollRow
                    key={cat}
                    items={items}
                    label={CatLabel(cat)}
                    emoji={FOOD_CAT_EMOJI[cat] || "✨"}
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
              <div>
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)" }}>
                    {FOOD_CAT_EMOJI[activeCategory] || "✨"} {CatLabel(activeCategory)}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, background: "white", padding: "3px 10px", borderRadius: 999, border: "1px solid #E5E7EB" }}>
                    {filteredFood.length} item{filteredFood.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {filteredFood.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 24px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No items found</h3>
                  </div>
                ) : (
                  <div className="food-grid-filtered">
                    {filteredFood.map(item => (
                      <FoodCard
                        key={item.id}
                        item={item}
                        layout="vertical"
                        cartItem={cart.find(c => c.item.id === item.id)}
                        onAdd={addToCart}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            /* ─ MUNCHIES WORLD ─ */
            munchiesItems.length === 0 ? (
              <div className="munchies-empty">
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🍿</div>
                <h3 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#0F172A", marginBottom: 8 }}>
                  Coming Very Soon!
                </h3>
                <p style={{ color: "#64748B", fontSize: "0.95rem", maxWidth: 280, margin: "0 auto 24px" }}>
                  Chips, beverages & all your late-night cravings are on their way.
                </p>
                <button
                  onClick={() => handleWorldSwitch("food")}
                  style={{ background: "#0135FB", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
                >
                  Browse Food Menu ☕
                </button>
              </div>
            ) : showMunchiesBrandSections ? (
              <>
                <div style={{ borderTop: "2px solid rgba(1,53,251,0.08)", margin: "4px 0 28px", position: "relative" }}>
                  <span style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    background: "#F8FAFF", padding: "0 12px",
                    fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>Browse by Brand</span>
                </div>
                {munchiesByBrand.map(({ brand, items }) => (
                  <BrandRow
                    key={brand}
                    brand={brand}
                    items={items}
                    cart={cart}
                    onAdd={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onViewAll={handleBrandViewAll}
                  />
                ))}
              </>
            ) : (
              <div>
                <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {activeBrand !== "all" && (
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A" }}>{activeBrand}</span>
                  )}
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, background: "white", padding: "3px 10px", borderRadius: 999, border: "1px solid #E5E7EB" }}>
                    {filteredMunchies.length} item{filteredMunchies.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => { setActiveBrand("all"); setActiveCategory("all"); }}
                    style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0135FB", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear filters
                  </button>
                </div>
                {filteredMunchies.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 24px" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
                    <p style={{ color: "#64748B" }}>No products found.</p>
                  </div>
                ) : (
                  <div className="food-grid-filtered">
                    {filteredMunchies.map(item => (
                      <FoodCard
                        key={item.id}
                        item={item}
                        layout="vertical"
                        cartItem={cart.find(c => c.item.id === item.id)}
                        onAdd={addToCart}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
