"use client";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, X, ChevronDown, Search } from "lucide-react";

// All supported Rohini delivery areas
const ROHINI_AREAS = [
  { label: "Rohini Sector 1", pincode: "110085" },
  { label: "Rohini Sector 3", pincode: "110085" },
  { label: "Rohini Sector 5", pincode: "110085" },
  { label: "Rohini Sector 7", pincode: "110085" },
  { label: "Rohini Sector 8", pincode: "110085" },
  { label: "Rohini Sector 9", pincode: "110085" },
  { label: "Rohini Sector 10", pincode: "110085" },
  { label: "Rohini Sector 11", pincode: "110085" },
  { label: "Rohini Sector 13", pincode: "110086" },
  { label: "Rohini Sector 14", pincode: "110086" },
  { label: "Rohini Sector 15", pincode: "110089" },
  { label: "Rohini Sector 16", pincode: "110089" },
  { label: "Rohini Sector 17", pincode: "110089" },
  { label: "Rohini Sector 18", pincode: "110089" },
  { label: "Rohini Sector 24", pincode: "110085" },
  { label: "Rohini Sector 25", pincode: "110085" },
  { label: "Prashant Vihar", pincode: "110085" },
  { label: "Pitampura", pincode: "110034" },
  { label: "Shalimar Bagh", pincode: "110088" },
  { label: "Saraswati Vihar", pincode: "110034" },
  { label: "Mangolpuri", pincode: "110083" },
  { label: "Pocket 1, Rohini", pincode: "110085" },
  { label: "Pocket 2, Rohini", pincode: "110085" },
];

const STORAGE_KEY = "otw_delivery_location";

export function useDeliveryLocation() {
  const [location, setLocationState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLocationState(saved);
  }, []);

  const saveLocation = useCallback((loc: string) => {
    localStorage.setItem(STORAGE_KEY, loc);
    setLocationState(loc);
  }, []);

  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocationState(null);
  }, []);

  return { location, saveLocation, clearLocation };
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: string) => void;
}

export function LocationModal({ isOpen, onClose, onSave }: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const filteredAreas = ROHINI_AREAS.filter(a =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (area: string) => {
    onSave(area);
    onClose();
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          let locationName = "Current Location";
          if (data && data.address) {
             const addr = data.address;
             locationName = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.city || "Detected Location";
          }
          setGeoLoading(false);
          onSave(locationName);
          onClose();
        } catch (e) {
          setGeoLoading(false);
          onSave("Detected Location");
          onClose();
        }
      },
      (error) => {
        setGeoLoading(false);
        setGeoError(error.message || "Could not detect location. Please select manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      />

      {/* Bottom Sheet */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "520px", zIndex: 10000,
        background: "white", borderRadius: "24px 24px 0 0",
        boxShadow: "0 -24px 60px rgba(0,0,0,0.2)",
        animation: "loc-slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>
        <style>{`
          @keyframes loc-slide-up {
            from { transform: translateY(60px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: "#E5E7EB", margin: "12px auto 0" }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0A0F2E" }}>📍 Where are we delivering?</h2>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", marginTop: "4px" }}>
              Serving Rohini's café lovers 🏡
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "#F3F4F6", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}>
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Use Current Location button */}
        <div style={{ padding: "16px 24px 0" }}>
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            style={{
              width: "100%", padding: "14px 18px", borderRadius: "12px",
              border: "2px solid #0135FB", background: geoLoading ? "#EEF1FF" : "white",
              color: "#0135FB", fontWeight: 700, fontSize: "0.9rem",
              display: "flex", alignItems: "center", gap: "10px",
              cursor: geoLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s", fontFamily: "inherit",
            }}
            onMouseEnter={e => { if (!geoLoading) (e.currentTarget as HTMLButtonElement).style.background = "#EEF1FF"; }}
            onMouseLeave={e => { if (!geoLoading) (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
          >
            <Navigation size={18} />
            {geoLoading ? "Detecting location…" : "Use Current Location"}
          </button>
          {geoError && (
            <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: "8px", fontWeight: 600 }}>{geoError}</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: "0.78rem", color: "#9CA3AF", fontWeight: 600 }}>OR SELECT AREA</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px 0", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 36, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Search Rohini area or sector…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px 11px 38px", borderRadius: "10px",
              border: "1.5px solid #E5E7EB", fontSize: "0.88rem", fontFamily: "inherit",
              outline: "none", background: "#F9FAFB", color: "#0A0F2E",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#0135FB")}
            onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
          />
        </div>

        {/* Area List */}
        <div style={{ overflowY: "auto", padding: "12px 24px 24px", flex: 1 }}>
          {filteredAreas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
              <p style={{ fontSize: "0.9rem" }}>No areas match your search.</p>
              <p style={{ fontSize: "0.8rem", marginTop: "6px" }}>
                We currently serve selected areas of Rohini, Delhi.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {filteredAreas.map(area => (
                <button
                  key={area.label}
                  onClick={() => handleSelect(area.label)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "13px 16px", borderRadius: "10px", border: "none",
                    background: "transparent", cursor: "pointer", textAlign: "left",
                    width: "100%", transition: "background 0.15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F5F7FF")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "#EEF1FF", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <MapPin size={16} color="#0135FB" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0A0F2E" }}>{area.label}</div>
                    <div style={{ fontSize: "0.74rem", color: "#9CA3AF", marginTop: "1px" }}>Delhi · {area.pincode}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Out of area note */}
          <div style={{
            marginTop: "16px", padding: "14px 16px", borderRadius: "10px",
            background: "#FFFBEB", border: "1px solid #FDE68A",
          }}>
            <p style={{ fontSize: "0.78rem", color: "#92400E", lineHeight: 1.6, fontWeight: 600 }}>
              📦 Don't see your area? We're expanding! Currently delivering across selected sectors of Rohini, Delhi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact header pill button
interface LocationButtonProps {
  location: string | null;
  onClick: () => void;
}

export function LocationButton({ location, onClick }: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      id="location-picker-btn"
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "7px 12px", borderRadius: "10px",
        border: "1.5px solid rgba(1,53,251,0.2)",
        background: location ? "#EEF1FF" : "rgba(255,255,255,0.9)",
        color: "#0135FB", cursor: "pointer", fontFamily: "inherit",
        fontWeight: 700, fontSize: "0.78rem", maxWidth: "180px",
        transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#E0E7FF")}
      onMouseLeave={e => (e.currentTarget.style.background = location ? "#EEF1FF" : "rgba(255,255,255,0.9)")}
    >
      <MapPin size={14} style={{ flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {location ? location : "Delivering to?"}
      </span>
      <ChevronDown size={12} style={{ flexShrink: 0 }} />
    </button>
  );
}
