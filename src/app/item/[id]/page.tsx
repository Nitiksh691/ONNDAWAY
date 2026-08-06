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

  const { data: menu = [], isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const item = useMemo(() => menu.find(m => m.id === id), [menu, id]);
  const cartItem = useMemo(() => cart.find(c => c.item.id === item?.id), [cart, item]);
  const relatedItems = useMemo(() => {
    if (!item) return [];
    return menu.filter(m => m.category === item.category && m.id !== item.id).slice(0, 6);
  }, [menu, item]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, "", [], item.price);
    toast.success("Added to cart");
  };

  if (isLoading || !item) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#0F172A" }}>Loading...</div>
      </div>
    );
  }

  const hasDiscount = !!item.originalPrice && item.originalPrice > item.price;
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
          border-radius: 12px;
          padding: 8px;
          position: relative;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          overflow: hidden;
        }
        .gallery-box img {
          object-fit: contain;
          max-width: 100%;
          max-height: 100%;
        }
        .zoom-icon {
          position: absolute;
          top: 16px;
          right: 16px;
          color: #94A3B8;
        }
        .thumbs-row {
          display: flex;
          gap: 12px;
        }
        .thumb-box {
          width: 72px;
          height: 72px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 8px;
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
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .title-text {
          font-size: 2.2rem;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.1;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        }
        .reviews-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748B;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }
        .desc-text {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        /* Price Box */
        .price-box {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }
        .price-current {
          font-size: 2.2rem;
          font-weight: 800;
        }
        .price-old {
          font-size: 1rem;
          color: #94A3B8;
          text-decoration: line-through;
        }
        .discount-pill {
          background: #10B981;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
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
          margin-bottom: 24px;
        }
        .qty-label {
          color: #64748B;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .qty-control {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
        }
        .qty-btn {
          width: 40px; height: 36px;
          background: transparent;
          border: none;
          color: #0F172A;
          cursor: pointer;
          font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
        }
        .qty-btn:hover { background: #F8FAFC; }
        .qty-val {
          width: 32px;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 700;
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
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-add:hover { background: #002be0; }
        .btn-icon {
          width: 48px; height: 48px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover { border-color: #CBD5E1; color: #0F172A; }
        .btn-icon.active { color: #ef4444; border-color: #ef4444; background: #FEF2F2; }
        
        .btn-buy {
          width: 100%;
          padding: 14px;
          background: #ffffff;
          border: 2px solid #0135FB;
          border-radius: 8px;
          color: #0135FB;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }
        .btn-buy:hover { background: #0135FB; color: #fff; }

        /* Meta Table */
        .meta-box {
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 16px;
          background: #ffffff;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          padding: 4px 0;
        }
        .meta-label { color: #64748B; font-weight: 600; }
        .meta-val { color: #0F172A; font-weight: 800; text-transform: capitalize; }

        /* Related Items */
        .related-section {
          padding-top: 56px;
        }
        .related-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .related-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.02em;
        }
        .related-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }
        .reco-scroll {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scrollbar-width: none;
          margin: 0 -24px;
          padding: 0 24px 16px;
        }
        .reco-scroll::-webkit-scrollbar { display: none; }
        .reco-item {
          width: 220px;
          flex-shrink: 0;
        }

        /* Mobile specific fixes */
        .mobile-only { display: none !important; }
        .mobile-sticky-bar { display: none; }

        @media (max-width: 900px) {
          .item-grid { grid-template-columns: 1fr; gap: 24px; }
          .item-page-wrap { padding: 16px 20px 100px; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          
          .title-text { font-size: 1.8rem; }
          .gallery-box { padding: 8px; aspect-ratio: 1/1; }
          .thumbs-row { justify-content: flex-start; }
          
          .mobile-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
            border-top: 1px solid #E2E8F0;
            z-index: 960;
            gap: 12px;
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
          {/* Left: Gallery */}
          <div>
            <div className="gallery-box">
              <div className="zoom-icon"><Search size={18} /></div>
              <Image src={images[activeImageIndex]} alt={item.name} fill style={{ objectFit: "contain" }} priority onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
            </div>
            <div className="thumbs-row">
              {images.map((img, idx) => (
                <div key={idx} className={`thumb-box ${activeImageIndex === idx ? "active" : ""}`} onClick={() => setActiveImageIndex(idx)}>
                  <Image src={img} alt={`${item.name} thumb`} width={50} height={50} style={{ objectFit: "cover" }} onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <div className="brand-text">ONN DA WAY</div>
            <h1 className="title-text">{item.name}</h1>
            
            <div className="reviews-text">
              <span>☆☆☆☆☆</span>
              <span>0 (0 reviews)</span>
            </div>

            <div className="desc-text">
              {item.description || "Fresh and delicious. Order now for quick delivery."}
            </div>

            <div className="price-box">
              <div className="price-row">
                <span className="price-current">₹{item.price}</span>
                {hasDiscount && <span className="price-old">₹{item.originalPrice}</span>}
                {hasDiscount && <span className="discount-pill">{discountPct}% OFF</span>}
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
              ) : (
                <button className="btn-add" onClick={handleAddToCart} disabled={!item.available || item.isLaunchingSoon}>
                  <ShoppingCart size={18} /> {item.isLaunchingSoon ? "LAUNCHING SOON" : (item.available ? "ADD TO CART" : "AVAILABLE SOON")}
                </button>
              )}
              <button className={`btn-icon ${isWishlisted ? "active" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)}>
                <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
              </button>
              <button className="btn-icon">
                <Share2 size={20} />
              </button>
            </div>

            <button className="btn-buy desktop-only">
              BUY NOW
            </button>

            <div className="meta-box">
              <div className="meta-row" style={{ marginBottom: 8 }}>
                <span className="meta-label">Category</span>
                <span className="meta-val">{item.category}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Brand</span>
                <span className="meta-val">ONN DA WAY</span>
              </div>
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
      <div className="mobile-sticky-bar">
        {cartItem ? (
          <>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E2E8F0", borderRadius: 8, overflow: "hidden", background: "white", height: 48 }}>
              <button className="qty-btn" style={{ color: "#0F172A", width: 40 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={14} /></button>
              <div className="qty-val" style={{ fontSize: "1rem", color: "#0F172A", width: 32 }}>{cartItem.quantity}</div>
              <button className="qty-btn" style={{ color: "#0F172A", width: 40 }} onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={14} /></button>
            </div>
            <button className="btn-add" onClick={() => router.push("/cart")} style={{ background: "#10B981", margin: 0, height: 48 }}>
              <ShoppingCart size={16} /> CHECKOUT
            </button>
          </>
        ) : (
          <button className="btn-add" onClick={handleAddToCart} disabled={!item.available || item.isLaunchingSoon} style={{ margin: 0, height: 48 }}>
            <ShoppingCart size={16} /> {item.isLaunchingSoon ? "LAUNCHING SOON" : (item.available ? "ADD TO CART" : "AVAILABLE SOON")}
          </button>
        )}
        <button className={`btn-icon ${isWishlisted ? "active" : ""}`} onClick={() => toggleWishlist && toggleWishlist(item.id)} style={{ height: 48, width: 48 }}>
          <Heart size={18} fill={isWishlisted ? "#ef4444" : "none"} />
        </button>
      </div>

      <Footer />
    </div>
  );
}
