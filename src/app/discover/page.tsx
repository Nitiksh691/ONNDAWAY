"use client";

import React, { useState, useEffect } from "react";
import FoodSwipeContainer from "@/components/FoodSwipeContainer";
import { MenuItem } from "@/lib/types";
import { useMenu } from "@/hooks/useMenu";

export default function DiscoverPage() {
  const { menuItems: rawMenuItems, isLoading: loading } = useMenu();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!loading && rawMenuItems.length > 0) {
      const available = rawMenuItems.filter(item => item.available);
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      setMenuItems(available);
    }
  }, [loading, rawMenuItems]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
        paddingTop: 12,
        overflow: "hidden",
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 520,
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          {/* Skeleton header */}
          <div style={{ width: "100%", textAlign: "center", paddingTop: 28, paddingBottom: 20 }}>
            <div
              style={{
                width: 120,
                height: 28,
                borderRadius: 999,
                background: "rgba(0,0,0,0.05)",
                margin: "0 auto 14px",
              }}
            />
            <div
              style={{
                width: 240,
                height: 32,
                borderRadius: 12,
                background: "rgba(0,0,0,0.06)",
                margin: "0 auto 8px",
              }}
            />
            <div
              style={{
                width: 180,
                height: 16,
                borderRadius: 8,
                background: "rgba(0,0,0,0.04)",
                margin: "0 auto",
              }}
            />
          </div>
          {/* Skeleton card */}
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              height: "clamp(460px, 65vh, 580px)",
              borderRadius: 28,
              background: "#1a1a2e",
              position: "relative",
              overflow: "hidden",
            }}
          >
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
                  width: "70%",
                  height: 28,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.08)",
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  width: "40%",
                  height: 20,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  marginBottom: 18,
                }}
              />
              <div
                style={{
                  width: "85%",
                  height: 14,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: "55%",
                  height: 14,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  marginBottom: 24,
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
        </div>
      ) : (
        <>
          <div className="hidden md:flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-lg mx-auto">
             <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
             </div>
             <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Mobile Only Feature</h2>
             <p className="text-white/80 font-medium leading-relaxed">
               Discover Mode is designed for a thumb-friendly touch experience. Please open this page on your smartphone to start swiping!
             </p>
          </div>
          <div className="block md:hidden">
            <FoodSwipeContainer initialFoods={menuItems} />
          </div>
        </>
      )}
    </div>
  );
}
