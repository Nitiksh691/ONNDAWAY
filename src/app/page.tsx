"use client";
import React, { useState, useEffect, useMemo, useDeferredValue } from "react";
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
import { useMenu } from "@/hooks/useMenu";

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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Use CSS animation instead of JS scroll for better mobile support
  React.useEffect(() => {
    // keeping effect hook just in case, but empty
  }, []);

  if (items.length === 0) return null;
  return (
    <section style={{ marginBottom: 36, overflow: "hidden" }}>
      <style>{`
        @keyframes nudge-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-35px); }
        }
        .nudge-anim {
          animation: nudge-left 1s ease-in-out 0.8s;
        }
      `}</style>
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
        <Link href={`/menu?category=${encodeURIComponent(title)}`} style={{
          fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textDecoration: "none",
          display: "flex", alignItems: "center", gap: 2
        }}>
          See All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Horizontal scroll strip */}
      <div 
        ref={scrollRef}
        className="nudge-anim"
        style={{
        display: "flex", gap: 14, overflowX: "auto",
        paddingBottom: 10, WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        {items.map(item => (
          <div key={item.id} style={{ flexShrink: 0, width: 154 }}>
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

    // Menu fetch replaced by useMenu
  }, []);

  const { menuItems: rawMenuItems, isLoading: loadingMenu } = useMenu();
  const availableItems = useMemo(() => (Array.isArray(rawMenuItems) ? rawMenuItems : []).filter((i: any) => i.available), [rawMenuItems]);
  
  useEffect(() => {
    if (availableItems.length > 0) {
      const sortedItems = [...availableItems].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMenuItems(sortedItems);
      const cats = ["all", ...Array.from(new Set(sortedItems.map((i: any) => i.category as string)))];
      setCategories(cats);
    }
  }, [availableItems]);

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
        .hn-search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          font-size: 0.9rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          outline: none;
          background: white;
          color: #0f172a;
          transition: all 0.25s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .hn-search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(1,53,251,0.1), 0 4px 12px rgba(1,53,251,0.08);
          background: white;
        }
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
          gap: 14px;
          width: 100%;
        }
        @media (max-width: 480px) {
          .hn-toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
          .hn-search-wrap { min-width: unset; }
          .hn-pills-wrap { flex: unset; }
        }
        @media (max-width: 639px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          }
          .menu-grid-sq { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
        }
        @media (min-width: 640px) {
          .menu-grid-sq { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        }
        @media (min-width: 1024px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
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

        /* Hero animation */
        @keyframes hero-float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(8deg); }
        }
        @keyframes hero-float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-5deg); }
        }
        @keyframes hero-float-3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.08); }
        }
        .hero-emoji-1 { animation: hero-float-1 4s ease-in-out infinite; }
        .hero-emoji-2 { animation: hero-float-2 5s ease-in-out infinite 0.5s; }
        .hero-emoji-3 { animation: hero-float-3 3.5s ease-in-out infinite 1s; }
        .hero-emoji-4 { animation: hero-float-1 4.5s ease-in-out infinite 1.5s; }
        .hero-emoji-5 { animation: hero-float-2 3.8s ease-in-out infinite 0.8s; }
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
        <section style={{ background: "linear-gradient(135deg, #0028D4 0%, #0135FB 50%, #2A55FF 100%)", padding: "56px 24px 48px", color: "white", position: "relative", overflow: "hidden" }}>
          {/* Floating food emoji particles */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <span className="hero-emoji-1" style={{ position: "absolute", top: "12%", left: "8%", fontSize: "2.5rem", opacity: 0.18 }}>🍔</span>
            <span className="hero-emoji-2" style={{ position: "absolute", top: "20%", right: "12%", fontSize: "2rem", opacity: 0.15 }}>🍕</span>
            <span className="hero-emoji-3" style={{ position: "absolute", bottom: "20%", left: "15%", fontSize: "1.8rem", opacity: 0.12 }}>🥤</span>
            <span className="hero-emoji-4" style={{ position: "absolute", bottom: "30%", right: "8%", fontSize: "2.2rem", opacity: 0.14 }}>☕</span>
            <span className="hero-emoji-5" style={{ position: "absolute", top: "50%", left: "40%", fontSize: "1.5rem", opacity: 0.1 }}>🍟</span>
            {/* Big blur circles */}
            <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: -100, right: -80, filter: "blur(40px)" }} />
            <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", bottom: -60, left: "5%", filter: "blur(30px)" }} />
          </div>
          <div className="otw-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 20, fontSize: "0.8rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              🛵 Campus Food Delivery
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(2.6rem, 7vw, 4.8rem)", lineHeight: 1, textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.03em" }}>
              LIFE BEGINS <br /> AFTER <span style={{ background: "linear-gradient(135deg, #93C5FD, #BAE6FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>FLAVOR</span>.
            </h1>
            <p style={{ fontSize: "1.05rem", maxWidth: "480px", opacity: 0.88, marginBottom: "32px", fontWeight: 500, lineHeight: 1.65 }}>
              Curated meals, snacks &amp; beverages — delivered to your campus spot in minutes.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/menu" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 999, background: "white", color: "var(--primary)", fontWeight: 900, fontSize: "0.92rem", textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.5px" }}>🍽️ Browse Menu</a>
              <a href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 800, fontSize: "0.92rem", textDecoration: "none", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.5px" }}>📦 My Orders</a>
            </div>
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
              className="hn-search-input"
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
          ) : layoutMode === "grid" && selectedCategory === "all" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(() => {
                // Priority order: coffee always first, then rest in appearance order
                const PRIORITY = ["coffee", "snacks", "meals", "drinks", "desserts"];
                const allCats = categories.filter(c => c !== "all");
                const ordered = [
                  ...PRIORITY.filter(c => allCats.includes(c)),
                  ...allCats.filter(c => !PRIORITY.includes(c)),
                ];
                return ordered.map(cat => {
                  const catItems = fullMenuItems.filter(i => i.category === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <HSliderSection
                      key={cat}
                      title={cat}
                      emoji={CAT_EMOJI[cat] || "📦"}
                      items={catItems}
                      cart={cart}
                      onAdd={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  );
                });
              })()}
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
