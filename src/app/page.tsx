"use client";
import { useState, useEffect, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { ArrowRight, Coffee, Navigation, Clock, Search, MapPin } from "lucide-react";
import FoodCard from "@/components/FoodCard";
import Footer from "@/components/Footer";
import { useApp } from "@/lib/context";
import OnboardingModal from "@/components/OnboardingModal";
import AuthModal from "@/components/AuthModal";

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bannerItems, setBannerItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminBanner, setAdminBanner] = useState<{ text: string, link: string, active: boolean } | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { cartCount, cartTotal } = useApp();

  useEffect(() => {
    try {
      const b = localStorage.getItem("otw_demo_banner");
      if (b) setAdminBanner(JSON.parse(b));
    } catch (e) {}

    fetch("/api/menu")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const available = data.filter(i => i.available);
          setMenuItems(available);
          setBannerItems(available.filter(i => i.isBanner));
          
          const cats = ["all", ...Array.from(new Set(available.map(i => i.category)))];
          setCategories(cats);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMenu(false));
  }, []);

  const deferredSearch = useDeferredValue(searchQuery);
  const filteredItems = useMemo(() => menuItems.filter(i => {
    const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
    const matchesSearch = i.name.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                          (i.description && i.description.toLowerCase().includes(deferredSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  }), [menuItems, selectedCategory, deferredSearch]);

  const popularItems = menuItems.filter(i => i.isPopular).slice(0, 4);

  return (
    <>
      <OnboardingModal onLoginClick={() => setShowAuthModal(true)} />
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={(uid) => {
            localStorage.setItem("otw_user_id", uid);
            window.location.reload();
          }} 
        />
      )}

      {/* Dynamic Admin Banner */}
      {adminBanner?.active && (
        <div style={{ background: "#0055ff", color: "white", textAlign: "center", padding: "12px", fontSize: "0.9rem", fontWeight: 700 }}>
          {adminBanner.link ? (
            <Link href={adminBanner.link} style={{ color: "white", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {adminBanner.text} <ArrowRight size={16} />
            </Link>
          ) : (
            <span>{adminBanner.text}</span>
          )}
        </div>
      )}

      {/* Marquee Banner */}
      <div className="marquee">
        <span>⚡ FRESH COFFEE ⚡ FAST DELIVERY ⚡ GREAT DEALS ⚡ NO LOGIN NEEDED ⚡ ORDER NOW ⚡ ONN DA WAY ⚡</span>
        <span>⚡ FRESH COFFEE ⚡ FAST DELIVERY ⚡ GREAT DEALS ⚡ NO LOGIN NEEDED ⚡ ORDER NOW ⚡ ONN DA WAY ⚡</span>
      </div>

      {/* Hero Header */}
      <section style={{ background: "var(--primary)", padding: "80px 24px 60px", color: "white", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -80, right: -60 }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", bottom: -40, left: "10%" }} />
        <div className="otw-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(2.8rem, 8vw, 5rem)", lineHeight: 1, textTransform: "uppercase", marginBottom: "20px", letterSpacing: "-0.02em" }}>
            LIFE BEGINS <br/> AFTER <span style={{ color: "#93C5FD" }}>FLAVOR</span>.
          </h1>
          <p style={{ fontSize: "1.15rem", maxWidth: "550px", opacity: 0.85, marginBottom: "36px", fontWeight: 500, lineHeight: 1.6 }}>
            Curated coffee, snacks, and meals — delivered straight to you in minutes.
          </p>
          <div style={{ position: "relative", width: "100%", maxWidth: "500px" }}>
            <Search size={20} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#0135FB" }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for coffee, meals, snacks..." 
              style={{ width: "100%", padding: "18px 24px 18px 50px", borderRadius: "99px", border: "3px solid white", fontSize: "1rem", fontFamily: "'Outfit', sans-serif", fontWeight: 600, outline: "none", boxShadow: "0 6px 0 rgba(0,0,0,0.15)", color: "#0A0F2E", background: "white" }}
            />
          </div>
        </div>
      </section>

      {/* Categories Sticky Bar */}
      <div className="category-scroll">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === "all" ? "All Items" : cat}
          </button>
        ))}
      </div>

      <section style={{ padding: "40px 0", background: "var(--bg-cream)", minHeight: "60vh" }}>
        <div className="otw-container">
          
          {/* Featured Bento Area (Only show when "all" is selected) */}
          {selectedCategory === "all" && popularItems.length > 0 && (
            <div className="featured-bento">
              {/* Big Featured Item */}
              {popularItems[0] && (
                <div className="otw-card" style={{ display: "flex", flexDirection: "column", position: "relative", background: "var(--accent)" }}>
                  <div style={{ position: "absolute", top: 16, left: 16, background: "var(--primary)", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: "0.85rem", zIndex: 10 }}>
                    #1 POPULAR
                  </div>
                  <div style={{ flex: 1, padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.1, color: "var(--primary)", marginBottom: "16px", textTransform: "uppercase" }}>
                      {popularItems[0].name}
                    </h2>
                    <p style={{ color: "var(--text-dark)", opacity: 0.8, marginBottom: "24px", fontSize: "1.1rem" }}>
                      {popularItems[0].description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>₹{popularItems[0].price}</span>
                      {/* Assuming FoodCard logic handles cart, but we might need a custom Add button here. For now, we'll link to it or rely on the user clicking the generic card. I will just render FoodCard styled differently or build a custom add button. */}
                    </div>
                  </div>
                </div>
              )}
              {/* Secondary Featured Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {popularItems.slice(1, 3).map((item, i) => (
                  <div key={item.id} className="otw-card" style={{ flex: 1, display: "flex", padding: "16px", background: i===0?"#DCFCE7":"#DBEAFE" }}>
                     <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)" }}>{item.name}</h3>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--primary)", marginTop: "8px" }}>₹{item.price}</div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Grid */}
          <div className="bento-grid">
            {loadingMenu ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280 }} />
              ))
            ) : (
              filteredItems.map(item => (
                <FoodCard key={item.id} item={item} />
              ))
            )}
            {!loadingMenu && filteredItems.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--text-muted)" }}>No items found in this category.</h3>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer/>

      {/* Mobile Sticky CTA */}
      {cartCount > 0 && (
        <div className="mobile-only" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", padding: "16px 24px", borderTop: "1px solid #E5E7EB", zIndex: 50, alignItems: "center", justifyContent: "space-between", boxShadow: "0 -4px 12px rgba(0,0,0,0.05)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-dark)" }}>{cartCount} item{cartCount > 1 ? 's' : ''}</div>
            <div style={{ color: "var(--primary)", fontWeight: 900, fontSize: "1.2rem" }}>₹{cartTotal}</div>
          </div>
          <Link href="/cart" className="otw-btn otw-btn-primary" style={{ padding: "12px 24px" }}>
            Checkout <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </>
  );
}
