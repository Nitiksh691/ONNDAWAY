"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Minus, CheckCircle, Clock, List, Settings, BarChart3, Coffee, LogOut, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// --- Types ---
type PosItem = {
  _id: string;
  name: string;
  price: number;
  category: string;
  isActive: boolean;
};

type CartItem = {
  item: PosItem;
  qty: number;
};

type PosSale = {
  _id: string;
  items: { name: string; price: number; qty: number }[];
  totalAmount: number;
  paymentMethod: "Cash" | "Online";
  createdAt: string;
};

// --- Main Page Component ---
export default function StorePosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [activeTab, setActiveTab] = useState<"pos" | "analytics" | "settings">("pos");

  const [items, setItems] = useState<PosItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analytics State
  const [sales, setSales] = useState<PosSale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem("pos_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      fetchItems();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234" || pin === "admin123") {
      setIsAuthenticated(true);
      localStorage.setItem("pos_auth", "true");
      fetchItems();
      toast.success("Welcome to POS");
    } else {
      toast.error("Incorrect PIN");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("pos_auth");
    setCart([]);
  };

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/pos/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      setIsLoadingSales(true);
      const res = await fetch("/api/pos/sales?date=today");
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSales(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchSales();
    }
  }, [activeTab]);

  // --- Cart Logic ---
  const addToCart = (item: PosItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item._id === item._id);
      if (existing) {
        return prev.map((c) => (c.item._id === item._id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
    // Optional: play a subtle sound or haptic feedback if running in PWA
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.item._id === id) {
          const newQty = c.qty + delta;
          return newQty > 0 ? { ...c, qty: newQty } : c;
        }
        return c;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.item._id !== id));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  }, [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map((c) => ({ name: c.item.name, price: c.item.price, qty: c.qty })),
        totalAmount,
        paymentMethod,
      };
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Order recorded successfully!");
        setCart([]);
        setPaymentMethod("Cash");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        toast.error("Failed to record order.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Auth View ---
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Toaster position="top-center" />
        <div style={{ width: "100%", maxWidth: 360, background: "#FFFFFF", padding: "40px 30px", borderRadius: 28, boxShadow: "0 10px 40px rgba(1, 53, 251, 0.08)", border: "1px solid rgba(1, 53, 251, 0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #0135FB, #3B82F6)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(1,53,251,0.2)" }}>
              <Coffee color="white" size={36} />
            </div>
            <h1 style={{ color: "#0A0F2E", fontSize: "1.7rem", fontWeight: 900 }}>Store POS</h1>
            <p style={{ color: "#6B7280", fontSize: "0.95rem", marginTop: 4, fontWeight: 500 }}>Enter your PIN to access</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN Code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "2px solid #E2E8F0",
                background: "#F8FAFC", color: "#0A0F2E", fontSize: "1.3rem", textAlign: "center",
                fontWeight: 700, outline: "none", transition: "0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0135FB"}
              onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              autoFocus
            />
            <button
              type="submit"
              style={{
                width: "100%", padding: "16px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #0135FB, #3B82F6)", color: "white", fontSize: "1.1rem", fontWeight: 800,
                cursor: "pointer", transition: "0.2s", boxShadow: "0 4px 16px rgba(1,53,251,0.25)"
              }}
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FF", color: "#0A0F2E", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif" }}>
      <Toaster position="top-center" />
      
      {/* Top Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#FFFFFF", borderBottom: "1px solid rgba(1,53,251,0.08)", zIndex: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0135FB, #3B82F6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(1,53,251,0.2)" }}>
            <Coffee color="white" size={20} />
          </div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0, color: "#0135FB" }}>POS</h1>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setActiveTab("pos")} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: activeTab === "pos" ? "#EEF1FF" : "transparent", color: activeTab === "pos" ? "#0135FB" : "#6B7280", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "0.2s" }}>
            <List size={16} /> <span className="hidden sm:inline">Order</span>
          </button>
          <button onClick={() => setActiveTab("analytics")} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: activeTab === "analytics" ? "#EEF1FF" : "transparent", color: activeTab === "analytics" ? "#0135FB" : "#6B7280", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "0.2s" }}>
            <BarChart3 size={16} /> <span className="hidden sm:inline">Analytics</span>
          </button>
          <button onClick={() => setActiveTab("settings")} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: activeTab === "settings" ? "#EEF1FF" : "transparent", color: activeTab === "settings" ? "#0135FB" : "#6B7280", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "0.2s" }}>
            <Settings size={16} /> <span className="hidden sm:inline">Settings</span>
          </button>
          <button onClick={handleLogout} style={{ padding: "8px", borderRadius: 10, border: "none", background: "#FEE2E2", color: "#EF4444", marginLeft: 8, cursor: "pointer", transition: "0.2s" }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* POS Tab */}
        {activeTab === "pos" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Drinks Grid (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, paddingBottom: 220 }}>
              {isLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6B7280", fontWeight: 600 }}>Loading menu...</div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6B7280", fontWeight: 600 }}>No items found. Go to Settings to add some.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 }}>
                  {items.map((item) => {
                    const inCartQty = cart.find(c => c.item._id === item._id)?.qty || 0;
                    return (
                      <div
                        key={item._id}
                        onClick={() => addToCart(item)}
                        style={{
                          background: inCartQty > 0 ? "#EEF1FF" : "#FFFFFF",
                          border: `2px solid ${inCartQty > 0 ? "#0135FB" : "rgba(1,53,251,0.06)"}`,
                          borderRadius: 20,
                          padding: "20px 12px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "0.15s ease",
                          userSelect: "none",
                          position: "relative",
                          boxShadow: inCartQty > 0 ? "0 8px 24px rgba(1,53,251,0.15)" : "0 4px 12px rgba(0,0,0,0.03)"
                        }}
                      >
                        {inCartQty > 0 && (
                          <div style={{ position: "absolute", top: -8, right: -8, background: "#0135FB", color: "white", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem", boxShadow: "0 2px 8px rgba(1,53,251,0.4)" }}>
                            {inCartQty}
                          </div>
                        )}
                        <span style={{ fontSize: "2.5rem", marginBottom: 10, filter: inCartQty > 0 ? "drop-shadow(0 4px 8px rgba(1,53,251,0.2))" : "none" }}>🥤</span>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.2, marginBottom: 4, color: "#0A0F2E" }}>{item.name}</h3>
                        <div style={{ color: "#0135FB", fontWeight: 900, fontSize: "0.95rem" }}>₹{item.price}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Cart Panel (Fixed on Mobile) */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#FFFFFF", borderTop: "1px solid rgba(1,53,251,0.1)",
              padding: "16px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              boxShadow: "0 -10px 40px rgba(1,53,251,0.08)",
              display: "flex", flexDirection: "column", gap: 16,
              transform: cart.length > 0 ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: 20,
              borderTopLeftRadius: 24, borderTopRightRadius: 24
            }}>
              {/* Selected Items List */}
              <div style={{ maxHeight: "25vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 8 }}>
                {cart.map((c) => (
                  <div key={c.item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px 16px", borderRadius: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0A0F2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.item.name}</div>
                      <div style={{ color: "#0135FB", fontSize: "0.85rem", fontWeight: 700 }}>₹{c.item.price}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                      <button onClick={() => updateQty(c.item._id, -1)} style={{ background: "transparent", border: "none", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, cursor: "pointer", transition: "0.15s" }}>
                        <Minus size={18} strokeWidth={2.5} />
                      </button>
                      <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#0A0F2E", minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                      <button onClick={() => updateQty(c.item._id, 1)} style={{ background: "#EEF1FF", border: "none", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, cursor: "pointer", transition: "0.15s" }}>
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Payment Toggle */}
                <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 14, padding: 4, flex: 1, border: "1px solid #E2E8F0" }}>
                  <button
                    onClick={() => setPaymentMethod("Cash")}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: paymentMethod === "Cash" ? "#22C55E" : "transparent", color: paymentMethod === "Cash" ? "white" : "#64748B", fontWeight: 800, fontSize: "0.95rem", transition: "0.2s", boxShadow: paymentMethod === "Cash" ? "0 2px 8px rgba(34,197,94,0.3)" : "none" }}
                  >
                    💵 Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod("Online")}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: paymentMethod === "Online" ? "#8B5CF6" : "transparent", color: paymentMethod === "Online" ? "white" : "#64748B", fontWeight: 800, fontSize: "0.95rem", transition: "0.2s", boxShadow: paymentMethod === "Online" ? "0 2px 8px rgba(139,92,246,0.3)" : "none" }}
                  >
                    📱 Online
                  </button>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting || cart.length === 0}
                  style={{
                    flex: 1.5,
                    padding: "16px 0",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #0135FB, #3B82F6)",
                    color: "white",
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    cursor: (isSubmitting || cart.length === 0) ? "not-allowed" : "pointer",
                    opacity: (isSubmitting || cart.length === 0) ? 0.7 : 1,
                    boxShadow: "0 4px 16px rgba(1,53,251,0.35)"
                  }}
                >
                  {isSubmitting ? "Saving..." : `Pay ₹${totalAmount}`}
                  <ChevronRight size={22} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 20, color: "#0A0F2E" }}>Today's Sales</h2>
            {isLoadingSales ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6B7280", fontWeight: 600 }}>Loading sales data...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
                  <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 20, border: "1px solid rgba(1,53,251,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                    <div style={{ color: "#6B7280", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Revenue</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0135FB", marginTop: 4 }}>
                      ₹{sales.reduce((sum, s) => sum + s.totalAmount, 0)}
                    </div>
                  </div>
                  <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 4px 16px rgba(34,197,94,0.08)" }}>
                    <div style={{ color: "#6B7280", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Cash Total</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#16A34A", marginTop: 4 }}>
                      ₹{sales.filter(s => s.paymentMethod === "Cash").reduce((sum, s) => sum + s.totalAmount, 0)}
                    </div>
                  </div>
                  <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 4px 16px rgba(139,92,246,0.08)" }}>
                    <div style={{ color: "#6B7280", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Online Total</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#7C3AED", marginTop: 4 }}>
                      ₹{sales.filter(s => s.paymentMethod === "Online").reduce((sum, s) => sum + s.totalAmount, 0)}
                    </div>
                  </div>
                </div>

                {/* Sales List */}
                <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <div style={{ padding: "16px 20px", background: "#F8FAFC", borderBottom: "1px solid rgba(0,0,0,0.05)", fontWeight: 800, fontSize: "1rem", color: "#0A0F2E" }}>
                    Recent Transactions
                  </div>
                  {sales.length === 0 ? (
                    <div style={{ padding: 30, textAlign: "center", color: "#6B7280", fontWeight: 600 }}>No sales yet today.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {sales.map((sale, i) => (
                        <div key={sale._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < sales.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0A0F2E" }}>
                              {sale.items.map(item => `${item.qty}x ${item.name}`).join(", ")}
                            </div>
                            <div style={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>
                              {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0A0F2E" }}>₹{sale.totalAmount}</div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: sale.paymentMethod === "Cash" ? "#16A34A" : "#7C3AED", marginTop: 4, textTransform: "uppercase", background: sale.paymentMethod === "Cash" ? "#DCFCE7" : "#EDE9FE", display: "inline-block", padding: "2px 8px", borderRadius: 6 }}>
                              {sale.paymentMethod}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <SettingsTab items={items} fetchItems={fetchItems} />
        )}
      </main>
    </div>
  );
}

// --- Settings Sub-component ---
function SettingsTab({ items, fetchItems }: { items: PosItem[], fetchItems: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pos/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), category: "Drink" }),
      });
      if (res.ok) {
        toast.success("Item added!");
        setName("");
        setPrice("");
        fetchItems();
      } else {
        toast.error("Failed to add item");
      }
    } catch (error) {
      toast.error("Error adding item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/menu");
      const menuData = await res.json();
      const drinks = menuData.categories.find((c: any) => c.name.toLowerCase() === "coffee")?.items || [];
      
      let added = 0;
      for (const drink of drinks) {
        await fetch("/api/pos/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: drink.name, price: drink.price, category: "Drink" }),
        });
        added++;
      }
      toast.success(`Copied ${added} items from online store!`);
      fetchItems();
    } catch (error) {
      toast.error("Failed to copy items");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 20, color: "#0A0F2E" }}>Manage Menu</h2>
      
      {/* Add New Item Form */}
      <div style={{ background: "#FFFFFF", padding: 24, borderRadius: 20, border: "1px solid rgba(1,53,251,0.1)", marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16, color: "#0A0F2E" }}>Add Custom Drink</h3>
        <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="text"
            placeholder="Drink Name (e.g. Special Iced Latte)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "14px 16px", borderRadius: 12, background: "#F8FAFC", border: "2px solid #E2E8F0", color: "#0A0F2E", outline: "none", fontWeight: 600, fontSize: "0.95rem" }}
            onFocus={(e) => e.target.style.borderColor = "#0135FB"}
            onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            required
          />
          <input
            type="number"
            placeholder="Price (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ padding: "14px 16px", borderRadius: 12, background: "#F8FAFC", border: "2px solid #E2E8F0", color: "#0A0F2E", outline: "none", fontWeight: 600, fontSize: "0.95rem" }}
            onFocus={(e) => e.target.style.borderColor = "#0135FB"}
            onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
            required
          />
          <button type="submit" disabled={isSubmitting} style={{ padding: "14px", borderRadius: 12, background: "#0135FB", color: "white", border: "none", fontWeight: 800, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1, fontSize: "1rem", marginTop: 4, boxShadow: "0 4px 12px rgba(1,53,251,0.25)" }}>
            {isSubmitting ? "Adding..." : "Add to POS Menu"}
          </button>
        </form>
      </div>

      {/* Seed Option */}
      {items.length === 0 && (
        <div style={{ background: "#EEF1FF", padding: 24, borderRadius: 20, border: "2px dashed #0135FB", marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🚀</div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0135FB", marginBottom: 8 }}>Quick Start</h4>
          <p style={{ fontSize: "0.95rem", color: "#2A3060", marginBottom: 16, fontWeight: 500, lineHeight: 1.4 }}>Your POS menu is empty. You can copy the coffee menu from your online store directly into the POS system.</p>
          <button onClick={handleSeed} disabled={isSeeding} style={{ padding: "12px 24px", borderRadius: 12, background: "#0135FB", color: "white", border: "none", fontWeight: 800, cursor: "pointer", fontSize: "1rem", boxShadow: "0 4px 12px rgba(1,53,251,0.3)" }}>
            {isSeeding ? "Copying Menu..." : "Copy from Online Store"}
          </button>
        </div>
      )}

      {/* Item List */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16, color: "#0A0F2E" }}>Current POS Menu ({items.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(item => (
            <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "16px", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0A0F2E" }}>{item.name}</div>
                <div style={{ color: "#0135FB", fontSize: "0.9rem", fontWeight: 800, marginTop: 4 }}>₹{item.price}</div>
              </div>
              <div style={{ color: "#16A34A", fontSize: "0.75rem", fontWeight: 800, background: "#DCFCE7", padding: "4px 10px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
