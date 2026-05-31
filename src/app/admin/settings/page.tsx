"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [deliveryFee, setDeliveryFee] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.deliveryFee !== undefined) {
          setDeliveryFee(data.deliveryFee);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee }),
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "8px" }}>App Settings</h1>
        <p style={{ color: "var(--text-muted)" }}>Manage global platform settings like delivery fees.</p>
      </div>

      <div className="otw-card" style={{ padding: "32px", maxWidth: "600px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          Financial Settings
        </h3>

        <div style={{ marginBottom: "24px" }}>
          <label className="otw-label" style={{ display: "block", marginBottom: "8px" }}>Delivery Fee (₹)</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input 
              type="number" 
              className="otw-input" 
              value={deliveryFee} 
              onChange={e => setDeliveryFee(Number(e.target.value))} 
              min="0"
              style={{ maxWidth: "200px" }}
            />
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Set to 0 to completely remove the delivery fee. This fee will be dynamically applied to all new orders at checkout.
          </p>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="otw-btn otw-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px" }}
        >
          <Save size={18}/> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
