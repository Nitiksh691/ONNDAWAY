"use client";
import React, { useState, useEffect } from "react";
import {
  Bike,
  Plus,
  Trash2,
  Phone,
  Store,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Compass,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

interface Rider {
  id: string;
  uid: string;
  name: string;
  phone: string;
  email?: string;
  storeId?: string;
  storeName?: string;
  active: boolean;
  createdAt?: string;
}

interface StoreOption {
  id: string;
  name: string;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creatingSampleOrderFor, setCreatingSampleOrderFor] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeId, setStoreId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ridersRes, storesRes] = await Promise.all([
        fetch("/api/delivery-persons"),
        fetch("/api/stores"),
      ]);
      if (ridersRes.ok) {
        const dps = await ridersRes.json();
        setRiders(dps);
      }
      if (storesRes.ok) {
        const sts = await storesRes.json();
        setStores(sts);
      }
    } catch {
      toast.error("Failed to load delivery riders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!name.trim() || cleanPhone.length !== 10) {
      toast.error("Please enter a valid name and 10-digit phone number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/delivery-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          storeId: storeId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Rider ${name} registered successfully!`);
        setShowAddModal(false);
        setName("");
        setPhone("");
        setStoreId("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to register rider");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, riderName: string) => {
    if (!confirm(`Remove rider "${riderName}"?`)) return;
    try {
      const res = await fetch(`/api/delivery-persons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rider removed");
        fetchData();
      }
    } catch {
      toast.error("Failed to remove rider");
    }
  };

  // Generate test order and launch rider view immediately for testing
  const handleTestRiderMap = async (rider: Rider) => {
    setCreatingSampleOrderFor(rider.uid);
    try {
      const res = await fetch("/api/delivery-persons/sample-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: rider.uid,
          riderName: rider.name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("otw_delivery_id", rider.uid);
        localStorage.setItem("otw_delivery_name", rider.name);
        toast.success("Sample order created! Opening Delivery Dashboard Map...");
        window.open("/delivery/dashboard", "_blank");
      } else {
        toast.error(data.error || "Failed to create sample order");
      }
    } catch {
      toast.error("Network error creating sample order");
    } finally {
      setCreatingSampleOrderFor(null);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Bike size={28} color="#0135FB" /> Delivery Partners & Riders
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "4px 0 0" }}>
            Register riders with Name and Phone number so they can log in instantly with their mobile
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          <Plus size={16} /> Register New Rider
        </button>
      </div>

      {/* ── Quick Test Banner ── */}
      <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #BFDBFE", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, color: "#1D4ED8", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} /> Instant Rider Map Testing
          </div>
          <div style={{ fontSize: "0.8rem", color: "#1E40AF", marginTop: 2 }}>
            Click &quot;Test Map & Route&quot; on any rider card below to generate an active order and view the live map in action.
          </div>
        </div>
      </div>

      {/* ── Riders List ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading delivery partners...</div>
      ) : riders.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: "50px 20px", textAlign: "center", border: "1.5px dashed #CBD5E1" }}>
          <Bike size={48} style={{ color: "#94A3B8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>No Delivery Partners Registered Yet</h3>
          <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "6px auto 18px", maxWidth: 400 }}>
            Click &quot;Register New Rider&quot; to add someone with just their Name and Phone number.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "10px 20px", borderRadius: 10, background: "#0135FB", color: "white", border: "none", fontWeight: 800, cursor: "pointer" }}
          >
            Register First Rider Now
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {riders.map((r) => {
            const isTestingThis = creatingSampleOrderFor === r.uid;
            return (
              <div
                key={r.uid || r.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 18,
                  border: "1.5px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bike size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0F172A" }}>{r.name}</div>
                        <div style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={12} /> +91 {r.phone}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "#DCFCE7", color: "#15803D" }}>
                      Active Rider
                    </span>
                  </div>

                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: "0.78rem", color: "#334155" }}>
                    📍 Assigned Hub: <strong>{r.storeName || "All Hubs (Global Pool)"}</strong>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleTestRiderMap(r)}
                    disabled={isTestingThis}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#0135FB",
                      color: "white",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: isTestingThis ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 8px rgba(1,53,251,0.25)",
                    }}
                  >
                    <Compass size={15} />
                    {isTestingThis ? "Launching..." : "Test Map & Route"}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id || r.uid, r.name)}
                    style={{ padding: "10px 12px", borderRadius: 10, background: "#FEF2F2", border: "none", color: "#DC2626", cursor: "pointer" }}
                    title="Remove Rider"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal to Register Rider ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={() => setShowAddModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              background: "white",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              zIndex: 10000,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Bike size={20} color="#0135FB" /> Register Delivery Partner
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRider} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>
                  RIDER FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikas Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>
                  MOBILE PHONE NUMBER (FOR LOGIN) *
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ padding: "11px 12px", borderRadius: 8, border: "1.5px solid #CBD5E1", background: "#F8FAFC", fontWeight: 800, fontSize: "0.85rem", color: "#334155" }}>
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{ flex: 1, padding: "11px 12px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: 4 }}>
                  The rider will use this 10-digit number to log in at <code>/delivery/login</code>.
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", display: "block", marginBottom: 4 }}>
                  ASSIGNED STORE HUB (OPTIONAL)
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1.5px solid #CBD5E1", fontSize: "0.85rem", outline: "none", background: "white", boxSizing: "border-box" }}
                >
                  <option value="">All Stores (Global Pool)</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: 10, background: "#F1F5F9", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 10,
                    background: "#0135FB",
                    color: "white",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Registering..." : "Register Rider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
