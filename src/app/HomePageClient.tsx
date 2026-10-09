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
import WalkingLoader from "@/components/WalkingLoader";

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
  priority = false,
}: {
  title: string;
  emoji: string;
  items: any[];
  cart: any[];
  onAdd: any;
  onUpdateQuantity: any;
  priority?: boolean;
}) {
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
              priority={priority}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── SDUI Components (Flipkart-style SDUI sections) ─── */
function DealTimer({ hours = 2, minutes = 14, seconds = 36, onExpire }: { hours?: number, minutes?: number, seconds?: number, onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ hours, minutes, seconds });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        
        clearInterval(timer);
        if (onExpire) onExpire();
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onExpire]);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <span style={{ background: "white", color: "#0135FB", fontWeight: 900, fontSize: "0.85rem", padding: "2px 6px", borderRadius: 6 }}>{pad(timeLeft.hours)}</span>
      <span style={{ color: "white", fontWeight: 900 }}>:</span>
      <span style={{ background: "white", color: "#0135FB", fontWeight: 900, fontSize: "0.85rem", padding: "2px 6px", borderRadius: 6 }}>{pad(timeLeft.minutes)}</span>
      <span style={{ color: "white", fontWeight: 900 }}>:</span>
      <span style={{ background: "white", color: "#0135FB", fontWeight: 900, fontSize: "0.85rem", padding: "2px 6px", borderRadius: 6 }}>{pad(timeLeft.seconds)}</span>
    </div>
  );
}

function FreeDeliveryStrip({ config }: { config: any }) {
  if (!config?.enabled) return null;
  const heading = config.headingText ? `${config.headingText} ${config.minAmount || 199}` : `FREE DELIVERY ABOVE ₹ ${config.minAmount || 199}`;

  return (
    <div style={{ width: "100%", padding: "0 12px", margin: "14px 0" }}>
      <div style={{
        background: config.bannerImage ? `url(${config.bannerImage}) center/cover no-repeat` : (config.bgGradient || "linear-gradient(135deg, #FF6B00 0%, #FF3D00 50%, #E62E00 100%)"),
        borderRadius: 20, padding: "16px 20px", color: "white", width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        boxShadow: "0 8px 24px rgba(255,61,0,0.28)", border: "1px solid rgba(255,255,255,0.25)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Glow accent */}
        <div style={{ position: "absolute", top: "-50px", right: "-30px", width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(25px)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "1.4rem" }}>🛵</span>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(0.95rem, 3.8vw, 1.15rem)", letterSpacing: "0.3px", textTransform: "uppercase", lineHeight: 1.2 }}>
              {heading}
            </div>
            {config.subText && (
              <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: 2, fontWeight: 600 }}>
                {config.subText}
              </div>
            )}
          </div>
        </div>
        <div style={{
          border: "2px dashed rgba(255,255,255,0.9)", borderRadius: 10, padding: "6px 14px",
          fontSize: "0.85rem", fontWeight: 900, letterSpacing: "1px", background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(6px)", flexShrink: 0
        }}>
          [{config.code || "FREEDEL"}]
        </div>
      </div>
    </div>
  );
}

function DealOfTheDaySection({ config, items, cart, onAdd, onUpdateQuantity }: any) {
  const [expired, setExpired] = useState(false);

  if (!config?.enabled || !items || items.length === 0 || expired) return null;

  // Filter admin selected items if available, or fallback to first 2 items
  let dealItems = items.filter((i: any) => (config.itemIds || []).includes(i.id || i._id));
  if (dealItems.length === 0) {
    dealItems = items.slice(0, 4); // Fallback to 4 items for horizontal slider
  }

  return (
    <div style={{ width: "100%", padding: "0 12px", margin: "16px 0 24px" }}>
      <div style={{
        background: config.bannerImage ? `url(${config.bannerImage}) center/cover no-repeat` : "linear-gradient(145deg, #0028D4 0%, #0135FB 55%, #1A4BFF 100%)",
        borderRadius: 24, padding: "20px", color: "white", width: "100%",
        boxShadow: "0 14px 36px rgba(1,53,251,0.28)", border: "1px solid rgba(255,255,255,0.15)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Glow ambient background */}
        {!config.bannerImage && <div style={{ position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(40px)", pointerEvents: "none" }} />}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, position: "relative", zIndex: 2 }}>
          <div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.15rem, 4vw, 1.4rem)", fontWeight: 900, letterSpacing: "-0.02em", margin: 0, color: "white", textShadow: config.bannerImage ? "0 2px 4px rgba(0,0,0,0.5)" : "none" }}>
              {config.title || "Deal of the Day"}
            </h2>
            {config.subtitle && (
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.9)", margin: "2px 0 0", fontWeight: 600, textShadow: config.bannerImage ? "0 1px 2px rgba(0,0,0,0.5)" : "none" }}>{config.subtitle}</p>
            )}
          </div>
          {config.showTimer !== false && (
            <DealTimer 
              hours={config.timerHours ?? 2} 
              minutes={config.timerMinutes ?? 14} 
              seconds={config.timerSeconds ?? 36}
              onExpire={() => setExpired(true)} 
            />
          )}
        </div>

        <div style={{ 
          display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10, 
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          position: "relative", zIndex: 2 
        }}>
          {dealItems.map((item: any) => {
            const dealPrice = config.dealPrice || item.price;
            const originalPrice = Math.round(dealPrice * 1.35);
            const cartItem = cart.find((c: any) => c.item.id === item.id);
            return (
              <div key={item.id} style={{
                background: "white", borderRadius: 18, padding: 14, color: "#0F172A",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)", position: "relative",
                flexShrink: 0, width: 140
              }}>
                <div style={{ width: "100%", height: 115, position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
                  <Image
                    src={item.image || "https://res.cloudinary.com/dr4nfueet/image/upload/v1791312577/onndaway/menu/w8ggcbikrhw7nuvm2oic.jpg"}
                    alt={item.name} fill style={{ objectFit: "cover" }}
                  />
                </div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: 6, height: 36, overflow: "hidden", lineHeight: 1.25 }}>{item.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#0F172A" }}>₹{dealPrice}</span>
                  <span style={{ fontSize: "0.78rem", color: "#94A3B8", textDecoration: "line-through" }}>₹{originalPrice}</span>
                </div>
                {cartItem ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0135FB", color: "white", borderRadius: 10, padding: "4px 12px", width: "100%" }}>
                    <button onClick={() => onUpdateQuantity(item.id, cartItem.quantity - 1)} style={{ background: "none", border: "none", color: "white", fontWeight: 900, cursor: "pointer", fontSize: "1.1rem" }}>-</button>
                    <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{cartItem.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, cartItem.quantity + 1)} style={{ background: "none", border: "none", color: "white", fontWeight: 900, cursor: "pointer", fontSize: "1.1rem" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => onAdd({ ...item, price: dealPrice })} style={{
                    background: "#0135FB", color: "white", border: "none", borderRadius: 10,
                    padding: "8px 0", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", width: "100%",
                    boxShadow: "0 4px 12px rgba(1,53,251,0.3)"
                  }}>
                    ADD
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ComboPromoBanner({ config }: { config: any }) {
  if (!config?.enabled) return null;
  return (
    <div style={{ width: "100%", padding: "0 12px", margin: "24px 0" }}>
      <Link href={config.link || "/menu"} style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          background: config.bgGradient || "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
          borderRadius: 22, padding: "20px 24px", color: "white", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden",
          boxShadow: "0 10px 28px rgba(255,140,0,0.3)", border: "1px solid rgba(255,255,255,0.25)"
        }}>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: "1.2px", textTransform: "uppercase", opacity: 0.9 }}>
              {config.subtitle || "COMBO SPECIAL"}
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(1.2rem, 4.5vw, 1.6rem)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1.15, margin: "6px 0" }}>
              {config.title || "COFFEE + SANDWICH"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", fontWeight: 800 }}>
              <span>Just ₹{config.priceText || "149"}</span>
              {config.originalPriceText && (
                <span style={{ fontSize: "0.82rem", opacity: 0.8, textDecoration: "line-through" }}>₹{config.originalPriceText}</span>
              )}
            </div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#0135FB",
            display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "1.3rem",
            boxShadow: "0 6px 18px rgba(1,53,251,0.35)", flexShrink: 0
          }}>
            →
          </div>
        </div>
      </Link>
    </div>
  );
}

function OrderAgainSection({ config, items, cart, onAdd, onUpdateQuantity }: any) {
  if (!config?.enabled || !items || items.length === 0) return null;
  const orderAgainItems = items.slice(0, 4);

  return (
    <div style={{ width: "100%", padding: "0 12px", margin: "24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.15rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>
            {config.title || "Order again"}
          </h2>
          {config.subtitle && (
            <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "2px 0 0" }}>{config.subtitle}</p>
          )}
        </div>
        <Link href="/orders" style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0135FB", textDecoration: "none" }}>
          History →
        </Link>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
        {orderAgainItems.map((item: any) => {
          const cartItem = cart.find((c: any) => c.item.id === item.id);
          return (
            <div key={item.id} style={{
              background: "white", borderRadius: 16, padding: 12, width: 220, flexShrink: 0,
              border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
            }}>
              <div style={{ width: 54, height: 54, borderRadius: 12, background: "#0135FB", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                <Image src={item.image || "https://res.cloudinary.com/dr4nfueet/image/upload/v1791312577/onndaway/menu/w8ggcbikrhw7nuvm2oic.jpg"} alt={item.name} fill style={{ objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: 2, fontWeight: 600 }}>
                  ₹{item.price}
                </div>
              </div>
              {cartItem ? (
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0135FB" }}>{cartItem.quantity} in cart</span>
              ) : (
                <button onClick={() => onAdd(item)} style={{
                  background: "#0135FB", color: "white", border: "none", borderRadius: 8,
                  padding: "6px 14px", fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", flexShrink: 0
                }}>
                  ADD
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrowseMenuGrid({ config, onSelectCategory }: any) {
  if (!config?.enabled) return null;
  const blocks = [
    { title: "Coffee", category: "coffee", bg: "#0135FB", textColor: "white" },
    { title: "Flavoured Coffee", category: "coffee", bg: "#001B94", textColor: "white" },
    { title: "Burgers & Sandwiches", category: "meals", bg: "#FF8F17", textColor: "white" },
    { title: "Cold Beverages", category: "drinks", bg: "#E0E7FF", textColor: "#0135FB" },
  ];

  return (
    <div style={{ width: "100%", padding: "0 12px", margin: "24px 0 36px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.15rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>
            {config.title || "Browse menu"}
          </h2>
          {config.subtitle && (
            <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "2px 0 0" }}>{config.subtitle}</p>
          )}
        </div>
        <Link href="/menu" style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0135FB", textDecoration: "none" }}>
          Full menu →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {blocks.map((b) => (
          <button
            key={b.title}
            onClick={() => onSelectCategory(b.category)}
            style={{
              background: b.bg, borderRadius: 18, height: 100, padding: 16,
              border: "none", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06)", transition: "transform 0.15s"
            }}
          >
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.05rem", fontWeight: 900, color: b.textColor, lineHeight: 1.25 }}>
              {b.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePageClient({ initialMenu = [], initialBanner = {}, initialHomeLayout = {} }: { initialMenu?: any[], initialBanner?: any, initialHomeLayout?: any }) {
  const [showSplash, setShowSplash] = useState(true);
  const [menuItems, setMenuItems] = useState<any[]>(initialMenu);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerSlides, setBannerSlides] = useState<any[]>(initialBanner.bannerSlides || []);
  const [bentoSlides, setBentoSlides] = useState<any[]>(initialBanner.bentoSlides || []);
  const [bannerMode, setBannerMode] = useState<"single" | "bento">(initialBanner.bannerMode || "single");
  const [bannerEnabled, setBannerEnabled] = useState(initialBanner.bannerEnabled ?? true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { profile, cart, addToCart, updateQuantity } = useApp();
  const { location, saveLocation } = useDeliveryLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");

  const [homeLayout, setHomeLayout] = useState({
    categoryIconsBar: { enabled: true, ...(initialHomeLayout.categoryIconsBar || {}) },
    freeDelivery: { enabled: true, minAmount: 199, code: "FREEDEL", bannerImage: "", ...(initialHomeLayout.freeDelivery || {}) },
    dealOfTheDay: { enabled: true, title: "Deal of the Day", showTimer: true, timerHours: 2, timerMinutes: 14, bannerImage: "", dealPrice: undefined, ...(initialHomeLayout.dealOfTheDay || {}) },
    bestsellers: { enabled: true, title: "Bestsellers", ...(initialHomeLayout.bestsellers || {}) },
    comboPromo: { enabled: true, title: "COFFEE + SANDWICH", subtitle: "COMBO", priceText: "149", link: "/menu", ...(initialHomeLayout.comboPromo || {}) },
    orderAgain: { enabled: true, title: "Order again", ...(initialHomeLayout.orderAgain || {}) },
    browseMenu: { enabled: true, title: "Browse menu", ...(initialHomeLayout.browseMenu || {}) },
  });

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);

    return () => clearTimeout(timer);
  }, []);

  const { menuItems: rawMenuItems, isLoading: loadingMenu } = useMenu(initialMenu);
  const availableItems = useMemo(() => (Array.isArray(rawMenuItems) ? rawMenuItems : []).filter((i: any) => i.available), [rawMenuItems]);

  // Split into food world and munchies world
  const munchiesItems = useMemo(() => availableItems.filter((i: any) => i.world === "munchies"), [availableItems]);

  useEffect(() => {
    if (availableItems.length > 0) {
      // Only food items go into the main menu section
      const foodOnly = availableItems.filter((i: any) => !i.world || i.world === "food");
      const sortedItems = [...foodOnly].sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMenuItems(sortedItems);
      const cats = ["all", ...Array.from(new Set(sortedItems.map((i: any) => i.category as string)))];
      setCategories(cats);
    }
  }, [availableItems]);

  // Munchies grouped by brand for homepage discovery
  const munchiesByBrand = useMemo(() => {
    const brands = Array.from(new Set(munchiesItems.map((i: any) => i.brand || "").filter(Boolean)));

    if (brands.length > 0) {
      const groups = brands.map(brand => ({
        brand,
        items: munchiesItems.filter((i: any) => i.brand === brand),
      }));
      // Add items without a brand to an "Other" section
      const noBrandItems = munchiesItems.filter((i: any) => !i.brand);
      if (noBrandItems.length > 0) {
        groups.push({ brand: "Other", items: noBrandItems });
      }
      return groups.filter(g => g.items.length > 0);
    }

    // Fallback: group by category
    const cats = Array.from(new Set(munchiesItems.map((i: any) => i.category || "").filter(Boolean)));
    return cats.map(cat => ({
      brand: cat.charAt(0).toUpperCase() + cat.slice(1),
      items: munchiesItems.filter((i: any) => i.category === cat),
    })).filter(g => g.items.length > 0);
  }, [munchiesItems]);

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

  // Popular items appear in both their category row AND the Popular slider below.
  // Recommended items only show a badge on the card — no separate section, no exclusion.
  const popularItems = useMemo(() => menuItems.filter(i => i.isPopular).slice(0, 10), [menuItems]);

  /* No items are excluded from the category rows — popular duplicates in slider are intentional */
  const fullMenuItems = useMemo(() => {
    return filteredItems;
  }, [filteredItems]);

  return (
    <>
      {showSplash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999, background: "#0135FB",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "fadeOut 0.5s ease-out 2s forwards"
        }}>
          <style>{`
            @keyframes pulseScale {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            @keyframes fadeOut {
              to { opacity: 0; visibility: hidden; pointer-events: none; }
            }
          `}</style>
          <div style={{ animation: "pulseScale 1.5s infinite ease-in-out", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <WalkingLoader size={80} color="white" />
          </div>
        </div>
      )}

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
        <BannerSlider slides={combinedBannerSlides} variant="menu" />
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
            <h1 style={{ fontFamily: "'Outfit', sans-serif", color: "white", fontWeight: 900, fontSize: "clamp(2.6rem, 7vw, 4.8rem)", lineHeight: 1, textTransform: "uppercase", marginBottom: "16px", letterSpacing: "-0.03em" }}>
              LIFE BEGINS <br /> AFTER <span style={{ background: "linear-gradient(135deg, #93C5FD, #BAE6FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>FLAVOR</span>.
            </h1>
            <p style={{ color: "white", fontSize: "1.05rem", maxWidth: "480px", opacity: 0.88, marginBottom: "32px", fontWeight: 500, lineHeight: 1.65 }}>
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

      {/* ─── STORE WELCOME STRIP (compact, inline) ─── */}
      <Link href="/menu?world=munchies" style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          background: "linear-gradient(110deg, #0028D4 0%, #0135FB 55%, #2A55FF 100%)",
          padding: "0 16px",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
        }}>
          <style>{`
            .store-strip { display: flex; align-items: center; gap: 12px; height: 60px; max-width: 900px; margin: 0 auto; position: relative; z-index: 2; }
            .store-strip-snacks { position: absolute; right: 0; top: 0; height: 100%; display: flex; align-items: flex-end; gap: -8px; pointer-events: none; padding-right: 12px; z-index: 1; }
            .store-snack-img { height: 58px; transform: translateY(4px); filter: drop-shadow(0 -4px 8px rgba(0,0,0,0.25)); transition: transform 0.3s; }
            @media (max-width: 480px) { .store-snack-img { height: 50px; } }
          `}</style>

          {/* Glow orb */}
          <div style={{ position: "absolute", top: "-40px", right: "20%", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)", filter: "blur(30px)", pointerEvents: "none", zIndex: 0 }} />



          {/* Floating snack emojis */}
          <div className="store-strip-snacks">
            <span className="store-snack-img" style={{ fontSize: "2.4rem", lineHeight: 1, transform: "rotate(-8deg) translateY(4px)" }}>🍿</span>
            <span className="store-snack-img" style={{ fontSize: "2.2rem", lineHeight: 1, transform: "rotate(5deg) translateY(0px)", marginLeft: -8 }}>🧃</span>
            <span className="store-snack-img" style={{ fontSize: "2.6rem", lineHeight: 1, transform: "rotate(-4deg) translateY(6px)", marginLeft: -12 }}>🍫</span>
          </div>
        </div>
      </Link>

      {/* ─── TOP OFFERS (FREE DELIVERY & DEAL OF THE DAY) ─── */}
      {!deferredSearch && selectedCategory === "all" && (
        <div className="otw-container" style={{ marginTop: "12px", marginBottom: "8px" }}>
          {/* 1. Free Delivery Banner Strip */}
          <FreeDeliveryStrip config={homeLayout.freeDelivery} />

          {/* 2. Deal of the Day Section */}
          <DealOfTheDaySection
            config={homeLayout.dealOfTheDay}
            items={availableItems}
            cart={cart}
            onAdd={addToCart}
            onUpdateQuantity={updateQuantity}
          />
        </div>
      )}

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
                return ordered.map((cat, index) => {
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
                      priority={index === 0}
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

          {/* ── MUNCHIES SECTION (only when no search/filter active) ── */}
          {!deferredSearch && selectedCategory === "all" && munchiesItems.length > 0 && (
            <div style={{ marginTop: 48 }}>
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20, paddingTop: 20,
                borderTop: "2px solid rgba(1,53,251,0.08)",
              }}>
                <div>
                  <h2 style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 900,
                    color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2,
                  }}>
                    🍿 Munchies &amp; Drinks
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                    Chips, beverages &amp; late-night cravings
                  </p>
                </div>
                <Link href="/menu?world=munchies" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)",
                  padding: "5px 12px", borderRadius: 8, background: "rgba(1,53,251,0.06)",
                  textDecoration: "none",
                }}>
                  See All <ChevronRight size={14} />
                </Link>
              </div>

              {/* Brand-grouped or category-grouped rows */}
              {munchiesByBrand.map(({ brand, items }) => (
                <HSliderSection
                  key={brand}
                  title={brand}
                  emoji="🛒"
                  items={items}
                  cart={cart}
                  onAdd={addToCart}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
          )}

          {/* ─── BOTTOM PROMO & DISCOVERY SECTIONS ─── */}
          {!deferredSearch && selectedCategory === "all" && (
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Combo Promo Banner */}
              <ComboPromoBanner config={homeLayout.comboPromo} />

              {/* Order Again Section */}
              <OrderAgainSection
                config={homeLayout.orderAgain}
                items={availableItems}
                cart={cart}
                onAdd={addToCart}
                onUpdateQuantity={updateQuantity}
              />

              {/* Browse Menu Grid (At the very end) */}
              <BrowseMenuGrid
                config={homeLayout.browseMenu}
                onSelectCategory={(cat: string) => setSelectedCategory(cat)}
              />
            </div>
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
