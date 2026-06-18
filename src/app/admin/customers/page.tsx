"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ShoppingBag,
  X,
  Phone,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  Package,
  IndianRupee,
  Clock,
  ArrowLeft,
  User,
  GraduationCap,
  Home,
  TrendingUp,
  Ban,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */
interface CustomerSummary {
  userId: string;
  name: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  lastOrderDate: string;
  frequentItem: string;
}

interface CustomerProfile {
  userId: string;
  name: string;
  phone: string;
  year: string;
  accommodation: string;
  location: string;
  role: string;
  createdAt: string;
}

interface CustomerOrder {
  id: string;
  items: { item: { name: string; price: number; image?: string }; quantity: number }[];
  total: number;
  discount: number;
  couponCode: string | null;
  status: string;
  location: string;
  scheduledTime: string;
  createdAt: string;
}

interface CustomerDetail {
  profile: CustomerProfile | null;
  stats: {
    totalOrders: number;
    totalSpent: number;
    favouriteItem: string;
    cancelledOrders: number;
  };
  orders: CustomerOrder[];
}

/* ── Status badge colours ──────────────────────────────────────────── */
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  placed:           { bg: "#EEF1FF", color: "#0135FB", label: "Placed" },
  preparing:        { bg: "#FEF3C7", color: "#92400E", label: "Preparing" },
  out_for_delivery: { bg: "#DBEAFE", color: "#1E40AF", label: "Out for Delivery" },
  delivered:        { bg: "#D1FAE5", color: "#065F46", label: "Delivered" },
  cancelled:        { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* Detail panel state */
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Fetch customer list */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/customers");
        if (res.ok) setCustomers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Fetch individual customer detail */
  const openDetail = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(userId)}`);
      if (res.ok) setDetail(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setSelectedUserId(null);
    setDetail(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.userId?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ position: "relative" }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              marginBottom: "8px",
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Customers Database
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Click on any customer to view their profile &amp; order history.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 22px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
            }}
          >
            <Users size={20} color="#0055ff" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Total Customers
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>
                {customers.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          marginBottom: "24px",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
          }}
        />
        <input
          type="text"
          placeholder="Search by name, phone, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 16px 14px 46px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            color: "#0f172a",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
      </div>

      {/* ── Customer Table ────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #0055ff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            Loading customers...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    background: "#ffffff",
                  }}
                >
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Customer
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Orders
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Total Spent
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Top Item
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Last Order
                  </th>
                  <th style={{ padding: "16px 20px", width: "44px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, i) => (
                    <tr
                      key={c.userId || i}
                      onClick={() => openDetail(c.userId)}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {/* Avatar */}
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0055ff, #0033cc)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#0f172a",
                              fontWeight: 800,
                              fontSize: "0.9rem",
                              flexShrink: 0,
                            }}
                          >
                            {(c.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.95rem" }}>
                              {c.name || "Unknown"}
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{c.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "rgba(0,85,255,0.12)",
                            color: "#4d8aff",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                          }}
                        >
                          <ShoppingBag size={13} /> {c.totalOrders}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                        ₹{c.totalSpent}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600, color: "#64748b", fontSize: "0.9rem" }}>
                        {c.frequentItem || "—"}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right", fontSize: "0.85rem", color: "#64748b" }}>
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <ChevronRight size={16} color="#cbd5e1" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-over Detail Panel ───────────────────────────────────── */}
      {selectedUserId && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              animation: "panelFadeIn 0.2s ease both",
            }}
          />
          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxWidth: "560px",
              background: "#ffffff",
              borderLeft: "1px solid #e2e8f0",
              zIndex: 201,
              display: "flex",
              flexDirection: "column",
              animation: "panelSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
              overflowY: "auto",
            }}
          >
            {detailLoading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid #e2e8f0",
                    borderTop: "3px solid #0055ff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading customer details...</span>
              </div>
            ) : detail ? (
              <>
                {/* Panel Header */}
                <div
                  style={{
                    padding: "24px 28px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    background: "#ffffff",
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={closeDetail}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    onClick={closeDetail}
                    style={{
                      background: "#f8fafc",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Profile Card */}
                <div style={{ padding: "28px" }}>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eef1ff 0%, #dbeafe 100%)",
                      border: "1px solid #c7d2fe",
                      borderRadius: "20px",
                      padding: "28px",
                      marginBottom: "24px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "16px",
                          background: "linear-gradient(135deg, #0055ff, #0033cc)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0f172a",
                          fontWeight: 900,
                          fontSize: "1.5rem",
                          boxShadow: "0 8px 24px rgba(0,85,255,0.3)",
                        }}
                      >
                        {(detail.profile?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>
                          {detail.profile?.name || "Unknown Customer"}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>
                          ID: {detail.profile?.userId || selectedUserId}
                        </div>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      <InfoRow icon={<Phone size={15} />} label="Phone" value={detail.profile?.phone || "—"} />
                      <InfoRow icon={<GraduationCap size={15} />} label="Year" value={detail.profile?.year || "—"} />
                      <InfoRow icon={<Home size={15} />} label="Accommodation" value={detail.profile?.accommodation || "—"} />
                      <InfoRow icon={<MapPin size={15} />} label="Location" value={detail.profile?.location || "—"} />
                      <InfoRow
                        icon={<Calendar size={15} />}
                        label="Joined"
                        value={
                          detail.profile?.createdAt
                            ? new Date(detail.profile.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"
                        }
                      />
                      <InfoRow icon={<User size={15} />} label="Role" value={(detail.profile?.role || "user").toUpperCase()} />
                    </div>
                  </div>

                  {/* Stats Strip */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                      gap: "12px",
                      marginBottom: "28px",
                    }}
                  >
                    <StatCard icon={<ShoppingBag size={16} />} label="Orders" value={String(detail.stats.totalOrders)} color="#0055ff" />
                    <StatCard icon={<IndianRupee size={16} />} label="Spent" value={`₹${detail.stats.totalSpent}`} color="#34d399" />
                    <StatCard icon={<Star size={16} />} label="Favourite" value={detail.stats.favouriteItem} color="#f59e0b" small />
                    <StatCard icon={<Ban size={16} />} label="Cancelled" value={String(detail.stats.cancelledOrders)} color="#ef4444" />
                  </div>

                  {/* Order History */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "18px",
                      }}
                    >
                      <Package size={18} color="#0055ff" />
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#334155" }}>
                        Order History
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: "rgba(0,85,255,0.12)",
                          color: "#4d8aff",
                          padding: "2px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        {detail.orders.length}
                      </span>
                    </div>

                    {detail.orders.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          color: "#64748b",
                          background: "#ffffff",
                          borderRadius: "14px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        No orders yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {detail.orders.map((order) => {
                          const s = STATUS_STYLES[order.status] || STATUS_STYLES.placed;
                          return (
                            <div
                              key={order.id}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "18px",
                                transition: "border-color 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                            >
                              {/* Order header */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "12px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <Clock size={14} color="#71717a" />
                                  <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
                                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    ·{" "}
                                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    background: s.bg,
                                    color: s.color,
                                    padding: "3px 10px",
                                    borderRadius: "20px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  {s.label}
                                </span>
                              </div>

                              {/* Items */}
                              <div style={{ marginBottom: "12px" }}>
                                {order.items.map((ci, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "6px 0",
                                      borderBottom: idx < order.items.length - 1 ? "1px solid #f8fafc" : "none",
                                    }}
                                  >
                                    <span style={{ color: "#334155", fontSize: "0.88rem", fontWeight: 600 }}>
                                      {ci.quantity}× {ci.item?.name || "Unknown Item"}
                                    </span>
                                    <span style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 700 }}>
                                      ₹{(ci.item?.price || 0) * ci.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Order footer */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "10px",
                                  borderTop: "1px solid #e2e8f0",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <MapPin size={13} color="#71717a" />
                                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{order.location}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {order.discount > 0 && (
                                    <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>
                                      −₹{order.discount}
                                    </span>
                                  )}
                                  <span style={{ fontWeight: 900, color: "#0f172a", fontSize: "1rem" }}>
                                    ₹{order.total}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                Failed to load customer details.
              </div>
            )}
          </div>

          <style>{`
            @keyframes panelSlideIn {
              from { transform: translateX(100%); }
              to   { transform: translateX(0); }
            }
            @keyframes panelFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ── Helper Components ─────────────────────────────────────────────── */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span style={{ color: "#0055ff", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0", marginTop: "2px", wordBreak: "break-word" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        textAlign: "center",
      }}
    >
      <div style={{ color, opacity: 0.9 }}>{icon}</div>
      <div
        style={{
          fontWeight: 900,
          fontSize: small ? "0.78rem" : "1.1rem",
          color: "#0f172a",
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}
