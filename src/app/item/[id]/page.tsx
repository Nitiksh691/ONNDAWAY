"use client";
import { useState, useRef, useCallback, useMemo, type CSSProperties } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Clock, MapPin, Zap, Info,
  Plus, Minus, ShoppingCart, ChevronRight, CheckCircle, Search
} from "lucide-react";
import { useApp } from "@/lib/context";
import { MenuItem, SelectedCustomization } from "@/lib/types";
import toast from "react-hot-toast";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

/* ── helpers ─────────────────────────────────────────── */
function getPseudoRating(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return +(4.0 + (h % 10) / 10).toFixed(1);
}
function getPseudoReviews(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return 40 + (h % 160);
}

const CAT_BG: Record<string, string> = {
  coffee: "#E6F0FF", snacks: "#FEF3C7", meals: "#D1FAE5",
  drinks: "#E0F2FE", desserts: "#FCE7F3",
};
const CAT_TEXT: Record<string, string> = {
  coffee: "#1E40AF", snacks: "#92400E", meals: "#065F46",
  drinks: "#0369A1", desserts: "#9D174D",
};

const DELIVERY_BADGES = [
  { icon: <Zap size={13} />, text: "30-45 min delivery" },
  { icon: <Clock size={13} />, text: "Freshly prepared" },
  { icon: <MapPin size={13} />, text: "Local delivery" },
];

function customizationKey(customizations?: SelectedCustomization[]) {
  return JSON.stringify((customizations || []).map(c => `${c.category}:${c.option}`).sort());
}

const INFO_CARD: CSSProperties = {
  background: "white",
  borderRadius: 16,
  border: "1px solid #E2E8F0",
  padding: "20px 24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
};

/* ═══════════════════════════════════════════════════════
   Star row component
═══════════════════════════════════════════════════════ */
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          color={i <= Math.round(rating) ? "#F59E0B" : "#CBD5E1"}
        />
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function ItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useApp();

  const [instructions, setInstructions] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  /* Desktop image zoom */
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef<HTMLDivElement>(null);

  // Use SWR for deduplication and caching
  const { data: menu = [], isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false, // Don't constantly refetch static menu
    dedupingInterval: 60000,
  });

  const item = menu.find(m => m.id === id);

  // Initialize customizations once item loads
  useMemo(() => {
    if (item?.customizationCategories?.length) {
      const defaults: Record<string, string> = {};
      item.customizationCategories.forEach(cat => {
        if (cat.options[0]?.name && !customizations[cat.name]) {
          defaults[cat.name] = cat.options[0].name;
        }
      });
      if (Object.keys(defaults).length > 0) {
        setCustomizations(prev => ({ ...prev, ...defaults }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]); // Intentionally omitting customizations dependency to only run once per item

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const setCustom = (label: string, choice: string) =>
    setCustomizations(prev => ({ ...prev, [label]: choice }));

  const itemOptions = item?.customizationCategories?.filter(
    cat => cat.name && cat.options.some(o => o.name)
  ) ?? [];

  const selectedCustomizations = useMemo((): SelectedCustomization[] => {
    if (!item?.customizationCategories) return [];
    return item.customizationCategories.flatMap(cat => {
      const choice = customizations[cat.name];
      const opt = cat.options.find(o => o.name === choice);
      return opt ? [{ category: cat.name, option: opt.name, price: opt.price || 0 }] : [];
    });
  }, [item, customizations]);

  const extrasTotal = useMemo(
    () => selectedCustomizations.reduce((sum, c) => sum + c.price, 0),
    [selectedCustomizations]
  );

  const unitPrice = (item?.price ?? 0) + extrasTotal;

  /* ── Derived state ── */
  const cartItem = cart.find(
    c =>
      c.item.id === item?.id &&
      customizationKey(c.selectedCustomizations) === customizationKey(selectedCustomizations) &&
      (c.specialInstructions || "") === (instructions || "")
  );
  const qtyInCart = cartItem?.quantity ?? 0;

  const handleAddToCart = () => {
    if (!item) return;
    for (let i = 0; i < qty; i++) {
      addToCart(item, instructions, selectedCustomizations, unitPrice);
    }
    toast.success(`${item.name} added to cart!`, { icon: "🛒", style: { borderRadius: "10px", background: "#0135FB", color: "white" } });
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAFA" }}>
        <style>{`@keyframes sk{0%,100%{opacity:1}50%{opacity:.5}}.sk{animation:sk 1.4s ease infinite;background:#E2E8F0;border-radius:12px}`}</style>
        <div className="desktop-only" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
          <div className="sk" style={{ aspectRatio: "1" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 10 }}>
            {[60, 40, 80, 30, 100, 60, 100].map((w, i) => <div key={i} className="sk" style={{ height: i === 4 ? 80 : i === 6 ? 52 : 24, width: `${w}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAFA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: "3.5rem" }}>😕</div>
        <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0F172A" }}>Item not found</h1>
        <Link href="/menu" style={{ display: "flex", alignItems: "center", gap: 6, color: "#0135FB", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}>
          <ArrowLeft size={16} /> Back to Menu
        </Link>
      </div>
    );
  }

  const rating = getPseudoRating(item.id);
  const reviews = getPseudoReviews(item.id);
  const hasDiscount = !!(item.originalPrice && item.originalPrice > item.price);
  const discountPct = hasDiscount ? Math.round((1 - item.price / item.originalPrice!) * 100) : 0;
  const savings = hasDiscount ? item.originalPrice! - item.price : 0;
  const displayUnitPrice = unitPrice;
  const displayLineTotal = displayUnitPrice * qty;

  const catBg = CAT_BG[item.category] ?? "#F1F5F9";
  const catText = CAT_TEXT[item.category] ?? "#475569";

  const relatedItems = menu.filter(m => m.id !== item.id && m.category === item.category && m.available).slice(0, 8);
  const boughtTogether = menu.filter(m => m.id !== item.id && m.category !== item.category && m.available).slice(0, 6);

  const descLong = item.description && item.description.length > 150;
  const descPreview = descLong && !descExpanded ? item.description.slice(0, 145) + "…" : item.description;

  const renderCustomizations = (compact?: boolean) => (
    itemOptions.length > 0 && (
      <div>
        {itemOptions.map(opt => (
          <div key={opt.name} style={{ marginBottom: compact ? 16 : 20 }}>
            <div style={{
              fontSize: "0.85rem", fontWeight: 700, color: "#0F172A",
              marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
            }}>
              {opt.name}
              {opt.required && <span style={{ color: "#EF4444" }}>*</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {opt.options.filter(o => o.name).map(o => (
                <button
                  key={o.name}
                  className={`opt-chip${customizations[opt.name] === o.name ? " selected" : ""}`}
                  style={{ padding: "8px 16px" }}
                  onClick={() => setCustom(opt.name, o.name)}
                >
                  {o.name}
                  {o.price > 0 && (
                    <span style={{ marginLeft: 6, opacity: customizations[opt.name] === o.name ? 0.9 : 0.6, fontSize: "0.8rem" }}>
                      +₹{o.price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  );

  /* ── Shared cart bar logic ── */
  const CartBar = ({ mobile }: { mobile: boolean }) => {
    const base: React.CSSProperties = mobile
      ? {
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
        background: "white", borderTop: "1px solid #E2E8F0",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
      }
      : { display: "flex", flexDirection: "column", gap: 16, marginTop: 8 };

    return (
      <div style={base}>
        {mobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, overflow: "hidden",
              position: "relative", flexShrink: 0, background: catBg, border: "1px solid #E2E8F0"
            }}>
              <Image src={item.image} alt={item.name} fill sizes="44px" style={{ objectFit: "cover" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0135FB" }}>₹{displayUnitPrice}</span>
                {hasDiscount && extrasTotal === 0 && <span style={{ fontSize: "0.75rem", textDecoration: "line-through", color: "#94A3B8" }}>₹{item.originalPrice}</span>}
              </div>
            </div>
          </div>
        )}

        {!mobile && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>Quantity</span>
              <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "white" }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 40, height: 40, border: "none", borderRight: "1px solid #E2E8F0", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                ><Minus size={16} /></button>
                <span style={{ width: 44, textAlign: "center", fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  style={{ width: 40, height: 40, border: "none", borderLeft: "1px solid #E2E8F0", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                ><Plus size={16} /></button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "0.9rem", color: "#64748B", fontWeight: 600 }}>Total</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                {hasDiscount && extrasTotal === 0 && qty === 1 && <span style={{ fontSize: "0.85rem", textDecoration: "line-through", color: "#94A3B8" }}>₹{item.originalPrice}</span>}
                <span style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0135FB" }}>₹{displayLineTotal}</span>
              </div>
            </div>
            {extrasTotal > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#64748B", textAlign: "right" }}>
                Base ₹{item.price}{extrasTotal > 0 ? ` + ₹${extrasTotal} add-ons` : ""}
              </div>
            )}
          </>
        )}

        {qtyInCart === 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            style={{
              flex: mobile ? "unset" : undefined,
              width: mobile ? "auto" : "100%",
              padding: mobile ? "0 24px" : "16px 24px",
              height: mobile ? 48 : undefined,
              borderRadius: 12, border: "none", cursor: item.available ? "pointer" : "not-allowed",
              background: item.available ? "#0135FB" : "#E2E8F0",
              color: item.available ? "white" : "#94A3B8",
              fontWeight: 800, fontSize: "0.95rem", fontFamily: "inherit",
              boxShadow: item.available ? "0 4px 12px rgba(1,53,251,0.2)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { if (item.available) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          >
            <ShoppingCart size={18} />
            {item.available
              ? (mobile ? "Add to Cart" : `Add to Cart`)
              : "Sold Out"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, width: mobile ? "auto" : "100%" }}>
            <Link href="/cart" style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: mobile ? "0 24px" : "16px 24px", height: mobile ? 48 : undefined,
              borderRadius: 12, background: "#10B981",
              color: "white", textDecoration: "none", fontWeight: 800, fontSize: "0.95rem",
              boxShadow: "0 4px 12px rgba(16,185,129,0.2)", whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
            >
              <CheckCircle size={18} /> Added to Cart
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .reco-scroll { display: grid; grid-auto-flow: column; grid-auto-columns: 240px; gap: 20px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; align-items: stretch; }
        .reco-scroll::-webkit-scrollbar { display:none; }
        .item-page-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; align-items: start; }
        .info-panel { position: sticky; top: 80px; }
        @media (max-width: 900px) {
          .item-page-grid { display: block; padding: 0; }
          .desktop-gallery { display: none !important; }
          .desktop-info { display: none !important; }
          .mobile-sticky-bar { display: flex !important; }
          .mobile-product-view { display: flex !important; }
          .reco-scroll { grid-auto-columns: 200px; gap: 16px; padding: 0 16px 16px; }
        }
        @media (min-width: 901px) {
          .mobile-product-view { display: none !important; }
          .mobile-sticky-bar { display: none !important; }
          .desktop-gallery { display: block !important; }
          .desktop-info { display: flex !important; }
        }
        .img-zoom-wrap { cursor: zoom-in; }
        .img-zoom-wrap.zoomed { cursor: zoom-out; }
        .opt-chip { padding: 10px 20px; border-radius: 12px; border: 1px solid #E2E8F0; background: white; cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #475569; transition: all 0.2s; }
        .opt-chip:hover { border-color: #0135FB; color: #0135FB; background: #F8FAFC; }
        .opt-chip.selected { border-color: #0135FB; background: #EEF1FF; color: #0135FB; }
        .trust-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #475569; }
      `}</style>

      <div style={{ background: "#FAFAFA", minHeight: "100vh" }}>
        <div className="item-page-grid">
          {/* Desktop Gallery */}
          <div className="desktop-gallery">
            <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Link href="/menu" style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
                <ArrowLeft size={16} /> Back to Menu
              </Link>
            </nav>
            <div
              ref={imgWrapRef} className={`img-zoom-wrap${zoomed ? " zoomed" : ""}`}
              style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 24, overflow: "hidden", background: catBg, border: "1px solid #E2E8F0" }}
              onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)} onMouseMove={handleMouseMove}
            >
              <Image src={item.image} alt={item.name} fill sizes="600px" priority style={{ objectFit: "cover", transition: "transform 0.4s ease-out", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: zoomed ? "scale(1.8)" : "scale(1)" }} />
              {item.isPopular && <span style={{ position: "absolute", top: 20, left: 20, background: "#F59E0B", color: "white", padding: "6px 14px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}>Popular</span>}
              {hasDiscount && <span style={{ position: "absolute", top: 20, right: 20, background: "#10B981", color: "white", padding: "6px 14px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700 }}>{discountPct}% OFF</span>}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              {DELIVERY_BADGES.map((b, i) => (
                <span key={i} className="trust-badge"><span style={{ color: "#0135FB" }}>{b.icon}</span> {b.text}</span>
              ))}
            </div>
          </div>

          {/* Desktop Info Panel */}
          <div className="desktop-info info-panel" style={{ flexDirection: "column", gap: 24 }}>
            <div>
              <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 10, background: catBg, color: catText, fontSize: "0.8rem", fontWeight: 700, textTransform: "capitalize", marginBottom: 16 }}>{item.category}</span>
              <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.1, marginBottom: 16 }}>{item.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <Stars rating={rating} />
                <span style={{ fontWeight: 700, color: "#0F172A" }}>{rating}</span>
                <span style={{ color: "#64748B" }}>({reviews} reviews)</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0135FB" }}>₹{displayUnitPrice}</span>
                {hasDiscount && extrasTotal === 0 && <span style={{ fontSize: "1.2rem", textDecoration: "line-through", color: "#94A3B8", fontWeight: 600 }}>₹{item.originalPrice}</span>}
              </div>
            </div>

            {item.description && (
              <div style={{ ...INFO_CARD }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Description</h3>
                <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6 }}>
                  {descPreview}
                  {descLong && <button onClick={() => setDescExpanded(!descExpanded)} style={{ color: "#0135FB", border: "none", background: "none", fontWeight: 600, cursor: "pointer", marginLeft: 8 }}>{descExpanded ? "Show less" : "Read more"}</button>}
                </p>
              </div>
            )}

            {itemOptions.length > 0 && (
              <div style={INFO_CARD}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Customize</h3>
                {renderCustomizations()}
              </div>
            )}

            <div style={INFO_CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}><Info size={16} /> Special Requests</h3>
                <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>{charCount}/200</span>
              </div>
              <textarea
                placeholder="e.g. Less sugar, extra hot..."
                value={instructions} maxLength={200} rows={3}
                onChange={e => { setInstructions(e.target.value); setCharCount(e.target.value.length); }}
                style={{ width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px", fontSize: "0.95rem", color: "#0F172A", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                onFocus={e => e.currentTarget.style.borderColor = "#0135FB"} onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
              />
            </div>
            
            <div style={{ ...INFO_CARD, padding: "24px" }}>
               <CartBar mobile={false} />
            </div>
          </div>
        </div>

        {/* Mobile View */}
        <div className="mobile-product-view" style={{ display: "none", flexDirection: "column", paddingBottom: 100 }}>
          <div style={{ position: "relative", width: "100%", height: "45vh", background: catBg }}>
            <Image src={item.image} alt={item.name} fill sizes="100vw" priority style={{ objectFit: "cover" }} />
            <button onClick={() => router.back()} style={{ position: "absolute", top: 20, left: 20, width: 44, height: 44, borderRadius: "50%", background: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10 }}><ArrowLeft size={20} /></button>
            {item.isPopular && <span style={{ position: "absolute", bottom: 20, left: 20, background: "#F59E0B", color: "white", padding: "6px 14px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700, zIndex: 10 }}>Popular</span>}
            {hasDiscount && <span style={{ position: "absolute", bottom: 20, right: 20, background: "#10B981", color: "white", padding: "6px 14px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700, zIndex: 10 }}>{discountPct}% OFF</span>}
          </div>
          
          <div style={{ padding: "24px 20px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
               <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0F172A", lineHeight: 1.2, flex: 1 }}>{item.name}</h1>
               <div style={{ textAlign: "right", marginLeft: 16 }}>
                  {hasDiscount && extrasTotal === 0 && <div style={{ fontSize: "0.9rem", textDecoration: "line-through", color: "#94A3B8" }}>₹{item.originalPrice}</div>}
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0135FB" }}>₹{displayUnitPrice}</div>
               </div>
             </div>
             <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <Stars rating={rating} />
                <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.95rem" }}>{rating}</span>
                <span style={{ color: "#64748B", fontSize: "0.95rem" }}>({reviews} reviews)</span>
             </div>
             
             {item.description && (
               <div style={{ marginBottom: 32 }}>
                 <p style={{ fontSize: "1rem", color: "#334155", lineHeight: 1.6 }}>{item.description}</p>
               </div>
             )}
             
             {itemOptions.length > 0 && (
               <div style={{ marginBottom: 32 }}>
                 <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>Customize Your Order</h3>
                 {renderCustomizations()}
               </div>
             )}
             
             <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Special Requests</h3>
                <textarea
                  placeholder="e.g. Less sugar, extra hot..."
                  value={instructions} maxLength={200} rows={3}
                  onChange={e => { setInstructions(e.target.value); setCharCount(e.target.value.length); }}
                  style={{ width: "100%", background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px", fontSize: "1rem", color: "#0F172A", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#0135FB"} onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                />
             </div>
          </div>
        </div>

        {/* Recos */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 60px" }}>
          {boughtTogether.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>Frequently Bought Together</h2>
                <Link href="/menu" style={{ color: "#0135FB", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}>See all</Link>
              </div>
              <div className="reco-scroll">
                 {/* Empty div for padding in scroll */}
                 <div style={{ width: 4 }} className="mobile-only" />
                 {boughtTogether.map(r => (
                   <FoodCard key={r.id} item={r} layout="vertical" cartItem={cart.find(c => c.item.id === r.id)} onAdd={addToCart} onUpdateQuantity={updateQuantity} />
                 ))}
                 <div style={{ width: 4 }} className="mobile-only" />
              </div>
            </div>
          )}
          {relatedItems.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>You May Also Like</h2>
                <Link href={`/menu?category=${item.category}`} style={{ color: "#0135FB", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}>See all</Link>
              </div>
              <div className="reco-scroll">
                 <div style={{ width: 4 }} className="mobile-only" />
                 {relatedItems.map(r => (
                   <FoodCard key={r.id} item={r} layout="vertical" cartItem={cart.find(c => c.item.id === r.id)} onAdd={addToCart} onUpdateQuantity={updateQuantity} />
                 ))}
                 <div style={{ width: 4 }} className="mobile-only" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mobile-sticky-bar" style={{ display: "none" }}>
        <CartBar mobile={true} />
      </div>

      <Footer />
    </>
  );
}
