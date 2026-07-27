"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Plus, X, Phone, Calendar, ArrowLeft, Gift, Coffee, ShoppingBag, Trash2, Minus, UserPlus, Sparkles, Check, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { useMenu } from "@/hooks/useMenu";

/* ── Types ─────────────────────────────────────────────────────────── */
interface MenuItemData { id: string; name: string; price: number; category: string; available: boolean; }
interface CartEntry { menuItem: MenuItemData; quantity: number; }
interface WalkInCustomerSummary { id: string; name: string; phone: string; totalOrders: number; totalDrinks: number; drinksInCycle: number; isEligibleForFree: boolean; lastVisit: string; }
interface WalkInOrderItem { name: string; price: number; quantity: number; category: string; }
interface WalkInOrder { id: string; items: WalkInOrderItem[]; drinkCount: number; isFreeRedeem: boolean; note: string; createdAt: string; }
interface WalkInCustomerDetail { id: string; name: string; phone: string; totalOrders: number; totalDrinks: number; drinksInCycle: number; isEligibleForFree: boolean; orders: WalkInOrder[]; }

const DRINK_CATEGORIES = ["coffee", "drinks"];
const LOYALTY_GOAL = 7;

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function DeliveryWalkInPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<WalkInCustomerSummary[]>([]);
  const { menuItems: rawMenuItems } = useMenu();
  const menuItems: MenuItemData[] = rawMenuItems.filter(i => i.available).map(i => ({
    id: i.id, name: i.name, price: i.price, category: i.category, available: i.available,
  }));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WalkInCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCustomerId, setOrderCustomerId] = useState<string | null>(null);
  const [orderCustomerName, setOrderCustomerName] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState("all");
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/walkin-customers");
      if (res.ok) setCustomers(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id); setDetail(null); setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/walkin-customers/${id}`);
      if (res.ok) setDetail(await res.json());
    } catch (err) { console.error(err); } finally { setDetailLoading(false); }
  }, []);

  const closeDetail = () => { setSelectedId(null); setDetail(null); };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return toast.error("Name and phone are required");
    setAddingCustomer(true);
    try {
      const res = await fetch("/api/admin/walkin-customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Customer added!");
        setNewName(""); setNewPhone(""); setShowAddForm(false); fetchCustomers();
        if (data.exists) openDetail(data.id);
      } else toast.error(data.error || "Failed to add customer");
    } catch { toast.error("Network error"); } finally { setAddingCustomer(false); }
  };

  const addToCart = (item: MenuItemData) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItem.id === item.id);
      if (ex) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const cartDrinkCount = cart.reduce((sum, c) => DRINK_CATEGORIES.includes(c.menuItem.category) ? sum + c.quantity : sum, 0);

  const openOrderForm = (customerId: string, customerName: string) => {
    setOrderCustomerId(customerId); setOrderCustomerName(customerName); setCart([]);
    setMenuSearch(""); setMenuCategory("all"); setShowOrderForm(true);
  };

  const handleSubmitOrder = async () => {
    if (!orderCustomerId || cart.length === 0) return toast.error("Please add items");
    setSavingOrder(true);
    try {
      const items = cart.map(c => ({ name: c.menuItem.name, price: c.menuItem.price, quantity: c.quantity, category: c.menuItem.category }));
      const res = await fetch(`/api/admin/walkin-customers/${orderCustomerId}/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, amount: cartTotal, drinkCount: cartDrinkCount, note: "" }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isEligibleForFree) toast.success("🎉 FREE DRINK EARNED!");
        else toast.success("Order placed successfully!");
        setShowOrderForm(false); setCart([]); fetchCustomers();
        if (selectedId === orderCustomerId) openDetail(orderCustomerId);
      } else toast.error(data.error || "Failed to save order");
    } catch { toast.error("Network error"); } finally { setSavingOrder(false); }
  };

  const handleRedeem = async (customerId: string) => {
    try {
      const res = await fetch(`/api/admin/walkin-customers/${customerId}/redeem`, { method: "POST" });
      if (res.ok) {
        toast.success("🎉 Free drink redeemed!"); fetchCustomers();
        if (selectedId === customerId) openDetail(customerId);
      } else toast.error("Failed to redeem");
    } catch { toast.error("Network error"); }
  };

  const filteredCustomers = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
  const categories = ["all", ...Array.from(new Set(menuItems.map((i) => i.category)))];
  const filteredMenu = menuItems.filter(i => (menuCategory === "all" || i.category === menuCategory) && i.name.toLowerCase().includes(menuSearch.toLowerCase()));

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingBottom: "80px" }}>
      {/* ── Header ── */}
      <div style={{ background: "var(--primary)", color: "white", padding: "20px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          <button onClick={() => router.push('/delivery/dashboard')} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 600, padding: 0, width: "fit-content" }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <Users size={24} /> Walk-in Customers
              </h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.8 }}>Manage offline orders & loyalty</p>
            </div>
            <button onClick={() => setShowAddForm(true)} style={{ background: "white", color: "var(--primary)", border: "none", padding: "10px 16px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
              <UserPlus size={18} /> <span className="hide-mobile">Add New</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
          <input type="text" placeholder="Search customer by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "16px 16px 16px 44px", background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", fontSize: "1rem", outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }} />
        </div>

        {/* Customer List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: "1px dashed #CBD5E1", color: "#64748B" }}>
            <Coffee size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 600 }}>No customers found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filteredCustomers.map(c => (
              <div key={c.id} onClick={() => openDetail(c.id)} style={{ background: "white", borderRadius: "16px", padding: "20px", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "12px", background: c.isEligibleForFree ? "#10B981" : "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem" }}>
                      {c.isEligibleForFree ? <Gift size={20} /> : c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>{c.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "#64748B" }}>{c.phone}</div>
                    </div>
                  </div>
                  {c.isEligibleForFree && (
                    <span style={{ background: "#10B981", color: "white", fontSize: "0.7rem", fontWeight: 800, padding: "4px 8px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Gift size={12} /> FREE
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Orders</div>
                    <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>{c.totalOrders}</div>
                  </div>
                  <LoyaltyDots current={c.drinksInCycle} />
                </div>

                <div style={{ display: "flex", gap: "10px" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openOrderForm(c.id, c.name)} style={{ flex: 1, padding: "10px", background: "#EFF6FF", color: "var(--primary)", border: "1px solid #BFDBFE", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Plus size={16} /> Order
                  </button>
                  {c.isEligibleForFree && (
                    <button onClick={() => handleRedeem(c.id)} style={{ flex: 1, padding: "10px", background: "#ECFDF5", color: "#10B981", border: "1px solid #A7F3D0", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <Gift size={16} /> Redeem
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-over Detail ── */}
      {selectedId && (
        <>
          <div onClick={closeDetail} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 100, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "480px", background: "white", zIndex: 101, display: "flex", flexDirection: "column", boxShadow: "-8px 0 32px rgba(0,0,0,0.1)", animation: "slideIn 0.3s ease" }}>
            {detailLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Loading...</div>
            ) : detail ? (
              <>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", zIndex: 10 }}>
                  <button onClick={closeDetail} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#64748B", cursor: "pointer" }}><ArrowLeft size={18} /> Back</button>
                  <button onClick={() => openOrderForm(detail.id, detail.name)} style={{ background: "var(--primary)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><Plus size={16} /> Order</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", marginBottom: "24px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "16px", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.8rem", margin: "0 auto 12px" }}>{detail.name.charAt(0).toUpperCase()}</div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", color: "#0F172A", fontWeight: 800 }}>{detail.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#64748B", fontSize: "0.9rem", fontWeight: 600 }}><Phone size={14} /> {detail.phone}</div>
                  </div>

                  <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}><Sparkles size={18} color="#F59E0B" /> Loyalty</div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748B" }}>{detail.totalDrinks} total drinks</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                      <LoyaltyDots current={detail.drinksInCycle} size="lg" />
                    </div>
                    {detail.isEligibleForFree ? (
                      <button onClick={() => handleRedeem(detail.id)} style={{ width: "100%", background: "#10B981", color: "white", border: "none", padding: "12px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                        <Gift size={18} /> Redeem Free Drink 🎉
                      </button>
                    ) : (
                      <div style={{ textAlign: "center", fontSize: "0.9rem", color: "#64748B", fontWeight: 600 }}>
                        <span style={{ color: "#F59E0B", fontWeight: 800 }}>{6 - detail.drinksInCycle}</span> more drink{6 - detail.drinksInCycle !== 1 ? "s" : ""} until free!
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><ShoppingBag size={18} color="var(--primary)" /> Order History</h3>
                    {detail.orders.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "30px", background: "#F8FAFC", borderRadius: "12px", color: "#64748B" }}>No past orders</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {detail.orders.map(order => (
                          <div key={order.id} style={{ background: order.isFreeRedeem ? "#ECFDF5" : "white", border: "1px solid", borderColor: order.isFreeRedeem ? "#A7F3D0" : "#E2E8F0", borderRadius: "12px", padding: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </div>
                              {order.isFreeRedeem && <span style={{ fontSize: "0.75rem", background: "#10B981", color: "white", padding: "4px 8px", borderRadius: "20px", fontWeight: 800 }}>FREE DRINK</span>}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", fontSize: "0.95rem", color: "#0F172A", fontWeight: 600 }}>
                                  {item.quantity}x {item.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}

      {/* ── Order Form Modal ── */}
      {showOrderForm && (
        <>
          <div onClick={() => setShowOrderForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", maxWidth: "600px", height: "90vh", maxHeight: "800px", background: "white", zIndex: 201, borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>New Order</h2>
                <div style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "2px" }}>For <span style={{ color: "var(--primary)", fontWeight: 700 }}>{orderCustomerName}</span></div>
              </div>
              <button onClick={() => setShowOrderForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 24px" }}>
                <input type="text" placeholder="Search menu..." value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} style={{ width: "100%", padding: "12px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", fontSize: "0.95rem", outline: "none", marginBottom: "16px" }} />
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setMenuCategory(cat)} style={{ padding: "8px 16px", borderRadius: "20px", border: "none", background: menuCategory === cat ? "var(--primary)" : "#F1F5F9", color: menuCategory === cat ? "white" : "#64748B", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize" }}>{cat}</button>
                  ))}
                </div>
              </div>

              <div style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                {filteredMenu.map(item => {
                  const inCart = cart.find(c => c.menuItem.id === item.id);
                  return (
                    <div key={item.id} onClick={() => !inCart && addToCart(item)} style={{ border: "1px solid", borderColor: inCart ? "var(--primary)" : "#E2E8F0", background: inCart ? "#EFF6FF" : "white", padding: "16px", borderRadius: "12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.95rem" }}>{item.name}</div>
                        <div style={{ fontSize: "0.85rem", color: "#10B981", fontWeight: 800, marginTop: "4px" }}>₹{item.price}</div>
                      </div>
                      {inCart ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 32, height: 32, borderRadius: "8px", border: "none", background: "#DBEAFE", color: "var(--primary)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Minus size={16} /></button>
                          <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>{inCart.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 32, height: 32, borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={16} /></button>
                        </div>
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "20px 24px", background: "white", borderTop: "1px solid #E2E8F0", boxShadow: "0 -4px 16px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "1.1rem" }}>Total: <span style={{ color: "var(--primary)", fontSize: "1.4rem" }}>₹{cartTotal}</span></div>
                  {cartDrinkCount > 0 && <span style={{ background: "#FEF3C7", color: "#D97706", padding: "4px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800 }}>+{cartDrinkCount} Loyalty Drink{cartDrinkCount > 1 ? "s" : ""}</span>}
                </div>
                <button onClick={handleSubmitOrder} disabled={savingOrder} style={{ width: "100%", padding: "16px", background: "var(--primary)", color: "white", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {savingOrder ? "Saving..." : <><Check size={20} /> Place Order</>}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Add Customer Modal ── */}
      {showAddForm && (
        <>
          <div onClick={() => setShowAddForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 300, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "400px", background: "white", zIndex: 301, borderRadius: "20px", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0F172A" }}>New Customer</h2>
              <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>Full Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter name" style={{ width: "100%", padding: "14px", border: "1px solid #E2E8F0", borderRadius: "10px", fontSize: "1rem", outline: "none", background: "#F8FAFC" }} autoFocus />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>Phone Number</label>
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Enter phone" style={{ width: "100%", padding: "14px", border: "1px solid #E2E8F0", borderRadius: "10px", fontSize: "1rem", outline: "none", background: "#F8FAFC" }} />
              </div>
              <button type="submit" disabled={addingCustomer} style={{ marginTop: "8px", width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>
                {addingCustomer ? "Adding..." : "Add Customer"}
              </button>
            </form>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .hide-mobile { display: inline; }
        @media(max-width: 600px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}

function LoyaltyDots({ current, size = "sm" }: { current: number; size?: "sm" | "lg" }) {
  const dotSize = size === "lg" ? 32 : 16;
  return (
    <div style={{ display: "flex", gap: size === "lg" ? "8px" : "4px" }}>
      {Array.from({ length: LOYALTY_GOAL }).map((_, i) => {
        const isFilled = i < current;
        const isFree = i === LOYALTY_GOAL - 1;
        return (
          <div key={i} style={{ width: dotSize, height: dotSize, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isFree ? (isFilled || current >= 6 ? "#10B981" : "#F1F5F9") : (isFilled ? "var(--primary)" : "#F1F5F9"), border: `2px solid ${isFree ? (isFilled || current >= 6 ? "#10B981" : "#E2E8F0") : (isFilled ? "var(--primary)" : "#E2E8F0")}` }}>
            {isFree ? <Gift size={size === "lg" ? 14 : 10} color={isFilled || current >= 6 ? "white" : "#94A3B8"} /> : isFilled && <Check size={size === "lg" ? 14 : 10} color="white" />}
          </div>
        );
      })}
    </div>
  );
}
