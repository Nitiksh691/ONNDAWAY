"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingCart, Star, X } from "lucide-react";
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
  const { user, cart, addToCart, updateQuantity } = useApp();
  const router = useRouter();
  const cartItem = cart.find(c => c.item.id === item.id);
  const [imgError, setImgError] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MenuItem[]>([]);

  // Fetch suggestions when modal opens
  if (open && suggestions.length === 0) {
    fetch("/api/menu")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sameCategory = data.filter(i => i.category === item.category && i.id !== item.id && i.available);
          setSuggestions(sameCategory.sort(() => 0.5 - Math.random()).slice(0, 2));
        }
      }).catch(console.error);
  }

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(item);
    toast.success(`${item.name} added to cart!`);
  };

  const bgColor = CATEGORY_COLORS[item.category] || "#E6F0FF";
  const textColor = CATEGORY_TEXT[item.category] || "#1E40AF";

  return (
    <>
      <div className="otw-card" onClick={() => setOpen(true)} style={{
        overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer",
      }}>
        {/* Image */}
        <div style={{
          height: compact ? 120 : 180, background: bgColor, position: "relative", overflow: "hidden", flexShrink: 0,
        }}>
          {!imgError ? (
            <Image
              src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 300px" style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
              onError={() => setImgError(true)}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", fontSize: compact ? "2rem" : "2.8rem", gap: "8px",
            }}>
              {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : item.category === "meals" ? "🍽️" : item.category === "drinks" ? "🥤" : "🍰"}
              <span style={{ fontSize: "0.7rem", color: textColor, fontWeight: 600 }}>{item.name.split(" ")[0]}</span>
            </div>
          )}
          <span style={{
            position: "absolute", top: 10, left: 10, background: "white", color: textColor,
            padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "capitalize",
          }}>{item.category}</span>
        </div>

        {/* Content */}
        <div style={{ padding: compact ? "14px" : "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px", background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: compact ? "1.1rem" : "1.2rem", color: "var(--text-dark)", lineHeight: 1.2 }}>{item.name}</h3>
            {item.originalPrice && item.originalPrice > item.price ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", fontFamily: "'Outfit', sans-serif" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through", fontWeight: 600 }}>₹{item.originalPrice}</span>
                <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--primary)" }}>₹{item.price}</span>
              </div>
            ) : (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "1.2rem", color: "var(--primary)", flexShrink: 0 }}>₹{item.price}</span>
            )}
          </div>

          {!compact && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, flex: 1 }}>{item.description}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{getPseudoRating(item.id)} · {item.orderCount}+</span>
            </div>

            {cartItem ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
                <button onClick={() => updateQuantity(item.id, cartItem.quantity - 1)} style={{
                  width: 30, height: 30, borderRadius: "8px", border: "1.5px solid var(--border)", background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--primary)", fontWeight: 700,
                }}><Minus size={14}/></button>
                <span style={{ fontWeight: 700, minWidth: "20px", textAlign: "center", color: "var(--primary)" }}>{cartItem.quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} style={{
                  width: 30, height: 30, borderRadius: "8px", border: "none", background: "var(--primary)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}><Plus size={14}/></button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="otw-btn otw-btn-primary otw-btn-sm"
                disabled={!item.available}
              >
                <ShoppingCart size={13}/>
                {item.available ? "Add" : "Sold Out"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
          <div className="otw-card animate-fade-up" style={{
            position: "relative", width: "100%", maxWidth: "420px", overflow: "hidden", zIndex: 1001, padding: 0, borderRadius: "20px", maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ height: "260px", background: bgColor, position: "relative" }}>
              {!imgError && <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: "contain", padding: "20px" }} />}
              <button onClick={() => setOpen(false)} style={{
                position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}><X size={20}/></button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.2 }}>{item.name}</h2>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "line-through", fontWeight: 600 }}>₹{item.originalPrice}</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--primary)" }}>₹{item.price}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--primary)", flexShrink: 0 }}>₹{item.price}</span>
                )}
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                {item.description}
              </p>
              
              <div style={{ display: "flex", gap: "0", background: "#F8FAFC", padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
                <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Category</div>
                  <div style={{ fontWeight: 800, textTransform: "capitalize", marginTop: "4px", color: "var(--text-dark)" }}>{item.category}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Prep Time</div>
                  <div style={{ fontWeight: 800, marginTop: "4px", color: "var(--text-dark)" }}>~10 mins</div>
                </div>
              </div>

              <button
                onClick={(e) => { handleAddToCart(e as any); setOpen(false); }}
                disabled={!item.available}
                style={{
                  width: "100%", padding: "16px", fontSize: "1.05rem", borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  background: item.available ? "#0135FB" : "#E2E8F0", 
                  color: item.available ? "white" : "#94A3B8",
                  border: "none", fontWeight: 800, cursor: item.available ? "pointer" : "not-allowed",
                  textTransform: "uppercase", letterSpacing: "1px"
                }}
              >
                <ShoppingCart size={18}/>
                {item.available ? "Add to Cart" : "Sold Out"}
              </button>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div style={{ marginTop: "32px" }}>
                  <h4 style={{ fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px", letterSpacing: "1px" }}>You might also like</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {suggestions.map(s => (
                      <div key={s.id} onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ cursor: "pointer", background: "white", border: "2px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ height: "100px", position: "relative", background: CATEGORY_COLORS[s.category] || "#F1F5F9" }}>
                          <Image src={s.image} alt={s.name} fill sizes="200px" style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ padding: "10px" }}>
                          <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                            <div style={{ fontWeight: 900, color: "var(--primary)", fontSize: "0.95rem" }}>₹{s.price}</div>
                            <button onClick={(e) => { e.stopPropagation(); addToCart(s); toast.success(`${s.name} added!`); }} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
