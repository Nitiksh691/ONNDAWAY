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

interface BannerSliderProps {
  slides: BannerSlide[];
  variant?: "home" | "menu";
}

export default function BannerSlider({ slides, variant = "home" }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(slides.length, 1));
    }, 5000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) startAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [slides.length, startAutoplay]);

  const goToSlide = useCallback(
    (idx: number) => {
      setCurrentSlide(idx);
      startAutoplay();
    },
    [startAutoplay]
  );

  if (slides.length === 0) return null;

  if (variant === "menu") {
    return (
      <div style={{ background: "var(--bg-cream)", padding: "20px 0 12px" }}>
        <div className="otw-container">
          <div
            ref={sliderRef}
            style={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              aspectRatio: "21/9",
              minHeight: "180px",
              maxHeight: "420px",
              background: "#111",
              boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            }}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: idx === currentSlide ? 1 : 0,
                  transform: idx === currentSlide ? "scale(1)" : "scale(1.04)",
                  transition: "opacity 0.7s ease, transform 0.7s ease",
                  zIndex: idx === currentSlide ? 1 : 0,
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.text || "Banner"}
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  style={{ objectFit: "cover" }}
                  priority={idx === 0}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background:
                      "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    padding: "clamp(18px, 4vw, 40px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {slide.text && (
                    <h3
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 900,
                        fontSize: "clamp(1.2rem, 4vw, 2.8rem)",
                        lineHeight: 1.05,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "-0.02em",
                        textShadow: "0 4px 16px rgba(0,0,0,0.8)",
                        maxWidth: "75%",
                      }}
                    >
                      {slide.text}
                    </h3>
                  )}
                  {slide.subText && (
                    <p
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "clamp(0.8rem, 2vw, 1.05rem)",
                        fontWeight: 500,
                        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {slide.subText}
                    </p>
                  )}
                  {slide.link && (
                    <Link
                      href={slide.link}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "4px",
                        background: "var(--primary)",
                        color: "#fff",
                        padding: "10px 22px",
                        borderRadius: "99px",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        textDecoration: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        width: "fit-content",
                        boxShadow: "0 6px 20px rgba(1,53,251,0.4)",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.04)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      ORDER NOW <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {slides.length > 1 && (
              <>
                <button
                  onClick={() =>
                    goToSlide((currentSlide - 1 + slides.length) % slides.length)
                  }
                  aria-label="Previous"
                  className="desktop-only"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => goToSlide((currentSlide + 1) % slides.length)}
                  aria-label="Next"
                  className="desktop-only"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 3,
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      style={{
                        width: idx === currentSlide ? 20 : 6,
                        height: 6,
                        borderRadius: "99px",
                        border: "none",
                        background:
                          idx === currentSlide
                            ? "#fff"
                            : "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-banner-section">
      <div className="otw-container">
        <div ref={sliderRef} className="home-banner-slider">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                inset: 0,
                opacity: idx === currentSlide ? 1 : 0,
                transform: idx === currentSlide ? "scale(1)" : "scale(1.02)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
                zIndex: idx === currentSlide ? 1 : 0,
              }}
            >
              <Image
                src={slide.image}
                alt={slide.text || "Banner"}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="home-banner-slide-img"
                priority={idx === 0}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)",
                }}
              />

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

          {slides.length > 1 && (
            <>
              <button
                onClick={() =>
                  goToSlide((currentSlide - 1 + slides.length) % slides.length)
                }
                aria-label="Previous slide"
                className="desktop-only"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.5)")
                }
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => goToSlide((currentSlide + 1) % slides.length)}
                aria-label="Next slide"
                className="desktop-only"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.5)")
                }
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {slides.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 3,
                display: "flex",
                gap: "6px",
              }}
            >
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    width: idx === currentSlide ? 24 : 8,
                    height: 8,
                    borderRadius: "99px",
                    border: "none",
                    background:
                      idx === currentSlide ? "#fff" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
