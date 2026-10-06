"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search, Heart, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/lib/context";
import FoodCard from "@/components/FoodCard";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StoreCategoryPage() {
  const { category } = useParams();
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useApp();
  
  const [selectedSub, setSelectedSub] = useState("all");

  // Fetch products for this category
  // For now we use the existing /api/menu and filter client-side, 
  // but eventually we should create a dedicated API or pass it down via server components.
  const { data: menuItems, error } = useSWR("/api/menu", fetcher);

  const decodedCategory = decodeURIComponent(category as string).replace(/-/g, " ");
  
  // Example subcategories (hardcoded for now, should come from Category model eventually)
  const subcategories = ["Chips & Crisps", "Nachos", "Popcorn", "Namkeen", "Dry Fruits & Nuts", "Energy Bars"];

  // Filter items
  const items = React.useMemo(() => {
    if (!menuItems) return [];
    // Currently fallback to matching the old 'category' field or the new 'category'/'subcategory' logic
    let filtered = menuItems.filter((i: any) => 
      i.category?.toLowerCase() === decodedCategory.toLowerCase() || 
      i.subcategory?.toLowerCase() === decodedCategory.toLowerCase()
    );
    if (selectedSub !== "all") {
      filtered = filtered.filter((i: any) => i.subcategory?.toLowerCase() === selectedSub.toLowerCase());
    }
    return filtered;
  }, [menuItems, decodedCategory, selectedSub]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: 100, display: "flex", flexDirection: "column" }}>
      
      {/* HEADER */}
      <div style={{
        background: "#FFFFFF", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#0F172A", padding: 0 }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", textTransform: "capitalize", margin: 0 }}>
            {decodedCategory}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Heart size={20} color="#0F172A" />
          <Search size={20} color="#0F172A" />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* LEFT SIDEBAR (Desktop) / TOP HORIZONTAL (Mobile) */}
        {/* We'll use a CSS-based approach for responsive layout */}
        <style>{`
          .store-layout { display: flex; flex-direction: column; width: 100%; }
          .store-sidebar { display: flex; overflow-x: auto; padding: 12px; background: white; border-bottom: 1px solid #F1F5F9; scrollbar-width: none; flex-shrink: 0; }
          .store-sidebar::-webkit-scrollbar { display: none; }
          .store-sub-btn { 
            display: flex; flex-direction: column; alignItems: center; gap: 6px; 
            min-width: 72px; padding: 8px; border-radius: 12px; border: none; background: transparent; cursor: pointer;
          }
          .store-sub-btn.active { background: #F3E8FF; }
          .store-sub-text { font-size: 0.7rem; font-weight: 600; color: #64748B; text-align: center; line-height: 1.2; }
          .store-sub-btn.active .store-sub-text { color: #7E22CE; font-weight: 800; }
          
          .store-content { flex: 1; padding: 16px; }
          .store-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

          @media (min-width: 768px) {
            .store-layout { flex-direction: row; }
            .store-sidebar { flex-direction: column; width: 120px; height: calc(100vh - 65px); border-bottom: none; border-right: 1px solid #F1F5F9; position: sticky; top: 65px; overflow-y: auto; padding: 16px 8px; }
            .store-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
          }
        `}</style>

        <div className="store-layout">
          <aside className="store-sidebar">
            <button className={`store-sub-btn ${selectedSub === "all" ? "active" : ""}`} onClick={() => setSelectedSub("all")}>
              <div style={{ fontSize: "1.5rem" }}>📦</div>
              <span className="store-sub-text">All</span>
            </button>
            {subcategories.map(sub => (
              <button key={sub} className={`store-sub-btn ${selectedSub === sub ? "active" : ""}`} onClick={() => setSelectedSub(sub)}>
                <div style={{ fontSize: "1.5rem" }}>🍟</div>
                <span className="store-sub-text">{sub}</span>
              </button>
            ))}
          </aside>

          <main className="store-content">
            {/* Filter Bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 8, background: "white", fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>
                <SlidersHorizontal size={14} /> Filter
              </button>
              <button style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 8, background: "white", fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>
                Brand ▾
              </button>
              <button style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 8, background: "white", fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>
                Type ▾
              </button>
            </div>

            {/* Product Grid */}
            {!menuItems ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>Loading...</div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔍</div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.2rem", color: "#64748B", fontWeight: 700 }}>No products found</h3>
              </div>
            ) : (
              <div className="store-grid">
                {items.map((item: any) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    layout="vertical"
                    cartItem={cart.find(c => c.item.id === item.id)}
                    onAdd={addToCart}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
