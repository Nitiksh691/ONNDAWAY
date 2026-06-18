"use client";
import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Clock, MapPin, Zap, Info,
  Plus, Minus, ShoppingCart, ChevronRight, CheckCircle
} from "lucide-react";
import { useApp } from "@/lib/context";
import { MenuItem, SelectedCustomization } from "@/lib/types";
import toast from "react-hot-toast";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";

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
  { icon: <MapPin size={13} />, text: "Rohini delivery" },
];

function customizationKey(customizations?: SelectedCustomization[]) {
  return JSON.stringify((customizations || []).map(c => `${c.category}:${c.option}`).sort());
}

const INFO_CARD: CSSProperties = {
  background: "white",
  borderRadius: 16,
  border: "1px solid #E8ECF4",
  padding: "20px 22px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
          size={13}
          fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          color={i <= Math.round(rating) ? "#F59E0B" : "#D1D5DB"}
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

  const [item, setItem] = useState<MenuItem | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  /* Desktop image zoom */
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomizations({});
    setInstructions("");
    setCharCount(0);
    setQty(1);
    setItem(null);
    setLoading(true);
  }, [id]);

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.json())
      .then((data: MenuItem[]) => {
        setMenu(data);
        const found = data.find(m => m.id === id);
        if (found) {
          setItem(found);
          if (found.customizationCategories?.length) {
            const defaults: Record<string, string> = {};
            found.customizationCategories.forEach(cat => {
              if (cat.options[0]?.name) defaults[cat.name] = cat.options[0].name;
            });
            setCustomizations(defaults);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!item?.customizationCategories?.length) return;
    setCustomizations(prev => {
      if (Object.keys(prev).length > 0) return prev;
      const defaults: Record<string, string> = {};
      item.customizationCategories!.forEach(cat => {
        if (cat.options[0]?.name) defaults[cat.name] = cat.options[0].name;
      });
      return defaults;
    });
  }, [item]);

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
    toast.success(`${item.name} added to cart!`, { icon: "🛒" });
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFF" }}>
        <style>{`@keyframes sk{0%,100%{opacity:1}50%{opacity:.5}}.sk{animation:sk 1.4s ease infinite;background:#E5E7EB;border-radius:8px}`}</style>
        {/* Desktop skeleton */}
        <div className="desktop-only" style={{ maxWidth: 1340, margin: "0 auto", padding: "32px 32px", display: "grid", gridTemplateColumns: "40% 1fr", gap: 40 }}>
          <div className="sk" style={{ aspectRatio: "1", borderRadius: 20 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
            {[60, 40, 80, 30, 100, 60, 100].map((w, i) => <div key={i} className="sk" style={{ height: i === 4 ? 80 : i === 6 ? 52 : 20, width: `${w}%` }} />)}
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="mobile-only" style={{ display: "flex", flexDirection: "column" }}>
          <div className="sk" style={{ height: 320, borderRadius: "0 0 24px 24px" }} />
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[70, 40, 90, 50].map((w, i) => <div key={i} className="sk" style={{ height: i === 3 ? 56 : 18, width: `${w}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: "3.5rem" }}>😕</div>
        <h1 style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0A0F2E" }}>Item not found</h1>
        <Link href="/menu" style={{ display: "flex", alignItems: "center", gap: 6, color: "#0135FB", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
          <ArrowLeft size={15} /> Back to Menu
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

  const catBg = CAT_BG[item.category] ?? "#E6F0FF";
  const catText = CAT_TEXT[item.category] ?? "#1E40AF";

  const relatedItems = menu.filter(m => m.id !== item.id && m.category === item.category && m.available).slice(0, 8);
  const boughtTogether = menu.filter(m => m.id !== item.id && m.category !== item.category && m.available).slice(0, 6);

  const descLong = item.description && item.description.length > 200;
  const descPreview = descLong && !descExpanded ? item.description.slice(0, 195) + "…" : item.description;

  const renderCustomizations = (compact?: boolean) => (
    itemOptions.length > 0 && (
      <div>
        {itemOptions.map(opt => (
          <div key={opt.name} style={{ marginBottom: compact ? 12 : 16 }}>
            <div style={{
              fontSize: compact ? "0.75rem" : "0.78rem", fontWeight: 800, color: "#0A0F2E",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {opt.name}
              {opt.required && <span style={{ color: "#EF4444", fontSize: "0.7rem" }}>*</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? 7 : 8 }}>
              {opt.options.filter(o => o.name).map(o => (
                <button
                  key={o.name}
                  className={`opt-chip${customizations[opt.name] === o.name ? " selected" : ""}`}
                  style={compact ? { fontSize: "0.8rem", padding: "7px 14px" } : undefined}
                  onClick={() => setCustom(opt.name, o.name)}
                >
                  {o.name}
                  {o.price > 0 && (
                    <span style={{ marginLeft: 6, opacity: customizations[opt.name] === o.name ? 0.9 : 0.7, fontSize: "0.78rem" }}>
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
        background: "white", borderTop: "1.5px solid #E5E7EB",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
        padding: "10px 16px 10px", display: "flex", alignItems: "center", gap: 10,
      }
      : { display: "flex", flexDirection: "column", gap: 12, marginTop: 8 };

    return (
      <div style={base}>
        {mobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, overflow: "hidden",
              position: "relative", flexShrink: 0, background: catBg,
            }}>
              <Image src={item.image} alt={item.name} fill sizes="38px" style={{ objectFit: "cover" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#0A0F2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontWeight: 900, fontSize: "1rem", color: "#0135FB" }}>₹{displayUnitPrice}</span>
                {hasDiscount && extrasTotal === 0 && <span style={{ fontSize: "0.72rem", textDecoration: "line-through", color: "#9CA3AF" }}>₹{item.originalPrice}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Desktop: qty selector + total */}
        {!mobile && (
          <>
            {/* Qty row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A0F2E" }}>Quantity</span>
              <div style={{ display: "flex", alignItems: "center", gap: 2, border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 36, height: 36, border: "none", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0F2E" }}
                ><Minus size={14} /></button>
                <span style={{ minWidth: 32, textAlign: "center", fontWeight: 800, fontSize: "0.95rem", color: "#0A0F2E" }}>{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  style={{ width: 36, height: 36, border: "none", background: "#0135FB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
                ><Plus size={14} /></button>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#F8FAFF", borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <span style={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 600 }}>Total</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                {hasDiscount && extrasTotal === 0 && qty === 1 && <span style={{ fontSize: "0.82rem", textDecoration: "line-through", color: "#9CA3AF" }}>₹{item.originalPrice}</span>}
                <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#0135FB" }}>₹{displayLineTotal}</span>
              </div>
            </div>
            {extrasTotal > 0 && (
              <div style={{ fontSize: "0.78rem", color: "#6B7280", textAlign: "right" }}>
                Base ₹{item.price}{extrasTotal > 0 ? ` + ₹${extrasTotal} add-ons` : ""}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        {qtyInCart === 0 ? (
          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            style={{
              flex: mobile ? "unset" : undefined,
              width: mobile ? "auto" : "100%",
              padding: mobile ? "0 20px" : "15px 24px",
              height: mobile ? 44 : undefined,
              borderRadius: 12, border: "none", cursor: item.available ? "pointer" : "not-allowed",
              background: item.available ? "linear-gradient(135deg, #0135FB 0%, #0028D4 100%)" : "#E5E7EB",
              color: item.available ? "white" : "#9CA3AF",
              fontWeight: 900, fontSize: "0.9rem", fontFamily: "inherit",
              letterSpacing: "0.3px",
              boxShadow: item.available ? "0 6px 20px rgba(1,53,251,0.3)" : "none",
              transition: "all 0.18s",
              display: "flex", alignItems: "center", gap: 7, justifyContent: "center",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { if (item.available) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          >
            <ShoppingCart size={15} />
            {item.available
              ? (mobile ? "Add to Cart" : `Add ${qty > 1 ? `(${qty})` : ""} · ₹${displayLineTotal}`)
              : "Sold Out"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => updateQuantity(cartItem!.cartItemId, qtyInCart - 1)}
                style={{ width: 36, height: 36, border: "none", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0F2E" }}>
                <Minus size={13} />
              </button>
              <span style={{ minWidth: 28, textAlign: "center", fontWeight: 800, fontSize: "0.92rem", color: "#0A0F2E" }}>{qtyInCart}</span>
              <button onClick={() => addToCart(item, instructions, selectedCustomizations, unitPrice)}
                style={{ width: 36, height: 36, border: "none", background: "#0135FB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <Plus size={13} />
              </button>
            </div>
            <Link href="/cart" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 36,
              borderRadius: 10, background: "linear-gradient(135deg, #22C55E, #16A34A)",
              color: "white", textDecoration: "none", fontWeight: 800, fontSize: "0.82rem",
              boxShadow: "0 4px 14px rgba(34,197,94,0.3)", whiteSpace: "nowrap",
            }}>
              <ShoppingCart size={13} /> View Cart
            </Link>
          </div>
        )}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* hide scrollbars on recommendation rows */
        .reco-scroll {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 200px;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          align-items: stretch;
        }
        .reco-scroll::-webkit-scrollbar { display:none; }
        .reco-scroll-item { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        .reco-section { margin-bottom: 40px; }
        .reco-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; gap: 12px;
        }
        .reco-section-header h2 {
          font-size: 1.15rem; font-weight: 800; color: #0A0F2E; margin: 0;
        }
        .item-desc-text {
          font-size: 1rem; color: #374151; line-height: 1.75; margin: 0;
        }
        @media (max-width: 768px) {
          .reco-scroll { grid-auto-columns: 160px; gap: 12px; }
          .item-desc-text { font-size: 0.92rem; line-height: 1.65; }
        }

        /* desktop two-column */
        .item-page-grid {
          display: grid;
          grid-template-columns: 40% 1fr;
          gap: 40px;
          max-width: 1340px;
          margin: 0 auto;
          padding: 28px 32px 80px;
          align-items: start;
        }

        /* sticky info panel on desktop */
        .info-panel { position: sticky; top: 72px; }

        /* mobile-only padding for sticky bar */
        @media (max-width: 768px) {
          .mobile-page-body { padding-bottom: 82px; }
          .item-page-grid { display: block; padding: 0; }
          .desktop-gallery { display: none !important; }
          .desktop-info { display: none !important; }
          .mobile-sticky-bar { display: flex !important; }
          .mobile-product-view { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-product-view { display: none !important; }
          .mobile-sticky-bar { display: none !important; }
          .desktop-gallery { display: block !important; }
          .desktop-info { display: flex !important; }
        }

        /* image zoom */
        .img-zoom-wrap { cursor: zoom-in; }
        .img-zoom-wrap.zoomed { cursor: zoom-out; }

        /* thumbnail active ring */
        .thumb-active { outline: 2.5px solid #0135FB; outline-offset: 2px; }

        /* option chips */
        .opt-chip {
          padding: 8px 16px; border-radius: 999px; border: 1.5px solid #E5E7EB;
          background: white; cursor: pointer; font-family: inherit; font-size: 0.82rem;
          font-weight: 600; color: #374151; transition: all 0.15s; white-space: nowrap;
        }
        .opt-chip:hover { border-color: #0135FB; color: #0135FB; background: #EEF1FF; }
        .opt-chip.selected { border-color: #0135FB; background: #0135FB; color: white; }

        /* delivery trust badges */
        .trust-badge {
          display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px;
          background: white; border: 1px solid #E5E7EB; border-radius: 99px;
          font-size: 0.78rem; font-weight: 700; color: #374151; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.35s ease both; }
      `}</style>

      <div style={{ background: "#F8FAFF", minHeight: "100vh" }}>

        {/* ══════════════════════════════════════════════
            DESKTOP LAYOUT: two-column grid
        ══════════════════════════════════════════════ */}
        <div className="item-page-grid">

          {/* ── Left: Image Gallery ── */}
          <div className="desktop-gallery" style={{ display: "none" }}>

            {/* Breadcrumb */}
            <nav style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
              <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "none", cursor: "pointer", color: "#6B7280", fontWeight: 600, fontSize: "0.8rem", fontFamily: "inherit", padding: 0 }}>
                <ArrowLeft size={13} /> Back
              </button>
              <ChevronRight size={11} color="#9CA3AF" />
              <Link href="/menu" style={{ color: "#6B7280", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>Menu</Link>
              <ChevronRight size={11} color="#9CA3AF" />
              <Link href={`/menu?category=${item.category}`} style={{ color: "#6B7280", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", textTransform: "capitalize" }}>{item.category}</Link>
              <ChevronRight size={11} color="#9CA3AF" />
              <span style={{ color: "#0A0F2E", fontSize: "0.8rem", fontWeight: 700, textTransform: "capitalize" }}>{item.name}</span>
            </nav>

            {/* Main image */}
            <div
              ref={imgWrapRef}
              className={`img-zoom-wrap${zoomed ? " zoomed" : ""}`}
              style={{
                position: "relative", width: "100%", aspectRatio: "1 / 1",
                borderRadius: 20, overflow: "hidden", background: catBg,
                boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 1340px) 40vw, 530px"
                priority
                style={{
                  objectFit: "cover",
                  transition: "transform 0.3s ease",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: zoomed ? "scale(1.6)" : "scale(1)",
                }}
              />
              {/* Badges on desktop image */}
              {item.isPopular && (
                <span style={{
                  position: "absolute", top: 14, left: 14, zIndex: 2,
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "white", padding: "5px 12px", borderRadius: 99,
                  fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.4px",
                  boxShadow: "0 3px 10px rgba(217,119,6,0.35)",
                }}>⭐ Popular</span>
              )}
              {hasDiscount && (
                <span style={{
                  position: "absolute", top: 14, right: 14, zIndex: 2,
                  background: "#22C55E", color: "white",
                  padding: "5px 12px", borderRadius: 99,
                  fontSize: "0.72rem", fontWeight: 800,
                  boxShadow: "0 3px 10px rgba(34,197,94,0.35)",
                }}>{discountPct}% OFF</span>
              )}
            </div>

            {/* Thumbnail strip — shows same image with slight zoom variation for now */}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              {[item.image].map((src, i) => (
                <div
                  key={i}
                  className="thumb-active"
                  style={{
                    width: 64, height: 64, borderRadius: 10, overflow: "hidden",
                    position: "relative", flexShrink: 0, background: catBg, cursor: "pointer",
                  }}
                >
                  <Image src={src} alt={`View ${i + 1}`} fill sizes="64px" style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>

            {/* Trust badges (desktop, below gallery) */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
              {DELIVERY_BADGES.map((b, i) => (
                <span key={i} className="trust-badge">
                  <span style={{ color: "#0135FB" }}>{b.icon}</span> {b.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Info Panel (sticky) ── */}
          <div className="desktop-info info-panel fade-up" style={{ display: "none", flexDirection: "column", gap: 14 }}>

            {/* Header card */}
            <div style={INFO_CARD}>
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: 999,
                  background: catBg, color: catText,
                  fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize",
                }}>{item.category}</span>
              </div>

              <h1 style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                fontSize: "clamp(1.7rem, 2.5vw, 2.2rem)", lineHeight: 1.1,
                color: "#0A0F2E", textTransform: "capitalize", marginBottom: 12,
              }}>{item.name}</h1>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Stars rating={rating} />
                <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0A0F2E" }}>{rating}</span>
                <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>({reviews} reviews)</span>
                <span style={{ width: 1, height: 14, background: "#E5E7EB" }} />
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem", color: "#6B7280" }}>
                  <CheckCircle size={13} color="#22C55E" /> {item.orderCount}+ orders
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 99,
                  background: item.available ? "#D1FAE5" : "#FEE2E2",
                  fontSize: "0.78rem", fontWeight: 700,
                  color: item.available ? "#065F46" : "#991B1B",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.available ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                  {item.available ? "Available" : "Sold Out"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, background: "#EEF1FF", fontSize: "0.78rem", fontWeight: 700, color: "#0135FB" }}>
                  <Clock size={12} /> Freshly Prepared
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, background: "#FEF3C7", fontSize: "0.78rem", fontWeight: 700, color: "#92400E" }}>
                  <Zap size={12} /> 30-45 min
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#0135FB", lineHeight: 1 }}>₹{displayUnitPrice}</span>
                {hasDiscount && extrasTotal === 0 && (
                  <>
                    <span style={{ fontSize: "1.05rem", textDecoration: "line-through", color: "#9CA3AF", fontWeight: 600 }}>₹{item.originalPrice}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#22C55E", background: "#DCFCE7", padding: "3px 10px", borderRadius: 6 }}>
                      Save ₹{savings}
                    </span>
                  </>
                )}
              </div>
              {extrasTotal > 0 && (
                <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#6B7280" }}>
                  Base price ₹{item.price} + ₹{extrasTotal} add-ons
                </p>
              )}
            </div>

            {/* Description card */}
            {item.description && (
              <div style={{ ...INFO_CARD, background: "linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)" }}>
                <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>About this item</h3>
                <p className="item-desc-text">
                  {descPreview}
                  {descLong && (
                    <button onClick={() => setDescExpanded(v => !v)} style={{ marginLeft: 6, color: "#0135FB", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "0.92rem", fontFamily: "inherit" }}>
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* Customizations card */}
            {itemOptions.length > 0 && (
              <div style={INFO_CARD}>
                <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Customize your order</h3>
                {renderCustomizations()}
              </div>
            )}

            {/* Special instructions card */}
            <div style={INFO_CARD}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                  <Info size={13} color="#9CA3AF" /> Special Requests
                </h3>
                <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{charCount}/200</span>
              </div>
              <textarea
                placeholder="e.g. Less sugar, extra hot, no ice…"
                value={instructions}
                maxLength={200}
                rows={3}
                onChange={e => { setInstructions(e.target.value); setCharCount(e.target.value.length); }}
                style={{
                  width: "100%", background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                  borderRadius: 10, padding: "12px 14px", fontSize: "0.875rem",
                  color: "#0A0F2E", outline: "none", resize: "none",
                  fontFamily: "inherit", lineHeight: 1.5, transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0135FB"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            {/* Purchase card */}
            <div style={{ ...INFO_CARD, border: "2px solid #EEF1FF", boxShadow: "0 8px 28px rgba(1,53,251,0.08)" }}>
              <CartBar mobile={false} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            MOBILE LAYOUT
        ══════════════════════════════════════════════ */}
        <div className="mobile-product-view mobile-page-body" style={{ display: "none", flexDirection: "column" }}>

          {/* ── Image area ── */}
          <div style={{
            position: "relative", width: "100%", height: 310,
            background: catBg, borderRadius: "0 0 24px 24px", overflow: "hidden", flexShrink: 0,
          }}>
            <Image src={item.image} alt={item.name} fill sizes="100vw" priority style={{ objectFit: "cover" }} />

            {/* Back */}
            <button
              onClick={() => router.back()}
              style={{
                position: "absolute", top: 14, left: 14, zIndex: 10,
                width: 38, height: 38, borderRadius: "50%", border: "none",
                background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
            >
              <ArrowLeft size={17} color="#0A0F2E" />
            </button>

            {/* Category badge */}
            <span style={{
              position: "absolute", top: 14, right: 14, zIndex: 10,
              background: catBg, color: catText,
              padding: "5px 12px", borderRadius: 99,
              fontSize: "0.72rem", fontWeight: 800, textTransform: "capitalize",
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            }}>{item.category}</span>

            {/* Discount badge */}
            {hasDiscount && (
              <span style={{
                position: "absolute", bottom: 18, right: 16, zIndex: 10,
                background: "#22C55E", color: "white",
                padding: "5px 14px", borderRadius: 99,
                fontSize: "0.78rem", fontWeight: 800,
                boxShadow: "0 3px 12px rgba(34,197,94,0.4)",
              }}>{discountPct}% OFF</span>
            )}

            {/* Popular badge */}
            {item.isPopular && (
              <span style={{
                position: "absolute", bottom: 18, left: 16, zIndex: 10,
                background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white",
                padding: "5px 12px", borderRadius: 99,
                fontSize: "0.72rem", fontWeight: 800,
                boxShadow: "0 3px 10px rgba(217,119,6,0.35)",
              }}>⭐ Popular</span>
            )}
          </div>

          {/* ── Product info card ── */}
          <div style={{ padding: "20px 16px 0" }}>

            {/* Name + price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "1.5rem",
                lineHeight: 1.15, color: "#0A0F2E", textTransform: "capitalize", flex: 1,
              }}>{item.name}</h1>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {hasDiscount && extrasTotal === 0 && <div style={{ fontSize: "0.78rem", textDecoration: "line-through", color: "#9CA3AF", lineHeight: 1.2 }}>₹{item.originalPrice}</div>}
                <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "#0135FB", lineHeight: 1.1 }}>₹{displayUnitPrice}</div>
                {hasDiscount && extrasTotal === 0 && <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#22C55E" }}>Save ₹{savings}</div>}
                {extrasTotal > 0 && <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: 2 }}>incl. add-ons</div>}
              </div>
            </div>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Stars rating={rating} />
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0A0F2E" }}>{rating}</span>
              <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>({reviews} reviews)</span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: item.available ? "#065F46" : "#991B1B", fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.available ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                {item.available ? "Available" : "Sold Out"}
              </span>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
              {DELIVERY_BADGES.map((b, i) => (
                <span key={i} className="trust-badge" style={{ fontSize: "0.72rem" }}>
                  <span style={{ color: "#0135FB" }}>{b.icon}</span> {b.text}
                </span>
              ))}
            </div>

            {/* Description */}
            {item.description && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #F1F5F9", padding: "16px 18px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>About this item</h3>
                <p className="item-desc-text">
                  {descPreview}
                  {descLong && (
                    <button onClick={() => setDescExpanded(v => !v)}
                      style={{ marginLeft: 4, color: "#0135FB", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: "0.88rem", fontFamily: "inherit" }}>
                      {descExpanded ? "Less" : "Read more"}
                    </button>
                  )}
                </p>
              </div>
            )}

            {/* Customisations */}
            {itemOptions.length > 0 && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #F1F5F9", padding: "14px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Customize</h3>
                {renderCustomizations(true)}
              </div>
            )}

            {/* Special instructions */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #F1F5F9", padding: "14px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontSize: "0.75rem", fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Any special requests?</h3>
                <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{charCount}/200</span>
              </div>
              <textarea
                placeholder="Less sugar, extra hot, no ice…"
                value={instructions}
                maxLength={200}
                rows={2}
                onChange={e => { setInstructions(e.target.value); setCharCount(e.target.value.length); }}
                style={{
                  width: "100%", background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                  borderRadius: 10, padding: "10px 12px", fontSize: "0.875rem",
                  color: "#0A0F2E", outline: "none", resize: "none",
                  fontFamily: "inherit", lineHeight: 1.5, transition: "border-color 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0135FB"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
              />
            </div>

            {/* Frequently bought together */}
            {boughtTogether.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0A0F2E" }}>Frequently Bought Together</h2>
                  <Link href="/menu" style={{ fontSize: "0.75rem", color: "#0135FB", fontWeight: 700, textDecoration: "none" }}>See all</Link>
                </div>
                <div className="reco-scroll">
                  {boughtTogether.map(r => (
                    <div key={r.id} className="reco-scroll-item">
                      <FoodCard 
                        item={r} 
                        compact 
                        layout="vertical"
                        cartItem={cart.find(c => c.item.id === r.id)}
                        onAdd={addToCart}
                        onUpdateQuantity={updateQuantity}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* More from same category */}
            {relatedItems.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0A0F2E" }}>You May Also Like</h2>
                  <Link href={`/menu?category=${item.category}`} style={{ fontSize: "0.75rem", color: "#0135FB", fontWeight: 700, textDecoration: "none" }}>View all →</Link>
                </div>
                <div className="reco-scroll">
                  {relatedItems.map(r => (
                    <div key={r.id} className="reco-scroll-item">
                      <FoodCard 
                        item={r} 
                        compact 
                        layout="vertical"
                        cartItem={cart.find(c => c.item.id === r.id)}
                        onAdd={addToCart}
                        onUpdateQuantity={updateQuantity}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            DESKTOP: Recommendations (below 2-col grid)
        ══════════════════════════════════════════════ */}
        <div className="desktop-only" style={{ maxWidth: 1340, margin: "0 auto", padding: "0 32px 60px" }}>
          {boughtTogether.length > 0 && (
            <section className="reco-section" style={{ paddingTop: 24, borderTop: "2px solid #F1F5F9" }}>
              <div className="reco-section-header">
                <h2>🛒 Frequently Bought Together</h2>
                <Link href="/menu" style={{ fontSize: "0.82rem", color: "#0135FB", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>See all <ChevronRight size={14} /></Link>
              </div>
              <div className="reco-scroll">
                {boughtTogether.map(r => (
                  <div key={r.id} className="reco-scroll-item">
                    <FoodCard 
                      item={r} 
                      compact 
                      layout="vertical"
                      cartItem={cart.find(c => c.item.id === r.id)}
                      onAdd={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedItems.length > 0 && (
            <section className="reco-section">
              <div className="reco-section-header">
                <h2>☕ More {item.category.charAt(0).toUpperCase() + item.category.slice(1)}</h2>
                <Link href={`/menu?category=${item.category}`} style={{ fontSize: "0.82rem", color: "#0135FB", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>View all <ChevronRight size={14} /></Link>
              </div>
              <div className="reco-scroll">
                {relatedItems.map(r => (
                  <div key={r.id} className="reco-scroll-item">
                    <FoodCard 
                      item={r} 
                      compact 
                      layout="vertical"
                      cartItem={cart.find(c => c.item.id === r.id)}
                      onAdd={addToCart}
                      onUpdateQuantity={updateQuantity}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>

      {/* Sticky mobile cart bar */}
      <div className="mobile-sticky-bar" style={{ display: "none" }}>
        <CartBar mobile={true} />
      </div>

      <Footer />
    </>
  );
}
