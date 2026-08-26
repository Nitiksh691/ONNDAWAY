"use client";
import { useState, useEffect } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import * as Dialog from '@radix-ui/react-dialog';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ code: "", label: "", discount: 0, type: "percentage", active: true, memeImage: "", memeSound: "" });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons", {
        headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
      });
      if (res.ok) setCoupons(await res.json());
    } catch (e) {}
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/coupons", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "x-admin-token": sessionStorage.getItem("otw_admin_token") || ""
        }, 
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success("Coupon created successfully");
        setDialogOpen(false);
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create coupon");
      }
    } catch {
      toast.error("Failed to create coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Delete this coupon?")) {
      try {
        const res = await fetch(`/api/coupons/${id}`, { 
          method: "DELETE",
          headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
        });
        if (res.ok) {
          toast.success("Coupon deleted");
          fetchCoupons();
        } else {
          toast.error("Failed to delete coupon");
        }
      } catch {
        toast.error("Failed to delete coupon");
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "8px" }}>Coupons</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage discount codes and promotions.</p>
        </div>
        <button onClick={() => { setForm({code: "", label: "", discount: 0, type: "percentage", active: true, memeImage: "", memeSound: ""}); setDialogOpen(true); }} className="otw-btn otw-btn-primary">
          <Plus size={18}/> New Coupon
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {coupons.map(coupon => (
          <div key={coupon.id} className="otw-card" style={{ padding: "24px", position: "relative" }}>
            <div style={{ position: "absolute", top: 24, right: 24 }}>
              <button onClick={() => handleDelete(coupon.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer" }}><Trash2 size={16}/></button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--accent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Tag size={20}/>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--primary)", letterSpacing: "1px" }}>{coupon.code}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: 700 }}>Active</div>
              </div>
            </div>

            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "8px" }}>{coupon.label}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Discount: {coupon.type === "percentage" ? `${coupon.discount}%` : `₹${coupon.discount}`}
            </div>

            <div style={{ background: "#F8FAFF", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-mid)", display: "flex", justifyContent: "space-between" }}>
              <span>Total Uses</span>
              <span style={{ color: "var(--primary)" }}>{coupon.usageCount} times</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }} />
          <Dialog.Content aria-describedby={undefined} className="otw-card" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: "400px", padding: "32px", zIndex: 1001 }}>
            <Dialog.Title style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "24px" }}>Create Coupon</Dialog.Title>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="otw-label">Coupon Code</label>
                <input type="text" className="otw-input" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. CAMPUS20" required />
              </div>
              <div>
                <label className="otw-label">Label / Description</label>
                <input type="text" className="otw-input" value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="e.g. 20% off for students" required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="otw-label">Type</label>
                  <select className="otw-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="otw-label">Discount Value</label>
                  <input type="number" className="otw-input" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} required min="1" />
                </div>
              </div>

              <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "1px dashed var(--border)" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "12px", color: "var(--text-dark)" }}>🎁 Meme / Surprise (Optional)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label className="otw-label">Popup Image URL</label>
                    <input type="url" className="otw-input" value={form.memeImage} onChange={e => setForm({...form, memeImage: e.target.value})} placeholder="e.g. https://imgur.com/meme.jpg" />
                  </div>
                  <div>
                    <label className="otw-label">Surprise Audio URL</label>
                    <input type="url" className="otw-input" value={form.memeSound} onChange={e => setForm({...form, memeSound: e.target.value})} placeholder="e.g. https://example.com/sound.mp3" />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <Dialog.Close asChild>
                  <button type="button" className="otw-btn otw-btn-outline" style={{ flex: 1 }}>Cancel</button>
                </Dialog.Close>
                <button type="submit" className="otw-btn otw-btn-primary" style={{ flex: 1 }}>Create</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
