"use client";
import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { TrendingUp, Package, Users, DollarSign, Activity, Tag } from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#a0a0a0", gap: "12px", fontWeight: 700 }}>
        <div style={{ width: 24, height: 24, border: "3px solid #333", borderTop: "3px solid #0055ff", borderRadius: "50%", animation: "spin-slow 1s linear infinite" }} />
        Loading Dashboard...
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueUsers = new Set(orders.map(o => o.userId)).size;
  
  // Calculate most popular item
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items.forEach(i => {
    itemCounts[i.item.name] = (itemCounts[i.item.name] || 0) + i.quantity;
  }));
  const popularItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  // Chart data: Orders by hour
  const hoursMap: Record<number, number> = {};
  for(let i=8; i<=22; i++) hoursMap[i] = 0; // Initialize 8am to 10pm
  
  orders.forEach(o => {
    const date = o.createdAt ? new Date(o.createdAt) : new Date();
    const hour = date.getHours();
    if (hour >= 8 && hour <= 22) hoursMap[hour]++;
  });

  const chartData = Object.entries(hoursMap).map(([hour, count]) => ({
    time: `${hour}:00`,
    orders: count
  }));

  const STAT_CARDS = [
    { title: "Total Orders", value: totalOrders, icon: <Package size={24}/>, color: "#3b82f6", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)" },
    { title: "Total Revenue", value: `₹${totalRevenue}`, icon: <DollarSign size={24}/>, color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
    { title: "Unique Customers", value: uniqueUsers, icon: <Users size={24}/>, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" },
    { title: "Top Selling Item", value: popularItem[0], sub: `${popularItem[1]} portions sold`, icon: <TrendingUp size={24}/>, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
  ];

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>Dashboard</h1>
        <div style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "4px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse-dot 1.5s ease-in-out infinite" }} /> LIVE
        </div>
      </div>
      <p style={{ color: "#a0a0a0", marginBottom: "40px", fontSize: "1rem" }}>Welcome back to the ONN D A WAY admin portal. Here's your business overview.</p>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} style={{ 
            background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", 
            display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "default"
          }}
          onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${stat.bg}`; }}
          onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 64, height: 64, borderRadius: "16px", background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#a0a0a0", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>{stat.title}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{stat.value}</div>
              {stat.sub && <div style={{ fontSize: "0.75rem", color: stat.color, marginTop: "6px", fontWeight: 700 }}>{stat.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "32px", minHeight: "340px", marginBottom: "40px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "32px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
          <Activity size={20} color="#0055ff"/> Peak Order Times
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px", borderBottom: "1px solid #27272a", paddingBottom: "12px", position: "relative" }}>
          
          {/* Y-axis guidelines */}
          <div style={{ position: "absolute", left: 0, right: 0, top: "25%", borderTop: "1px dashed #333", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #333", zIndex: 0 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "75%", borderTop: "1px dashed #333", zIndex: 0 }} />

          {chartData.map((d, i) => {
            const max = Math.max(...chartData.map(c => c.orders));
            const height = max === 0 ? 0 : (d.orders / max) * 100;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", position: "relative", zIndex: 1 }}>
                <div style={{ width: "100%", maxWidth: "40px", height: `${height}%`, background: "linear-gradient(180deg, #0055ff, rgba(0,85,255,0.2))", borderRadius: "6px 6px 0 0", minHeight: height > 0 ? "4px" : "0", transition: "height 0.5s ease" }} />
                <div style={{ fontSize: "0.7rem", color: "#6b7280", transform: "rotate(-45deg)", marginTop: "12px", fontWeight: 600 }}>{d.time}</div>
                
                {/* Tooltip on hover (simple CSS hack) */}
                <div title={`${d.orders} orders`} style={{ position: "absolute", inset: 0, cursor: "pointer" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner Settings */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "32px", maxWidth: "600px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "8px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
          <Tag size={20} color="#f59e0b"/> Homepage Banner
        </h3>
        <p style={{ color: "#a0a0a0", fontSize: "0.9rem", marginBottom: "24px" }}>Control the announcement banner displayed at the top of the main menu page.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Banner Text</label>
            <input type="text" id="bannerText" defaultValue="🎉 Free delivery on all orders above ₹200!" 
              style={{ width: "100%", padding: "14px 16px", background: "#111", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", fontSize: "0.95rem", outline: "none" }} 
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Banner Link (Optional)</label>
            <input type="text" id="bannerLink" defaultValue="/menu" 
              style={{ width: "100%", padding: "14px 16px", background: "#111", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", fontSize: "0.95rem", outline: "none" }} 
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#111", padding: "16px", borderRadius: "8px", border: "1px solid #3f3f46" }}>
            <input type="checkbox" id="bannerActive" defaultChecked style={{ width: 20, height: 20, accentColor: "#0055ff", cursor: "pointer" }} />
            <label htmlFor="bannerActive" style={{ fontWeight: 700, color: "#fff", cursor: "pointer" }}>Enable Banner on Homepage</label>
          </div>
          
          <button onClick={() => {
            const text = (document.getElementById("bannerText") as HTMLInputElement).value;
            const link = (document.getElementById("bannerLink") as HTMLInputElement).value;
            const active = (document.getElementById("bannerActive") as HTMLInputElement).checked;
            localStorage.setItem("otw_demo_banner", JSON.stringify({ text, link, active }));
            import("react-hot-toast").then(({ default: toast }) => toast.success("Banner updated live! 🎉", { style: { background: "#18181b", color: "#fff", border: "1px solid #27272a" } }));
          }} 
          style={{ alignSelf: "flex-start", marginTop: "8px", background: "#0055ff", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,85,255,0.3)" }}>
            Save Banner Settings
          </button>
        </div>
      </div>
      
    </div>
  );
}
