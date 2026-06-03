"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { MenuItem } from "@/lib/types";

type BannerSlide = {
  id: string;
  text: string;
  subText?: string;
  image: string;
  link: string;
  active: boolean;
};

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
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Autoplay slider
  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(bannerSlides.length, 1));
    }, 5000);
  }, [bannerSlides.length]);

  useEffect(() => {
    if (bannerSlides.length > 1) startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [bannerSlides.length, startAutoplay]);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
    startAutoplay(); // reset autoplay timer on manual navigation
  }, [startAutoplay]);

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
    if (cat && CATEGORIES.includes(cat as any)) {
      setActiveCategory(cat);
    }

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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .food-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 16px !important; }
        }
      `}} />

      {/* ─── BANNER SLIDER ─── */}
      {bannerEnabled && bannerSlides.length > 0 ? (
        <div style={{ background: "var(--bg-cream)", padding: "24px 0 16px" }}>
          <div className="otw-container">
            <div ref={sliderRef} style={{
              position: "relative", borderRadius: "24px", overflow: "hidden",
              aspectRatio: "21/9", minHeight: "220px", maxHeight: "480px",
              background: "#111", boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
            }}>
              {/* Slides */}
              {bannerSlides.map((slide, idx) => (
                <div key={slide.id} style={{
                  position: "absolute", inset: 0,
                  opacity: idx === currentSlide ? 1 : 0,
                  transform: idx === currentSlide ? "scale(1)" : "scale(1.04)",
                  transition: "opacity 0.7s ease, transform 0.7s ease",
                  zIndex: idx === currentSlide ? 1 : 0,
                }}>
                  <Image
                    src={slide.image} alt={slide.text || "Banner"} fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    style={{ objectFit: "cover" }}
                    priority={idx === 0}
                  />
                  {/* Dark gradient overlay */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)"
                  }} />

                  {/* Text content */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2,
                    padding: "clamp(24px, 5vw, 48px)", display: "flex", flexDirection: "column", gap: "10px"
                  }}>
                    {slide.text && (
                      <h3 style={{
                        fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                        fontSize: "clamp(1.4rem, 5vw, 3.2rem)", lineHeight: 1.05,
                        color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em",
                        textShadow: "0 4px 16px rgba(0,0,0,0.8)",
                        maxWidth: "80%", wordBreak: "break-word", overflowWrap: "anywhere"
                      }}>
                        {slide.text}
                      </h3>
                    )}
                    {slide.subText && (
                      <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "clamp(0.9rem, 2.2vw, 1.15rem)", fontWeight: 500, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                        {slide.subText}
                      </p>
                    )}
                    {slide.link && (
                      <Link href={slide.link} style={{
                        display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "8px",
                        background: "var(--primary)", color: "#fff", padding: "12px 28px",
                        borderRadius: "99px", fontWeight: 800, fontSize: "0.95rem",
                        textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px",
                        width: "fit-content", boxShadow: "0 8px 24px rgba(1,53,251,0.5)",
                        transition: "transform 0.2s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        SHOP NOW <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {/* Navigation arrows (desktop) */}
              {bannerSlides.length > 1 && (
                <>
                  <button onClick={() => goToSlide((currentSlide - 1 + bannerSlides.length) % bannerSlides.length)}
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
                  <button onClick={() => goToSlide((currentSlide + 1) % bannerSlides.length)}
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
              {bannerSlides.length > 1 && (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 3,
                  display: "flex", gap: "6px"
                }}>
                  {bannerSlides.map((_, idx) => (
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
      ) : (
        <div className="otw-page-header">
          <div className="otw-container">
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "8px" }}>Our Menu</h1>
            <p style={{ opacity: 0.85, fontSize: "0.9rem" }}>
              Fresh campus food, curated daily. Delivered to you.
            </p>
          </div>
        </div>
      )}

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
                      <FoodCard item={item} compact />
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
                      <FoodCard item={item} compact />
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
                  {menu.map(item => <FoodCard key={item.id} item={item} />)}
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
                  {filtered.map(item => <FoodCard key={item.id} item={item} />)}
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
