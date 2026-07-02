"use client";
import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, List, ChevronRight } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { useApp } from "@/lib/context";
import OnboardingModal from "@/components/OnboardingModal";
import AuthModal from "@/components/AuthModal";
import { LocationModal, useDeliveryLocation } from "@/components/LocationModal";
import BannerSlider from "@/components/BannerSlider";

type LayoutMode = "grid" | "list";

const CAT_EMOJI: Record<string, string> = {
  all: "🍽️", coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤", desserts: "🍰",
};

/* ─── Horizontal Scroll Slider Section ─── */
function HSliderSection({
  title,
  emoji,
  items,
  cart,
  onAdd,
  onUpdateQuantity,
}: {
  title: string;
  emoji: string;
  items: any[];
  cart: any[];
  onAdd: any;
  onUpdateQuantity: any;
}) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, padding: "0 2px",
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 900,
            color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.4px",
            marginBottom: 2,
          }}>
            {emoji} {title}
          </h2>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div style={{
        display: "flex", gap: 14, overflowX: "auto",
        paddingBottom: 10, WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        {items.map(item => (
          <div key={item.id} style={{ flexShrink: 0, width: 200 }}>
            <FoodCard
              item={item}
              layout="vertical"
              cartItem={cart.find((c: any) => c.item.id === item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerSlides, setBannerSlides] = useState<any[]>([]);
  const [bentoSlides, setBentoSlides] = useState<any[]>([]);
  const [bannerMode, setBannerMode] = useState<"single" | "bento">("single");
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { profile, cart, addToCart, updateQuantity } = useApp();
  const { location, saveLocation } = useDeliveryLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/settings/banner");
        if (res.ok) {
          const data = await res.json();
          setBannerEnabled(data.bannerEnabled ?? true);
          setBannerMode(data.bannerMode || "single");
          if (data.bannerSlides && Array.isArray(data.bannerSlides)) {
            setBannerSlides(data.bannerSlides.filter((s: any) => s.active && s.image));
          }
          if (data.bentoSlides && Array.isArray(data.bentoSlides)) {
            setBentoSlides(data.bentoSlides);
          }
        }
      } catch (err) {
        console.error("Failed to load banner settings:", err);
      }
    };
    fetchBanner();

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);

    fetch("/api/menu")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const available = data.filter((i: any) => i.available);
          setMenuItems(available);
          const cats = ["all", ...Array.from(new Set(available.map((i: any) => i.category as string)))];
          setCategories(cats);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMenu(false));
  }, []);

  const bannerItems = useMemo(() => menuItems.filter(i => i.isBanner).map(i => ({
    id: `item-${i.id}`,
    text: i.name,
    subText: i.description || "Freshly prepared for you",
    image: i.image,
    link: `/item/${i.id}`,
    active: true,
  })), [menuItems]);

  const combinedBannerSlides = useMemo(() => [...bannerItems, ...bannerSlides], [bannerItems, bannerSlides]);
  const hasBanner = bannerEnabled && combinedBannerSlides.length > 0;

  const deferredSearch = useDeferredValue(searchQuery);
  const filteredItems = useMemo(() => menuItems.filter(i => {
    const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(deferredSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  }), [menuItems, selectedCategory, deferredSearch]);

  const popularItems = useMemo(() => menuItems.filter(i => i.isPopular).slice(0, 10), [menuItems]);
  const recommendedItems = useMemo(() => menuItems.filter(i => i.isRecommended).slice(0, 10), [menuItems]);

  const featuredIds = useMemo(
    () => new Set([...popularItems, ...recommendedItems].map(i => i.id)),
    [popularItems, recommendedItems]
  );

  /* When showing "all" category without search, exclude featured from full menu to avoid dupe */
  const fullMenuItems = useMemo(() => {
    if (selectedCategory !== "all" || deferredSearch) return filteredItems;
    return filteredItems.filter(i => !featuredIds.has(i.id));
  }, [filteredItems, selectedCategory, deferredSearch, featuredIds]);

  return (
    <>
      <OnboardingModal onLoginClick={() => setShowAuthModal(true)} />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(uid) => { localStorage.setItem("otw_user_id", uid); window.location.reload(); }}
        />
      )}

      <style>{`
        .hn-toolbar {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }
        .hn-search-wrap { flex: 1; min-width: 200px; position: relative; }
        .hn-pills-wrap {
          display: flex; gap: 7px;
          overflow-x: auto; flex: 2; padding: 4px 0;
          scrollbar-width: none;
        }
        .hn-pills-wrap::-webkit-scrollbar { display: none; }
        .hn-layout-toggle {
          display: flex; gap: 2px;
          background: #f1f5f9; padding: 3px;
          border-radius: 10px; flex-shrink: 0;
          border: 1px solid #e2e8f0;
        }
        .hn-toggle-btn {
          width: 34px; height: 30px; border-radius: 8px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .hn-toggle-btn.active {
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          color: #0135FB;
        }
        .hn-toggle-btn:not(.active) {
          background: transparent; color: #94a3b8;
        }
        /* Grid card — square, big image */
        .menu-grid-sq {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 16px;
          width: 100%;
        }
        @media (max-width: 480px) {
          .hn-toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
          .hn-search-wrap { min-width: unset; }
          .hn-pills-wrap { flex: unset; }
          .menu-grid-sq { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (min-width: 768px) {
          .menu-grid-sq { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (min-width: 1024px) {
          .menu-grid-sq { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        }
        /* List card rows */
        .menu-list-rows {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 10px;
          width: 100%;
        }
        @media (max-width: 640px) {
          .menu-list-rows { grid-template-columns: 1fr; }
        }
        /* hscroll hide scrollbar */
        .hscroll-hide::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ─── BANNER SLIDER ─── */}
      {hasBanner && bannerMode === "single" && (
        <BannerSlider slides={combinedBannerSlides} variant="home" />
      )}
      {hasBanner && bannerMode === "bento" && (
        <BannerSlider bentoSlides={bentoSlides} variant="bento" />
      )}

      {/* ─── HERO (only when NO banners) ─── */}
      {!hasBanner && (
        <section style={{ background: "var(--primary)", padding: "56px 24px 44px", color: "white", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -80, right: -60 }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", bottom: -40, left: "10%" }} />
          <div className="otw-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(2.4rem, 7vw, 4.5rem)", lineHeight: 1, textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.02em" }}>
              LIFE BEGINS <br /> AFTER <span style={{ color: "#93C5FD" }}>FLAVOR</span>.
            </h1>
            <p style={{ fontSize: "1.05rem", maxWidth: "500px", opacity: 0.85, marginBottom: "32px", fontWeight: 500, lineHeight: 1.6 }}>
              Curated meals, snacks, and beverages — delivered straight to you in minutes.
            </p>
          </div>
        </section>
      )}

      {/* ─── MARQUEE ─── */}
      <div className="marquee">
        <span>🍔 FRESH MEALS ⚡ FAST DELIVERY 🍕 HOT FOOD ⚡ BURGERS &amp; SANDWICHES 🥤 COLD BEVERAGES ⚡ ROHINI DELIVERY 🛵 ORDER NOW ⚡ ONN DA WAY 🍔</span>
        <span>🍔 FRESH MEALS ⚡ FAST DELIVERY 🍕 HOT FOOD ⚡ BURGERS &amp; SANDWICHES 🥤 COLD BEVERAGES ⚡ ROHINI DELIVERY 🛵 ORDER NOW ⚡ ONN DA WAY 🍔</span>
      </div>

      {/* ─── UNIFIED SEARCH & CATEGORY + LAYOUT TOGGLE BAR ─── */}
      <div style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky", top: 60, zIndex: 41, padding: "12px 0",
      }}>
        <div className="otw-container hn-toolbar">

          {/* Search */}
          <div className="hn-search-wrap">
            <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meals, snacks..."
              style={{
                width: "100%", padding: "11px 14px 11px 40px", borderRadius: "99px",
                border: "1.5px solid #e5e7eb", fontSize: "0.92rem",
                fontFamily: "'Outfit', sans-serif", fontWeight: 600, outline: "none",
                background: "#f8fafc", color: "#0f172a", transition: "all 0.2s",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(1,53,251,0.1)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Category Pills */}
          <div className="hn-pills-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-btn${selectedCategory === cat ? " active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {CAT_EMOJI[cat] || "📦"} {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Grid / List Toggle */}
          <div className="hn-layout-toggle">
            <button
              title="Grid view"
              className={`hn-toggle-btn${layoutMode === "grid" ? " active" : ""}`}
              onClick={() => setLayoutMode("grid")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              title="List view"
              className={`hn-toggle-btn${layoutMode === "list" ? " active" : ""}`}
              onClick={() => setLayoutMode("list")}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MENU CONTENT ─── */}
      <section style={{ padding: "24px 0 120px", background: "var(--bg-cream)", minHeight: "60vh" }}>
        <div className="otw-container">

          {/* ── MOBILE CTA BANNER (Food Swipe CTA) ── */}
          <div className="mobile-only" style={{ marginBottom: "20px" }}>
            <div style={{
              background: "linear-gradient(135deg, var(--primary), #2A55FF)",
              borderRadius: "16px", padding: "16px", color: "white",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(1,53,251,0.25)"
            }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "4px" }}>Can't Decide?</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.9, lineHeight: 1.3 }}>Let us pick the perfect meal for you based on your cravings.</p>
              </div>
              <div style={{ fontSize: "2.5rem", paddingLeft: "12px" }}>
                ✨
              </div>
            </div>
          </div>

          {/* ── FULL MENU HEADER ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16, padding: "0 2px",
          }}>
            <div>
              <h2 style={{
                fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 900,
                color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2,
              }}>
                {selectedCategory === "all" ? "📋 Full Menu" : `${CAT_EMOJI[selectedCategory] || "📦"} ${selectedCategory}`}
              </h2>
              {!loadingMenu && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                  {fullMenuItems.length} item{fullMenuItems.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Link href="/menu" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)",
              padding: "5px 12px", borderRadius: 8, background: "var(--accent-2)",
              textDecoration: "none", transition: "background 0.15s",
            }}>
              See All <ChevronRight size={14} />
            </Link>
          </div>

          {/* ── GRID / LIST VIEW ── */}
          {loadingMenu ? (
            <div className={layoutMode === "grid" ? "menu-grid-sq" : "menu-list-rows"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{
                  height: layoutMode === "grid" ? 240 : 90,
                  borderRadius: 14,
                }} />
              ))}
            </div>
          ) : fullMenuItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.3rem", color: "var(--text-muted)", fontWeight: 700 }}>No items found</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.9rem" }}>Try a different category or search term.</p>
            </div>
          ) : layoutMode === "grid" ? (
            <div className="menu-grid-sq">
              {fullMenuItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  layout="vertical"
                  cartItem={cart.find((c: any) => c.item.id === item.id)}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
          ) : (
            <div className="menu-list-rows">
              {fullMenuItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  layout="horizontal"
                  cartItem={cart.find((c: any) => c.item.id === item.id)}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
          )}

          {/* ── POPULAR (Horizontal Slider) ── */}
          <div style={{ marginTop: "40px" }}>
            {!deferredSearch && selectedCategory === "all" && (
              <HSliderSection
                title="Popular Right Now"
                emoji="🔥"
                items={popularItems}
                cart={cart}
                onAdd={addToCart}
                onUpdateQuantity={updateQuantity}
              />
            )}
          </div>

          {/* ── RECOMMENDED (Horizontal Slider) ── */}
          {!deferredSearch && selectedCategory === "all" && (
            <HSliderSection
              title="Recommended For You"
              emoji="🎯"
              items={recommendedItems}
              cart={cart}
              onAdd={addToCart}
              onUpdateQuantity={updateQuantity}
            />
          )}

        </div>
      </section>

      <Footer />

      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSave={saveLocation}
      />
    </>
  );
}
