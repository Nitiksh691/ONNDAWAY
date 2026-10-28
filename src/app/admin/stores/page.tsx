"use client";
import React, { useState, useEffect } from "react";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Phone,
  Power,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Store as StoreType } from "@/lib/types";

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    code: "",
    address: "",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    latitude: "28.7499",
    longitude: "77.1170",
    serviceRadiusKm: "5",
    serviceAreas: "DTU Sector 16, DTU Sector 17, DTU Hostels, DTU Main Gate",
    openingTime: "07:00",
    closingTime: "23:59",
    minOrderValue: "0",
    deliveryFee: "20",
    estimatedDeliveryMins: "15",
    phone: "",
    pin: "1234",
    managerName: "",
    isActive: true,
    isAcceptingOrders: true,
  });

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stores?all=true");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setForm({
      name: "",
      slug: "",
      code: "",
      address: "",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      latitude: "28.7499",
      longitude: "77.1170",
      serviceRadiusKm: "5",
      serviceAreas: "DTU Sector 16, DTU Sector 17, Hostels",
      openingTime: "07:00",
      closingTime: "23:59",
      minOrderValue: "0",
      deliveryFee: "20",
      estimatedDeliveryMins: "15",
      phone: "",
      pin: "1234",
      managerName: "",
      isActive: true,
      isAcceptingOrders: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (store: StoreType) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      slug: store.slug,
      code: store.code,
      address: store.address,
      city: store.city || "Delhi",
      state: store.state || "Delhi",
      country: store.country || "India",
      latitude: String(store.location.coordinates[1]),
      longitude: String(store.location.coordinates[0]),
      serviceRadiusKm: String(store.serviceRadiusKm),
      serviceAreas: (store.serviceAreas || []).join(", "),
      openingTime: store.openingTime,
      closingTime: store.closingTime,
      minOrderValue: String(store.minOrderValue || 0),
      deliveryFee: String(store.deliveryFee != null ? store.deliveryFee : 20),
      estimatedDeliveryMins: String(store.estimatedDeliveryMins || 15),
      phone: store.phone,
      pin: store.pin || "1234",
      managerName: store.managerName || "",
      isActive: store.isActive,
      isAcceptingOrders: store.isAcceptingOrders,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.code || !form.phone || !form.pin) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    const token =
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("otw_admin_token") ||
          localStorage.getItem("otw_admin_token"))) ||
      "";

    const payload = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      serviceRadiusKm: parseFloat(form.serviceRadiusKm),
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      deliveryFee: parseFloat(form.deliveryFee) || 0,
      estimatedDeliveryMins: parseInt(form.estimatedDeliveryMins) || 15,
      serviceAreas: form.serviceAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = editingStore ? `/api/stores/${editingStore.id}` : "/api/stores";
      const method = editingStore ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingStore ? "Store updated!" : "Store created!");
        setShowModal(false);
        fetchStores();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save store");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete store "${name}"?`)) return;
    const token =
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("otw_admin_token") ||
          localStorage.getItem("otw_admin_token"))) ||
      "";
    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        toast.success("Store deleted");
        fetchStores();
      } else {
        toast.error("Failed to delete store");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/stores/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Seeded default stores!");
        fetchStores();
      } else {
        toast.error(data.error || "Failed to seed stores");
      }
    } catch {
      toast.error("Network error during seed");
    } finally {
      setSeeding(false);
    }
  };

  const totalActive = stores.filter((s) => s.isActive).length;
  const totalAccepting = stores.filter((s) => s.isActive && s.isAcceptingOrders).length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Store size={26} color="#0135FB" /> Multi-Store Hubs & Locations
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "4px 0 0" }}>
            Configure dark stores, coordinates, delivery zones, and store partner credentials
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {stores.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 10,
                background: "#EFF6FF",
                color: "#0135FB",
                border: "1.5px solid #BFDBFE",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: seeding ? "not-allowed" : "pointer",
              }}
            >
              <Sparkles size={16} />
              {seeding ? "Seeding..." : "Seed Default Hubs (DTU, NSUT, DU)"}
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 10,
              background: "#0135FB",
              color: "white",
              border: "none",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(1,53,251,0.3)",
            }}
          >
            <Plus size={16} /> Add New Store Hub
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "white", padding: 18, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>TOTAL CONFIGURED STORES</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{stores.length}</div>
        </div>
        <div style={{ background: "white", padding: 18, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>ACTIVE STORES</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#16A34A", marginTop: 4 }}>{totalActive}</div>
        </div>
        <div style={{ background: "white", padding: 18, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>ACCEPTING ORDERS NOW</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0135FB", marginTop: 4 }}>{totalAccepting}</div>
        </div>
      </div>

      {/* ── Stores List ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading stores...</div>
      ) : stores.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: "50px 20px", textAlign: "center", border: "1.5px dashed #CBD5E1" }}>
          <Store size={48} style={{ color: "#94A3B8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>No Stores Configured Yet</h3>
          <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "6px auto 18px", maxWidth: 400 }}>
            Click &quot;Seed Default Hubs&quot; to automatically create the DTU, NSUT, and DU North Campus stores.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{ padding: "10px 20px", borderRadius: 10, background: "#0135FB", color: "white", border: "none", fontWeight: 800, cursor: "pointer" }}
          >
            {seeding ? "Creating..." : "Seed Default Hubs Now"}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {stores.map((s) => (
            <div
              key={s.id}
              style={{
                background: "white",
                borderRadius: 16,
                padding: 20,
                border: s.isActive ? "1.5px solid #E2E8F0" : "1.5px solid #FCA5A5",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div>
                {/* Store Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>{s.name}</h3>
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: 6 }}>
                        {s.code}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} color="#0135FB" /> {s.address}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: s.isActive ? (s.isAcceptingOrders ? "#DCFCE7" : "#FEF3C7") : "#FEE2E2",
                      color: s.isActive ? (s.isAcceptingOrders ? "#15803D" : "#B45309") : "#B91C1C",
                    }}
                  >
                    {s.isActive ? (s.isAcceptingOrders ? "Live & Open" : "Paused") : "Inactive"}
                  </span>
                </div>

                {/* Details Grid */}
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: "0.78rem", color: "#334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>📍 Radius: <strong>{s.serviceRadiusKm} km</strong></div>
                  <div>⏰ Hours: <strong>{s.openingTime} - {s.closingTime}</strong></div>
                  <div>📞 Phone: <strong>{s.phone}</strong></div>
                  <div>🔑 Login PIN: <strong>{s.pin || "1234"}</strong></div>
                  <div>💰 Delivery Fee: <strong>₹{s.deliveryFee}</strong></div>
                  <div>⚡ ETA: <strong>~{s.estimatedDeliveryMins} mins</strong></div>
                </div>

                {/* Delivery Zones */}
                {s.serviceAreas && s.serviceAreas.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>
                      SERVICED AREAS ({s.serviceAreas.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {s.serviceAreas.slice(0, 6).map((area, idx) => (
                        <span key={idx} style={{ fontSize: "0.68rem", background: "#EFF6FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {area}
                        </span>
                      ))}
                      {s.serviceAreas.length > 6 && (
                        <span style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 700 }}>
                          +{s.serviceAreas.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a
                  href="/store-portal"
                  target="_blank"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    color: "#0135FB",
                    textDecoration: "none",
                  }}
                >
                  Partner Portal <ExternalLink size={12} />
                </a>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleOpenEdit(s)}
                    style={{ padding: "6px 12px", borderRadius: 8, background: "#F1F5F9", border: "none", color: "#334155", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    style={{ padding: "6px 10px", borderRadius: 8, background: "#FEF2F2", border: "none", color: "#DC2626", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Store Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setShowModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "white",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              zIndex: 10000,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>
                {editingStore ? "Edit Store Hub" : "Create New Store Hub"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>STORE NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DTU Main Hub"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>UNIQUE CODE *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DTU01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>SLUG (URL SAFE) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dtu-hub"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>PHYSICAL ADDRESS *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street, Campus gate, building number..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              {/* Coordinates & Radius */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>LATITUDE *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="28.7499"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>LONGITUDE *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="77.1170"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>RADIUS (KM)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.serviceRadiusKm}
                    onChange={(e) => setForm({ ...form, serviceRadiusKm: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>
                  SERVICED AREAS / ZONES (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DTU Sector 16, DTU Sector 17, Campus Hostels, Main Gate"
                  value={form.serviceAreas}
                  onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Login Credentials for Collaborated Store Partner */}
              <div style={{ background: "#EFF6FF", padding: 12, borderRadius: 10, border: "1px solid #BFDBFE" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1D4ED8", marginBottom: 8 }}>
                  STORE PARTNER PORTAL LOGIN CREDENTIALS
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1E40AF", display: "block", marginBottom: 3 }}>PHONE NUMBER *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9999000001"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #93C5FD", fontSize: "0.85rem", background: "white", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1E40AF", display: "block", marginBottom: 3 }}>PORTAL 4-DIGIT PIN *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="1234"
                      value={form.pin}
                      onChange={(e) => setForm({ ...form, pin: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #93C5FD", fontSize: "0.85rem", background: "white", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Operating Hours & Fees */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 3 }}>OPEN TIME</label>
                  <input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 3 }}>CLOSE TIME</label>
                  <input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 3 }}>DELIVERY (₹)</label>
                  <input
                    type="number"
                    value={form.deliveryFee}
                    onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 3 }}>ETA (MINS)</label>
                  <input
                    type="number"
                    value={form.estimatedDeliveryMins}
                    onChange={(e) => setForm({ ...form, estimatedDeliveryMins: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active Store
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isAcceptingOrders}
                    onChange={(e) => setForm({ ...form, isAcceptingOrders: e.target.checked })}
                  />
                  Accepting Orders
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 10, background: "#F1F5F9", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "10px 22px", borderRadius: 10, background: "#0135FB", color: "white", border: "none", fontWeight: 800, fontSize: "0.85rem", cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Saving..." : editingStore ? "Update Store" : "Create Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
