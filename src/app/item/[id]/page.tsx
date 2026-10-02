"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Heart, Share2, Minus, Plus, Search, ChevronRight, Check } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");

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
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #F1F5F9", borderTopColor: "#0135FB", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#64748B", fontWeight: 600, fontSize: "0.9rem" }}>Loading details...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentPrice = selectedSize ? selectedSize.price : item.price;
  const hasDiscount = !!item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
  const isWishlisted = wishlist?.includes(item.id);

  const images = [item.image, item.image, item.image];

  const highlights = [
    { label: "Brand", value: "ONN DA WAY" },
    { label: "Category", value: item.category },
    { label: "Dietary Preference", value: "Veg" },
    ...(item.details || [])
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#0F172A", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{`
        .item-page-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 32px 80px;
          font-family: 'Inter', sans-serif;
        }
        .item-grid {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 56px;
          align-items: start;
        }

        /* --- LEFT COLUMN (Gallery) --- */
        .left-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 40px;
        }
        .gallery-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
        }
        .main-image-box {
          width: 100%;
          max-width: 500px;
          aspect-ratio: 1 / 1;
          border-radius: 28px;
          position: relative;
          background: #FFFFFF;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02);
        }
        .thumbs-col {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 16px;
          width: 100%;
        }
        .thumb-box {
          width: 72px; height: 72px;
          position: relative;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; justify-content: center;
          background: #fff;
          overflow: hidden;
          opacity: 0.5;
          border: 2px solid transparent;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .thumb-box:hover { opacity: 0.8; transform: translateY(-2px); }
        .thumb-box.active { opacity: 1; border-color: #0135FB; box-shadow: 0 8px 24px rgba(1,53,251,0.15); }

        /* --- DESKTOP ACTIONS --- */
        .desktop-actions-wrap {
          display: flex; gap: 16px;
          margin-bottom: 32px;
          margin-top: 16px;
        }
        .btn-desktop-cta {
          flex: 1;
          background: linear-gradient(135deg, #0135FB, #2A55FF);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 18px 24px;
          font-size: 1.1rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 8px 24px rgba(1,53,251,0.25);
          letter-spacing: 0.5px;
        }
        .btn-desktop-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(1,53,251,0.35); }
        .btn-desktop-cta:active { transform: translateY(0); }
        .btn-desktop-cta.checkout { background: #10B981; box-shadow: 0 8px 24px rgba(16,185,129,0.25); }
        .btn-desktop-cta.checkout:hover { background: #059669; }
        
        .qty-control-desktop {
          display: flex; align-items: center;
          background: #F1F5F9;
          border-radius: 16px;
          padding: 4px;
          border: 1px solid #E2E8F0;
        }
        .qty-btn-desk { 
          width: 48px; height: 48px; 
          display: flex; align-items: center; justify-content: center; 
          background: #FFFFFF; border: none; border-radius: 12px;
          cursor: pointer; color: #0F172A; 
          transition: 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .qty-btn-desk:hover { background: #F8FAFC; color: #0135FB; }
        .qty-val-desk { width: 44px; text-align: center; font-weight: 900; font-size: 1.2rem; color: #0F172A; }
        
        .icon-btn-desk {
          width: 56px; height: 56px; border: 1px solid #E2E8F0; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          background: #fff; cursor: pointer; color: #64748B; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .icon-btn-desk:hover { background: #F8FAFC; color: #0F172A; border-color: #CBD5E1; transform: translateY(-2px); }
        .icon-btn-desk.wishlisted { color: #ef4444; border-color: #ef4444; background: #FEF2F2; }

        /* --- RIGHT COLUMN (Details) --- */
        .details-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        /* Cards */
        .premium-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.01);
          border: 1px solid rgba(0,0,0,0.02);
        }
        
        /* Product Header */
        .brand-link {
          font-size: 0.85rem; color: #64748B; font-weight: 700;
          display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
          letter-spacing: 1px; text-transform: uppercase;
        }
        .product-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.4rem; font-weight: 900; color: #0F172A;
          margin: 0 0 16px 0; line-height: 1.1; letter-spacing: -0.03em;
        }

        /* Pricing */
        .price-wrap { 
          display: flex; flex-direction: column; gap: 8px;
          padding-bottom: 24px; border-bottom: 1px solid #F1F5F9;
        }
        .price-row {
          display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
        }
        .current-price {
          font-size: 2.5rem; font-weight: 900; color: #0135FB; letter-spacing: -1px; line-height: 1;
        }
        .mrp-wrap {
          display: flex; align-items: center; gap: 12px;
        }
        .price-mrp-val { 
          font-size: 1.2rem; color: #94A3B8; font-weight: 600; text-decoration: line-through; 
        }
        .savings-badge { 
          background: #DCFCE7; color: #16A34A; padding: 6px 12px; border-radius: 8px; 
          font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .tax-incl { font-size: 0.85rem; color: #94A3B8; font-weight: 500; }

        /* Customizations */
        .custom-group { margin-top: 28px; }
        .custom-label {
          font-size: 0.85rem; font-weight: 800; color: #475569;
          text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .pill-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .custom-pill {
          padding: 14px 20px; border: 2px solid #E2E8F0; border-radius: 16px;
          font-size: 0.95rem; font-weight: 700; color: #475569; background: #fff;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
        }
        .custom-pill.active { 
          border-color: #0135FB; background: #EEF1FF; color: #0135FB; 
        }
        .custom-pill.active::after {
          content: ''; position: absolute; inset: 0; 
          box-shadow: inset 0 0 0 1px #0135FB; border-radius: 14px; pointer-events: none;
        }
        .custom-pill:hover:not(.active) { 
          border-color: #CBD5E1; background: #F8FAFC; transform: translateY(-2px); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        /* --- BOTTOM TABS --- */
        .tabs-container {
          margin-top: 40px;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          overflow: hidden;
          background: #FFFFFF;
        }
        .tabs-header {
          display: flex; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;
        }
        .tab-btn {
          flex: 1; padding: 16px; text-align: center;
          font-size: 0.95rem; font-weight: 800; color: #64748B;
          border: none; background: transparent; cursor: pointer;
          text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s;
        }
        .tab-btn.active { color: #0135FB; background: #FFFFFF; box-shadow: inset 0 -2px 0 #0135FB; }
        .tab-content { padding: 32px; font-size: 1.05rem; color: #475569; line-height: 1.6; min-height: 120px; }


        /* Related Items */
        .related-section { padding-top: 64px; }
        .related-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .related-title { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 900; color: #0F172A; letter-spacing: -0.03em; }
        .reco-scroll { display: flex; gap: 20px; overflow-x: auto; scrollbar-width: none; padding-bottom: 24px; margin: 0 -32px; padding-left: 32px; padding-right: 32px; }
        .reco-scroll::-webkit-scrollbar { display: none; }
        .reco-item { width: 240px; flex-shrink: 0; }

        /* Mobile specific fixes */
        .mobile-only { display: none !important; }
        .mobile-sticky-bar { display: none; }

        @media (max-width: 900px) {
          .item-grid { grid-template-columns: 1fr; gap: 24px; }
          .item-page-wrap { padding: 0 0 120px 0; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          
          .left-col { position: relative; top: 0; gap: 0; }
          .gallery-wrap { gap: 0; }
          
          /* Remove thumbnails completely on mobile */
          .thumbs-col { display: none !important; }
          
          .main-image-box { 
            border-radius: 0 0 32px 32px; 
            max-width: 100%;
            border: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
            background: #F1F5F9;
          }
          
          .details-col { padding: 0 20px; margin-top: 24px; }
          .premium-card { padding: 24px; border-radius: 24px; }
          
          .product-title { font-size: 2rem; }
          .current-price { font-size: 2.2rem; }
          
          /* MOBILE STICKY BAR */
          .mobile-sticky-bar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px);
            padding: 16px 20px; padding-bottom: max(16px, env(safe-area-inset-bottom));
            border-top: 1px solid rgba(0,0,0,0.05); z-index: 960; gap: 12px; align-items: center;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.08);
          }
          
          .reco-scroll { margin: 0 -20px; padding-left: 20px; padding-right: 20px; }
          
          /* Mobile top nav overlay */
          .mobile-top-nav {
            position: absolute; top: 16px; left: 16px; right: 16px; z-index: 10;
            display: flex; justify-content: space-between;
          }
          .mobile-nav-btn {
            width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.95);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: none; color: #0F172A;
            backdrop-filter: blur(10px);
          }
        }
      `}</style>

      <div className="item-page-wrap">

        {/* --- LEFT COLUMN: Images --- */}
        <div className="item-grid">
          <div className="left-col">
            <div className="desktop-only" style={{ marginBottom: -12 }}>
              <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#64748B", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#0F172A"} onMouseLeave={e => e.currentTarget.style.color = "#64748B"}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <ArrowLeft size={16} /> 
                </div>
                Back to Menu
              </button>
            </div>

            <div className="gallery-wrap">
              {/* Mobile overlay navigation over the main image */}
              <div className="mobile-only mobile-top-nav">
                <button className="mobile-nav-btn" onClick={() => router.back()}>
                  <ArrowLeft size={20} />
                </button>
                <button className="mobile-nav-btn" onClick={() => toggleWishlist(item.id)} style={{ color: isWishlisted ? "#EF4444" : "#0F172A" }}>
                  <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="main-image-box">
                <Image src={images[activeImageIndex]} alt={item.name} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: "contain", padding: "20px" }} priority onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                {!item.available && !item.isLaunchingSoon && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
                    <div style={{ background: "#EF4444", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: 900, letterSpacing: "1px", fontSize: "1.1rem", boxShadow: "0 8px 24px rgba(239, 68, 68, 0.3)" }}>CURRENTLY UNAVAILABLE</div>
                  </div>
                )}
              </div>
              <div className="thumbs-col desktop-only">
                {images.map((img, idx) => (
                  <div key={idx} className={`thumb-box ${activeImageIndex === idx ? "active" : ""}`} onClick={() => setActiveImageIndex(idx)}>
                    <Image src={img} alt={`${item.name} thumb`} fill style={{ objectFit: "cover", padding: "8px" }} onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* --- RIGHT COLUMN: Info & Customizations --- */}
          <div className="details-col">

            {/* Basic Info Card */}
            <div className="premium-card">
              <div className="brand-link">
                ONN DA WAY <ChevronRight size={14} />
              </div>
              <h1 className="product-title">{item.name}</h1>

              <div className="price-wrap">
                <div className="price-row">
                  <div className="current-price">₹{currentPrice}</div>
                  
                  {hasDiscount && (
                    <div className="mrp-wrap">
                      <span className="price-mrp-val">₹{item.originalPrice}</span>
                      <span className="savings-badge">Save ₹{item.originalPrice! - currentPrice} ({discountPct}% OFF)</span>
                    </div>
                  )}
                </div>
                <div className="tax-incl">(Inclusive of all taxes)</div>
              </div>
            </div>

            {/* Customizations Card */}
            {((item.sizes && item.sizes.length > 0) || item.hasTallSize || item.category === "coffee") ? (
              <div className="premium-card">
                {((item.sizes && item.sizes.length > 0) || item.hasTallSize) && (
                  <div className="custom-group" style={{ marginTop: 0 }}>
                    <div className="custom-label">☕ Select Serving Size</div>
                    <div className="pill-grid">
                      {(item.hasTallSize ? [
                        { name: "Regular", price: item.price },
                        { name: "Tall", price: item.price + 20 }
                      ] : item.sizes!).map(size => {
                        const isActive = selectedSize?.name === size.name || (!selectedSize && size.name === "Regular");
                        return (
                          <button key={size.name} type="button" onClick={() => setSelectedSize(size)} className={`custom-pill ${isActive ? "active" : ""}`}>
                            {isActive && <Check size={16} />}
                            {size.name === "Tall" ? "🥤 Tall (+₹20)" : "☕ Regular"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.category === "coffee" && (
                  <>
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
                            {selectedSugar === opt.label ? <Check size={16} /> : opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Desktop Actions */}
            <div className="desktop-actions-wrap desktop-only">
              {cartItem ? (
                <>
                  <div className="qty-control-desktop">
                    <button className="qty-btn-desk" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={20} strokeWidth={3} /></button>
                    <div className="qty-val-desk">{cartItem.quantity}</div>
                    <button className="qty-btn-desk" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={20} strokeWidth={3} /></button>
                  </div>
                  <button className="btn-desktop-cta checkout" onClick={() => router.push("/cart")}>
                    <ShoppingCart size={22} /> Go to Cart (₹{currentPrice * cartItem.quantity})
                  </button>
                </>
              ) : (
                <button
                  className="btn-desktop-cta"
                  onClick={handleAddToCart}
                  disabled={!item.available}
                  style={{ opacity: !item.available ? 0.6 : 1, cursor: !item.available ? "not-allowed" : "pointer" }}
                >
                  <ShoppingCart size={22} /> {item.available ? `Add to Order — ₹${currentPrice}` : "Unavailable"}
                </button>
              )}
              
              <button className={`icon-btn-desk ${isWishlisted ? 'wishlisted' : ''}`} onClick={() => toggleWishlist(item.id)}>
                <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
              <button className="icon-btn-desk" onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: item.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }
              }}>
                <Share2 size={22} />
              </button>
            </div>

            {/* TABS (Description / Details) */}
            <div className="tabs-container">
              <div className="tabs-header">
                <button className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
                <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
              </div>
              <div className="tab-content">
                {activeTab === 'description' && (
                  <p>{item.description || "Indulge in this perfectly crafted beverage, made fresh to order. Enjoy the rich flavors and premium ingredients that make every sip special."}</p>
                )}
                {activeTab === 'details' && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {highlights.map((h, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: i < highlights.length - 1 ? "1px solid #F1F5F9" : "none", paddingBottom: i < highlights.length - 1 ? 16 : 0 }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>{h.label}</span>
                        <span style={{ color: "#0F172A", fontWeight: 800 }}>{h.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* --- RELATED ITEMS --- */}
        {relatedItems.length > 0 && (
          <div className="related-section">
            <div className="related-header">
              <h2 className="related-title">You May Also Like</h2>
            </div>
            <div className="reco-scroll">
              {relatedItems.map(m => (
                <div key={m.id} className="reco-item">
                  <FoodCard item={m} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MOBILE STICKY BOTTOM BAR (Cart + Quantity + Wishlist) --- */}
      <div className="mobile-sticky-bar mobile-only">
        {cartItem ? (
          <>
            <div className="qty-control-desktop" style={{ flexShrink: 0, padding: 4, height: 52 }}>
              <button className="qty-btn-desk" style={{ width: 44, height: 44 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={18} strokeWidth={3} /></button>
              <div className="qty-val-desk" style={{ width: 36, fontSize: "1.1rem" }}>{cartItem.quantity}</div>
              <button className="qty-btn-desk" style={{ width: 44, height: 44 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={18} strokeWidth={3} /></button>
            </div>
            <button className="btn-desktop-cta checkout" style={{ margin: 0, padding: 0, height: 52, flex: 1, borderRadius: 12, fontSize: "1rem" }} onClick={() => router.push("/cart")}>
              Go to Cart
            </button>
          </>
        ) : (
          <button
            className="btn-desktop-cta"
            onClick={handleAddToCart}
            disabled={!item.available}
            style={{ margin: 0, padding: 0, height: 52, flex: 1, borderRadius: 12, fontSize: "1rem", opacity: !item.available ? 0.6 : 1 }}
          >
            {item.available ? `Add Item • ₹${currentPrice}` : "Unavailable"}
          </button>
        )}
        
        {/* Wishlist button on mobile sticky bar */}
        <button 
          onClick={() => toggleWishlist(item.id)}
          style={{
            width: 52, height: 52, flexShrink: 0, borderRadius: 12,
            border: `2px solid ${isWishlisted ? '#EF4444' : '#E2E8F0'}`,
            background: isWishlisted ? '#FEF2F2' : '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isWishlisted ? '#EF4444' : '#64748B', transition: '0.2s'
          }}
        >
          <Heart size={22} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <Footer />
    </div>
  );
}
