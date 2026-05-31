"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Package, Users, DollarSign, Calendar, Target, Activity } from "lucide-react";
import { Order } from "@/lib/types";

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  const today = new Date().setHours(0,0,0,0);
  
  // Calculate stats
  const completedOrders = orders.filter(o => o.status === "delivered");
  const todayOrders = orders.filter(o => new Date(o.createdAt).setHours(0,0,0,0) === today);
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const todayRevenue = todayOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.total, 0);

  // Status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Best sellers
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCounts[i.item.name] = (itemCounts[i.item.name] || 0) + i.quantity;
  }));
  const bestSellers = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const STAT_CARDS = [
    { title: "Total Revenue", value: `₹${totalRevenue}`, icon: <DollarSign size={24}/>, color: "#059669", bg: "#D1FAE5" },
    { title: "Today's Revenue", value: `₹${todayRevenue}`, icon: <TrendingUp size={24}/>, color: "#2563EB", bg: "#DBEAFE" },
    { title: "Total Orders", value: orders.length, icon: <Package size={24}/>, color: "#7C3AED", bg: "#EDE9FE" },
    { title: "Today's Orders", value: todayOrders.length, icon: <Activity size={24}/>, color: "#EA580C", bg: "#FFEDD5" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Analytics & Reports</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Deep dive into your store's performance metrics.</p>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="otw-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "16px", background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>{stat.title}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-dark)", lineHeight: 1.1 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Order Status Breakdown */}
        <div className="otw-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Target size={20} color="var(--primary)"/> Order Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Object.entries(statusCounts).map(([status, count], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ textTransform: "capitalize", fontWeight: 600 }}>{status.replace("_", " ")}</div>
                <div style={{ fontWeight: 800, color: "var(--primary)" }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="otw-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={20} color="var(--primary)"/> Top 5 Products
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {bestSellers.map(([name, count], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div style={{ background: "var(--accent)", color: "var(--primary)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 800 }}>
                  {count} sold
                </div>
              </div>
            ))}
            {bestSellers.length === 0 && <div style={{ color: "var(--text-muted)" }}>No sales data available.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
