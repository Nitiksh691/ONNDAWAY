"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FoodSwipeCard from "./FoodSwipeCard";
import {
  X,
  Heart,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { MenuItem } from "@/lib/types";
import { useApp } from "@/lib/context";
import Link from "next/link";
import toast from "react-hot-toast";

interface FoodSwipeContainerProps {
  initialFoods: MenuItem[];
  showHeader?: boolean;
}

/* ── skeleton card (loading state) ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        height: "100%",
        borderRadius: 28,
        overflow: "hidden",
        position: "relative",
        background: "#1a1a2e",
      }}
    >
      {/* shimmer overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
      {/* fake content blocks */}
      <div style={{ position: "absolute", bottom: 32, left: 24, right: 24 }}>
        <div
          style={{
            width: 80,
            height: 20,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            marginBottom: 14,
          }}
        />
        <div
          style={{
            width: "75%",
            height: 26,
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            marginBottom: 10,
          }}
        />
        <div
          style={{
            width: "45%",
            height: 18,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 18,
          }}
        />
        <div
          style={{
            width: "90%",
            height: 12,
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: "60%",
            height: 12,
            borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
            marginBottom: 22,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 50,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
          }}
        />
      </div>
    </div>
  );
}

/* ── empty state ────────────────────────────────────────────────────────── */
function EmptyState({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 32px",
        maxWidth: 380,
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(1,53,251,0.1), rgba(1,53,251,0.05))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <UtensilsCrossed size={36} color="var(--primary)" strokeWidth={1.5} />
      </motion.div>
      <h3
        style={{
          fontSize: "1.3rem",
          fontWeight: 800,
          color: "var(--text-dark)",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        You've seen it all!
      </h3>
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          marginBottom: 28,
          fontWeight: 500,
        }}
      >
        You swiped through every item on the menu. Restart to discover again.
      </p>
      <button
        onClick={onRestart}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 32px",
          borderRadius: 16,
          border: "2px solid var(--primary)",
          background: "var(--primary)",
          color: "#fff",
          fontWeight: 800,
          fontSize: "0.92rem",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.15s",
          boxShadow: "0 4px 0 var(--primary-dark)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(2px)";
          e.currentTarget.style.boxShadow = "0 2px 0 var(--primary-dark)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 4px 0 var(--primary-dark)";
        }}
      >
        <RotateCcw size={17} strokeWidth={2.5} />
        Start Over
      </button>
    </motion.div>
  );
}

/* ── floating cart widget ───────────────────────────────────────────────── */
function FloatingCart() {
  const { cartCount, cartTotal } = useApp();
  if (cartCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--primary)",
        padding: "10px 10px 10px 18px",
        borderRadius: 18,
        boxShadow: "0 8px 32px rgba(1,53,251,0.35), 0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.1)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShoppingBag size={18} color="#fff" />
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -10,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              color: "var(--primary)",
              fontSize: "0.65rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        </div>
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
            {cartCount} item{cartCount > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#fff" }}>₹{cartTotal}</div>
        </div>
      </div>
      <Link
        href="/cart"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 16px",
          borderRadius: 12,
          background: "#fff",
          color: "var(--primary)",
          fontWeight: 800,
          fontSize: "0.82rem",
          textDecoration: "none",
          fontFamily: "inherit",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          transition: "transform 0.1s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
      >
        Checkout <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}

/* ── main container ─────────────────────────────────────────────────────── */
export default function FoodSwipeContainer({ initialFoods, showHeader = true }: FoodSwipeContainerProps) {
  const [foods, setFoods] = useState<MenuItem[]>(initialFoods);
  const { addToCart } = useApp();

  useEffect(() => {
    setFoods(initialFoods);
  }, [initialFoods]);

  const handleSwipe = useCallback(
    (id: string, action: "like" | "dislike") => {
      const swipedFood = foods.find((f) => f.id === id);
      setTimeout(() => {
        setFoods((prev) => {
          const rest = prev.filter((food) => food.id !== id);
          if (!swipedFood) return rest;
          // Create a new item with a unique ID to loop it to the back
          const newFood = { ...swipedFood, id: `${swipedFood.id}-${Date.now()}` };
          return [...rest, newFood];
        });
      }, 250);
      if (swipedFood && action === "like") {
        addToCart(swipedFood);
      }
    },
    [foods, addToCart]
  );



  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        /* Hide the bottom action bar on the discover page */
        .bottom-action-bar { display: none !important; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 16px",
          minHeight: showHeader ? "calc(100vh - 80px)" : "auto",
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        {showHeader && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.15)",
              padding: "6px 16px",
              borderRadius: 999,
              marginBottom: 14,
            }}
          >
            <Sparkles size={14} color="white" />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Discover Mode
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 6px",
            }}
          >
            What are you craving?
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            Swipe right to add · left to skip
          </p>
        </div>
        )}

        {/* ── Card stack ────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            height: "clamp(460px, 65vh, 580px)",
            margin: "0 auto",
          }}
        >
          <AnimatePresence>
            {foods.map((food, index) => (
              <FoodSwipeCard
                key={food.id}
                item={food}
                index={index}
                isFront={index === 0}
                onSwipe={handleSwipe}
                onAdd={() => addToCart(food)}
                total={foods.length}
              />
            ))}
          </AnimatePresence>
        </div>


      </div>

      {/* ── Floating cart ───────────────────────────────────────────────── */}
      <AnimatePresence>
        <FloatingCart />
      </AnimatePresence>
    </>
  );
}
