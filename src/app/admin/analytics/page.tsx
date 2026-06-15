"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Package, Users, DollarSign, Target, Activity, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    todayOrders: number;
    avgOrderValue: number;
  };
  statusBreakdown: Record<string, number>;
  bestSellers: { name: string; count: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export default function AnalyticsPage() {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.ok ? r.json() : Promise.reject("Failed"))
      .then((d) => setData(d))
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text-muted)" }}>
      Loading analytics...
    </div>
  );
  if (error) return <div style={{ color: "var(--error)", padding: 24 }}>{error}</div>;
  if (!data)  return null;

  const { summary, statusBreakdown, bestSellers, revenueByDay } = data;

  const STAT_CARDS = [
    { title: "Total Revenue",      value: `₹${summary.totalRevenue.toLocaleString()}`,  icon: <DollarSign size={24}/>, color: "#059669", bg: "#D1FAE5" },
    { title: "Today's Revenue",    value: `₹${summary.todayRevenue.toLocaleString()}`,  icon: <TrendingUp size={24}/>, color: "#2563EB", bg: "#DBEAFE" },
    { title: "Total Orders",       value: summary.totalOrders,                          icon: <Package size={24}/>,    color: "#7C3AED", bg: "#EDE9FE" },
    { title: "Today's Orders",     value: summary.todayOrders,                          icon: <Activity size={24}/>,   color: "#EA580C", bg: "#FFEDD5" },
    { title: "Avg Order Value",    value: `₹${summary.avgOrderValue}`,                  icon: <BarChart2 size={24}/>,  color: "#0891B2", bg: "#E0F2FE" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    delivered:        "#22C55E",
    placed:           "#3B82F6",
    preparing:        "#F59E0B",
    out_for_delivery: "#8B5CF6",
    cancelled:        "#EF4444",
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Analytics &amp; Reports</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Deep dive into your store's performance metrics.</p>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {STAT_CARDS.map((stat, i) => (
          <div key={i} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#71717a", fontWeight: 600, marginBottom: "4px" }}>{stat.title}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "white", lineHeight: 1.1 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueByDay.length > 0 && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "24px", color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="#3B82F6" /> Revenue — Last 30 Days
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, color: "white" }}
                formatter={(v) => [`₹${Number(v ?? 0)}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2}
                fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#3B82F6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "start" }}>
        {/* Order Status Breakdown */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
            <Target size={18} color="var(--primary)" /> Order Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {Object.entries(statusBreakdown).map(([status, count], i) => {
              const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              const color = STATUS_COLORS[status] ?? "#6B7280";
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600, color: "#d4d4d8", fontSize: "0.88rem" }}>
                      {status.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontWeight: 800, color }}>
                      {count} <span style={{ color: "#52525b", fontWeight: 500, fontSize: "0.8rem" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#27272a", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Sellers */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
            <Package size={18} color="var(--primary)" /> Top 5 Products
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {bestSellers.map(({ name, count }, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #27272a", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: "#d4d4d8", fontSize: "0.9rem" }}>{name}</span>
                </div>
                <span style={{ background: "#3B82F620", color: "#60A5FA", padding: "3px 10px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                  {count} sold
                </span>
              </div>
            ))}
            {bestSellers.length === 0 && <div style={{ color: "#52525b" }}>No sales data yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
