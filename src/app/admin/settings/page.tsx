"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, AlertTriangle, Info, Clock, Phone } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export default function AdminSettingsPage() {
  const [deliveryFee, setDeliveryFee] = useState<number>(20);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenancePhone, setMaintenancePhone] = useState<string>("");
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("We're currently under maintenance. Please call us to place your order.");
  const [kitchenClosed, setKitchenClosed] = useState<boolean>(false);
  const [kitchenOpenTime, setKitchenOpenTime] = useState<string>("7:00 AM");
  const [waitlistMode, setWaitlistMode] = useState(false);
  const [launchingSoonMode, setLaunchingSoonMode] = useState(false);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState<boolean>(true);
  const [codEnabled, setCodEnabled] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings", {
      headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.deliveryFee !== undefined) setDeliveryFee(data.deliveryFee);
          if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
          if (data.maintenancePhone !== undefined) setMaintenancePhone(data.maintenancePhone);
          if (data.maintenanceMessage !== undefined) setMaintenanceMessage(data.maintenanceMessage);
          if (data.kitchenClosed !== undefined) setKitchenClosed(data.kitchenClosed);
          if (data.kitchenOpenTime !== undefined) setKitchenOpenTime(data.kitchenOpenTime);
          if (data.waitlistMode !== undefined) setWaitlistMode(data.waitlistMode);
          if (data.launchingSoonMode !== undefined) setLaunchingSoonMode(data.launchingSoonMode);
          if (data.onlinePaymentEnabled !== undefined) setOnlinePaymentEnabled(data.onlinePaymentEnabled);
          if (data.codEnabled !== undefined) setCodEnabled(data.codEnabled);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleSaveRequest = () => {
    const dataToSave = {
      deliveryFee,
      maintenanceMode,
      maintenancePhone,
      maintenanceMessage,
      kitchenClosed,
      kitchenOpenTime,
      waitlistMode,
      launchingSoonMode,
      onlinePaymentEnabled,
      codEnabled,
    };
    
    // Only show confirmation if enabling disruptive modes
    if (maintenanceMode || kitchenClosed || waitlistMode || launchingSoonMode) {
      setPendingSaveData(dataToSave);
      setShowConfirmDialog(true);
    } else {
      executeSave(dataToSave);
    }
  };

  const executeSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": sessionStorage.getItem("otw_admin_token") || ""
        },
        body: JSON.stringify(data),
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
      setShowConfirmDialog(false);
      setPendingSaveData(null);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading settings...</div>;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "8px" }}>App Settings</h1>
        <p style={{ color: "var(--text-muted)" }}>Manage global platform settings, fees, and operational status.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        
        {/* Financial Settings */}
        <div className="otw-card" style={{ padding: "32px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <span style={{ color: "var(--primary)" }}>💰</span> Financial Settings
          </h3>
          <div style={{ marginBottom: "24px" }}>
            <label className="otw-label" style={{ display: "block", marginBottom: "8px" }}>Delivery Fee (₹)</label>
            <input 
              type="number" 
              className="otw-input" 
              value={deliveryFee} 
              onChange={e => setDeliveryFee(Number(e.target.value))} 
              min="0"
              style={{ maxWidth: "200px" }}
            />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Set to 0 to completely remove the delivery fee. This fee will be dynamically applied to all new orders.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: onlinePaymentEnabled ? "#F0FDF4" : "#FEF2F2", borderRadius: "12px", border: onlinePaymentEnabled ? "1px solid #BBF7D0" : "1px solid #FCA5A5", marginBottom: "12px" }}>
            <div>
              <strong style={{ display: "block", color: onlinePaymentEnabled ? "#15803D" : "#DC2626" }}>Online Payments</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{onlinePaymentEnabled ? "Razorpay is active." : "Disabled. Users can only use COD."}</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={onlinePaymentEnabled} onChange={e => setOnlinePaymentEnabled(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                <div style={{ width: 44, height: 24, background: onlinePaymentEnabled ? "#22C55E" : "#EF4444", borderRadius: 999, transition: "0.3s" }}></div>
                <div style={{ position: "absolute", left: onlinePaymentEnabled ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
              </div>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: codEnabled ? "#F0FDF4" : "#F8FAFC", borderRadius: "12px", border: codEnabled ? "1px solid #BBF7D0" : "1px solid #E2E8F0" }}>
            <div>
              <strong style={{ display: "block", color: codEnabled ? "#15803D" : "var(--text-dark)" }}>Cash on Delivery (COD)</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{codEnabled ? "COD is enabled for all." : "COD is hidden (except after multiple payment failures)."}</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={codEnabled} onChange={e => setCodEnabled(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                <div style={{ width: 44, height: 24, background: codEnabled ? "#22C55E" : "#CBD5E1", borderRadius: 999, transition: "0.3s" }}></div>
                <div style={{ position: "absolute", left: codEnabled ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
              </div>
            </label>
          </div>
        </div>

        {/* Operational Status Settings */}
        <div className="otw-card" style={{ padding: "32px", border: (maintenanceMode || kitchenClosed) ? "2px solid var(--error)" : "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <AlertTriangle size={20} color="var(--error)" /> Operational Status
          </h3>

          {/* Kitchen Closed Toggle */}
          <div style={{ marginBottom: "24px", padding: "16px", background: kitchenClosed ? "#FEF2F2" : "#F8FAFC", borderRadius: "12px", border: kitchenClosed ? "1px solid #FCA5A5" : "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <strong style={{ display: "block", color: kitchenClosed ? "#DC2626" : "var(--text-dark)" }}>Kitchen Closed Mode</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Shows a banner site-wide.</span>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <div style={{ position: "relative" }}>
                  <input type="checkbox" checked={kitchenClosed} onChange={e => setKitchenClosed(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                  <div style={{ width: 44, height: 24, background: kitchenClosed ? "#EF4444" : "#CBD5E1", borderRadius: 999, transition: "0.3s" }}></div>
                  <div style={{ position: "absolute", left: kitchenClosed ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
                </div>
              </label>
            </div>
            {kitchenClosed && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Opening Time</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} color="var(--text-muted)" />
                  <input type="text" className="otw-input" style={{ padding: "8px 12px" }} value={kitchenOpenTime} onChange={e => setKitchenOpenTime(e.target.value)} placeholder="e.g. 7:00 AM" />
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Mode Toggle */}
          <div style={{ padding: "16px", background: maintenanceMode ? "#FEF2F2" : "#F8FAFC", borderRadius: "12px", border: maintenanceMode ? "1px solid #FCA5A5" : "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <strong style={{ display: "block", color: maintenanceMode ? "#DC2626" : "var(--text-dark)" }}>Full Maintenance Mode</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Blocks access to normal users.</span>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <div style={{ position: "relative" }}>
                  <input type="checkbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                  <div style={{ width: 44, height: 24, background: maintenanceMode ? "#EF4444" : "#CBD5E1", borderRadius: 999, transition: "0.3s" }}></div>
                  <div style={{ position: "absolute", left: maintenanceMode ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
                </div>
              </label>
            </div>
            {maintenanceMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Support Phone</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Phone size={16} color="var(--text-muted)" />
                    <input type="text" className="otw-input" style={{ padding: "8px 12px" }} value={maintenancePhone} onChange={e => setMaintenancePhone(e.target.value)} placeholder="Phone number to display" />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Message</label>
                  <textarea className="otw-input" style={{ padding: "8px 12px", minHeight: "80px" }} value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          
          {/* Waitlist Mode Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: waitlistMode ? "#FEF2F2" : "#F8FAFC", borderRadius: "12px", border: waitlistMode ? "1px solid #FCA5A5" : "1px solid #E2E8F0", marginBottom: "24px", marginTop: "24px" }}>
            <div>
              <strong style={{ display: "block", color: waitlistMode ? "#DC2626" : "var(--text-dark)" }}>Waitlist Mode</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Blocks access to main site, captures emails.</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={waitlistMode} onChange={e => setWaitlistMode(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                <div style={{ width: 44, height: 24, background: waitlistMode ? "#EF4444" : "#CBD5E1", borderRadius: 999, transition: "0.3s" }}></div>
                <div style={{ position: "absolute", left: waitlistMode ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
              </div>
            </label>
          </div>

          {/* Launching Soon Mode Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: launchingSoonMode ? "#EFF6FF" : "#F8FAFC", borderRadius: "12px", border: launchingSoonMode ? "1px solid #93C5FD" : "1px solid #E2E8F0" }}>
            <div>
              <strong style={{ display: "block", color: launchingSoonMode ? "#2563EB" : "var(--text-dark)" }}>Launching Soon Mode</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Allows browsing but blocks checkout with a popup.</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={launchingSoonMode} onChange={e => setLaunchingSoonMode(e.target.checked)} style={{ position: "absolute", width: 0, height: 0, opacity: 0 }} />
                <div style={{ width: 44, height: 24, background: launchingSoonMode ? "#3B82F6" : "#CBD5E1", borderRadius: 999, transition: "0.3s" }}></div>
                <div style={{ position: "absolute", left: launchingSoonMode ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.3s" }}></div>
              </div>
            </label>
          </div>
          
        </div>
      </div>

      <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={handleSaveRequest} 
          disabled={saving}
          className="otw-btn otw-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 32px", fontSize: "1.1rem" }}
        >
          <Save size={20}/> {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog.Root open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999, backdropFilter: "blur(4px)" }} />
          <Dialog.Content aria-describedby={undefined} style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "white", padding: "32px", borderRadius: "20px", width: "90%", maxWidth: "450px",
            zIndex: 100000, boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <AlertTriangle size={32} />
              </div>
              <Dialog.Title style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "8px", color: "#111827" }}>Confirm Changes</Dialog.Title>
              <Dialog.Description style={{ color: "#4B5563", fontSize: "0.95rem" }}>
                You are about to enable a mode that affects all users:
                <ul style={{ textAlign: "left", marginTop: "12px", background: "#F3F4F6", padding: "12px 12px 12px 32px", borderRadius: "8px", fontSize: "0.9rem" }}>
                  {pendingSaveData?.maintenanceMode && <li><strong>Maintenance Mode:</strong> All non-admin users will be blocked from using the app.</li>}
                  {pendingSaveData?.kitchenClosed && <li><strong>Kitchen Closed:</strong> A prominent banner will be shown to all users.</li>}
                  {pendingSaveData?.waitlistMode && <li><strong>Waitlist Mode:</strong> All users will be redirected to the waitlist page.</li>}
                </ul>
                Are you sure you want to proceed?
              </Dialog.Description>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Dialog.Close asChild>
                <button className="otw-btn otw-btn-outline" style={{ flex: 1 }}>Cancel</button>
              </Dialog.Close>
              <button className="otw-btn otw-btn-primary" style={{ flex: 1, background: "#EF4444", borderColor: "#EF4444", boxShadow: "0 4px 0 #B91C1C" }} onClick={() => executeSave(pendingSaveData)}>
                Yes, Apply Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
