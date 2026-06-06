"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingCart, Star } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CATEGORY_COLORS: Record<string, string> = {
  coffee: "#E6F0FF", snacks: "#FEF3C7", meals: "#D1FAE5", drinks: "#E0F2FE", desserts: "#FCE7F3",
};
const CATEGORY_TEXT: Record<string, string> = {
  coffee: "#1E40AF", snacks: "#92400E", meals: "#065F46", drinks: "#0369A1", desserts: "#9D174D",
};

/**
 * Generates a deterministic pseudo-rating between 4.0–4.9 from a string.
 * Works with any ID format (MongoDB ObjectId hex, numeric, etc.).
 * Pure function — same ID always produces the same rating.
 */
function getPseudoRating(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0; // unsigned 32-bit int
  }
  return (4.0 + (hash % 10) / 10).toFixed(1);
}

interface FoodCardProps {
  item: MenuItem;
  compact?: boolean;
}

export default function FoodCard({ item, compact = false }: FoodCardProps) {
  const { cart, addToCart, updateQuantity } = useApp();
  const router = useRouter();
  const cartItem = cart.find(c => c.item.id === item.id);
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(item, "");
    toast.success(`${item.name} added!`, { duration: 1500 });
  };

  const navigateToProduct = () => {
    router.push(`/item/${item.id}`);
  };

  const bgColor = CATEGORY_COLORS[item.category] || "#E6F0FF";
  const textColor = CATEGORY_TEXT[item.category] || "#1E40AF";

  // Image heights: compact = 100px, normal = 140px (reduced from 120/180)
  const imgHeight = compact ? 100 : 140;

  return (
    <div className={`otw-card${compact ? " otw-card-compact" : ""}`} onClick={navigateToProduct} style={{
      overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      height: compact ? "100%" : undefined,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Image */}
      <div style={{
        height: imgHeight, background: bgColor, position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        {!imgError ? (
          <Image
            src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 300px"
            style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
            onError={() => setImgError(true)}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", fontSize: compact ? "1.8rem" : "2.4rem", gap: "6px",
          }}>
            {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : item.category === "meals" ? "🍽️" : item.category === "drinks" ? "🥤" : "🍰"}
            <span style={{ fontSize: "0.65rem", color: textColor, fontWeight: 600 }}>{item.name.split(" ")[0]}</span>
          </div>
        )}
        <span style={{
          position: "absolute", top: 8, left: 8, background: "white", color: textColor,
          padding: "2px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 700, textTransform: "capitalize",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>{item.category}</span>

        {item.isPopular && (
          <span style={{
            position: "absolute", top: 8, right: 8, background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white",
            padding: "2px 8px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
          }}>⭐ Best</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: compact ? "10px 12px" : "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: "6px", background: "white", minHeight: compact ? 118 : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px", minHeight: compact ? 40 : undefined }}>
          <h3 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: compact ? "0.88rem" : "1rem",
            color: "var(--text-dark)", lineHeight: 1.2,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
          }}>{item.name}</h3>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontFamily: "'Outfit', sans-serif", flexShrink: 0, minHeight: compact ? 36 : undefined, justifyContent: "flex-start" }}>
            {item.originalPrice && item.originalPrice > item.price ? (
              <>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "line-through", fontWeight: 600, lineHeight: 1.2 }}>₹{item.originalPrice}</span>
                <span style={{ fontWeight: 900, fontSize: compact ? "0.95rem" : "1rem", color: "var(--primary)", lineHeight: 1.2 }}>₹{item.price}</span>
              </>
            ) : (
              <span style={{ fontWeight: 900, fontSize: compact ? "0.95rem" : "1rem", color: "var(--primary)", lineHeight: 1.2 }}>₹{item.price}</span>
            )}
          </div>
        </div>

        {!compact && item.description && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4, flex: 1,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
          }}>{item.description}</p>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "4px", minHeight: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{getPseudoRating(item.id)} · {item.orderCount}+</span>
          </div>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => updateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)} style={{
                width: 28, height: 28, borderRadius: "7px", border: "1.5px solid var(--border)", background: "white",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--primary)", fontWeight: 700,
              }}><Minus size={12} /></button>
              <span style={{ fontWeight: 800, minWidth: "18px", textAlign: "center", color: "var(--text-dark)", fontSize: "0.9rem" }}>{cartItem.quantity}</span>
              <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} style={{
                width: 28, height: 28, borderRadius: "7px", border: "none", background: "linear-gradient(135deg, #0135FB, #0028D4)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(1,53,251,0.2)",
              }}><Plus size={12} /></button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!item.available}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 10px", borderRadius: "7px", border: "none",
                background: item.available ? "linear-gradient(135deg, #0135FB, #0028D4)" : "#E5E7EB",
                color: item.available ? "white" : "#9CA3AF",
                fontWeight: 800, fontSize: "0.75rem", cursor: item.available ? "pointer" : "not-allowed",
                boxShadow: item.available ? "0 3px 10px rgba(1,53,251,0.2)" : "none",
                fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.3px",
                transition: "all 0.15s",
              }}
            >
              <ShoppingCart size={11} />
              {item.available ? "Add" : "Sold Out"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
