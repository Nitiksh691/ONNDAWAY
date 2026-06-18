"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  X,
  Phone,
  Calendar,
  ChevronRight,
  IndianRupee,
  Clock,
  ArrowLeft,
  Gift,
  Coffee,
  ShoppingBag,
  Trash2,
  Star,
  Minus,
  UserPlus,
  Sparkles,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────────────── */
interface MenuItemData {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

interface CartEntry {
  menuItem: MenuItemData;
  quantity: number;
}

interface WalkInCustomerSummary {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  totalDrinks: number;
  loyaltyRedeemed: number;
  drinksInCycle: number;
  isEligibleForFree: boolean;
  lastVisit: string;
}

interface WalkInOrderItem {
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface WalkInOrder {
  id: string;
  items: WalkInOrderItem[];
  amount: number;
  drinkCount: number;
  isFreeRedeem: boolean;
  note: string;
  createdAt: string;
}

interface WalkInCustomerDetail {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  totalDrinks: number;
  loyaltyRedeemed: number;
  drinksInCycle: number;
  isEligibleForFree: boolean;
  orders: WalkInOrder[];
  createdAt: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */
const DRINK_CATEGORIES = ["coffee", "drinks"];
const LOYALTY_GOAL = 7;

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function WalkInCustomersPage() {
  const [customers, setCustomers] = useState<WalkInCustomerSummary[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* Detail panel */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WalkInCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* New customer form */
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  /* New order form */
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCustomerId, setOrderCustomerId] = useState<string | null>(null);
  const [orderCustomerName, setOrderCustomerName] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState("all");
  const [orderNote, setOrderNote] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  /* ── Fetch data ──────────────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/walkin-customers");
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        setMenuItems(
          data
            .filter((i: any) => i.available)
            .map((i: any) => ({
              id: i.id || i._id,
              name: i.name,
              price: i.price,
              category: i.category,
              image: i.image,
              available: i.available,
            }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchMenu();
  }, [fetchCustomers, fetchMenu]);

  /* ── Customer detail ─────────────────────────────────────────────── */
  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/walkin-customers/${id}`);
      if (res.ok) setDetail(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  /* ── Add customer ────────────────────────────────────────────────── */
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setAddingCustomer(true);
    try {
      const res = await fetch("/api/admin/walkin-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.exists) {
          toast("Customer already exists! Opening their profile.", {
            icon: "👋",
          });
          openDetail(data.id);
        } else {
          toast.success("Customer added!");
        }
        setNewName("");
        setNewPhone("");
        setShowAddForm(false);
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to add customer");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAddingCustomer(false);
    }
  };

  /* ── Cart operations ─────────────────────────────────────────────── */
  const addToCart = (item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + c.menuItem.price * c.quantity,
    0
  );
  const cartDrinkCount = cart.reduce((sum, c) => {
    if (DRINK_CATEGORIES.includes(c.menuItem.category)) {
      return sum + c.quantity;
    }
    return sum;
  }, 0);

  /* ── Open order form ─────────────────────────────────────────────── */
  const openOrderForm = (customerId: string, customerName: string) => {
    setOrderCustomerId(customerId);
    setOrderCustomerName(customerName);
    setCart([]);
    setMenuSearch("");
    setMenuCategory("all");
    setOrderNote("");
    setShowOrderForm(true);
  };

  /* ── Submit order ────────────────────────────────────────────────── */
  const handleSubmitOrder = async () => {
    if (!orderCustomerId || cart.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setSavingOrder(true);
    try {
      const items = cart.map((c) => ({
        name: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
        category: c.menuItem.category,
      }));

      const res = await fetch(
        `/api/admin/walkin-customers/${orderCustomerId}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            amount: cartTotal,
            drinkCount: cartDrinkCount,
            note: orderNote,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        if (data.isEligibleForFree) {
          toast("🎉 This customer earned a FREE DRINK!", {
            icon: "🎁",
            duration: 5000,
            style: {
              background: "#064e3b",
              color: "#0f172a",
              fontWeight: 800,
            },
          });
        } else {
          toast.success("Order saved!");
        }
        setShowOrderForm(false);
        setCart([]);
        fetchCustomers();
        if (selectedId === orderCustomerId) {
          openDetail(orderCustomerId);
        }
      } else {
        toast.error(data.error || "Failed to save order");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingOrder(false);
    }
  };

  /* ── Redeem free drink ───────────────────────────────────────────── */
  const handleRedeem = async (customerId: string) => {
    try {
      const res = await fetch(
        `/api/admin/walkin-customers/${customerId}/redeem`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("🎉 Free drink redeemed!");
        fetchCustomers();
        if (selectedId === customerId) {
          openDetail(customerId);
        }
      } else {
        toast.error(data.error || "Failed to redeem");
      }
    } catch {
      toast.error("Network error");
    }
  };

  /* ── Delete customer ─────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer and all their order history?")) return;
    try {
      const res = await fetch(`/api/admin/walkin-customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Customer deleted");
        closeDetail();
        fetchCustomers();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  /* ── Filtered data ───────────────────────────────────────────────── */
  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const categories = ["all", ...Array.from(new Set(menuItems.map((i) => i.category)))];
  const filteredMenu = menuItems.filter((i) => {
    const matchesSearch = i.name
      .toLowerCase()
      .includes(menuSearch.toLowerCase());
    const matchesCat = menuCategory === "all" || i.category === menuCategory;
    return matchesSearch && matchesCat;
  });

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={{ position: "relative" }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              marginBottom: "6px",
              color: "#0f172a",
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Coffee size={28} color="#0055ff" />
            Walk-in Customers
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Manage in-store customers, track orders & loyalty rewards
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Stats badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              background: "linear-gradient(135deg, rgba(0,85,255,0.1), rgba(0,85,255,0.05))",
              border: "1px solid rgba(0,85,255,0.2)",
              borderRadius: "12px",
            }}
          >
            <Users size={18} color="#0055ff" />
            <div>
              <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Customers
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a" }}>
                {customers.length}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              background: "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.05))",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: "12px",
            }}
          >
            <Gift size={18} color="#34d399" />
            <div>
              <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Free Drinks Given
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#34d399" }}>
                {customers.reduce((s, c) => s + c.loyaltyRedeemed, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons + Search ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: "linear-gradient(135deg, #0055ff, #0033cc)",
            color: "#0f172a",
            border: "none",
            padding: "12px 22px",
            borderRadius: "12px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(0,85,255,0.3)",
            transition: "all 0.2s",
          }}
        >
          <UserPlus size={18} /> New Customer
        </button>
        <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "360px" }}>
          <Search
            size={17}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              color: "#0f172a",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
        </div>
      </div>

      {/* ── Customer Table / Cards ──────────────────────────────────── */}
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
                width: 32, height: 32,
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #0055ff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#64748b",
            }}
          >
            <Coffee size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <div style={{ fontWeight: 700, marginBottom: "8px", color: "#64748b" }}>
              {search ? "No customers match your search" : "No walk-in customers yet"}
            </div>
            <div style={{ fontSize: "0.85rem" }}>
              {search
                ? "Try a different search term"
                : 'Click "New Customer" to add your first walk-in customer'}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="walkin-desktop-table" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
                    <th style={thStyle}>Customer</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Orders</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Spent</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Loyalty</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Last Visit</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => openDetail(c.id)}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: 40, height: 40,
                              borderRadius: "12px",
                              background: c.isEligibleForFree
                                ? "linear-gradient(135deg, #059669, #047857)"
                                : "linear-gradient(135deg, #0055ff, #0033cc)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#0f172a", fontWeight: 800, fontSize: "0.95rem", flexShrink: 0,
                              boxShadow: c.isEligibleForFree ? "0 0 16px rgba(5,150,105,0.4)" : "none",
                              animation: c.isEligibleForFree ? "loyaltyPulse 2s ease-in-out infinite" : "none",
                            }}
                          >
                            {c.isEligibleForFree ? <Gift size={18} /> : c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                              {c.name}
                              {c.isEligibleForFree && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    background: "linear-gradient(135deg, #059669, #047857)",
                                    color: "#0f172a",
                                    padding: "2px 8px",
                                    borderRadius: "20px",
                                    animation: "loyaltyPulse 2s ease-in-out infinite",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  🎁 FREE DRINK!
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{c.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center" }}>
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
                      <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                        ₹{c.totalSpent}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "center" }}>
                        <LoyaltyDots current={c.drinksInCycle} size="sm" />
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right", fontSize: "0.82rem", color: "#64748b" }}>
                        {c.lastVisit
                          ? new Date(c.lastVisit).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openOrderForm(c.id, c.name)}
                            title="Add Order"
                            style={{
                              width: 34, height: 34,
                              borderRadius: "8px",
                              border: "1px solid rgba(0,85,255,0.3)",
                              background: "rgba(0,85,255,0.1)",
                              color: "#4d8aff",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(0,85,255,0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(0,85,255,0.1)";
                            }}
                          >
                            <Plus size={16} />
                          </button>
                          {c.isEligibleForFree && (
                            <button
                              onClick={() => handleRedeem(c.id)}
                              title="Redeem Free Drink"
                              style={{
                                width: 34, height: 34,
                                borderRadius: "8px",
                                border: "1px solid rgba(52,211,153,0.3)",
                                background: "rgba(52,211,153,0.15)",
                                color: "#34d399",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                animation: "loyaltyPulse 2s ease-in-out infinite",
                                transition: "all 0.15s",
                              }}
                            >
                              <Gift size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="walkin-mobile-cards" style={{ padding: "12px", display: "none", flexDirection: "column", gap: "10px" }}>
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openDetail(c.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: 38, height: 38,
                          borderRadius: "10px",
                          background: c.isEligibleForFree
                            ? "linear-gradient(135deg, #059669, #047857)"
                            : "linear-gradient(135deg, #0055ff, #0033cc)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#0f172a", fontWeight: 800, fontSize: "0.9rem",
                          animation: c.isEligibleForFree ? "loyaltyPulse 2s ease-in-out infinite" : "none",
                        }}
                      >
                        {c.isEligibleForFree ? <Gift size={16} /> : c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.9rem" }}>{c.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{c.phone}</div>
                      </div>
                    </div>
                    {c.isEligibleForFree && (
                      <span
                        style={{
                          fontSize: "0.6rem", fontWeight: 800,
                          background: "linear-gradient(135deg, #059669, #047857)",
                          color: "#0f172a", padding: "3px 8px", borderRadius: "20px",
                          animation: "loyaltyPulse 2s ease-in-out infinite",
                          textTransform: "uppercase",
                        }}
                      >
                        🎁 FREE!
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Orders</div>
                        <div style={{ fontWeight: 800, color: "#4d8aff", fontSize: "0.9rem" }}>{c.totalOrders}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Spent</div>
                        <div style={{ fontWeight: 800, color: "#34d399", fontSize: "0.9rem" }}>₹{c.totalSpent}</div>
                      </div>
                    </div>
                    <LoyaltyDots current={c.drinksInCycle} size="sm" />
                  </div>
                  {/* Mobile action buttons */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid #f8fafc", paddingTop: "12px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openOrderForm(c.id, c.name)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0,85,255,0.3)",
                        background: "rgba(0,85,255,0.1)",
                        color: "#4d8aff",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "6px", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit",
                      }}
                    >
                      <Plus size={14} /> Add Order
                    </button>
                    {c.isEligibleForFree && (
                      <button
                        onClick={() => handleRedeem(c.id)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1px solid rgba(52,211,153,0.3)",
                          background: "rgba(52,211,153,0.15)",
                          color: "#34d399",
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          gap: "6px", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit",
                          animation: "loyaltyPulse 2s ease-in-out infinite",
                        }}
                      >
                        <Gift size={14} /> Redeem Free
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Add Customer Modal ──────────────────────────────────────── */}
      {showAddForm && (
        <>
          <div
            onClick={() => setShowAddForm(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 300,
              animation: "panelFadeIn 0.2s ease both",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 301,
              width: "95%", maxWidth: "440px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              padding: "0",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px 28px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: 42, height: 42,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0055ff, #0033cc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,85,255,0.3)",
                  }}
                >
                  <UserPlus size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a" }}>New Customer</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Add a walk-in customer</div>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: "#e2e8f0", border: "none", borderRadius: "8px",
                  padding: "8px", color: "#64748b", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} style={{ padding: "24px 28px 28px" }}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "#ffffff", border: "1px solid #cbd5e1",
                    borderRadius: "10px", color: "#0f172a",
                    fontSize: "1rem", fontFamily: "inherit", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 16px",
                    background: "#ffffff", border: "1px solid #cbd5e1",
                    borderRadius: "10px", color: "#0f172a",
                    fontSize: "1rem", fontFamily: "inherit", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                />
              </div>
              <button
                type="submit"
                disabled={addingCustomer}
                style={{
                  width: "100%", padding: "14px",
                  background: "linear-gradient(135deg, #0055ff, #0033cc)",
                  color: "#0f172a", border: "none",
                  borderRadius: "12px", fontWeight: 900,
                  fontSize: "0.95rem", cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 16px rgba(0,85,255,0.35)",
                  opacity: addingCustomer ? 0.7 : 1,
                  transition: "opacity 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {addingCustomer ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Add Customer
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Order Form Modal (with Menu Picker) ────────────────────── */}
      {showOrderForm && (
        <>
          <div
            onClick={() => setShowOrderForm(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 300,
              animation: "panelFadeIn 0.2s ease both",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 301,
              width: "95%", maxWidth: "680px",
              maxHeight: "92vh",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Order modal header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShoppingBag size={20} color="#0055ff" />
                  New Order
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                  for <span style={{ color: "#0055ff", fontWeight: 700 }}>{orderCustomerName}</span>
                </div>
              </div>
              <button
                onClick={() => setShowOrderForm(false)}
                style={{
                  background: "#e2e8f0", border: "none", borderRadius: "8px",
                  padding: "8px", color: "#64748b", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              {/* Menu browser */}
              <div style={{ padding: "16px 24px 8px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#64748b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Select Items from Menu
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
                    <Search
                      size={15}
                      style={{
                        position: "absolute", left: "12px", top: "50%",
                        transform: "translateY(-50%)", color: "#64748b",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search menu..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px 10px 36px",
                        background: "#ffffff", border: "1px solid #e2e8f0",
                        borderRadius: "10px", color: "#0f172a", fontSize: "0.85rem",
                        fontFamily: "inherit", outline: "none",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                    />
                  </div>
                </div>
                {/* Category pills */}
                <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMenuCategory(cat)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: "1px solid",
                        borderColor: menuCategory === cat ? "#0055ff" : "#e2e8f0",
                        background: menuCategory === cat ? "rgba(0,85,255,0.15)" : "#ffffff",
                        color: menuCategory === cat ? "#4d8aff" : "#a0a0a0",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                        textTransform: "capitalize",
                        transition: "all 0.15s",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu items grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "8px",
                  padding: "8px 24px 16px",
                  maxHeight: "240px",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
              >
                {filteredMenu.map((item) => {
                  const inCart = cart.find((c) => c.menuItem.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      style={{
                        background: inCart ? "rgba(0,85,255,0.1)" : "#ffffff",
                        border: `1px solid ${inCart ? "rgba(0,85,255,0.3)" : "#e2e8f0"}`,
                        borderRadius: "12px",
                        padding: "12px 14px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onMouseEnter={(e) => {
                        if (!inCart) e.currentTarget.style.borderColor = "#cbd5e1";
                      }}
                      onMouseLeave={(e) => {
                        if (!inCart) e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700, fontSize: "0.85rem", color: "#334155",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#34d399" }}>
                            ₹{item.price}
                          </span>
                          {DRINK_CATEGORIES.includes(item.category) && (
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 5px", borderRadius: "4px" }}>
                              DRINK
                            </span>
                          )}
                        </div>
                      </div>
                      {inCart ? (
                        <div
                          style={{
                            display: "flex", alignItems: "center", gap: "2px",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{
                              width: 26, height: 26,
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(239,68,68,0.15)",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.85rem",
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span
                            style={{
                              minWidth: "26px",
                              textAlign: "center",
                              fontWeight: 900,
                              fontSize: "0.9rem",
                              color: "#4d8aff",
                            }}
                          >
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{
                              width: 26, height: 26,
                              borderRadius: "6px",
                              border: "none",
                              background: "rgba(0,85,255,0.15)",
                              color: "#4d8aff",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.85rem",
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 28, height: 28,
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#64748b", flexShrink: 0,
                          }}
                        >
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cart summary */}
              {cart.length > 0 && (
                <div
                  style={{
                    margin: "0 24px 16px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#334155" }}>
                      Order Summary
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {cart.reduce((s, c) => s + c.quantity, 0)} items
                    </span>
                  </div>
                  <div style={{ padding: "8px 16px" }}>
                    {cart.map((c) => (
                      <div
                        key={c.menuItem.id}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 0",
                          borderBottom: "1px solid #f8fafc",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#334155" }}>
                            {c.quantity}× {c.menuItem.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#64748b" }}>
                            ₹{c.menuItem.price * c.quantity}
                          </span>
                          <button
                            onClick={() => removeFromCart(c.menuItem.id)}
                            style={{
                              background: "none", border: "none",
                              color: "#ef4444", cursor: "pointer",
                              display: "flex", alignItems: "center",
                              padding: "4px",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid #e2e8f0",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 900, color: "#0f172a", fontSize: "1.05rem" }}>
                        ₹{cartTotal}
                      </span>
                      {cartDrinkCount > 0 && (
                        <span style={{ fontSize: "0.72rem", color: "#f59e0b", marginLeft: "10px", fontWeight: 700 }}>
                          +{cartDrinkCount} drink{cartDrinkCount > 1 ? "s" : ""} toward loyalty
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Order note */}
              <div style={{ padding: "0 24px 16px" }}>
                <input
                  type="text"
                  placeholder="Order note (optional)..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px",
                    background: "#ffffff", border: "1px solid #e2e8f0",
                    borderRadius: "10px", color: "#0f172a",
                    fontSize: "0.85rem", fontFamily: "inherit", outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0055ff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            {/* Order submit button */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                background: "#ffffff",
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || savingOrder}
                style={{
                  width: "100%", padding: "14px",
                  background: cart.length === 0
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #0055ff, #0033cc)",
                  color: cart.length === 0 ? "#71717a" : "#fff",
                  border: "none", borderRadius: "12px",
                  fontWeight: 900, fontSize: "0.95rem",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: cart.length === 0 ? "none" : "0 4px 16px rgba(0,85,255,0.35)",
                  opacity: savingOrder ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {savingOrder ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {cart.length === 0
                      ? "Select items to place order"
                      : `Place Order · ₹${cartTotal}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Customer Detail Slide-over ─────────────────────────────── */}
      {selectedId && (
        <>
          <div
            onClick={closeDetail}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              animation: "panelFadeIn 0.2s ease both",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0, right: 0, bottom: 0,
              width: "100%", maxWidth: "540px",
              background: "#ffffff",
              borderLeft: "1px solid #e2e8f0",
              zIndex: 201,
              display: "flex", flexDirection: "column",
              animation: "panelSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
              overflowY: "auto",
            }}
          >
            {detailLoading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
                <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTop: "3px solid #0055ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading...</span>
              </div>
            ) : detail ? (
              <>
                {/* Panel header */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    position: "sticky", top: 0,
                    background: "#ffffff", zIndex: 10,
                  }}
                >
                  <button
                    onClick={closeDetail}
                    style={{
                      background: "none", border: "none", color: "#64748b",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                      fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem",
                      padding: "8px 12px", borderRadius: "8px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openOrderForm(detail.id, detail.name)}
                      style={{
                        background: "linear-gradient(135deg, #0055ff, #0033cc)",
                        color: "#0f172a", border: "none",
                        padding: "8px 16px", borderRadius: "8px",
                        fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <Plus size={15} /> Order
                    </button>
                    <button
                      onClick={() => handleDelete(detail.id)}
                      style={{
                        background: "#f8fafc", border: "none",
                        borderRadius: "8px", padding: "8px",
                        color: "#ef4444", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: "24px" }}>
                  {/* Profile card */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eef1ff 0%, #dbeafe 100%)",
                      border: "1px solid #c7d2fe",
                      borderRadius: "20px",
                      padding: "24px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                      <div
                        style={{
                          width: 56, height: 56,
                          borderRadius: "16px",
                          background: "linear-gradient(135deg, #0055ff, #0033cc)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#0f172a", fontWeight: 900, fontSize: "1.4rem",
                          boxShadow: "0 8px 24px rgba(0,85,255,0.3)",
                        }}
                      >
                        {detail.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a" }}>
                          {detail.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <Phone size={13} color="#64748b" />
                          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                            {detail.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                      <MiniStat label="Orders" value={String(detail.totalOrders)} color="#4d8aff" />
                      <MiniStat label="Spent" value={`₹${detail.totalSpent}`} color="#34d399" />
                      <MiniStat label="Free Drinks" value={String(detail.loyaltyRedeemed)} color="#f59e0b" />
                    </div>
                  </div>

                  {/* Loyalty tracker */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: `1px solid ${detail.isEligibleForFree ? "rgba(52,211,153,0.3)" : "#e2e8f0"}`,
                      borderRadius: "16px",
                      padding: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#334155" }}>
                          Loyalty Progress
                        </span>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>
                        {detail.totalDrinks} total drinks
                      </span>
                    </div>
                    <LoyaltyDots current={detail.drinksInCycle} size="lg" />
                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      {detail.isEligibleForFree ? (
                        <button
                          onClick={() => handleRedeem(detail.id)}
                          style={{
                            background: "linear-gradient(135deg, #059669, #047857)",
                            color: "#0f172a", border: "none",
                            padding: "12px 28px", borderRadius: "12px",
                            fontWeight: 900, fontSize: "0.9rem",
                            cursor: "pointer", fontFamily: "inherit",
                            animation: "loyaltyPulse 2s ease-in-out infinite",
                            boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
                            display: "inline-flex", alignItems: "center", gap: "8px",
                          }}
                        >
                          <Gift size={18} /> Redeem Free Drink 🎉
                        </button>
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                          <span style={{ color: "#f59e0b", fontWeight: 800 }}>
                            {6 - detail.drinksInCycle}
                          </span>{" "}
                          more drink{6 - detail.drinksInCycle !== 1 ? "s" : ""} until free drink
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order history */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <Clock size={18} color="#0055ff" />
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "#334155" }}>
                        Order History
                      </span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(0,85,255,0.12)", color: "#4d8aff", padding: "2px 10px", borderRadius: "20px" }}>
                        {detail.orders.length}
                      </span>
                    </div>

                    {detail.orders.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        No orders yet
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {detail.orders.map((order) => (
                          <div
                            key={order.id}
                            style={{
                              background: order.isFreeRedeem
                                ? "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(5,150,105,0.03))"
                                : "#ffffff",
                              border: `1px solid ${order.isFreeRedeem ? "rgba(52,211,153,0.2)" : "#e2e8f0"}`,
                              borderRadius: "14px",
                              padding: "16px",
                              transition: "border-color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = order.isFreeRedeem ? "rgba(52,211,153,0.4)" : "#cbd5e1")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = order.isFreeRedeem ? "rgba(52,211,153,0.2)" : "#e2e8f0")}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Calendar size={13} color="#71717a" />
                                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
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
                              {order.isFreeRedeem ? (
                                <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase" }}>
                                  🎁 Free Drink
                                </span>
                              ) : (
                                <span style={{ fontWeight: 900, color: "#0f172a", fontSize: "0.95rem" }}>
                                  ₹{order.amount}
                                </span>
                              )}
                            </div>
                            <div>
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "4px 0",
                                    borderBottom: idx < order.items.length - 1 ? "1px solid #f8fafc" : "none",
                                  }}
                                >
                                  <span style={{ color: "#334155", fontSize: "0.85rem", fontWeight: 600 }}>
                                    {item.quantity}× {item.name}
                                  </span>
                                  <span style={{ color: "#64748b", fontSize: "0.82rem", fontWeight: 700 }}>
                                    ₹{item.price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {order.note && (
                              <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "#f59e0b", fontStyle: "italic" }}>
                                {order.note}
                              </div>
                            )}
                            {order.drinkCount > 0 && !order.isFreeRedeem && (
                              <div style={{ marginTop: "8px", fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Star size={11} color="#f59e0b" />
                                +{order.drinkCount} drink{order.drinkCount > 1 ? "s" : ""} loyalty
                              </div>
                            )}
                          </div>
                        ))}
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
        </>
      )}

      {/* ── Styles ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes panelFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loyaltyPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(52,211,153,0.3); }
          50% { box-shadow: 0 0 24px rgba(52,211,153,0.6); }
        }
        @keyframes dotFill {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @media(max-width: 768px) {
          .walkin-desktop-table { display: none !important; }
          .walkin-mobile-cards { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Helper: Table header style ──────────────────────────────────── */
const thStyle: React.CSSProperties = {
  padding: "14px 20px",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

/* ── Loyalty Dots Component ──────────────────────────────────────── */
function LoyaltyDots({
  current,
  size = "sm",
}: {
  current: number;
  size?: "sm" | "lg";
}) {
  const dotSize = size === "lg" ? 36 : 20;
  const gap = size === "lg" ? 8 : 4;
  const iconSize = size === "lg" ? 16 : 10;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: LOYALTY_GOAL }).map((_, i) => {
        const isFilled = i < current;
        const isFree = i === LOYALTY_GOAL - 1;
        const isNext = i === current;

        return (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              animation: isFilled ? `dotFill 0.3s ease ${i * 0.05}s both` : "none",
              ...(isFree
                ? {
                    background: isFilled || current >= 6
                      ? "linear-gradient(135deg, #059669, #047857)"
                      : "#e2e8f0",
                    border: `2px solid ${isFilled || current >= 6 ? "#34d399" : "#cbd5e1"}`,
                    boxShadow: isFilled || current >= 6 ? "0 0 12px rgba(52,211,153,0.4)" : "none",
                  }
                : isFilled
                ? {
                    background: "linear-gradient(135deg, #0055ff, #0033cc)",
                    border: "2px solid #4d8aff",
                    boxShadow: "0 0 8px rgba(0,85,255,0.3)",
                  }
                : isNext
                ? {
                    background: "transparent",
                    border: "2px dashed #4d8aff",
                  }
                : {
                    background: "#e2e8f0",
                    border: "2px solid #cbd5e1",
                  }),
            }}
            title={
              isFree
                ? "Free drink!"
                : isFilled
                ? `Drink ${i + 1} ✓`
                : `Drink ${i + 1}`
            }
          >
            {isFree ? (
              <Gift size={iconSize} color={isFilled || current >= 6 ? "#fff" : "#71717a"} />
            ) : isFilled ? (
              <Check size={iconSize} color="#fff" />
            ) : size === "lg" ? (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b" }}>
                {i + 1}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ── Mini Stat Card ──────────────────────────────────────────────── */
function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "12px 10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 900, color }}>
        {value}
      </div>
    </div>
  );
}
