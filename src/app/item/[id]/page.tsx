"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Heart, Share2, Minus, Plus, Search } from "lucide-react";
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
  const [selectedSize, setSelectedSize] = useState<{name: string, price: number} | null>(null);

  const { data: menu = [], isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

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
    const customizations = selectedSize ? [{ category: "Size", option: selectedSize.name, price: selectedSize.price }] : [];
    addToCart(item, "", customizations, currentPrice);
    toast.success("Added to cart");
  };

  if (isLoading || !item) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0F172A" }}>Loading...</div>
      </div>
    );
  }

  const currentPrice = selectedSize ? selectedSize.price : item.price;
  const hasDiscount = !!item.originalPrice && item.originalPrice > item.price; // Keep base item logic for original price
  const discountPct = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
  const isWishlisted = wishlist?.includes(item.id);
  const images = [item.image, item.image]; // Mocking multiple images for now

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#0F172A", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{`
        .item-page-wrap {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .item-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }

        /* Gallery */
        .gallery-box {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 12px;
          position: relative;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .gallery-box img {
          object-fit: contain;
          max-width: 100%;
          max-height: 100%;
        }
        .zoom-icon {
          position: absolute;
          top: 14px;
          right: 14px;
          color: #CBD5E1;
          background: #F8FAFC;
          border-radius: 8px;
          padding: 4px;
        }
        .thumbs-row {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .thumb-box {
          width: 60px;
          height: 60px;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 6px;
          cursor: pointer;
          transition: border-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumb-box.active {
          border-color: #0135FB;
          border-width: 2px;
        }
        .thumb-box img {
          object-fit: contain;
          max-width: 100%;
          max-height: 100%;
        }

        /* Info */
        .brand-text {
          color: #0135FB;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .title-text {
          font-size: 2rem;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          margin: 0 0 10px 0;
          letter-spacing: -0.5px;
          color: #0A0F2E;
        }
        .reviews-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94A3B8;
          font-size: 0.82rem;
          margin-bottom: 16px;
        }
        .desc-text {
          color: #475569;
          font-size: 0.92rem;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        /* Feature chips */
        .feature-chips {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .feature-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
          min-width: 90px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          text-align: center;
          line-height: 1.3;
        }

        /* Size buttons — square */
        .size-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }
        .size-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .size-btn {
          width: 80px;
          height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid #E2E8F0;
          border-radius: 14px;
          background: #ffffff;
          color: #0F172A;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.18s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .size-btn:hover { border-color: #0135FB; background: #EEF3FF; }
        .size-btn.active {
          border-color: #0135FB;
          background: #0135FB;
          color: #ffffff;
        }
        .size-btn svg path { transition: stroke 0.18s; }
        .size-mrp-line {
          font-size: 0.82rem;
          color: #64748B;
          margin-bottom: 16px;
        }
        .size-mrp-line s { color: #94A3B8; font-weight: 600; }
        .size-mrp-line strong { color: #10B981; font-weight: 800; margin-left: 6px; }

        /* Price Box */
        .price-box {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 18px 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 10px;
        }
        .price-current {
          font-size: 2.4rem;
          font-weight: 900;
          color: #0A0F2E;
          line-height: 1;
        }
        .price-old {
          font-size: 1.3rem;
          color: #94A3B8;
          text-decoration: line-through;
          font-weight: 600;
        }
        .discount-pill {
          background: #10B981;
          color: #fff;
          font-size: 0.72rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.3px;
        }
        .delivery-text {
          color: #10B981;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .delivery-dot {
          width: 6px; height: 6px;
          background: #10B981;
          border-radius: 50%;
        }

        /* Quantity */
        .qty-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .qty-label {
          color: #64748B;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }
        .qty-control {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          overflow: hidden;
        }
        .qty-btn {
          width: 40px; height: 38px;
          background: transparent;
          border: none;
          color: #0F172A;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .qty-btn:hover { background: #F8FAFC; }
        .qty-val {
          width: 32px;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0A0F2E;
        }

        /* Buttons */
        .actions-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .btn-add {
          flex: 1;
          background: #0135FB;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
          letter-spacing: 0.2px;
        }
        .btn-add:hover { background: #002be0; }
        .btn-icon {
          width: 48px; height: 48px;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .btn-icon:hover { border-color: #CBD5E1; color: #0F172A; }
        .btn-icon.active { color: #ef4444; border-color: #ef4444; background: #FEF2F2; }

        /* Meta Table */
        .meta-box {
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 16px;
          background: #ffffff;
          margin-bottom: 0;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          padding: 6px 0;
          border-bottom: 1px solid #F1F5F9;
        }
        .meta-row:last-child { border-bottom: none; }
        .meta-label { color: #94A3B8; font-weight: 600; }
        .meta-val { color: #0F172A; font-weight: 800; text-transform: capitalize; }

        /* Product details in left column */
        .prod-details-box {
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          background: #ffffff;
          margin-top: 16px;
          overflow: hidden;
          max-width: 380px;
          margin-left: auto;
          margin-right: auto;
        }
        .prod-details-header {
          background: #F8FAFC;
          padding: 10px 16px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-bottom: 1px solid #E2E8F0;
        }
        .prod-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 16px;
          font-size: 0.85rem;
          border-bottom: 1px solid #F1F5F9;
        }
        .prod-detail-row:last-child { border-bottom: none; }
        .prod-detail-label { color: #64748B; font-weight: 600; flex-shrink: 0; padding-top: 1px; }
        .prod-detail-val { color: #0F172A; font-weight: 700; text-align: right; }

        /* Related Items */
        .related-section {
          padding-top: 48px;
        }
        .related-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .related-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.3rem;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }
        .related-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }
        .reco-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          margin: 0 -24px;
          padding: 0 24px 16px;
        }
        .reco-scroll::-webkit-scrollbar { display: none; }
        .reco-item {
          width: 200px;
          flex-shrink: 0;
        }

        /* Mobile specific fixes */
        .mobile-only { display: none !important; }
        .mobile-sticky-bar { display: none; }

        @media (max-width: 900px) {
          .item-grid { grid-template-columns: 1fr; gap: 20px; }
          .item-page-wrap { padding: 12px 16px 110px; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }

          .gallery-box { max-width: 280px; padding: 8px; }
          .title-text { font-size: 1.5rem; }
          .price-current { font-size: 2rem; }
          .thumbs-row { justify-content: flex-start; }
          .size-btn { width: 72px; height: 72px; font-size: 0.7rem; }

          .mobile-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(12px);
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            border-top: 1px solid #E2E8F0;
            z-index: 960;
            gap: 10px;
          }
        }
      `}</style>

      {/* Mobile Topbar */}
      <div className="mobile-only" style={{ padding: "0 0 16px 0" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#0F172A", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="item-page-wrap">
        <div className="item-grid">
          {/* Left: Gallery + Product Details */}
          <div>
            <div className="gallery-box">
              <div className="zoom-icon"><Search size={18} /></div>
              <Image src={images[activeImageIndex]} alt={item.name} fill sizes="(max-width: 768px) 100vw, 600px" style={{ objectFit: "contain" }} priority onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
              {!item.available && !item.isLaunchingSoon && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(1, 53, 251, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px", color: "#fff", fontSize: "1.5rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center", zIndex: 10, backdropFilter: "blur(4px)" }}>
                  NOT AVAILABLE
                </div>
              )}
            </div>
            <div className="thumbs-row">
              {images.map((img, idx) => (
                <div key={idx} className={`thumb-box ${activeImageIndex === idx ? "active" : ""}`} onClick={() => setActiveImageIndex(idx)}>
                  <Image src={img} alt={`${item.name} thumb`} width={50} height={50} style={{ objectFit: "cover" }} onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                </div>
              ))}
            </div>

            {/* Product Details — left column desktop */}
            {item.details && item.details.length > 0 && (
              <div className="prod-details-box desktop-only">
                <div className="prod-details-header">Product Details</div>
                {item.details.map((d, i) => (
                  <div key={i} className="prod-detail-row">
                    <span className="prod-detail-label">{d.label}</span>
                    <span className="prod-detail-val">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            <div className="brand-text">ONN DA WAY</div>
            <h1 className="title-text">{item.name}</h1>

            <div className="reviews-text">
              <span>☆☆☆☆☆</span>
              <span>0 (0 reviews)</span>
            </div>

            <div className="desc-text">{item.description}</div>

            {/* Sizes */}
            {item.sizes && item.sizes.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div className="size-label">Select Size</div>
                <div className="size-buttons">
                  {item.sizes.map(size => {
                    const isActive = selectedSize?.name === size.name;
                    return (
                      <button
                        key={size.name}
                        onClick={() => setSelectedSize(size)}
                        className={`size-btn${isActive ? " active" : ""}`}
                      >
                        {/* Product image in size button */}
                        <div style={{
                          width: 40, height: 40,
                          borderRadius: 8,
                          overflow: "hidden",
                          position: "relative",
                          border: isActive ? "2px solid rgba(255,255,255,0.4)" : "2px solid #E2E8F0",
                          flexShrink: 0
                        }}>
                          <Image src={item.image} alt={size.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                        </div>
                        <span style={{ fontSize: "0.7rem", marginTop: 2 }}>{size.name}</span>
                        <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>₹{size.price}</span>
                      </button>
                    );
                  })}
                </div>
                {/* MRP line below sizes */}
                {hasDiscount && (
                  <div className="size-mrp-line">
                    <s>MRP ₹{item.originalPrice}</s>
                    <strong>₹{item.originalPrice! - item.price} OFF</strong>
                  </div>
                )}
              </div>
            )}

            <div className="price-box">
              <div className="price-row">
                <div className="price-current">₹{currentPrice}</div>
                {hasDiscount && (
                  <>
                    <div className="price-old">₹{item.originalPrice}</div>
                    <span className="discount-pill">{discountPct}% OFF</span>
                  </>
                )}
              </div>
              <div className="delivery-text">
                <div className="delivery-dot" /> Delivery in 10 mins
              </div>
            </div>

            <div className="qty-row desktop-only">
              <span className="qty-label">QUANTITY:</span>
              <div className="qty-control">
                {(cartItem && !item.isLaunchingSoon) ? (
                  <>
                    <button className="qty-btn" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={14} /></button>
                    <div className="qty-val">{cartItem.quantity}</div>
                    <button className="qty-btn" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={14} /></button>
                  </>
                ) : (
                  <>
                    <button className="qty-btn" disabled style={{ opacity: 0.3 }}><Minus size={14} /></button>
                    <div className="qty-val">0</div>
                    <button className="qty-btn" onClick={() => { addToCart(item, "", [], item.price); toast.success("Added!"); }} disabled={item.isLaunchingSoon} style={{ opacity: item.isLaunchingSoon ? 0.3 : 1 }}><Plus size={14} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="actions-row desktop-only">
              {cartItem ? (
                <button className="btn-add" onClick={() => router.push("/cart")} style={{ background: "#10B981" }}>
                  <ShoppingCart size={18} /> CHECKOUT
                </button>
              ) : !item.available ? (
                <button disabled className="btn-add" style={{ background: "#E2E8F0", color: "#94A3B8", cursor: "not-allowed" }}>
                  <ShoppingCart size={18} /> CURRENTLY UNAVAILABLE
                </button>
              ) : item.isLaunchingSoon ? (
                <button disabled className="btn-add" style={{ background: "#E2E8F0", color: "#94A3B8", cursor: "not-allowed" }}>
                  <ShoppingCart size={18} /> LAUNCHING SOON
                </button>
              ) : (
                <button className="btn-add" onClick={handleAddToCart}>
                  <ShoppingCart size={18} /> ADD TO CART
                </button>
              )}<button className={`btn-icon ${isWishlisted ? "active" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)}>
                <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
              </button>
              <button className="btn-icon">
                <Share2 size={20} />
              </button>
            </div>

            {/* Category + Brand */}
            <div className="meta-box">
              <div className="meta-row" style={{ marginBottom: 0 }}>
                <span className="meta-label">Category</span>
                <span className="meta-val">{item.category}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Brand</span>
                <span className="meta-val">ONN DA WAY</span>
              </div>
            </div>

            {/* Product Details — mobile only (on desktop shown in left col) */}
            {item.details && item.details.length > 0 && (
              <div className="prod-details-box mobile-only" style={{ display: undefined, marginTop: 12 }}>
                <div className="prod-details-header">Product Details</div>
                {item.details.map((d, i) => (
                  <div key={i} className="prod-detail-row">
                    <span className="prod-detail-label">{d.label}</span>
                    <span className="prod-detail-val">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
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
      <div className="mobile-sticky-bar">
        {cartItem ? (
          <>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E2E8F0", borderRadius: 8, overflow: "hidden", background: "white", height: 48, flexShrink: 0 }}>
              <button className="qty-btn" style={{ color: "#0F172A", width: 40 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={14} /></button>
              <div className="qty-val" style={{ fontSize: "1rem", color: "#0F172A", width: 32 }}>{cartItem.quantity}</div>
              <button className="qty-btn" style={{ color: "#0F172A", width: 40 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={14} /></button>
            </div>
            <button className="btn-add" onClick={() => router.push("/cart")} style={{ background: "#10B981", margin: 0, height: 48, flex: 1 }}>
              <ShoppingCart size={16} /> CHECKOUT
            </button>
          </>
        ) : (
          <button className="btn-add" onClick={handleAddToCart} disabled={!item.available || item.isLaunchingSoon} style={{ margin: 0, height: 48 }}>
            <ShoppingCart size={16} /> {item.isLaunchingSoon ? "LAUNCHING SOON" : (item.available ? "ADD TO CART" : "CURRENTLY UNAVAILABLE")}
          </button>
        )}
        <button className={`btn-icon ${isWishlisted ? "active" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)} style={{ height: 48, width: 48, flexShrink: 0 }}>
          <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} />
        </button>
      </div>

      <Footer />
    </div>
  );
}
