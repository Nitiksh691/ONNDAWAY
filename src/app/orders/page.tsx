"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { setActiveOrderId, isActiveOrderStatus } from "@/lib/activeOrder";
import { Package, Clock, MapPin, ChevronRight, RefreshCw, Compass } from "lucide-react";
import { useMenu } from "@/hooks/useMenu";

const CAT_EMOJI: Record<string, string> = {
  coffee: "☕", snacks: "🍟", meals: "🍜", drinks: "🥤",
  desserts: "🍰", burgers: "🍔", pizza: "🍕", sandwich: "🥪",
  beverages: "🧃", combo: "🎁",
};

const CAT_COLORS: string[] = [
  "#EEF1FF", "#FEF3C7", "#D1FAE5", "#FCE7F3", "#DBEAFE", "#FDE68A", "#E0E7FF", "#CFFAFE",
];

export default function OrdersPage() {
  const { user, loading } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const { menuItems: rawMenuItems, isLoading: loadingMenu } = useMenu();
  
  // For empty state categories
  const categories = Array.from(new Set(rawMenuItems.filter(i => i.available).map(i => i.category as string)));


  useEffect(() => {
    if (!loading && !user) {
      setFetching(false);
    }
  }, [user, loading]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const isDemo = typeof window !== "undefined" && localStorage.getItem("otw_demo") === "true";
        if (isDemo) {
          const demoOrders = JSON.parse(localStorage.getItem("otw_demo_orders") || "[]") as Order[];
          const myDemoOrders = demoOrders.filter(o => o.userId === user.uid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(myDemoOrders);
          setFetching(false);
          return;
        }

        const res = await fetch(`/api/orders?userId=${user.uid}`);
        if (res.ok) {
          const data: Order[] = await res.json();
          setOrders(data);
          const inProgress = data.find(o => isActiveOrderStatus(o.status));
          if (inProgress) setActiveOrderId(inProgress.id);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setFetching(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "placed": return <span className="otw-badge otw-badge-blue">Placed</span>;
      case "preparing": return <span className="otw-badge otw-badge-yellow">Preparing</span>;
      case "out_for_delivery": return <span className="otw-badge otw-badge-blue" style={{ background: "#E0F2FE", color: "#0284C7" }}>Out for Delivery</span>;
      case "delivered": return <span className="otw-badge otw-badge-green">Delivered</span>;
      case "cancelled": return <span className="otw-badge otw-badge-red">Cancelled</span>;
      default: return null;
    }
  };

  if (loading || fetching) return <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}><RefreshCw className="animate-spin" size={32} color="var(--primary)" /></div>;

  if (!user) {
    return (
      <div style={{ background: "#F5F7FF", minHeight: "calc(100vh - 68px)", padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="otw-card" style={{ padding: "40px", textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "16px" }}>Login to view orders</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Please log in to track your current orders and view order history.</p>
          <button id="nav-auth-btn" className="otw-btn otw-btn-primary" style={{ width: "100%" }} onClick={() => document.getElementById("nav-auth-btn")?.click()}>Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F5F7FF", minHeight: "calc(100vh - 68px)", padding: "40px 0" }}>
      <div className="otw-container" style={{ maxWidth: "800px" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "12px", background: "var(--accent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={24}/>
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.2 }}>My Orders</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Track and view your past cravings</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div>
            <div className="otw-card" style={{ padding: "40px 24px", textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "12px" }}>🧾</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>No orders yet</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>You haven't ordered anything yet. Let's fix that!</p>
              <Link href="/menu" className="otw-btn otw-btn-primary">Browse Full Menu</Link>
            </div>

            {categories.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Compass size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Explore Categories</h3>
                </div>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "12px",
                }}>
                  {categories.map((cat, i) => {
                    const bg = CAT_COLORS[i % CAT_COLORS.length];
                    const emoji = CAT_EMOJI[cat.toLowerCase()] || "📦";
                    const catItem = rawMenuItems.find(item => item.category === cat && item.image);

                    return (
                      <Link
                        key={cat}
                        href={`/?category=${encodeURIComponent(cat)}`}
                        style={{
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          gap: "8px", padding: "16px 12px",
                          borderRadius: "16px", background: bg,
                          textDecoration: "none",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          minHeight: "110px",
                        }}
                      >
                        {catItem?.image ? (
                          <img
                            src={catItem.image}
                            alt={cat}
                            style={{
                              width: "50px", height: "50px",
                              objectFit: "cover", borderRadius: "50%",
                              border: "2px solid rgba(255,255,255,0.8)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "2rem" }}>{emoji}</span>
                        )}
                        <span style={{
                          fontWeight: 800, fontSize: "0.8rem",
                          color: "#0f172a", textTransform: "capitalize",
                          textAlign: "center",
                        }}>
                          {cat}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* CURRENT ORDERS */}
            {orders.filter(o => isActiveOrderStatus(o.status)).length > 0 && (
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "16px", color: "var(--primary)" }}>Current Orders</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {orders.filter(o => isActiveOrderStatus(o.status)).map(order => (
                    <div key={order.id} className="otw-card" style={{ padding: "24px", border: "2px solid var(--primary)", boxShadow: "0 8px 24px rgba(1,53,251,0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14}/> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14}/> {order.location}</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--primary)" }}>
                          ₹{order.total}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                            <span style={{ fontWeight: 600 }}>{item.quantity}x {item.item.name}</span>
                            <span style={{ color: "var(--text-muted)" }}>₹{item.item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <Link href={`/track/${order.id}`} className="otw-btn otw-btn-primary" style={{ width: "100%", textAlign: "center", justifyContent: "center" }}>
                          Track Order Live <ChevronRight size={16}/>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PREVIOUS ORDERS */}
            {orders.filter(o => !isActiveOrderStatus(o.status)).length > 0 && (
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "16px", color: "var(--text-dark)" }}>Previous Orders</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {orders.filter(o => !isActiveOrderStatus(o.status)).map(order => (
                    <div key={order.id} className="otw-card" style={{ padding: "24px", opacity: 0.8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14}/> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14}/> {order.location}</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text-dark)" }}>
                          ₹{order.total}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                            <span style={{ fontWeight: 500 }}>{item.quantity}x {item.item.name}</span>
                            <span style={{ color: "var(--text-muted)" }}>₹{item.item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <Link href={`/track/${order.id}`} className="otw-btn otw-btn-outline otw-btn-sm">
                          View Details <ChevronRight size={14}/>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
