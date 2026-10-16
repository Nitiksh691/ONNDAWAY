"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Store,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Phone,
  CheckCircle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface VendorReportItem {
  name: string;
  qty: number;
  revenue: number;
}

interface VendorStat {
  _id: string;
  name: string;
  businessName: string;
  phone: string;
  pin: string;
  active: boolean;
  revenueSharePct: number;
  itemCount: number;
  totalOrders: number;
  unitsSold: number;
  grossSales: number;
  vendorPayable: number;
  adminMargin: number;
  items: VendorReportItem[];
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("30");
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    pin: "",
    revenueSharePct: 70,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/report?period=${period}`, {
        headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      } else {
        toast.error("Failed to fetch vendor reports");
      }
    } catch {
      toast.error("Network error fetching vendor data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenModal = (vendor?: VendorStat) => {
    if (vendor) {
      setEditingVendor(vendor);
      setForm({
        name: vendor.name,
        businessName: vendor.businessName || "",
        phone: vendor.phone,
        pin: vendor.pin,
        revenueSharePct: vendor.revenueSharePct ?? 70,
        notes: "",
      });
    } else {
      setEditingVendor(null);
      setForm({
        name: "",
        businessName: "",
        phone: "",
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        revenueSharePct: 70,
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingVendor ? "PATCH" : "POST";
      const payload = editingVendor ? { id: editingVendor._id, ...form } : form;

      const res = await fetch("/api/vendors", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": sessionStorage.getItem("otw_admin_token") || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save vendor");

      toast.success(editingVendor ? "Vendor updated!" : "Vendor created!");
      setDialogOpen(false);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/vendors?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" },
      });
      if (res.ok) {
        toast.success("Vendor deleted");
        fetchReports();
      } else {
        toast.error("Failed to delete vendor");
      }
    } catch {
      toast.error("Network error deleting vendor");
    }
  };

  const totalPartners = vendors.length;
  const totalGross = vendors.reduce((acc, v) => acc + (v.grossSales || 0), 0);
  const totalPayable = vendors.reduce((acc, v) => acc + (v.vendorPayable || 0), 0);
  const totalUnits = vendors.reduce((acc, v) => acc + (v.unitsSold || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ background: "#EEF2FF", padding: "8px 12px", borderRadius: 12, color: "#0135FB" }}>
              <Store size={26} />
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              Vendor & Consignment Management
            </h1>
          </div>
          <p style={{ color: "#64748B", fontSize: "0.9rem", margin: 0, maxWidth: 650 }}>
            Manage outside grocery and consignment vendors. Set their profit share, view separate sales reports, and calculate payout settlements.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/vendor"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1",
              borderRadius: 12, padding: "10px 16px", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none"
            }}
          >
            Open Vendor Portal <ExternalLink size={14} />
          </a>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#0135FB", color: "white", border: "none",
              borderRadius: 12, padding: "10px 20px", fontWeight: 800, fontSize: "0.9rem",
              cursor: "pointer", boxShadow: "0 4px 14px rgba(1,53,251,0.25)"
            }}
          >
            <Plus size={18} /> Add New Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Vendors", value: totalPartners, icon: <Store size={22} />, color: "#0135FB", bg: "#EEF2FF" },
          { label: "Units Sold", value: `${totalUnits} items`, icon: <Package size={22} />, color: "#7C3AED", bg: "#F3E8FF" },
          { label: "Gross Partner Sales", value: `₹${totalGross.toFixed(0)}`, icon: <DollarSign size={22} />, color: "#059669", bg: "#ECFDF5" },
          { label: "Total Payable to Vendors", value: `₹${totalPayable.toFixed(0)}`, icon: <TrendingUp size={22} />, color: "#D97706", bg: "#FEF3C7" },
        ].map((card, idx) => (
          <div key={idx} style={{
            background: "white", borderRadius: 18, padding: "20px",
            border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748B" }}>{card.label}</span>
              <div style={{ background: card.bg, color: card.color, padding: "8px", borderRadius: 10 }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: "white", borderRadius: 16, padding: "12px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        border: "1px solid #E2E8F0", marginBottom: 20, flexWrap: "wrap", gap: 12
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#64748B", marginRight: 4 }}>Period:</span>
          {([["7", "Last 7 Days"], ["30", "Last 30 Days"], ["90", "Last 3 Months"], ["all", "All Time"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              style={{
                padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
                borderColor: period === val ? "#0135FB" : "#E2E8F0",
                background: period === val ? "#0135FB" : "white",
                color: period === val ? "white" : "#475569",
                fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchReports}
          style={{
            background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "8px 14px", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.82rem"
          }}
        >
          <RefreshCw size={14} /> Refresh Reports
        </button>
      </div>

      {/* Vendor List / Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 20, border: "1px solid #E2E8F0" }}>
          <div style={{ color: "#64748B", fontWeight: 700 }}>Loading vendor performance & settlements...</div>
        </div>
      ) : vendors.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, background: "white", borderRadius: 20, border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🏪</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", margin: "0 0 6px" }}>No Vendors Registered Yet</h3>
          <p style={{ color: "#64748B", fontSize: "0.9rem", margin: "0 0 20px" }}>
            Add consignment partners to start tracking grocery products and generating payout reports.
          </p>
          <button
            onClick={() => handleOpenModal()}
            style={{
              background: "#0135FB", color: "white", border: "none",
              borderRadius: 12, padding: "12px 24px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer"
            }}
          >
            + Add Your First Vendor
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {vendors.map(v => {
            const isExpanded = expandedVendorId === v._id;
            return (
              <div key={v._id} style={{
                background: "white", borderRadius: 18, border: "1px solid #E2E8F0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)", overflow: "hidden",
              }}>
                <div style={{
                  padding: "20px 24px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
                  background: isExpanded ? "#F8FAFC" : "white", borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                }}>
                  {/* Vendor Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, background: "#EEF2FF",
                      color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.3rem"
                    }}>
                      🏪
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>{v.name}</span>
                        {v.businessName && (
                          <span style={{ fontSize: "0.82rem", background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                            {v.businessName}
                          </span>
                        )}
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                          background: v.active ? "#DCFCE7" : "#FEE2E2", color: v.active ? "#166534" : "#991B1B",
                        }}>
                          {v.active ? "Active Partner" : "Inactive"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, fontSize: "0.78rem", color: "#64748B" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={13} /> {v.phone}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <KeyRound size={13} /> PIN: <code>{v.pin}</code>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Package size={13} /> {v.itemCount} linked products
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                        Payable to Vendor ({v.revenueSharePct}%)
                      </div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#059669" }}>
                        ₹{v.vendorPayable.toFixed(0)}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                        Gross Sales: ₹{v.grossSales.toFixed(0)} · {v.totalOrders} orders
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setExpandedVendorId(isExpanded ? null : v._id)}
                        style={{
                          background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 10,
                          padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                          fontWeight: 700, fontSize: "0.8rem", color: "#334155"
                        }}
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        {isExpanded ? "Hide Sales" : "View Sales"}
                      </button>
                      <button
                        onClick={() => handleOpenModal(v)}
                        style={{
                          background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 10,
                          padding: "8px 10px", cursor: "pointer", color: "#475569"
                        }}
                        title="Edit vendor"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id, v.name)}
                        style={{
                          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
                          padding: "8px 10px", cursor: "pointer", color: "#EF4444"
                        }}
                        title="Delete vendor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Item Breakdown */}
                {isExpanded && (
                  <div style={{ padding: "18px 24px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <ShoppingBag size={16} color="#0135FB" /> Sales Breakdown by Product ({period === "all" ? "All Time" : `Last ${period} Days`})
                    </div>

                    {v.items.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: "0.85rem" }}>
                        No items sold by this vendor during the selected period.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                            <th style={{ padding: "8px 0", fontWeight: 700 }}>Item Name</th>
                            <th style={{ padding: "8px 0", fontWeight: 700, textAlign: "center" }}>Units Sold</th>
                            <th style={{ padding: "8px 0", fontWeight: 700, textAlign: "right" }}>Total Revenue</th>
                            <th style={{ padding: "8px 0", fontWeight: 700, textAlign: "right" }}>Vendor Payout ({v.revenueSharePct}%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {v.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "10px 0", fontWeight: 700, color: "#0F172A" }}>{item.name}</td>
                              <td style={{ padding: "10px 0", textAlign: "center", color: "#475569", fontWeight: 600 }}>{item.qty} units</td>
                              <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>₹{item.revenue.toFixed(0)}</td>
                              <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 800, color: "#059669" }}>
                                ₹{((item.revenue * v.revenueSharePct) / 100).toFixed(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
          <Dialog.Content aria-describedby={undefined} style={{
            background: "white", position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", width: "95%", maxWidth: 500,
            borderRadius: 20, padding: "28px", zIndex: 1001, boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          }}>
            <Dialog.Title style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0F172A", margin: "0 0 16px" }}>
              {editingVendor ? "Edit Vendor Details" : "Register New Consignment Vendor"}
            </Dialog.Title>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                  Business / Store Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Balaji Organic Farms"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                    Phone Number (Login ID) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                    Portal Login PIN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="e.g. 1234"
                    value={form.pin}
                    onChange={e => setForm({ ...form, pin: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", outline: "none", boxSizing: "border-box", fontFamily: "monospace", fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                  Vendor Profit / Revenue Share (%) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={form.revenueSharePct}
                  onChange={e => setForm({ ...form, revenueSharePct: Number(e.target.value) })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", outline: "none", boxSizing: "border-box" }}
                />
                <p style={{ fontSize: "0.72rem", color: "#64748B", margin: "4px 0 0" }}>
                  Percentage of item sales revenue that will be paid back to this partner. (e.g. 70 means vendor gets ₹70 on every ₹100 sold).
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  style={{ background: "#F1F5F9", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "#0135FB", border: "none", borderRadius: 10, padding: "11px 22px",
                    fontWeight: 800, color: "white", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? "Saving..." : editingVendor ? "Update Partner" : "Create Vendor Partner"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
