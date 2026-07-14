"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { MenuItem, SelectedCustomization } from "@/lib/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CATEGORY_BG: Record<string, string> = {
  coffee: "#E6F0FF", snacks: "#FEF3C7", meals: "#D1FAE5", drinks: "#E0F2FE", desserts: "#FCE7F3",
};

function getPseudoRating(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (4.0 + (hash % 10) / 10).toFixed(1);
}

interface FoodCardProps {
  item: MenuItem;
  compact?: boolean;
  layout?: "vertical" | "horizontal";
  cartItem?: any;
  onAdd?: (item: MenuItem, specialInstructions?: string, selectedCustomizations?: SelectedCustomization[], unitPrice?: number) => void;
  onUpdateQuantity?: (cartItemId: string, qty: number) => void;
}

const FoodCard = ({
  item,
  compact = false,
  layout = "horizontal",
  cartItem,
  onAdd,
  onUpdateQuantity,
}: FoodCardProps) => {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const isHorizontal = layout === "horizontal";
  const bg = CATEGORY_BG[item.category] || "#E6F0FF";

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdd) onAdd(item);
    toast.success(`${item.name} added!`, { duration: 1200 });
  };

  const go = () => router.push(`/item/${item.id}`);

  /* ── HORIZONTAL (List) card ── */
  if (isHorizontal) {
    return (
      <div
        onClick={go}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fff", borderRadius: 16,
          border: "1px solid #e2e8f0",
          borderLeft: "4px solid #0135FB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: "10px 14px 10px 10px",
          cursor: "pointer",
          transition: "box-shadow 0.2s, transform 0.2s",
          overflow: "hidden",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(1,53,251,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = ""; }}
      >
        {/* Image — square */}
        <div style={{ position: "relative", width: 90, height: 90, borderRadius: 12, overflow: "hidden", background: bg, flexShrink: 0 }}>
          {!imgError ? (
            <Image src={item.image} alt={item.name} fill sizes="90px" style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
              {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
            </div>
          )}
          {item.isPopular && (
            <span style={{ position: "absolute", bottom: 4, left: 4, background: "#F59E0B", color: "#fff", fontSize: "0.52rem", fontWeight: 800, padding: "2px 5px", borderRadius: 4, textTransform: "uppercase" }}>
              Best
            </span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.6rem", color: "#0135FB", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
            {item.category}
          </div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any, marginBottom: 2 }}>
            {item.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>ONN DA WAY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ color: "#F59E0B", fontSize: "0.62rem" }}>★</span>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>{getPseudoRating(item.id)}</span>
          </div>
        </div>

        {/* Price + Add */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            {item.originalPrice && item.originalPrice > item.price && (
              <div style={{ fontSize: "0.66rem", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1 }}>₹{item.originalPrice}</div>
            )}
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a", lineHeight: 1 }}>₹{item.price}</div>
          </div>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}
                style={{ width: 27, height: 27, borderRadius: "50%", border: "1.5px solid #0135FB", background: "#fff", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800 }}
              ><Minus size={11} /></button>
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", minWidth: 16, textAlign: "center" }}>{cartItem.quantity}</span>
              <button
                onClick={e => { e.stopPropagation(); if (onAdd) onAdd(item); }}
                style={{ width: 27, height: 27, borderRadius: "50%", border: "none", background: "#0135FB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(1,53,251,0.3)" }}
              ><Plus size={11} /></button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!item.available}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: item.available ? "#0135FB" : "#e2e8f0", color: item.available ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: item.available ? "pointer" : "not-allowed", boxShadow: item.available ? "0 3px 10px rgba(1,53,251,0.3)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
              onMouseEnter={e => item.available && (e.currentTarget.style.transform = "scale(1.12)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "")}
            ><Plus size={14} /></button>
          )}
        </div>
      </div>
    );
  }

  /* ── VERTICAL (Grid) card — Square format, big image ── */
  return (
    <div
      onClick={go}
      style={{
        background: "#fff",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
        position: "relative"
      }}
    >
      {/* Image Area */}
      <div style={{
        position: "relative",
        aspectRatio: "4 / 5",
        background: bg,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
        marginBottom: 8
      }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden" }}>
          {!imgError ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 45vw, 250px"
              style={{ objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
              {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
            </div>
          )}
        </div>

        {/* Bestseller Tag */}
        {item.isPopular && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: "linear-gradient(90deg, #F59E0B, #FCD34D)",
            color: "#fff",
            fontSize: "0.55rem",
            fontWeight: 800,
            padding: "4px 6px",
            borderRadius: "12px 0 8px 0",
            textTransform: "uppercase"
          }}>
            Bestseller
          </div>
        )}

        {/* ADD Button (Floating) */}
        <div style={{
          position: "absolute",
          bottom: -10,
          right: 8,
          zIndex: 10
        }} onClick={e => e.stopPropagation()}>
          {cartItem ? (
            <div style={{
              display: "flex", alignItems: "center",
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 8,
              height: 32,
              padding: "0 4px",
              boxShadow: "0 2px 6px rgba(1,53,251,0.3)"
            }}>
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}
                style={{ width: 26, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "none", border: "none", cursor: "pointer" }}
              ><Minus size={14}/></button>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", minWidth: 20, textAlign: "center" }}>{cartItem.quantity}</span>
              <button
                onClick={e => { e.stopPropagation(); if (onAdd) onAdd(item); }}
                style={{ width: 26, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "none", border: "none", cursor: "pointer" }}
              ><Plus size={14}/></button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!item.available}
              style={{
                background: "#fff",
                color: item.available ? "var(--primary)" : "#94A3B8",
                border: `1px solid ${item.available ? "var(--primary)" : "#E2E8F0"}`,
                borderRadius: 8,
                height: 32,
                padding: "0 18px",
                fontWeight: 900,
                fontSize: "0.85rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                cursor: item.available ? "pointer" : "not-allowed"
              }}
            >
              ADD
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 4px 4px 4px" }}>
        
        {/* Price Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{
            background: "var(--primary)",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 6
          }}>
            ₹{item.price}
          </div>
          {item.originalPrice && item.originalPrice > item.price && (
            <div style={{
              color: "#94A3B8",
              fontSize: "0.75rem",
              textDecoration: "line-through",
              fontWeight: 600
            }}>
              ₹{item.originalPrice}
            </div>
          )}
        </div>

        {/* Discount Text */}
        {item.originalPrice && item.originalPrice > item.price && (
          <div style={{ color: "var(--primary)", fontSize: "0.65rem", fontWeight: 800, marginBottom: 6 }}>
            ₹{item.originalPrice - item.price} OFF
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: "0.85rem",
          fontWeight: 700,
          color: "#0F172A",
          lineHeight: 1.3,
          marginBottom: 4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginTop: (!item.originalPrice || item.originalPrice <= item.price) ? "4px" : "0px"
        }}>
          {item.name}
        </div>

        {/* Portion / Info */}
        <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: 6 }}>
          1 portion
        </div>

        {/* Category Pill */}
        {item.section && (
          <div style={{ marginBottom: 8, display: "flex", overflow: "hidden" }}>
            <span style={{
              background: "rgba(1, 53, 251, 0.08)",
              color: "var(--primary)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%"
            }}>
              {item.section}
            </span>
          </div>
        )}

        {/* Rating */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#64748B" }}>
          <span style={{ color: "var(--primary)" }}>★</span> {getPseudoRating(item.id)} ({(4 + parseInt(item.id.slice(-2), 16) % 96)}k)
        </div>
      </div>
    </div>
  );
};

export default React.memo(FoodCard, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.compact === next.compact &&
    prev.layout === next.layout &&
    prev.cartItem?.quantity === next.cartItem?.quantity
  );
});
