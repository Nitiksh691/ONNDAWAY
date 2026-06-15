"use client";
import { useState, useEffect, useMemo, useDeferredValue, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { useApp } from "@/lib/context";
import OnboardingModal from "@/components/OnboardingModal";
import AuthModal from "@/components/AuthModal";
import { LocationModal, useDeliveryLocation } from "@/components/LocationModal";

type BannerSlide = {
  id: string;
  text: string;
  subText?: string;
  image: string;
  link: string;
  active: boolean;
};

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { profile } = useApp();
  const { location, saveLocation } = useDeliveryLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load banner slides & menu
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/settings/banner");
        if (res.ok) {
          const data = await res.json();
          setBannerEnabled(data.bannerEnabled ?? true);
          if (data.bannerSlides && Array.isArray(data.bannerSlides)) {
            setBannerSlides(data.bannerSlides.filter((s: BannerSlide) => s.active && s.image));
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
    active: true
  })), [menuItems]);

  const combinedBannerSlides = useMemo(() => [...bannerItems, ...bannerSlides], [bannerItems, bannerSlides]);
  const hasBanner = bannerEnabled && combinedBannerSlides.length > 0;

  // Autoplay slider
  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(combinedBannerSlides.length, 1));
    }, 5000);
  }, [combinedBannerSlides.length]);

  useEffect(() => {
    if (combinedBannerSlides.length > 1) startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [combinedBannerSlides.length, startAutoplay]);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
    startAutoplay(); // reset autoplay timer on manual navigation
  }, [startAutoplay]);

  const deferredSearch = useDeferredValue(searchQuery);
  const filteredItems = useMemo(() => menuItems.filter(i => {
    const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(deferredSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  }), [menuItems, selectedCategory, deferredSearch]);

  const popularItems = useMemo(() => menuItems.filter(i => i.isPopular).slice(0, 6), [menuItems]);
  const recommendedItems = useMemo(() => menuItems.filter(i => i.isRecommended).slice(0, 6), [menuItems]);
  const featuredIds = useMemo(
    () => new Set([...popularItems, ...recommendedItems].map(i => i.id)),
    [popularItems, recommendedItems]
  );
  const gridItems = useMemo(() => {
    if (selectedCategory !== "all") return filteredItems;
    return filteredItems.filter(i => !featuredIds.has(i.id));
  }, [filteredItems, selectedCategory, featuredIds]);
  const userName = profile?.name?.split(" ")[0] || null;

  const CAT_EMOJI: Record<string, string> = { all: "🍽️", coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤", desserts: "🍰" };

  return (
    <>
      <OnboardingModal onLoginClick={() => setShowAuthModal(true)} />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(uid) => { localStorage.setItem("otw_user_id", uid); window.location.reload(); }}
        />
      )}



      {/* ─── BANNER SLIDER ─── */}
      {hasBanner && (
        <div className="home-banner-section">
          <div className="otw-container">
            <div ref={sliderRef} className="home-banner-slider">
              {/* Slides */}
              {combinedBannerSlides.map((slide, idx) => (
                <div key={slide.id} style={{
                  position: "absolute", inset: 0,
                  opacity: idx === currentSlide ? 1 : 0,
                  transform: idx === currentSlide ? "scale(1)" : "scale(1.02)",
                  transition: "opacity 0.7s ease, transform 0.7s ease",
                  zIndex: idx === currentSlide ? 1 : 0,
                }}>
                  <Image
                    src={slide.image} alt={slide.text || "Banner"} fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="home-banner-slide-img"
                    priority={idx === 0}
                  />
                  {/* Dark gradient overlay */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)"
                  }} />

                  {/* Text content */}
                  <div className="home-banner-content">
                    {slide.text && (
                      <h3 className="home-banner-title">{slide.text}</h3>
                    )}
                    {slide.subText && (
                      <p className="home-banner-sub">{slide.subText}</p>
                    )}
                    {slide.link && (
                      <Link href={slide.link} className="home-banner-cta">
                        ORDER NOW <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {/* Navigation arrows (desktop) */}
              {combinedBannerSlides.length > 1 && (
                <>
                  <button onClick={() => goToSlide((currentSlide - 1 + combinedBannerSlides.length) % combinedBannerSlides.length)}
                    aria-label="Previous slide"
                    className="desktop-only"
                    style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                      width: 40, height: 40, borderRadius: "50%", border: "none",
                      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => goToSlide((currentSlide + 1) % combinedBannerSlides.length)}
                    aria-label="Next slide"
                    className="desktop-only"
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 3,
                      width: 40, height: 40, borderRadius: "50%", border: "none",
                      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Dots */}
              {combinedBannerSlides.length > 1 && (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 3,
                  display: "flex", gap: "6px"
                }}>
                  {combinedBannerSlides.map((_, idx) => (
                    <button key={idx} onClick={() => goToSlide(idx)} aria-label={`Slide ${idx + 1}`}
                      style={{
                        width: idx === currentSlide ? 24 : 8, height: 8, borderRadius: "99px", border: "none",
                        background: idx === currentSlide ? "#fff" : "rgba(255,255,255,0.4)",
                        cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── HERO (only when NO banners) ─── */}
      {!hasBanner && (
        <section style={{ background: "var(--primary)", padding: "60px 24px 48px", color: "white", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -80, right: -60 }} />
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", bottom: -40, left: "10%" }} />
          <div className="otw-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(2.4rem, 7vw, 4.5rem)", lineHeight: 1, textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.02em" }}>
              LIFE BEGINS <br /> AFTER <span style={{ color: "#93C5FD" }}>FLAVOR</span>.
            </h1>
            <p style={{ fontSize: "1.05rem", maxWidth: "500px", opacity: 0.85, marginBottom: "32px", fontWeight: 500, lineHeight: 1.6 }}>
              Curated coffee, snacks, and meals — delivered straight to you in minutes.
            </p>
          </div>
        </section>
      )}



      {/* ─── MARQUEE ─── */}
      <div className="marquee">
        <span>☕ FRESH COFFEE ⚡ FAST DELIVERY ☕ COLD COFFEE ⚡ BURGERS & SANDWICHES ☕ CAFÉ-STYLE FOOD ⚡ ROHINI DELIVERY ☕ ORDER NOW ⚡ ONN DA WAY ☕</span>
        <span>☕ FRESH COFFEE ⚡ FAST DELIVERY ☕ COLD COFFEE ⚡ BURGERS & SANDWICHES ☕ CAFÉ-STYLE FOOD ⚡ ROHINI DELIVERY ☕ ORDER NOW ⚡ ONN DA WAY ☕</span>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div style={{ background: "#fff", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 63, zIndex: 41 }}>
        <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
          <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for coffee, meals, snacks..."
            style={{
              width: "100%", padding: "12px 16px 12px 42px", borderRadius: "10px",
              border: "2px solid #e5e7eb", fontSize: "0.9rem", fontFamily: "'Outfit', sans-serif",
              fontWeight: 600, outline: "none", background: "#f9fafb", color: "#0A0F2E",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(1,53,251,0.1)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* ─── CATEGORY PILLS ─── */}
      <div className="category-scroll">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {CAT_EMOJI[cat] || "📦"} {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* ─── MENU CONTENT ─── */}
      <section style={{ padding: "24px 0 40px", background: "var(--bg-cream)", minHeight: "60vh" }}>
        <div className="otw-container">

          {/* Popular — top: social proof & bestsellers */}
          {selectedCategory === "all" && popularItems.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <div style={{ marginBottom: "14px", padding: "0 4px" }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 900, color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  🔥 Popular Right Now
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Trending picks — order what everyone&apos;s loving</p>
              </div>
              <div style={{
                display: "grid", gridAutoFlow: "column", gridAutoColumns: "220px",
                gap: "14px", overflowX: "auto", paddingBottom: "8px",
                WebkitOverflowScrolling: "touch", scrollbarWidth: "none", alignItems: "stretch",
              }}>
                {popularItems.map(item => (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", scrollSnapAlign: "start" }}>
                    <FoodCard item={item} compact />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended — middle: curated discovery */}
          {selectedCategory === "all" && recommendedItems.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <div style={{ marginBottom: "14px", padding: "0 4px" }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 900, color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  🎯 Recommended For You
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Hand-picked by us — great pairings & hidden gems</p>
              </div>
              <div style={{
                display: "grid", gridAutoFlow: "column", gridAutoColumns: "220px",
                gap: "14px", overflowX: "auto", paddingBottom: "8px",
                WebkitOverflowScrolling: "touch", scrollbarWidth: "none", alignItems: "stretch",
              }}>
                {recommendedItems.map(item => (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", scrollSnapAlign: "start" }}>
                    <FoodCard item={item} compact />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Full menu — bottom: complete browseable catalog */}
          <div style={{ marginBottom: "12px", padding: "0 4px" }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 900, color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {selectedCategory === "all" ? "📋 Full Menu" : `${CAT_EMOJI[selectedCategory] || "📦"} ${selectedCategory}`}
            </h2>
            {selectedCategory === "all" && (popularItems.length > 0 || recommendedItems.length > 0) && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Everything else — popular & recommended items shown above</p>
            )}
          </div>

          <div className="bento-grid">
            {loadingMenu ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260, borderRadius: "12px" }} />
              ))
            ) : (
              gridItems.map(item => (
                <FoodCard key={item.id} item={item} />
              ))
            )}
            {!loadingMenu && gridItems.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.3rem", color: "var(--text-muted)", fontWeight: 700 }}>No items found</h3>
                <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.9rem" }}>Try a different category or search.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      {/* Location Modal */}
      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSave={saveLocation}
      />

    </>
  );
}
