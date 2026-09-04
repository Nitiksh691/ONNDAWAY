"use client";
import { useState, useEffect, useCallback } from "react";
import { MapPin, X, ChevronDown, Building2, Map, Plus, Clock } from "lucide-react";

const STORAGE_KEY = "otw_delivery_location";
const HISTORY_KEY = "otw_saved_locations";

export function useDeliveryLocation() {
  const [location, setLocationState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLocationState(saved);
  }, []);

  const saveLocation = useCallback((loc: string) => {
    localStorage.setItem(STORAGE_KEY, loc);
    setLocationState(loc);

    // Save to history
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY);
      let history = historyStr ? JSON.parse(historyStr) : [];
      if (!Array.isArray(history)) history = [];
      const newLocations = [loc, ...history.filter((l: string) => l !== loc)].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newLocations));
    } catch (e) { }
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
  const [exactSpot, setExactSpot] = useState("");
  const [landmark, setLandmark] = useState("");
  const [view, setView] = useState<"list" | "form">("form");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setExactSpot("");
      setLandmark("");

      try {
        const historyStr = localStorage.getItem(HISTORY_KEY);
        if (historyStr) {
          const history = JSON.parse(historyStr);
          if (Array.isArray(history) && history.length > 0) {
            setSavedLocations(history);
            setView("list");
          } else {
            setView("form");
          }
        } else {
          setView("form");
        }
      } catch (e) {
        setView("form");
      }
    }
  }, [isOpen]);

  const handleSaveLocation = () => {
    if (!exactSpot.trim()) {
      alert("Please enter your exact spot (e.g. building, room).");
      return;
    }

    let combined = exactSpot.trim();
    if (landmark.trim()) {
      combined += ` (Near ${landmark.trim()})`;
    }

    onSave(combined);
    onClose();
  };

  const handleSelectSaved = (loc: string) => {
    onSave(loc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      />

      {/* Centered Modal */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "480px", zIndex: 10000,
        background: "white", borderRadius: "24px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        animation: "loc-fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
      }}>
        <style>{`
          @keyframes loc-fade-up {
            from { transform: translateY(20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>



        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: "1.3rem", color: "#0A0F2E" }}>
              {view === "list" ? "📍 Choose Delivery Location" : "📍 Where exactly on campus?"}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", marginTop: "4px", lineHeight: 1.4 }}>
              {view === "list"
                ? "Select a previous location or add a new one."
                : "Tell us your specific department, building, or classroom so our rider can find you easily."}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "#F3F4F6", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: "12px"
          }}>
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "20px 24px 24px", flex: 1 }}>

          {view === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSaved(loc)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "16px", borderRadius: "14px", border: "1.5px solid #E5E7EB",
                    background: "#F9FAFB", cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#0135FB";
                    e.currentTarget.style.background = "#EEF1FF";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.background = "#F9FAFB";
                  }}
                >
                  <Clock size={20} color="#0135FB" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0A0F2E", lineHeight: 1.4 }}>
                      {loc.split("(Near ")[0].replace("[GPS attached]", "").trim()}
                    </div>
                    {loc.includes("(Near ") && (
                      <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "4px" }}>
                        Landmark: {loc.split("(Near ")[1].split(")")[0]}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                <span style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>Or</span>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              </div>

              <button
                onClick={() => setView("form")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "16px", borderRadius: "14px", border: "2px dashed #CBD5E1",
                  background: "transparent", color: "#64748B", cursor: "pointer",
                  fontWeight: 800, fontSize: "0.95rem", transition: "all 0.2s", fontFamily: "inherit"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#0135FB";
                  e.currentTarget.style.color = "#0135FB";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.color = "#64748B";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Plus size={18} />
                Add Another Location
              </button>
            </div>
          ) : (
            <div>
              {savedLocations.length > 0 && (
                <button
                  onClick={() => setView("list")}
                  style={{
                    background: "none", border: "none", color: "#0135FB", fontWeight: 700,
                    fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                    marginBottom: "16px", padding: 0
                  }}
                >
                  ← Back to saved locations
                </button>
              )}

              {/* Exact Spot */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#2A3060", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Exact Spot (Required)
                </label>
                <div style={{ position: "relative" }}>
                  <Building2 size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                  <input
                    type="text"
                    placeholder="e.g. Civil Dept, 2nd Floor, Room 204"
                    value={exactSpot}
                    onChange={e => setExactSpot(e.target.value)}
                    style={{
                      width: "100%", padding: "14px 14px 14px 40px", borderRadius: "12px",
                      border: "1.5px solid #E5E7EB", fontSize: "0.95rem", fontFamily: "inherit",
                      outline: "none", background: "#F9FAFB", color: "#0A0F2E",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#0135FB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>
              </div>

              {/* Landmark */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#2A3060", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Nearby Landmark (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <Map size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                  <input
                    type="text"
                    placeholder="e.g. Near Main Canteen, Next to Library"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    style={{
                      width: "100%", padding: "14px 14px 14px 40px", borderRadius: "12px",
                      border: "1.5px solid #E5E7EB", fontSize: "0.95rem", fontFamily: "inherit",
                      outline: "none", background: "#F9FAFB", color: "#0A0F2E",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#0135FB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveLocation}
                disabled={!exactSpot.trim()}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px",
                  background: exactSpot.trim() ? "#0135FB" : "#E5E7EB",
                  color: exactSpot.trim() ? "white" : "#9CA3AF",
                  border: "none", fontWeight: 900, fontSize: "1rem",
                  cursor: exactSpot.trim() ? "pointer" : "not-allowed",
                  boxShadow: exactSpot.trim() ? "0 4px 0 #0028D4" : "none",
                  textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s", fontFamily: "inherit"
                }}
              >
                Confirm Location
              </button>
            </div>
          )}
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
        {location ? location.split("(Near")[0].replace("[GPS attached]", "").trim() : "Delivering to?"}
      </span>
      <ChevronDown size={12} style={{ flexShrink: 0 }} />
    </button>
  );
}
