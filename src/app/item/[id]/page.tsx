"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Heart, Share2, Minus, Plus, Search, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/context";
import { MenuItem } from "@/lib/types";
import toast from "react-hot-toast";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cart, addToCart, updateQuantity, wishlist, toggleWishlist } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<{ name: string, price: number } | null>(null);
  const [selectedMilk, setSelectedMilk] = useState<string>("Hot Milk");
  const [selectedSugar, setSelectedSugar] = useState<string>("Sweet");
  const [selectedStrength, setSelectedStrength] = useState<string>("Regular");

  const { data: rawMenu, isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const menu = Array.isArray(rawMenu) ? rawMenu : [];

  const item = useMemo(() => menu.find(m => m.id === id), [menu, id]);

  // Set default selected size when item loads
  useMemo(() => {
    if (item && item.sizes && item.sizes.length > 0 && !selectedSize) {
      setSelectedSize(item.sizes[0]);
    }
  }, [item, selectedSize]);

  const cartItem = useMemo(() => cart.find(c => c.item.id === item?.id), [cart, item]);
  const relatedItems = useMemo(() => {
    if (!item) return [];
    return menu.filter(m => m.category === item.category && m.id !== item.id).slice(0, 6);
  }, [menu, item]);

  // const handleAddToCart = () => {
  //   if (!item) return;
  //   const currentPrice = selectedSize ? selectedSize.price : item.price;
  //   const customizations: { category: string; option: string; price?: number }[] = [
  //     ...(selectedSize ? [{ category: "Size", option: selectedSize.name, price: selectedSize.price }] : []),
  //     ...(item.category === "coffee" ? [
  //       { category: "Milk", option: selectedMilk },
  //       { category: "Sugar", option: selectedSugar },
  //       { category: "Strength", option: selectedStrength },
  //     ] : []),
  //   ];
  //   addToCart(item, "", customizations, currentPrice);
  //   toast.success("Added to cart");
  // };

  const handleAddToCart = () => {
    if (!item) return;
    const currentPrice = selectedSize ? selectedSize.price : item.price;

    const customizations = [
      ...(selectedSize ? [{ category: "Size", option: selectedSize.name, price: selectedSize.price }] : []),
      ...(item.category === "coffee" ? [
        { category: "Milk", option: selectedMilk, price: 0 },
        { category: "Sugar", option: selectedSugar, price: 0 },
        { category: "Strength", option: selectedStrength, price: 0 },
      ] : []),
    ];

    addToCart(item, "", customizations, currentPrice);
    toast.success("Added to cart");
  };

  if (isLoading || !item) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0F172A" }}>Loading...</div>
      </div>
    );
  }

  const currentPrice = selectedSize ? selectedSize.price : item.price;
  const hasDiscount = !!item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
  const isWishlisted = wishlist?.includes(item.id);

  // We keep the images array for desktop thumbs, but hide it on mobile.
  const images = [item.image, item.image, item.image];

  const highlights = [
    { label: "Brand", value: "ONN DA WAY" },
    { label: "Category", value: item.category },
    { label: "Dietary Preference", value: "Veg" },
    ...(item.details || [])
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#111827", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{`
        .item-page-wrap {
          max-width: 1160px;
          margin: 0 auto;
          padding: 24px 32px 64px;
        }
        .item-grid {
          display: grid;
          grid-template-columns: 48% 52%;
          gap: 48px;
          align-items: start;
        }

        /* --- LEFT COLUMN --- */
        .left-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 32px;
        }
        .gallery-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          width: 100%;
        }
        .thumbs-col {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 16px;
          width: 100%;
        }
        .thumb-box {
          width: 64px; height: 64px;
          position: relative;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
          background: #fff;
          overflow: hidden;
          opacity: 0.6;
          border: 1.5px solid transparent;
        }
        .thumb-box.active { opacity: 1; border-color: #0135FB; border-width: 2px; }
        .main-image-box {
          width: 100%;
          max-width: 440px;
          aspect-ratio: 1 / 1;
          border: 1.5px solid #F3F4F6;
          border-radius: 20px;
          position: relative;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }

        /* --- DESKTOP ACTIONS --- */
        .desktop-actions-wrap {
          display: flex; gap: 12px;
          margin-bottom: 20px;
        }
        .btn-desktop-cta {
          flex: 1;
          background: #0135FB;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 1.05rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: 0 4px 12px rgba(1,53,251,0.2);
        }
        .btn-desktop-cta:hover { background: #002BE0; }
        .btn-desktop-cta.checkout { background: #10B981; box-shadow: 0 4px 12px rgba(16,185,129,0.2); }
        .btn-desktop-cta.checkout:hover { background: #059669; }
        
        .qty-control-desktop {
          display: flex; align-items: center;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          background: #fff;
        }
        .qty-btn-desk { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: #111827; }
        .qty-btn-desk:hover { background: #F9FAFB; }
        .qty-val-desk { width: 40px; text-align: center; font-weight: 800; font-size: 1.1rem; }
        
        .icon-btn-desk {
          width: 54px; height: 54px; border: 1.5px solid #E5E7EB; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: #fff; cursor: pointer; color: #6B7280; transition: all 0.2s;
        }
        .icon-btn-desk:hover { background: #F9FAFB; color: #111827; }
        .icon-btn-desk.wishlisted { color: #ef4444; border-color: #ef4444; background: #FEF2F2; }

        /* --- RIGHT COLUMN --- */
        .card-box {
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 20px;
          background: #fff;
          margin-bottom: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        
        /* Product Header */
        .brand-link {
          font-size: 0.85rem; color: #6B7280; font-weight: 600;
          display: flex; align-items: center; gap: 4px; margin-bottom: 12px;
        }
        .product-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem; font-weight: 900; color: #1f4bfdff;
          margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -0.02em;
        }

        /* Pricing */
        .price-wrap { margin-bottom: 20px; }
        /* Row: MRP on left crossed, our price on right */
        .price-row {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;
        }
        .price-mrp-left { display: flex; flex-direction: column; gap: 2px; }
        .price-mrp-label { font-size: 0.78rem; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .price-mrp-val { font-size: 1rem; color: #94A3B8; font-weight: 500; text-decoration: line-through; }
        .price-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .current-price {
          font-size: 2.2rem; font-weight: 900; color: #0A0F2E; letter-spacing: -1px; line-height: 1;
        }
        .savings-badge { background: #DCFCE7; color: #16A34A; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 800; }
        .tax-incl { font-size: 0.8rem; color: #94A3B8; font-weight: 500; }

        /* Customizations */
        .custom-group { margin-bottom: 24px; }
        .custom-group:last-child { margin-bottom: 0; }
        .custom-label {
          font-size: 0.75rem; font-weight: 800; color: #6B7280;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
          display: flex; align-items: center; gap: 6px;
        }
        .pill-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .custom-pill {
          padding: 10px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px;
          font-size: 0.88rem; font-weight: 600; color: #475569; background: #fff;
          cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 8px;
        }
        .custom-pill.active { border-color: #0135FB; background: #EEF1FF; color: #0135FB; box-shadow: 0 4px 12px rgba(1, 53, 251, 0.1); }
        .custom-pill:hover:not(.active) { border-color: #CBD5E1; background: #F8FAFC; transform: translateY(-1px); }

        /* Highlights */
        .highlights-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem; font-weight: 900; color: #0A0F2E; margin-bottom: 20px; letter-spacing: -0.01em;
        }
        .highlight-row {
          display: flex; padding: 16px 0;
          border-bottom: 1px solid #F1F5F9;
        }
        .highlight-row:last-child { border-bottom: none; padding-bottom: 0; }
        .highlight-label { width: 45%; color: #64748B; font-weight: 500; font-size: 0.95rem; }
        .highlight-value { width: 55%; color: #0F172A; font-weight: 700; font-size: 0.95rem; text-transform: capitalize; }

        /* Related Items */
        .related-section { padding-top: 48px; }
        .related-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .related-title { font-size: 1.4rem; font-weight: 900; color: #111827; }
        .related-line { flex: 1; height: 1.5px; background: #F3F4F6; }
        .reco-scroll { display: flex; gap: 16px; overflow-x: auto; scrollbar-width: none; padding-bottom: 16px; }
        .reco-scroll::-webkit-scrollbar { display: none; }
        .reco-item { width: 220px; flex-shrink: 0; }

        /* Mobile specific fixes */
        .mobile-only { display: none !important; }
        .mobile-sticky-bar { display: none; }

        @media (max-width: 900px) {
          .item-grid { grid-template-columns: 1fr; gap: 16px; }
          .item-page-wrap { padding: 16px 16px 110px; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          
          .left-col { position: relative; top: 0; gap: 16px; }
          .gallery-wrap { height: auto; gap: 12px; }
          
          /* Remove thumbnails completely on mobile */
          .thumbs-col { display: none !important; }
          
          .main-image-box { aspect-ratio: 1/1; height: auto; }
          
          .card-box { padding: 16px; border-radius: 14px; margin-bottom: 12px; }
          .product-title { font-size: 1.6rem; }
          .current-price { font-size: 1.9rem; }
          
          .mobile-sticky-bar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px);
            padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom));
            border-top: 1px solid #E5E7EB; z-index: 960; gap: 12px; align-items: center;
          }
        }
      `}</style>

      {/* Mobile Topbar */}
      <div className="mobile-only" style={{ padding: "0 0 16px 0" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#4B5563", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.95rem" }}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="item-page-wrap">
        <div className="item-grid">

          {/* --- LEFT COLUMN: Images --- */}
          <div className="left-col">
            <div className="desktop-only" style={{ marginBottom: -4 }}>
              <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6B7280", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#111827"} onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>
                <ArrowLeft size={16} /> Back to Menu
              </button>
            </div>

            <div className="gallery-wrap">
              <div className="main-image-box">
                <Image src={images[activeImageIndex]} alt={item.name} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: "contain" }} priority onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                {!item.available && !item.isLaunchingSoon && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                    <div style={{ background: "#EF4444", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, letterSpacing: "1px" }}>UNAVAILABLE</div>
                  </div>
                )}
              </div>
              <div className="thumbs-col">
                {images.map((img, idx) => (
                  <div key={idx} className={`thumb-box ${activeImageIndex === idx ? "active" : ""}`} onClick={() => setActiveImageIndex(idx)}>
                    <Image src={img} alt={`${item.name} thumb`} fill style={{ objectFit: "cover" }} onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* --- RIGHT COLUMN: Info & Customizations --- */}
          <div>

            {/* Basic Info Card */}
            <div className="card-box">
              <div className="brand-link">
                ONN DA WAY <ChevronRight size={14} />
              </div>
              <h1 className="product-title">{item.name}</h1>

              <div className="price-wrap">
                <div className="price-row">
                  {/* Left: MRP crossed out */}
                  {hasDiscount ? (
                    <div className="price-mrp-left">
                      <span className="price-mrp-label">MRP</span>
                      <span className="price-mrp-val">₹{item.originalPrice}</span>
                    </div>
                  ) : (
                    <div className="price-mrp-left">
                      <span className="price-mrp-label">Price</span>
                    </div>
                  )}
                  {/* Right: Our price + savings */}
                  <div className="price-right">
                    <div className="current-price">₹{currentPrice}</div>
                    {hasDiscount && (
                      <span className="savings-badge">Save ₹{item.originalPrice! - currentPrice} ({discountPct}% OFF)</span>
                    )}
                  </div>
                </div>
                <div className="tax-incl">(Incl. of all taxes)</div>
              </div>
            </div>

            {/* Customizations Card */}
            {(item.sizes?.length || item.category === "coffee") ? (
              <div className="card-box">
                {item.sizes && item.sizes.length > 0 && (
                  <div className="custom-group">
                    <div className="custom-label">Select Size</div>
                    <div className="pill-grid">
                      {item.sizes.map(size => {
                        const isActive = selectedSize?.name === size.name;
                        return (
                          <button key={size.name} onClick={() => setSelectedSize(size)} className={`custom-pill ${isActive ? "active" : ""}`}>
                            {size.name} - ₹{size.price}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.category === "coffee" && (
                  <>
                    <div className="custom-group">
                      {/* <div className="custom-label">☕ Milk Preference</div>
                      <div className="pill-grid">
                        {[
                          { label: "Hot Milk", icon: "🌡️" },
                          { label: "Cold Milk", icon: "🧊" },
                          { label: "No Milk", icon: "🚫" },
                        ].map(opt => (
                          <button key={opt.label} type="button" className={`custom-pill ${selectedMilk === opt.label ? "active" : ""}`} onClick={() => setSelectedMilk(opt.label)}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div> */}
                    </div>

                    <div className="custom-group">
                      <div className="custom-label">🍬 Sugar Level</div>
                      <div className="pill-grid">
                        {[
                          { label: "Strong", icon: "💪" },
                          { label: "Sweet", icon: "😊" },
                          { label: "Less", icon: "😌" },
                          { label: "No Sugar", icon: "🚫" },
                        ].map(opt => (
                          <button key={opt.label} type="button" className={`custom-pill ${selectedSugar === opt.label ? "active" : ""}`} onClick={() => setSelectedSugar(opt.label)}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Desktop Add to Cart (Moved to Right Column) */}
            <div className="desktop-actions-wrap desktop-only">
              {cartItem ? (
                <>
                  <div className="qty-control-desktop">
                    <button className="qty-btn-desk" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={18} /></button>
                    <div className="qty-val-desk">{cartItem.quantity}</div>
                    <button className="qty-btn-desk" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={18} /></button>
                  </div>
                  <button className="btn-desktop-cta checkout" onClick={() => router.push("/cart")}>
                    <ShoppingCart size={20} /> CHECKOUT
                  </button>
                </>
              ) : (
                <button
                  className="btn-desktop-cta"
                  onClick={handleAddToCart}
                  disabled={!item.available || item.isLaunchingSoon}
                  style={{ opacity: (!item.available || item.isLaunchingSoon) ? 0.5 : 1, cursor: (!item.available || item.isLaunchingSoon) ? 'not-allowed' : 'pointer', background: (!item.available || item.isLaunchingSoon) ? '#E5E7EB' : undefined, color: (!item.available || item.isLaunchingSoon) ? '#6B7280' : undefined }}
                >
                  <ShoppingCart size={20} />
                  {item.isLaunchingSoon ? "LAUNCHING SOON" : (!item.available ? "UNAVAILABLE" : "ADD TO CART")}
                </button>
              )}
              <button className={`icon-btn-desk ${isWishlisted ? "wishlisted" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)}>
                <Heart size={22} fill={isWishlisted ? "#ef4444" : "none"} />
              </button>
            </div>

            {/* Highlights Card */}
            <div className="card-box">
              <h2 className="highlights-title">Highlights</h2>
              {highlights.map((h, i) => (
                <div key={i} className="highlight-row">
                  <div className="highlight-label">{h.label}</div>
                  <div className="highlight-value">{h.value}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Related Items Section */}
        {relatedItems.length > 0 && (
          <div className="related-section">
            <div className="related-header">
              <h2 className="related-title">You May Also Like</h2>
              <div className="related-line" />
            </div>
            <div className="reco-scroll">
              {relatedItems.map(r => (
                <div key={r.id} className="reco-item">
                  <FoodCard item={r} layout="vertical" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-sticky-bar mobile-only">
        {cartItem ? (
          <>
            <div className="qty-control-desktop" style={{ height: 50, borderRadius: 10 }}>
              <button className="qty-btn-desk" style={{ width: 44 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={16} /></button>
              <div className="qty-val-desk" style={{ width: 36 }}>{cartItem.quantity}</div>
              <button className="qty-btn-desk" style={{ width: 44 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={16} /></button>
            </div>
            <button className="btn-desktop-cta checkout" onClick={() => router.push("/cart")} style={{ margin: 0, height: 50, flex: 1, padding: 0, borderRadius: 10 }}>
              <ShoppingCart size={18} /> CHECKOUT
            </button>
          </>
        ) : (
          <button className="btn-desktop-cta" onClick={handleAddToCart} disabled={!item.available || item.isLaunchingSoon} style={{ margin: 0, height: 50, flex: 1, padding: 0, borderRadius: 10, opacity: (!item.available || item.isLaunchingSoon) ? 0.5 : 1, background: (!item.available || item.isLaunchingSoon) ? '#E5E7EB' : undefined, color: (!item.available || item.isLaunchingSoon) ? '#6B7280' : undefined }}>
            <ShoppingCart size={18} /> {item.isLaunchingSoon ? "LAUNCHING SOON" : (item.available ? "ADD TO CART" : "UNAVAILABLE")}
          </button>
        )}
        <button className={`icon-btn-desk ${isWishlisted ? "wishlisted" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)} style={{ height: 50, width: 50, flexShrink: 0, borderRadius: 10 }}>
          <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
        </button>
      </div>

      <Footer />
    </div>
  );
}
