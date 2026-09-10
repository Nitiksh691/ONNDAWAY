"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Plus, Minus, X } from "lucide-react";
import { MenuItem, SelectedCustomization } from "@/lib/types";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CATEGORY_BG: Record<string, string> = {
  coffee: "#E6F0FF", snacks: "#FEF3C7", meals: "#D1FAE5", drinks: "#E0F2FE", desserts: "#FCE7F3",
};

interface FoodCardProps {
  item: MenuItem;
  compact?: boolean;
  layout?: "vertical" | "horizontal";
  cartItem?: any;
  onAdd?: (item: MenuItem, specialInstructions?: string, selectedCustomizations?: SelectedCustomization[], unitPrice?: number) => void;
  onUpdateQuantity?: (cartItemId: string, qty: number) => void;
}

/* ── Size Picker Bottom Sheet / Modal ── */
function SizePicker({ item, onClose, onAdd }: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (item: MenuItem, si?: string, sc?: SelectedCustomization[], price?: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<{ name: string; price: number }>({
    name: "Regular",
    price: item.price,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = [
    {
      name: "Regular",
      label: "Regular Size",
      price: item.price,
      desc: "Standard cup serving",
      icon: "☕",
      badge: null,
    },
    {
      name: "Tall",
      label: "Tall / Large",
      price: item.price + 20,
      desc: "Extra volume · +₹20",
      icon: "🥤",
      badge: "+₹20 EXTRA",
    },
  ];

  const handleConfirm = () => {
    onAdd(item, "", [{ category: "Size", option: selected.name, price: selected.price }], selected.price);
    toast.success(`Added ${item.name} (${selected.name}) to cart!`, { duration: 1600 });
    onClose();
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)",
          zIndex: 999999, backdropFilter: "blur(6px)",
          animation: "size-fade-in 0.2s ease-out both"
        }}
      />
      {/* Container - Bottom sheet on mobile, centered modal on desktop */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 1000000,
        background: "#FFFFFF",
        borderRadius: "24px 24px 0 0",
        padding: "20px 24px calc(24px + env(safe-area-inset-bottom)) 24px",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.2)",
        animation: "size-sheet-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        maxWidth: "480px",
        margin: "0 auto",
      }}>
        <style>{`
          @keyframes size-fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes size-sheet-up {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          @media (min-width: 640px) {
            div[style*="size-sheet-up"] {
              bottom: auto !important;
              top: 50% !important;
              left: 50% !important;
              right: auto !important;
              transform: translate(-50%, -50%) !important;
              border-radius: 24px !important;
              animation: size-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both !important;
              width: 90% !important;
            }
          }
          @keyframes size-pop-in {
            from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: "#CBD5E1", borderRadius: 99, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {item.image ? (
              <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", position: "relative", flexShrink: 0, border: "1px solid #E2E8F0" }}>
                <Image src={item.image} alt={item.name} fill sizes="44px" style={{ objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>☕</div>
            )}
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "#0F172A", lineHeight: 1.2 }}>{item.name}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600, marginTop: 2 }}>Select cup serving size</div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
            <X size={16} />
          </button>
        </div>

        {/* Cup Options Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {sizes.map(s => {
            const isSelected = selected.name === s.name;
            return (
              <div
                key={s.name}
                onClick={() => setSelected({ name: s.name, price: s.price })}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "16px 12px 14px",
                  borderRadius: 18,
                  border: `2px solid ${isSelected ? "#0135FB" : "#E2E8F0"}`,
                  background: isSelected ? "#F0F4FF" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.18s ease-in-out",
                  boxShadow: isSelected ? "0 4px 16px rgba(1, 53, 251, 0.15)" : "0 2px 6px rgba(0,0,0,0.02)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                }}
              >
                {s.badge && (
                  <span style={{
                    position: "absolute", top: -10, right: 10,
                    background: "#0135FB", color: "#FFFFFF",
                    fontSize: "0.62rem", fontWeight: 900,
                    padding: "2px 8px", borderRadius: 99,
                    letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(1,53,251,0.3)"
                  }}>
                    {s.badge}
                  </span>
                )}

                <div style={{
                  fontSize: s.name === "Tall" ? "2.4rem" : "1.9rem",
                  lineHeight: 1, marginBottom: 8,
                  filter: isSelected ? "drop-shadow(0 4px 8px rgba(1,53,251,0.25))" : "none",
                  transition: "transform 0.18s",
                }}>
                  {s.icon}
                </div>

                <div style={{ fontWeight: 900, fontSize: "0.95rem", color: isSelected ? "#0135FB" : "#0F172A" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600, marginTop: 2, textAlign: "center" }}>
                  {s.desc}
                </div>

                <div style={{
                  marginTop: 10,
                  background: isSelected ? "#0135FB" : "#F1F5F9",
                  color: isSelected ? "#FFFFFF" : "#0F172A",
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  padding: "5px 14px",
                  borderRadius: 10,
                  transition: "all 0.18s"
                }}>
                  ₹{s.price}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Action Button */}
        <button
          onClick={handleConfirm}
          style={{
            width: "100%",
            background: "#0135FB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            padding: "14px 20px",
            fontSize: "1rem",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(1, 53, 251, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "transform 0.15s, background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#002BE0"}
          onMouseLeave={e => e.currentTarget.style.background = "#0135FB"}
        >
          <span>Add to Order</span>
          <span style={{ opacity: 0.8 }}>·</span>
          <span>₹{selected.price}</span>
        </button>
      </div>
    </>,
    document.body
  );
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
  const [showSizePicker, setShowSizePicker] = useState(false);
  const isHorizontal = layout === "horizontal";
  const bg = CATEGORY_BG[item.category] || "#E6F0FF";

  /* When tapping + — intercept if hasTallSize is enabled */
  const triggerAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAdd) return;
    if (item.hasTallSize) {
      setShowSizePicker(true);
    } else {
      onAdd(item);
      toast.success(`${item.name} added!`, { duration: 1200 });
    }
  };

  const go = () => router.push(`/item/${item.id}`);

  /* ── HORIZONTAL (List) card ── */
  if (isHorizontal) {
    return (
      <>
        {showSizePicker && onAdd && (
          <SizePicker item={item} onClose={() => setShowSizePicker(false)} onAdd={onAdd} />
        )}
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
          {/* Image */}
          <div style={{ position: "relative", width: 90, height: 90, borderRadius: 12, overflow: "hidden", background: bg, flexShrink: 0 }}>
            {!imgError ? (
              <Image src={item.image} alt={item.name} fill sizes="90px" style={{ objectFit: "cover" }} onError={() => setImgError(true)} onContextMenu={e => e.preventDefault()} onDragStart={e => e.preventDefault()} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
                {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
              </div>
            )}
            {item.isPopular && (
              <span style={{ position: "absolute", bottom: 4, left: 4, background: "#F59E0B", color: "#fff", fontSize: "0.52rem", fontWeight: 800, padding: "2px 5px", borderRadius: 4, textTransform: "uppercase" }}>Best</span>
            )}
            {item.isLaunchingSoon && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(16, 185, 129, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, color: "#fff", fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center", padding: "0 8px", zIndex: 5 }}>
                Launching<br/>Soon
              </div>
            )}
            {!item.available && !item.isLaunchingSoon && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(1, 53, 251, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, color: "#fff", fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center", padding: "0 4px", zIndex: 5, backdropFilter: "blur(2px)" }}>
                NOT<br/>AVAILABLE
              </div>
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
          </div>

          {/* Price + Add */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              {item.originalPrice && item.originalPrice > item.price && (
                <div style={{ fontSize: "0.66rem", color: "#94a3b8", textDecoration: "line-through", lineHeight: 1 }}>₹{item.originalPrice}</div>
              )}
              <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a", lineHeight: 1 }}>₹{item.price}</div>
            </div>

            {(cartItem && !item.isLaunchingSoon) ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}
                  style={{ width: 27, height: 27, borderRadius: "50%", border: "1.5px solid #0135FB", background: "#fff", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800 }}
                ><Minus size={11} /></button>
                <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a", minWidth: 16, textAlign: "center" }}>{cartItem.quantity}</span>
                <button
                  onClick={triggerAdd}
                  style={{ width: 27, height: 27, borderRadius: "50%", border: "none", background: "#0135FB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(1,53,251,0.3)" }}
                ><Plus size={11} /></button>
              </div>
            ) : (
              <button
                onClick={triggerAdd}
                disabled={!item.available || item.isLaunchingSoon}
                style={{ width: (item.available && !item.isLaunchingSoon) ? 32 : "auto", padding: (item.available && !item.isLaunchingSoon) ? 0 : "0 8px", height: 32, borderRadius: (item.available && !item.isLaunchingSoon) ? "50%" : 8, border: "none", background: (item.available && !item.isLaunchingSoon) ? "#0135FB" : "#F1F5F9", color: (item.available && !item.isLaunchingSoon) ? "#fff" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", cursor: (item.available && !item.isLaunchingSoon) ? "pointer" : "not-allowed", boxShadow: (item.available && !item.isLaunchingSoon) ? "0 3px 10px rgba(1,53,251,0.3)" : "none", transition: "transform 0.15s", flexShrink: 0, fontWeight: 800, fontSize: "0.65rem" }}
                onMouseEnter={e => (item.available && !item.isLaunchingSoon) && (e.currentTarget.style.transform = "scale(1.12)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "")}
              >{item.isLaunchingSoon ? "LAUNCHING" : (item.available ? <Plus size={14} /> : "NO STOCK")}</button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ── VERTICAL (Grid) card ── */
  return (
    <>
      {showSizePicker && onAdd && (
        <SizePicker item={item} onClose={() => setShowSizePicker(false)} onAdd={onAdd} />
      )}
      <div
        onClick={go}
        style={{
          background: "#fff",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          cursor: "pointer",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Image Area */}
        <div style={{
          position: "relative",
          aspectRatio: "4 / 5",
          background: bg,
          borderRadius: "20px 20px 0 0",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          flexShrink: 0
        }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
            {!imgError ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 480px) 50vw, (max-width: 768px) 45vw, 250px"
                style={{ objectFit: "cover" }}
                onError={() => setImgError(true)}
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                {item.category === "coffee" ? "☕" : item.category === "snacks" ? "🍟" : "🍽️"}
              </div>
            )}
          </div>

          {item.isPopular && (
            <div style={{ position: "absolute", top: 0, left: 0, background: "linear-gradient(90deg, #F59E0B, #FCD34D)", color: "#fff", fontSize: "0.55rem", fontWeight: 800, padding: "4px 6px", borderRadius: "12px 0 8px 0", textTransform: "uppercase" }}>
              Bestseller
            </div>
          )}
          {item.isLaunchingSoon && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(1, 53, 251, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, color: "#fff", fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center", zIndex: 5 }}>
              Launching<br/>Soon
            </div>
          )}
          {!item.available && !item.isLaunchingSoon && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(1, 53, 251, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px 20px 0 0", color: "#fff", fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", textAlign: "center", zIndex: 5, backdropFilter: "blur(2px)" }}>
              NOT<br/>AVAILABLE
            </div>
          )}

          {/* ADD Button (Floating) */}
          <div style={{ position: "absolute", bottom: -12, right: 12, zIndex: 10 }} onClick={e => e.stopPropagation()}>
            {(cartItem && !item.isLaunchingSoon) ? (
              <div style={{ display: "flex", alignItems: "center", background: "var(--primary)", color: "#fff", borderRadius: 8, height: 32, padding: "0 4px", boxShadow: "0 2px 6px rgba(1,53,251,0.3)" }}>
                <button
                  onClick={() => onUpdateQuantity && onUpdateQuantity(cartItem.cartItemId || cartItem.item.id, cartItem.quantity - 1)}
                  style={{ width: 26, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "none", border: "none", cursor: "pointer" }}
                ><Minus size={14}/></button>
                <span style={{ fontWeight: 800, fontSize: "0.85rem", minWidth: 20, textAlign: "center" }}>{cartItem.quantity}</span>
                <button
                  onClick={triggerAdd}
                  style={{ width: 26, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "none", border: "none", cursor: "pointer" }}
                ><Plus size={14}/></button>
              </div>
            ) : (
              <button
                onClick={triggerAdd}
                disabled={!item.available || item.isLaunchingSoon}
                style={{
                  background: "#fff",
                  color: (item.available && !item.isLaunchingSoon) ? "var(--primary)" : "#94A3B8",
                  border: `1px solid ${(item.available && !item.isLaunchingSoon) ? "var(--primary)" : "#E2E8F0"}`,
                  borderRadius: 8, height: 32,
                  padding: (item.available && !item.isLaunchingSoon) ? "0 18px" : "0 12px",
                  fontWeight: 900,
                  fontSize: (item.available && !item.isLaunchingSoon) ? "0.85rem" : "0.75rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  cursor: (item.available && !item.isLaunchingSoon) ? "pointer" : "not-allowed"
                }}
              >
                {item.isLaunchingSoon ? "LAUNCHING" : (item.available ? "ADD" : "NO STOCK")}
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 12px 14px 12px" }}>
          {/* Price Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ background: "var(--primary)", color: "#fff", fontWeight: 800, fontSize: "0.8rem", padding: "2px 6px", borderRadius: 6 }}>
              ₹{item.price}
            </div>
            {item.originalPrice && item.originalPrice > item.price && (
              <div style={{ color: "#94A3B8", fontSize: "0.75rem", textDecoration: "line-through", fontWeight: 600 }}>
                ₹{item.originalPrice}
              </div>
            )}
          </div>

          {item.originalPrice && item.originalPrice > item.price && (
            <div style={{ color: "var(--primary)", fontSize: "0.65rem", fontWeight: 800, marginBottom: 6 }}>
              ₹{item.originalPrice - item.price} OFF
            </div>
          )}

          <div style={{
            fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.3, marginBottom: 4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            marginTop: (!item.originalPrice || item.originalPrice <= item.price) ? "4px" : "0px"
          }}>
            {item.name}
          </div>

          {item.section && (
            <div style={{ marginBottom: 8, display: "flex", overflow: "hidden" }}>
              <span style={{ background: "rgba(1, 53, 251, 0.08)", color: "var(--primary)", fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {item.section}
              </span>
            </div>
          )}

          {item.isRecommended && (
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#ECFDF5", color: "#059669", fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 999, border: "1px solid #6EE7B7", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                🎯 Recommended
              </span>
            </div>
          )}
        </div>
      </div>
    </>
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
