"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotFoundPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const available = data.filter((i: any) => i.available);
          setMenuItems(available);
          // Extract unique categories
          const cats = Array.from(new Set(available.map((i: any) => i.category as string)));
          setCategories(cats);
        }
      })
      .catch(console.error);
  }, []);

  const CAT_EMOJI: Record<string, string> = {
    coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤",
    desserts: "🍰", burgers: "🍔", pizza: "🍕", sandwich: "🥪",
    beverages: "🧃", combo: "🎁",
  };

  const CAT_COLORS: string[] = [
    "#EEF1FF", "#FEF3C7", "#D1FAE5", "#FCE7F3", "#DBEAFE", "#FDE68A", "#E0E7FF", "#CFFAFE",
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "'Outfit', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* Hero Section */}
      <div style={{
        textAlign: "center",
        padding: "60px 24px 40px",
        maxWidth: "500px",
        width: "100%",
      }}>
        {/* Fun 404 illustration */}
        <div style={{ fontSize: "6rem", lineHeight: 1, marginBottom: "10px", position: "relative" }}>
          <span style={{ color: "#0055ff", fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>4</span>
          <span style={{ display: "inline-block", fontSize: "5rem", animation: "bounce404 1.5s ease-in-out infinite" }}>🛵</span>
          <span style={{ color: "#0055ff", fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>4</span>
        </div>

        <h1 style={{
          fontSize: "1.6rem", fontWeight: 900, color: "#0f172a",
          marginBottom: "12px", letterSpacing: "-0.02em"
        }}>
          Looks like this page got lost <br />
          <span style={{ color: "#0055ff" }}>ONN DA WAY!</span>
        </h1>

        <p style={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.6, marginBottom: "28px", fontWeight: 500 }}>
          We couldn&apos;t find what you were looking for, but we can definitely find you some great food.
        </p>

        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "12px 28px", borderRadius: "12px",
          background: "#0055ff", color: "#fff", fontWeight: 800,
          textDecoration: "none", fontSize: "0.95rem",
          boxShadow: "0 4px 14px rgba(0,85,255,0.3)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}>
          ← Go to Home
        </Link>
      </div>

      {/* Divider */}
      <div style={{ width: "90%", maxWidth: "500px", textAlign: "center", padding: "10px 0 20px" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase" }}>
          THE GOOD STUFF&apos;S STILL HERE
        </div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", marginTop: "6px" }}>
          Explore Our Top Categories
        </h2>
      </div>

      {/* Category Grid — like Zepto */}
      <div style={{
        width: "90%", maxWidth: "500px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "14px",
        paddingBottom: "40px",
      }}>
        {categories.map((cat, i) => {
          const bg = CAT_COLORS[i % CAT_COLORS.length];
          const emoji = CAT_EMOJI[cat.toLowerCase()] || "📦";
          // Find a representative image for this category
          const catItem = menuItems.find(item => item.category === cat && item.image);

          return (
            <Link
              key={cat}
              href={`/?category=${encodeURIComponent(cat)}`}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "10px", padding: "20px 12px",
                borderRadius: "16px", background: bg,
                textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative", overflow: "hidden",
                minHeight: "120px",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {catItem?.image ? (
                <img
                  src={catItem.image}
                  alt={cat}
                  style={{
                    width: "60px", height: "60px",
                    objectFit: "cover", borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              ) : (
                <span style={{ fontSize: "2.5rem" }}>{emoji}</span>
              )}
              <span style={{
                fontWeight: 800, fontSize: "0.85rem",
                color: "#0f172a", textTransform: "capitalize",
                textAlign: "center",
              }}>
                {cat}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Popular Items Section */}
      {menuItems.filter(i => i.isPopular && i.image).length > 0 && (
        <div style={{ width: "90%", maxWidth: "500px", paddingBottom: "60px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
            🔥 Popular Right Now
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "12px",
          }}>
            {menuItems.filter(i => i.isPopular && i.image).slice(0, 6).map(item => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                style={{
                  display: "flex", flexDirection: "column",
                  borderRadius: "14px", overflow: "hidden",
                  background: "#f8fafc", textDecoration: "none",
                  border: "1px solid #e2e8f0",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a", marginBottom: "4px" }}>{item.name}</div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#10b981" }}>₹{item.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce404 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
