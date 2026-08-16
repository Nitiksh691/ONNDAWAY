"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type BannerSlide = {
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

interface BannerSliderProps {
  slides?: BannerSlide[];
  bentoSlides?: BentoSlideGroup[];
  variant?: "home" | "menu" | "bento";
}

// ─── Bento cell ───────────────────────────────────────────────────────────────
function BentoCell({ slides, isLarge }: { slides: BannerSlide[]; isLarge?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(slides.length, 1));
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [slides.length, startAutoplay]);

  if (!slides || slides.length === 0) return null;

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      borderRadius: "16px", overflow: "hidden", background: "#111",
    }}>
      {slides.map((slide, idx) => (
        <div key={slide.id} style={{
          position: "absolute", inset: 0,
          opacity: idx === currentSlide ? 1 : 0,
          transform: idx === currentSlide ? "scale(1)" : "scale(1.05)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          zIndex: idx === currentSlide ? 1 : 0,
        }}>
          <Image src={slide.image} alt={slide.text || "Banner"} fill
            sizes={isLarge ? "(max-width: 768px) 100vw, 800px" : "(max-width: 768px) 50vw, 400px"}
            style={{ objectFit: "cover" }} priority={idx === 0} />
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: isLarge ? "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 100%)" : "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: isLarge ? "clamp(16px, 4vw, 32px)" : "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {slide.text && <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: isLarge ? "clamp(1.5rem, 4vw, 2.5rem)" : "clamp(1rem, 2.5vw, 1.3rem)", lineHeight: 1.05, color: "#fff", textTransform: "uppercase", margin: 0, letterSpacing: "-0.02em" }}>{slide.text}</h3>}
            {slide.subText && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: isLarge ? "clamp(0.9rem, 2vw, 1.1rem)" : "0.8rem", fontWeight: 500, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{slide.subText}</p>}
            {slide.link && (
              <Link href={slide.link} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "10px", background: "var(--primary)", color: "#fff", padding: isLarge ? "12px 24px" : "8px 16px", borderRadius: "99px", fontWeight: 800, fontSize: isLarge ? "0.9rem" : "0.75rem", textDecoration: "none", textTransform: "uppercase", width: "fit-content", boxShadow: "0 6px 20px rgba(1,53,251,0.4)", transition: "transform 0.2s", position: "relative", zIndex: 11 }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                ORDER NOW <ArrowRight size={isLarge ? 16 : 14} />
              </Link>
            )}
            {!isLarge && slide.link && (
              <Link href={slide.link} style={{ position: "absolute", inset: 0, zIndex: 10 }} aria-label={slide.text} />
            )}
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, display: "flex", gap: "5px" }}>
          {slides.map((_, idx) => (
            <div key={idx} style={{ width: idx === currentSlide ? 16 : 6, height: 4, borderRadius: "99px", background: idx === currentSlide ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.3s ease" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function BannerSlider({
  slides = [],
  bentoSlides = [],
  variant = "home",
}: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Touch swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (!slides || slides.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, [slides?.length]);

  useEffect(() => {
    if (slides && slides.length > 1) startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [slides?.length, startAutoplay]);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
    startAutoplay();
  }, [startAutoplay]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!slides || slides.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only register horizontal swipe if it's more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      if (dx < 0) goToSlide((currentSlide + 1) % slides.length);
      else goToSlide((currentSlide - 1 + slides.length) % slides.length);
    }
  };

  // ── Bento variant ──────────────────────────────────────────────────────────
  if (variant === "bento") {
    // Only render cells that actually have slides
    const activeCells = [0, 1, 2, 3, 4].map((pos) => {
      const group = bentoSlides.find((g) => g.position === pos);
      const activeSlides = group?.slides?.filter((s) => s.active && s.image) || [];
      return { pos, slides: activeSlides };
    }).filter((c) => c.slides.length > 0);

    // Dynamic grid based on number of active cells
    const count = activeCells.length;

    const getGridStyle = (): React.CSSProperties => {
      if (count === 0) return { display: "none" };
      if (count === 1) return {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        gridTemplateAreas: `"large"`,
        gap: "16px",
        width: "100%",
        aspectRatio: "16/7",
        minHeight: "300px",
      };
      if (count === 2) return {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr",
        gap: "16px",
        width: "100%",
        aspectRatio: "16/7",
        minHeight: "300px",
      };
      if (count === 3) return {
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gridTemplateAreas: `"large small1" "large small2"`,
        gap: "16px",
        width: "100%",
        aspectRatio: "16/7",
        minHeight: "300px",
      };
      // 4 or 5 — full bento
      return {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gridTemplateAreas: `"large large small1 small2" "large large small3 small4"`,
        gap: "16px",
        width: "100%",
        aspectRatio: "21 / 9",
        minHeight: "400px",
      };
    };

    const gridStyle = getGridStyle();

    const getCellStyle = (idx: number): React.CSSProperties => {
      if (count === 1) return { gridArea: "large" };
      if (count === 2) return {};
      if (count === 3) {
        if (idx === 0) return { gridArea: "large" };
        if (idx === 1) return { gridArea: "small1" };
        return { gridArea: "small2" };
      }
      // 4 or 5
      const areas = ["large", "small1", "small2", "small3", "small4"];
      return { gridArea: areas[idx] ?? "small4" };
    };

    if (count === 0) return null;

    return (
      <div className="home-banner-section" style={{ margin: 0, padding: 0, width: "100%", maxWidth: "100%", backgroundColor: "#111", borderRadius: 0 }}>
        <div className="otw-container">
          <div style={gridStyle}>
            {activeCells.map((cell, idx) => (
              <div key={cell.pos} style={{ ...getCellStyle(idx), height: "100%", width: "100%" }}>
                <BentoCell slides={cell.slides} isLarge={idx === 0} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!slides || slides.length === 0) return null;

  // ── Menu variant ────────────────────────────────────────────────────────────
  if (variant === "menu") {
    return (
      <div style={{ background: "var(--bg-cream)", padding: "20px 0 12px" }}>
        <div className="otw-container">
          <div
            ref={sliderRef}
            style={{
              position: "relative",
              overflow: "hidden",
              aspectRatio: "21/9",
              minHeight: "180px",
              maxHeight: "420px",
              background: "#111",
              boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
              width: "100%",
              boxSizing: "border-box",
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {slides.map((slide, idx) => (
              <div key={slide.id} style={{ position: "absolute", inset: 0, opacity: idx === currentSlide ? 1 : 0, transform: idx === currentSlide ? "scale(1)" : "scale(1.04)", transition: "opacity 0.7s ease, transform 0.7s ease", zIndex: idx === currentSlide ? 1 : 0 }}>
                <Image src={slide.image} alt={slide.text || "Banner"} fill sizes="(max-width: 768px) 100vw, 1200px" style={{ objectFit: "cover" }} priority={idx === 0} />
                <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "clamp(18px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {slide.text && <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 4vw, 2.8rem)", lineHeight: 1.05, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", textShadow: "0 4px 16px rgba(0,0,0,0.8)", maxWidth: "75%", margin: 0 }}>{slide.text}</h3>}
                  {slide.subText && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "clamp(0.8rem, 2vw, 1.05rem)", fontWeight: 500, textShadow: "0 2px 8px rgba(0,0,0,0.5)", margin: 0 }}>{slide.subText}</p>}
                  {slide.link && (
                    <Link href={slide.link} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px", background: "var(--primary)", color: "#fff", padding: "10px 22px", borderRadius: "99px", fontWeight: 800, fontSize: "0.85rem", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px", width: "fit-content", boxShadow: "0 6px 20px rgba(1,53,251,0.4)", transition: "transform 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                      ORDER NOW <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {slides.length > 1 && (
              <>
                <button onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)} aria-label="Previous" className="desktop-only"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 3, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => goToSlide((currentSlide + 1) % slides.length)} aria-label="Next" className="desktop-only"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 3, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <ChevronRight size={18} />
                </button>
                <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", gap: "5px" }}>
                  {slides.map((_, idx) => (
                    <button key={idx} onClick={() => goToSlide(idx)} aria-label={`Slide ${idx + 1}`}
                      style={{ width: idx === currentSlide ? 20 : 6, height: 6, borderRadius: "99px", border: "none", background: idx === currentSlide ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Home variant ────────────────────────────────────────────────────────────
  const currentSlideData = slides[currentSlide];

  return (
    <div
      className="home-banner-section home-banner-section--mobile-fullbleed"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="home-banner-container-inner">
        <div ref={sliderRef} className="home-banner-slider home-banner-slider--mobile-edge">
          {/* Slides */}
          {slides.map((slide, idx) => (
            <div key={slide.id} style={{
              position: "absolute", inset: 0,
              opacity: idx === currentSlide ? 1 : 0,
              transform: idx === currentSlide ? "scale(1)" : "scale(1.02)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
              zIndex: idx === currentSlide ? 1 : 0,
            }}>
              <Image src={slide.image} alt={slide.text || "Banner"} fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="home-banner-slide-img"
                style={{ objectFit: "cover" }} priority={idx === 0} />
              <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)" }} />
            </div>
          ))}

          {/* Banner content */}
          <div className="home-banner-content hbs-content-overlay visible">
            {currentSlideData?.text && (
                <h3 className="home-banner-title">{currentSlideData.text}</h3>
              )}
              {currentSlideData?.subText && (
                <p className="home-banner-sub">{currentSlideData.subText}</p>
              )}
              {currentSlideData?.link && (
                <Link href={currentSlideData.link} className="home-banner-cta">
                  ORDER NOW <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {/* Desktop arrow controls */}
            {slides.length > 1 && (
              <>
                <button onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
                  aria-label="Previous slide" className="desktop-only"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 3, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => goToSlide((currentSlide + 1) % slides.length)}
                  aria-label="Next slide" className="desktop-only"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 3, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {slides.length > 1 && (
              <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 5, display: "flex", gap: "6px" }}>
                {slides.map((_, idx) => (
                  <button key={idx} onClick={() => goToSlide(idx)} aria-label={`Slide ${idx + 1}`}
                    style={{ width: idx === currentSlide ? 24 : 8, height: 8, borderRadius: "99px", border: "none", background: idx === currentSlide ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }} />
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
