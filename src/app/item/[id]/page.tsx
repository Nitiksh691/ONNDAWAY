"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, ShoppingCart, Heart, Share2, Package, Minus, Plus
} from "lucide-react";
import { useApp } from "@/lib/context";
import { MenuItem, SelectedCustomization } from "@/lib/types";
import toast from "react-hot-toast";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

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

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={16}
          fill={i <= Math.round(rating) ? "#0135FB" : "none"}
          color={i <= Math.round(rating) ? "#0135FB" : "#CBD5E1"}
        />
      ))}
    </span>
  );
}

export default function ItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cart, addToCart, updateQuantity, wishlist, toggleWishlist } = useApp();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: menu = [], isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const item = useMemo(() => menu.find(m => m.id === id), [menu, id]);
  const cartItem = useMemo(() => cart.find(c => c.item.id === item?.id), [cart, item]);
  const relatedItems = useMemo(() => {
    if (!item) return [];
    return menu.filter(m => m.category === item.category && m.id !== item.id).slice(0, 4);
  }, [menu, item]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, "", [], item.price);
    toast.success("Added to cart");
  };

  if (isLoading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }
  if (!item) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Item not found</div>;
  }

  const rating = getPseudoRating(item.id);
  const reviews = getPseudoReviews(item.id);
  const hasDiscount = !!item.originalPrice && item.originalPrice > item.price;
  const discountPct = hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
  
  const isWishlisted = wishlist?.includes(item.id);

  // Mock array for thumbnails if we want to show multiple
  const images = [item.image, item.image];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <style>{`
        .item-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        /* Top Header */
        .item-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
        }
        .item-page-title-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          color: var(--text-dark);
          text-transform: uppercase;
        }
        .item-page-title-icon {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-text {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        
        /* Main Layout */
        .item-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        /* Left: Images */
        .img-main-box {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          aspect-ratio: 4/3;
          position: relative;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .img-thumbnails {
          display: flex;
          gap: 12px;
        }
        .img-thumb {
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 8px;
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .img-thumb.active {
          border-color: var(--primary);
        }

        /* Right: Info */
        .info-col {
          display: flex;
          flex-direction: column;
        }
        .info-brand {
          color: var(--primary);
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .info-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.1;
          color: var(--text-dark);
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .info-rating {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .rating-text {
          font-weight: 800;
          color: var(--text-dark);
        }
        .reviews-text {
          color: var(--text-muted);
        }
        .info-desc {
          font-size: 1.05rem;
          color: var(--text-mid);
          margin-bottom: 24px;
        }

        /* Price Box */
        .price-box {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
        }
        .price-current {
          font-size: 3rem;
          font-weight: 900;
          color: var(--text-dark);
          line-height: 1;
        }
        .price-old {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-muted);
          text-decoration: line-through;
        }
        .discount-pill {
          background: #10B981;
          color: white;
          font-size: 0.8rem;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .delivery-eta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #10B981;
          font-weight: 800;
          font-size: 0.9rem;
        }
        .delivery-eta-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
        }

        /* Controls */
        .controls-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .qty-label {
          font-weight: 900;
          color: var(--text-dark);
          font-size: 0.9rem;
          text-transform: uppercase;
        }
        .qty-box {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          overflow: hidden;
        }
        .qty-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-dark);
          cursor: pointer;
        }
        .qty-btn:hover { background: #f1f5f9; }
        .qty-val {
          width: 40px;
          text-align: center;
          font-weight: 900;
          font-size: 1.1rem;
          color: var(--text-dark);
        }

        /* Buttons */
        .actions-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .btn-atc {
          flex: 1;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .btn-atc:hover { background: var(--primary-dark); }
        
        .btn-icon {
          width: 54px;
          height: 54px;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dark);
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-icon:hover { background: #f1f5f9; }
        .btn-icon.active { color: #ef4444; border-color: #ef4444; }

        .btn-buy {
          width: 100%;
          background: white;
          color: var(--primary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          font-size: 1rem;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
          transition: background 0.2s;
          margin-bottom: 24px;
        }
        .btn-buy:hover { background: #f1f5f9; }

        /* Meta Box */
        .meta-box {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .meta-row:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }
        .meta-label {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .meta-value {
          color: var(--text-dark);
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
        }

        /* Tabs Section */
        .tabs-container {
          display: flex;
          border-bottom: 1px solid var(--border-light);
          margin-bottom: 24px;
        }
        .tab {
          flex: 1;
          text-align: center;
          padding: 16px;
          font-weight: 900;
          font-size: 0.95rem;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
          background: transparent;
        }
        .tab.active {
          background: var(--primary);
          color: white;
          border-radius: 8px 8px 0 0;
        }
        .tab-content {
          padding: 24px;
          background: white;
          border: 1px solid var(--border-light);
          border-top: none;
          border-radius: 0 0 8px 8px;
          color: var(--text-mid);
          font-size: 1rem;
          min-height: 150px;
        }

        /* Related */
        .related-section {
          margin-top: 48px;
        }
        .related-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-dark);
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        
        .reco-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          margin: 0 -24px;
          padding: 0 24px 16px 24px;
        }
        .reco-scroll::-webkit-scrollbar { display: none; }
        .reco-item {
          width: 200px;
          flex-shrink: 0;
        }

        /* Mobile specific fixes */
        .mobile-sticky-bar {
          display: none;
        }
        .mobile-only {
          display: none !important;
        }

        @media (max-width: 900px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .item-grid { grid-template-columns: 1fr; gap: 24px; }
          .item-page-header { display: none; }
          .img-main-box { border-radius: 0; border-left: none; border-right: none; }
          .info-title { font-size: 2rem; }
          .mobile-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0; right: 0;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            padding: 12px 16px;
            padding-bottom: max(16px, env(safe-area-inset-bottom));
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            z-index: 960;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
            gap: 12px;
          }
        }
      `}</style>

      <div className="item-container">
        {/* Header (Desktop) */}
        <div className="item-page-header">
          <div className="item-page-title-badge">
            <div className="item-page-title-icon"><Package size={18} /></div>
            {item.name}
          </div>
          <div className="brand-text">ONN DA WAY</div>
        </div>

        {/* Main Grid */}
        <div className="item-grid">
          {/* Left: Gallery */}
          <div className="gallery-col">
            <button className="mobile-only" onClick={() => router.back()} style={{ marginBottom: 16, background: "transparent", border: "none", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--text-mid)" }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div className="img-main-box">
              <Image src={images[activeImageIndex]} alt={item.name} fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: "cover" }} />
            </div>
            <div className="img-thumbnails">
              {images.map((img, idx) => (
                <div key={idx} className={`img-thumb ${activeImageIndex === idx ? "active" : ""}`} onClick={() => setActiveImageIndex(idx)}>
                  <Image src={img} alt={`${item.name} thumb`} fill sizes="80px" style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="info-col">
            <div className="info-brand">ONN DA WAY</div>
            <h1 className="info-title">{item.name}</h1>
            
            <div className="info-rating">
              <Stars rating={rating} />
              <span className="rating-text">{rating}</span>
              <span className="reviews-text">({reviews} reviews)</span>
            </div>
            
            <div className="info-desc">
              {item.description || "Refreshing and delicious."}
            </div>
            
            <div className="price-box">
              <div className="price-row">
                <span className="price-current">₹{item.price}</span>
                {hasDiscount && <span className="price-old">₹{item.originalPrice}</span>}
                {hasDiscount && <span className="discount-pill">{discountPct}% OFF</span>}
              </div>
              <div className="delivery-eta">
                <div className="delivery-eta-dot" /> Delivery in 10 mins
              </div>
            </div>

            <div className="controls-row">
              <div className="qty-label">Quantity:</div>
              <div className="qty-box">
                {cartItem ? (
                  <>
                    <button className="qty-btn" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}><Minus size={16} /></button>
                    <div className="qty-val">{cartItem.quantity}</div>
                    <button className="qty-btn" onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity + 1)}><Plus size={16} /></button>
                  </>
                ) : (
                  <>
                    <button className="qty-btn" disabled style={{ opacity: 0.3 }}><Minus size={16} /></button>
                    <div className="qty-val">0</div>
                    <button className="qty-btn" onClick={() => { addToCart(item, "", [], item.price); toast.success("Added to cart"); }}><Plus size={16} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="actions-row desktop-only" style={{ display: 'flex' }}>
              {cartItem ? (
                <button className="btn-atc" onClick={() => router.push("/cart")} style={{ background: "#10B981" }}>
                  <ShoppingCart size={18} /> CHECKOUT
                </button>
              ) : (
                <button className="btn-atc" onClick={handleAddToCart} disabled={!item.available}>
                  <ShoppingCart size={18} /> {item.available ? "ADD TO CART" : "SOLD OUT"}
                </button>
              )}
              <button className="btn-icon" onClick={() => toggleWishlist && toggleWishlist(item.id)}>
                <Heart size={20} className={isWishlisted ? "active" : ""} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "currentColor"} />
              </button>
              <button className="btn-icon">
                <Share2 size={20} />
              </button>
            </div>
            
            <button className="btn-buy desktop-only" style={{ display: 'block' }}>
              BUY NOW
            </button>

            <div className="meta-box">
              <div className="meta-row">
                <span className="meta-label">Category</span>
                <span className="meta-value">{item.category}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Brand</span>
                <span className="meta-value">ONN DA WAY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <div className="tabs-container">
            <div className={`tab ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>DESCRIPTION</div>
            <div className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>DETAILS</div>
            <div className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>REVIEWS ({reviews})</div>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && (
              <p>{item.description || "Enjoy the authentic taste of ONN DA WAY."}</p>
            )}
            {activeTab === 'details' && (
              <p>Freshly prepared on campus. Best consumed immediately.</p>
            )}
            {activeTab === 'reviews' && (
              <p>Customers love this item! Rating: {rating}/5</p>
            )}
          </div>
        </div>

        {/* Related */}
        {relatedItems.length > 0 && (
          <div className="related-section">
            <h2 className="related-title">YOU MAY ALSO LIKE</h2>
            <div className="reco-scroll">
              {relatedItems.map(r => (
                <div key={r.id} className="reco-item">
                  <FoodCard item={r} />
                </div>
              ))}
              <div style={{ width: 1, flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="mobile-sticky-bar">
        {cartItem ? (
          <button className="btn-atc" onClick={() => router.push("/cart")} style={{ background: "#10B981", padding: "12px", fontSize: "0.9rem" }}>
            <ShoppingCart size={16} /> CHECKOUT
          </button>
        ) : (
          <button className="btn-atc" onClick={handleAddToCart} disabled={!item.available} style={{ padding: "12px", fontSize: "0.9rem" }}>
            <ShoppingCart size={16} /> ADD
          </button>
        )}
        <button className="btn-icon" onClick={() => toggleWishlist && toggleWishlist(item.id)} style={{ width: 44, height: 44 }}>
          <Heart size={18} className={isWishlisted ? "active" : ""} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "currentColor"} />
        </button>
      </div>

      <Footer />
    </div>
  );
}
