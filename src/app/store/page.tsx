"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, Heart, ShoppingBag } from "lucide-react";
import { useApp } from "@/lib/context";
import FoodCard from "@/components/FoodCard";

export default function StoreHomePage() {
  const { cart, addToCart, updateQuantity } = useApp();
  
  // This will eventually be fetched from the DB
  const storeCategories = [
    { title: "Munchies", image: "/images/cat-munchies.png", color: "#E0F2FE", slug: "munchies" },
    { title: "Beverages", image: "/images/cat-beverages.png", color: "#FEE2E2", slug: "beverages" },
    { title: "Pleasure Essentials", image: "/images/cat-pleasure.png", color: "#F3E8FF", slug: "pleasure-essentials" },
    { title: "Sweet Indulgence", image: "/images/cat-sweet.png", color: "#FEF9C3", slug: "sweet-indulgence" },
    { title: "Instant Food", image: "/images/cat-instant.png", color: "#FFEDD5", slug: "instant-food" },
    { title: "Paan Corner", image: "/images/cat-paan.png", color: "#ECFCCB", slug: "paan-corner" }
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: "#FFFFFF", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12
      }}>
        <Link href="/" style={{ color: "#0F172A", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={24} />
        </Link>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search 'chips & more'"
            style={{
              width: "100%", padding: "10px 10px 10px 36px", borderRadius: 12,
              border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: "0.9rem",
              fontFamily: "'Outfit', sans-serif", outline: "none"
            }}
          />
        </div>
      </div>

      {/* HERO BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A, #1E293B)",
        padding: "30px 20px", color: "white", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 900, fontStyle: "italic", lineHeight: 1 }}>
          LATE NIGHT <br/> <span style={{ color: "#38BDF8" }}>STORE</span>
        </h1>
        <p style={{ opacity: 0.8, fontSize: "0.85rem", marginTop: 8 }}>Powered by Onn Da Way</p>
      </div>

      {/* DISCOVERY GRID (like screenshot 2) */}
      <div className="otw-container" style={{ padding: "20px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10
        }}>
          {storeCategories.map(cat => (
            <Link key={cat.slug} href={`/store/${cat.slug}`} style={{
              background: "#FFFFFF", borderRadius: 16, padding: "12px 8px", textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ width: 60, height: 60, background: cat.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                {/* Fallback emoji if no image */}
                {cat.slug === "munchies" ? "🍟" : cat.slug === "beverages" ? "🥤" : cat.slug === "sweet-indulgence" ? "🍫" : "📦"}
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A", textAlign: "center", lineHeight: 1.2 }}>
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* OFFERS SECTION */}
      <div className="otw-container" style={{ padding: "0 20px 20px" }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>
          Offers For You
        </h3>
        <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: "2rem" }}>🎉</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>Get 15% OFF</div>
            <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Use code NIGHTOWL on orders above ₹199</div>
          </div>
        </div>
      </div>

    </div>
  );
}
