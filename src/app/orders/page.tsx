"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Order } from "@/lib/types";
import { Package, Clock, MapPin, ChevronRight, RefreshCw } from "lucide-react";

export default function OrdersPage() {
  const { user, loading } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setFetching(false);
    }
  }, [user, loading]);

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
          const data = await res.json();
          setOrders(data);
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
          <div className="otw-card" style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🧾</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px" }}>No orders yet</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>You haven't ordered anything yet. Let's fix that!</p>
            <Link href="/" className="otw-btn otw-btn-primary">Browse Menu</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map(order => (
              <div key={order.id} className="otw-card" style={{ padding: "24px" }}>
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
                  <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--primary)" }}>
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
                  <Link href={`/track/${order.id}`} className="otw-btn otw-btn-outline otw-btn-sm">
                    {order.status === "delivered" ? "View Details" : "Track Order"} <ChevronRight size={14}/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
