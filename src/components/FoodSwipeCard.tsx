"use client";

import React, { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  AnimatePresence,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { ShoppingCart, ExternalLink, Star } from "lucide-react";
import { MenuItem } from "@/lib/types";
import toast from "react-hot-toast";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function pseudoRating(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (4.0 + (h % 10) / 10).toFixed(1);
}

const CAT_EMOJI: Record<string, string> = {
  coffee: "☕",
  snacks: "🍟",
  meals: "🍜",
  drinks: "🥤",
  desserts: "🍰",
};

/* ── props ───────────────────────────────────────────────────────────────── */
interface FoodSwipeCardProps {
  item: MenuItem;
  isFront: boolean;
  onSwipe: (id: string, action: "like" | "dislike") => void;
  onAdd: () => void;
  index: number;
  total: number;
}

/* ── component ───────────────────────────────────────────────────────────── */
export default function FoodSwipeCard({
  item,
  isFront,
  onSwipe,
  onAdd,
  index,
  total,
}: FoodSwipeCardProps) {
  const router = useRouter();
  const [exitX, setExitX] = useState(0);
  const [gone, setGone] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -120], [0, 1]);

  /* tint the whole card green/red while dragging */
  const overlayBg = useTransform(
    x,
    [-200, -80, 0, 80, 200],
    [
      "rgba(239,68,68,0.18)",
      "rgba(239,68,68,0.06)",
      "rgba(0,0,0,0)",
      "rgba(34,197,94,0.06)",
      "rgba(34,197,94,0.18)",
    ]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      setExitX(600);
      setGone(true);
      onSwipe(item.id, "like");
      toast.success(`${item.name} added to cart`, {
        duration: 1800,
        icon: "🛒",
        style: {
          borderRadius: "14px",
          background: "#1a1a2e",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.88rem",
        },
      });
    } else if (info.offset.x < -threshold) {
      setExitX(-600);
      setGone(true);
      onSwipe(item.id, "dislike");
    }
  };

  const handleCardTap = () => {
    if (Math.abs(x.get()) > 5) return;
    router.push(`/item/${item.id}`);
  };

  /* ── stacking transforms ─────────────────────────────────────────────── */
  const stackScale = isFront ? 1 : Math.max(0.88, 1 - index * 0.045);
  const stackY = isFront ? 0 : index * 14;
  const stackZ = 50 - index;
  const stackOpacity = index > 3 ? 0 : 1 - index * 0.05;
  const stackBlur = index === 0 ? 0 : index * 1.5;

  const rating = pseudoRating(item.id);
  const emoji = CAT_EMOJI[item.category] || "🍽️";

  return (
    <motion.div
      style={{
        x,
        rotate,
        scale: stackScale,
        top: isFront ? 0 : stackY,
        zIndex: stackZ,
        opacity: stackOpacity,
        filter: stackBlur ? `blur(${stackBlur}px)` : undefined,
        position: "absolute",
        left: "50%",
        translateX: "-50%",
        width: "100%",
        maxWidth: 420,
        height: "100%",
        borderRadius: 28,
        overflow: "hidden",
        cursor: isFront ? "grab" : "default",
        pointerEvents: isFront ? "auto" : "none",
        userSelect: "none",
        willChange: "transform",
      }}
      drag={isFront ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={
        gone
          ? { x: exitX, opacity: 0, transition: { type: "spring", stiffness: 200, damping: 30 } }
          : {}
      }
      onClick={handleCardTap}
      whileTap={isFront ? { cursor: "grabbing" } : undefined}
    >
      {/* ── Background Image ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${item.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 0.6s cubic-bezier(.25,.1,.25,1)",
        }}
      />

      {/* ── Gradient overlays ───────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.08) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Swipe direction tint ────────────────────────────────────────── */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: overlayBg,
          pointerEvents: "none",
          borderRadius: 28,
        }}
      />

      {/* ── YUM stamp ───────────────────────────────────────────────────── */}
      <motion.div
        style={{
          opacity: likeOpacity,
          position: "absolute",
          top: 48,
          left: 24,
          transform: "rotate(-14deg)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            border: "4px solid #22c55e",
            color: "#22c55e",
            padding: "6px 20px",
            borderRadius: 16,
            fontSize: "2.2rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 40px rgba(34,197,94,0.35)",
          }}
        >
          YUM!
        </div>
      </motion.div>

      {/* ── NOPE stamp ──────────────────────────────────────────────────── */}
      <motion.div
        style={{
          opacity: nopeOpacity,
          position: "absolute",
          top: 48,
          right: 24,
          transform: "rotate(14deg)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            border: "4px solid #ef4444",
            color: "#ef4444",
            padding: "6px 20px",
            borderRadius: 16,
            fontSize: "2.2rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 40px rgba(239,68,68,0.35)",
          }}
        >
          NOPE
        </div>
      </motion.div>

      {/* ── Top-right badge cluster ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(16px)",
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Star size={13} fill="#facc15" color="#facc15" />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {rating}
          </span>
        </div>
      </div>



      {/* ── Bottom content ──────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "28px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Category + Popular badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {emoji} {item.category}
          </span>
          {item.isPopular && (
            <span
              style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              🔥 Trending
            </span>
          )}
        </div>

        {/* Name + Price */}
        <div style={{ pointerEvents: "none" }}>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 5vw, 2rem)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 4,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {item.name}
          </h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              ₹{item.price}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.45)",
                  textDecoration: "line-through",
                }}
              >
                ₹{item.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any,
            overflow: "hidden",
            margin: 0,
            pointerEvents: "none",
          }}
        >
          {item.description}
        </p>

        {/* Action buttons */}
        {isFront && (
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
                toast.success(`${item.name} added!`, {
                  duration: 1200,
                  icon: "🛒",
                  style: {
                    borderRadius: "14px",
                    background: "#1a1a2e",
                    color: "#fff",
                    fontWeight: 600,
                  },
                });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                flex: 1,
                background: "#fff",
                color: "#0A0F2E",
                border: "none",
                padding: "14px 20px",
                borderRadius: 16,
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
              }}
            >
              <ShoppingCart size={17} strokeWidth={2.5} />
              Add to Cart
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/item/${item.id}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 50,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 16,
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "";
              }}
            >
              <ExternalLink size={20} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
