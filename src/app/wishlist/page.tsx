"use client";
import { useApp } from "@/lib/context";
import useSWR from "swr";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { MenuItem } from "@/lib/types";
import FoodCard from "@/components/FoodCard";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WishlistPage() {
  const { wishlist, cart, addToCart, updateQuantity } = useApp();
  const { data: menu = [], isLoading } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const wishlistItems = menu.filter(item => wishlist.includes(item.id));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Page header */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border-light)", padding: "24px 32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 10 }}>
          <Heart size={22} color="var(--primary)" /> WISHLIST
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>
          {wishlistItems.length} saved {wishlistItems.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "var(--white)", borderRadius: 16, aspectRatio: "0.85", border: "1px solid var(--border-light)", opacity: 0.6 }} />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--white)", border: "2px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={36} color="var(--text-muted)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: 8 }}>Your wishlist is empty</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>Save your favourite items to order them faster next time</p>
            </div>
            <Link href="/menu" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
              background: "var(--primary)", color: "white", textDecoration: "none",
              borderRadius: 12, fontWeight: 800, fontSize: "0.9rem"
            }}>
              <ShoppingBag size={16} /> Browse Menu
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {wishlistItems.map(item => (
              <FoodCard key={item.id} item={item} layout="vertical" cartItem={cart.find(c => c.item.id === item.id)} onAdd={addToCart} onUpdateQuantity={updateQuantity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
