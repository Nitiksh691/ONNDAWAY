"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  X,
  ChevronDown,
  Building2,
  Map as MapIcon,
  Plus,
  Clock,
  Compass,
  AlertCircle,
  CheckCircle2,
  Store,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Store as StoreType, ServiceabilityResult } from "@/lib/types";

export interface DeliveryLocationData {
  address: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  storeId?: string | null;
  storeName?: string | null;
  serviceArea?: string | null;
}

export function useDeliveryLocation() {
  const [location, setLocationState] = useState<string | null>(null);
  const [locationData, setLocationDataState] = useState<DeliveryLocationData | null>(null);
  const [servingStore, setServingStoreState] = useState<StoreType | null>(null);

  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem(STORAGE_KEYS.deliveryLocation);
      if (savedLoc) setLocationState(savedLoc);

      const savedData = localStorage.getItem(STORAGE_KEYS.deliveryLocationData);
      if (savedData) setLocationDataState(JSON.parse(savedData));

      const savedStore = localStorage.getItem(STORAGE_KEYS.servingStore);
      if (savedStore) setServingStoreState(JSON.parse(savedStore));
    } catch {
      // ignore
    }
  }, []);

  const saveLocation = useCallback((loc: string, data?: DeliveryLocationData, store?: StoreType | null) => {
    localStorage.setItem(STORAGE_KEYS.deliveryLocation, loc);
    setLocationState(loc);

    if (data) {
      localStorage.setItem(STORAGE_KEYS.deliveryLocationData, JSON.stringify(data));
      setLocationDataState(data);
    }

    if (store) {
      localStorage.setItem(STORAGE_KEYS.servingStore, JSON.stringify(store));
      setServingStoreState(store);
    }

    // Save to history
    try {
      const historyStr = localStorage.getItem("otw_saved_locations");
      let history = historyStr ? JSON.parse(historyStr) : [];
      if (!Array.isArray(history)) history = [];
      const newLocations = [loc, ...history.filter((l: string) => l !== loc)].slice(0, 5);
      localStorage.setItem("otw_saved_locations", JSON.stringify(newLocations));
    } catch {
      // ignore
    }
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.deliveryLocation);
    localStorage.removeItem(STORAGE_KEYS.deliveryLocationData);
    localStorage.removeItem(STORAGE_KEYS.servingStore);
    setLocationState(null);
    setLocationDataState(null);
    setServingStoreState(null);
  }, []);

  return { location, locationData, servingStore, saveLocation, clearLocation };
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (location: string, data?: DeliveryLocationData, store?: StoreType | null) => void;
}

export function LocationModal({ isOpen, onClose, onSave }: LocationModalProps) {
  const [mode, setMode] = useState<"areas" | "gps" | "manual" | "recent">("areas");
  const [exactSpot, setExactSpot] = useState("");
  const [landmark, setLandmark] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResult, setGpsResult] = useState<ServiceabilityResult | null>(null);

  // Load active stores and available areas on open
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/serviceability")
      .then((res) => res.json())
      .then((data: ServiceabilityResult) => {
        if (data.availableStores) setAvailableStores(data.availableStores);
        if (data.allAreas) setAllAreas(data.allAreas);
      })
      .catch(() => {});

    try {
      const historyStr = localStorage.getItem("otw_saved_locations");
      if (historyStr) {
        const hist = JSON.parse(historyStr);
        if (Array.isArray(hist) && hist.length > 0) {
          setSavedLocations(hist);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Request GPS Location & Check Serviceability
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setGpsResult(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(`/api/serviceability?lat=${lat}&lng=${lng}`);
          const data: ServiceabilityResult = await res.json();
          setGpsResult(data);

          if (data.isServiceable && data.store) {
            toast.success(`Connected to ${data.store.name}!`);
          } else {
            toast.error(data.message || "Location outside service area");
          }
        } catch {
          toast.error("Failed to check serviceability for GPS coordinates");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          toast.error("Location permission denied. Please select your area manually.");
        } else {
          toast.error("Unable to retrieve location. Please select an area below.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Confirm GPS location selection
  const handleConfirmGps = () => {
    if (!gpsResult || !gpsResult.isServiceable || !gpsResult.store) return;
    const store = gpsResult.store;
    const locString = `${store.name} Area [GPS: ${gpsResult.distanceKm} km]`;
    const locData: DeliveryLocationData = {
      address: locString,
      storeId: store.id,
      storeName: store.name,
    };

    completeSelection(locString, locData, store);
  };

  // Select a predefined area/zone
  const handleSelectArea = async (area: string) => {
    try {
      const res = await fetch(`/api/serviceability?area=${encodeURIComponent(area)}`);
      const data: ServiceabilityResult = await res.json();

      if (data.isServiceable && data.store) {
        const locData: DeliveryLocationData = {
          address: area,
          serviceArea: area,
          storeId: data.store.id,
          storeName: data.store.name,
        };
        completeSelection(area, locData, data.store);
      } else {
        toast.error(data.message || "This area is currently unavailable.");
      }
    } catch {
      toast.error("Failed to assign area");
    }
  };

  // Manual address submission
  const handleSaveManual = async () => {
    if (!exactSpot.trim()) {
      toast.error("Please enter your building, department, or street name");
      return;
    }

    let combined = exactSpot.trim();
    if (landmark.trim()) combined += ` (Near ${landmark.trim()})`;

    // Check serviceability by text match
    try {
      const res = await fetch(`/api/serviceability?area=${encodeURIComponent(combined)}`);
      const data: ServiceabilityResult = await res.json();

      const store = data.store || (availableStores.length > 0 ? availableStores[0] : null);
      const locData: DeliveryLocationData = {
        address: combined,
        landmark: landmark.trim() || undefined,
        storeId: store ? store.id : null,
        storeName: store ? store.name : null,
      };

      completeSelection(combined, locData, store);
    } catch {
      completeSelection(combined, { address: combined });
    }
  };

  const completeSelection = (loc: string, data: DeliveryLocationData, store?: StoreType | null) => {
    localStorage.setItem(STORAGE_KEYS.deliveryLocation, loc);
    localStorage.setItem(STORAGE_KEYS.deliveryLocationData, JSON.stringify(data));
    if (store) {
      localStorage.setItem(STORAGE_KEYS.servingStore, JSON.stringify(store));
    }

    if (onSave) {
      onSave(loc, data, store);
    }
    onClose();
    // Refresh page state to reload catalog & cart for the newly selected store
    window.location.reload();
  };

  if (!isOpen) return null;

  const filteredAreas = allAreas.filter((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      />

      {/* Centered Modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "500px",
          zIndex: 10000,
          background: "#FFFFFF",
          borderRadius: "24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0F172A", margin: 0 }}>
              📍 Choose Delivery Location
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "4px 0 0" }}>
              Quick-commerce delivery to your campus or neighborhood
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", background: "#F8FAFC", padding: "6px 20px", borderBottom: "1px solid #E2E8F0", gap: 6 }}>
          {[
            { id: "areas", label: "Delivery Areas", icon: <MapIcon size={14} /> },
            { id: "gps", label: "Use GPS", icon: <Compass size={14} /> },
            { id: "manual", label: "Custom Address", icon: <Building2 size={14} /> },
            ...(savedLocations.length > 0 ? [{ id: "recent", label: "Recent", icon: <Clock size={14} /> }] : []),
          ].map((t: any) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: mode === t.id ? "#0135FB" : "transparent",
                color: mode === t.id ? "white" : "#64748B",
                fontWeight: 800,
                fontSize: "0.76rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {/* ── MODE 1: PREDEFINED AREAS & HUBS ── */}
          {mode === "areas" && (
            <div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Search campus, gate, hostel, or neighborhood..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Serving Store Hubs list */}
              {availableStores.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    ACTIVE STORE HUBS
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {availableStores.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectArea(st.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1.5px solid #E2E8F0",
                          background: "#F8FAFC",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#0135FB";
                          e.currentTarget.style.background = "#EFF6FF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#E2E8F0";
                          e.currentTarget.style.background = "#F8FAFC";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Store size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0F172A" }}>{st.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{st.address.slice(0, 42)}...</div>
                          </div>
                        </div>
                        <ArrowRight size={16} color="#0135FB" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Zone Pills */}
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  CAMPUS GATES & NEIGHBORHOODS ({filteredAreas.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {filteredAreas.map((area, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectArea(area)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #E2E8F0",
                        background: "#FFFFFF",
                        color: "#1E293B",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#0135FB";
                        e.currentTarget.style.color = "#0135FB";
                        e.currentTarget.style.background = "#EFF6FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.color = "#1E293B";
                        e.currentTarget.style.background = "#FFFFFF";
                      }}
                    >
                      <MapPin size={13} color="#0135FB" />
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MODE 2: USE GPS ── */}
          {mode === "gps" && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Compass size={32} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0F172A", margin: "0 0 6px" }}>
                Auto-Detect Current Location
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 auto 20px", maxWidth: 360, lineHeight: 1.4 }}>
                We'll calculate your precise distance to our closest store and serve the appropriate live inventory.
              </p>

              <button
                onClick={handleUseGps}
                disabled={gpsLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 24px",
                  borderRadius: 12,
                  background: "#0135FB",
                  color: "white",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: gpsLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(1,53,251,0.3)",
                }}
              >
                {gpsLoading ? <RefreshCw size={18} className="animate-spin" /> : <MapPin size={18} />}
                {gpsLoading ? "Detecting & Checking Service..." : "Find My Nearest Store"}
              </button>

              {/* GPS Result Card */}
              {gpsResult && (
                <div style={{ marginTop: 24, textAlign: "left", padding: 16, borderRadius: 14, background: gpsResult.isServiceable ? "#F0FDF4" : "#FEF2F2", border: gpsResult.isServiceable ? "1.5px solid #86EFAC" : "1.5px solid #FCA5A5" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    {gpsResult.isServiceable ? (
                      <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: gpsResult.isServiceable ? "#166534" : "#991B1B" }}>
                        {gpsResult.isServiceable ? "Serviceable Area!" : "Out of Delivery Range"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: gpsResult.isServiceable ? "#15803D" : "#B91C1C", marginTop: 4 }}>
                        {gpsResult.message}
                      </div>

                      {gpsResult.isServiceable && gpsResult.store && (
                        <button
                          onClick={handleConfirmGps}
                          style={{
                            marginTop: 12,
                            padding: "10px 18px",
                            borderRadius: 10,
                            background: "#16A34A",
                            color: "white",
                            border: "none",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                          }}
                        >
                          Confirm Delivery from {gpsResult.store.name} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODE 3: MANUAL ADDRESS ── */}
          {mode === "manual" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: 6, textTransform: "uppercase" }}>
                  Building, Hostel, or Room (Required)
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="text"
                    placeholder="e.g. Aryabhatta Hostel, Room 214 or Civil Dept 2nd floor"
                    value={exactSpot}
                    onChange={(e) => setExactSpot(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "#334155", marginBottom: 6, textTransform: "uppercase" }}>
                  Nearby Landmark / Gate (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="text"
                    placeholder="e.g. Near Main Canteen, Next to Library Gate"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 12, border: "1.5px solid #CBD5E1", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveManual}
                disabled={!exactSpot.trim()}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  background: exactSpot.trim() ? "#0135FB" : "#E2E8F0",
                  color: exactSpot.trim() ? "white" : "#94A3B8",
                  border: "none",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  cursor: exactSpot.trim() ? "pointer" : "not-allowed",
                  boxShadow: exactSpot.trim() ? "0 4px 14px rgba(1,53,251,0.3)" : "none",
                }}
              >
                Save & Set Delivery Spot
              </button>
            </div>
          )}

          {/* ── MODE 4: RECENT LOCATIONS ── */}
          {mode === "recent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => completeSelection(loc, { address: loc })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px",
                    borderRadius: 12,
                    border: "1.5px solid #E2E8F0",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Clock size={18} color="#0135FB" />
                  <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0F172A" }}>{loc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact header pill button
export function LocationButton({ location, onClick }: { location: string | null; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      id="location-picker-btn"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 12px",
        borderRadius: "10px",
        border: "1.5px solid rgba(1,53,251,0.2)",
        background: location ? "#EEF1FF" : "rgba(255,255,255,0.9)",
        color: "#0135FB",
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 700,
        fontSize: "0.78rem",
        maxWidth: "200px",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <MapPin size={14} style={{ flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {location ? location.split("(Near")[0].replace(/\[.*?\]/g, "").trim() : "Delivering to?"}
      </span>
      <ChevronDown size={12} style={{ flexShrink: 0 }} />
    </button>
  );
}
