"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";
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
  onUpdateQuantity
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
          transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
          overflow: "hidden",
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(1,53,251,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "#0135FB"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#e2e8f0"; }}
      >
        {/* Image */}
        <div style={{ position: "relative", width: 100, height: 100, borderRadius: 12, overflow: "hidden", background: bg, flexShrink: 0 }}>
          {!imgError ? (
            <Image src={item.image} alt={item.name} fill sizes="90px" style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
              {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
            </div>
          )}
          {item.isPopular && (
            <span style={{ position: "absolute", bottom: 4, left: 4, background: "#F59E0B", color: "#fff", fontSize: "0.55rem", fontWeight: 800, padding: "2px 5px", borderRadius: 4, textTransform: "uppercase" }}>
              Best
            </span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.62rem", color: "#0135FB", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
            {item.category}
          </div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any, marginBottom: 2 }}>
            {item.name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>ONN DA WAY</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#F59E0B", fontSize: "0.65rem" }}>★</span>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>{getPseudoRating(item.id)}</span>
          </div>
        </div>

        {/* Price + Add */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            {item.originalPrice && item.originalPrice > item.price && (
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1 }}>₹{item.originalPrice}</div>
            )}
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a", lineHeight: 1 }}>₹{item.price}</div>
          </div>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #0135FB", background: "#fff", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800 }}
              ><Minus size={12} /></button>
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", minWidth: 16, textAlign: "center" }}>{cartItem.quantity}</span>
              <button
                onClick={e => { e.stopPropagation(); if (onAdd) onAdd(item); }}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#0135FB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(1,53,251,0.3)" }}
              ><Plus size={12} /></button>
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

  /* ── VERTICAL (Grid) card — Swiggy/Zomato style ── */
  return (
    <div
      onClick={go}
      style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #f0f2f5",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        overflow: "hidden", cursor: "pointer",
        transition: "box-shadow 0.18s, transform 0.18s",
        display: "flex", flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(1,53,251,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = ""; }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 170, background: bg, overflow: "hidden" }}>
        {!imgError ? (
          <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 250px" style={{ objectFit: "cover", transition: "transform 0.4s" }} onError={() => setImgError(true)}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = ""}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
            {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%)", pointerEvents: "none" }} />
        {/* Category badge */}
        <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.95)", color: "#0135FB", fontSize: "0.6rem", fontWeight: 800, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.05em", backdropFilter: "blur(4px)" }}>
          {item.category}
        </span>
        {item.isPopular && (
          <span style={{ position: "absolute", top: 8, right: 8, background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 6, textTransform: "uppercase" }}>
            ⭐ Best
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "#0f172a", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
          {item.name}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>ONN DA WAY</div>

        {item.description && !compact && (
          <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.35, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
            {item.description}
          </p>
        )}

        {/* Price + Add */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
          <div>
            {item.originalPrice && item.originalPrice > item.price && (
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1 }}>₹{item.originalPrice}</div>
            )}
            <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a" }}>₹{item.price}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
              <span style={{ color: "#F59E0B", fontSize: "0.65rem" }}>★</span>
              <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>{getPseudoRating(item.id)}</span>
            </div>
          </div>

          {cartItem ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #0135FB", background: "#fff", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Minus size={12} /></button>
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", minWidth: 14, textAlign: "center" }}>{cartItem.quantity}</span>
              <button onClick={e => { e.stopPropagation(); if (onAdd) onAdd(item); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#0135FB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(1,53,251,0.3)" }}><Plus size={12} /></button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!item.available}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: item.available ? "#0135FB" : "#e2e8f0", color: item.available ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: item.available ? "pointer" : "not-allowed", boxShadow: item.available ? "0 4px 12px rgba(1,53,251,0.35)" : "none", transition: "transform 0.15s" }}
              onMouseEnter={e => item.available && (e.currentTarget.style.transform = "scale(1.12)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "")}
            ><Plus size={15} /></button>
          )}
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
