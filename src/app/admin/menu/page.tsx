"use client";
import { useState } from "react";
import Image from "next/image";
import { useEffect } from "react";
import { MenuItem } from "@/lib/types";
import { Plus, Edit2, Trash2, Search, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";


// Dialog components from Radix UI
import * as Dialog from '@radix-ui/react-dialog';

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [form, setForm] = useState<Partial<MenuItem>>({ name: "", description: "", price: 0, originalPrice: 0, section: "", category: "coffee", available: true, isPopular: false, isRecommended: false, isBanner: false, image: "", customizationCategories: [], details: [], sizes: [] });
  const [uploadingImage, setUploadingImage] = useState(false);


  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenEdit = (item: MenuItem | null) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
    } else {
      setEditingItem(null);
      setForm({ name: "", description: "", price: 0, originalPrice: 0, section: "", category: "coffee", available: true, isPopular: false, isRecommended: false, isBanner: false, image: "", orderCount: 0, sortOrder: 0, customizationCategories: [], details: [], sizes: [] });
    }
    setDialogOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: reader.result }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setForm(f => ({ ...f, image: data.url }));
            toast.success("Image uploaded!");
          } else {
            toast.error(data.error || "Failed to upload image");
          }
        } catch {
          toast.error("Error uploading image");
        } finally {
          setUploadingImage(false);
        }
      };
    } catch {
      toast.error("Error reading file");
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(`Item ${editingItem ? "updated" : "added"} successfully`);
        fetchMenu();
        setDialogOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save item");
      }
    } catch (err) {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Item deleted");
          fetchMenu();
        } else {
          toast.error("Failed to delete item");
        }
      } catch (err) {
        toast.error("Failed to delete item");
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "8px" }}>Menu Management</h1>
          <p style={{ color: "var(--text-muted)" }}>Add, edit, or remove items from the campus menu.</p>
        </div>
        <button onClick={() => handleOpenEdit(null)} style={{ background: "#0055ff", color: "#0f172a", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>

        <div style={{ position: "relative", marginBottom: "24px", maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search menu items..."
            style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px 14px 48px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "16px", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Item</th>
                <th style={{ padding: "16px", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Category</th>
                <th style={{ padding: "16px", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Price</th>
                <th style={{ padding: "16px", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "16px", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--accent)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "10px", background: "#e2e8f0", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.image ? <Image src={item.image} alt={item.name} fill sizes="48px" style={{ objectFit: "cover" }} /> : <ImageIcon size={20} color="var(--text-muted)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-dark)" }}>{item.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.description}</div>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: item.isPopular || item.isRecommended || item.isBanner ? "6px" : undefined }}>
                          {item.isPopular && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#2a160c", border: "1px solid #7c2d12", color: "#f97316", fontSize: "0.68rem", fontWeight: 800, padding: "2px 7px", borderRadius: "999px", letterSpacing: "0.3px" }}>
                              🔥 POPULAR
                            </span>
                          )}
                          {item.isRecommended && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#0d2b18", border: "1px solid #14532d", color: "#22c55e", fontSize: "0.68rem", fontWeight: 800, padding: "2px 7px", borderRadius: "999px", letterSpacing: "0.3px" }}>
                              🎯 RECOMMENDED
                            </span>
                          )}
                          {item.isBanner && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#0d1b2a", border: "1px solid #1e3a8a", color: "#60a5fa", fontSize: "0.68rem", fontWeight: 800, padding: "2px 7px", borderRadius: "999px", letterSpacing: "0.3px" }}>
                              🎇 BANNER
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize" }}>{item.category}</span>
                    {item.section && <div style={{ fontSize: "0.7rem", color: "var(--primary)", marginTop: "4px", fontWeight: 700 }}>{item.section}</div>}
                  </td>
                  <td style={{ padding: "16px", fontWeight: 700, color: "var(--primary)" }}>
                    {item.originalPrice && item.originalPrice > item.price ? (
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "line-through", marginRight: "6px" }}>₹{item.originalPrice}</span>
                        ₹{item.price}
                      </div>
                    ) : (
                      <span>₹{item.price}</span>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span className={`otw-badge ${item.available ? 'otw-badge-green' : 'otw-badge-red'}`}>
                      {item.available ? "In Stock" : "Sold Out"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => handleOpenEdit(item)} style={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid #cbd5e1", background: "#e2e8f0", color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(item.id)} style={{ width: 32, height: 32, borderRadius: "8px", border: "1px solid #7f1d1d", background: "#450a0a", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Edit/Add Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 1000 }} />
          <Dialog.Content aria-describedby={undefined} style={{
            background: "#ffffff",
            position: "fixed", top: "45%", left: "50%", transform: "translate(-50%, -50%)",
            width: "95%", maxWidth: "650px", padding: "0", zIndex: 1001,
            maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "3px solid var(--primary)", borderRadius: "16px"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "#e2e8f0", display: "flex" }}>
              <Dialog.Title style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-dark)", margin: 0 }}>
                {editingItem ? "Edit Menu Item" : "Create New Item"}
              </Dialog.Title>
            </div>

            <div style={{ padding: "32px", overflowY: "auto", flex: 1, minHeight: 0, overscrollBehavior: "contain" }}>
              <form id="menu-form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Item Name</label>
                  <input type="text" className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                  <div>
                    <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Current Price (₹)</label>
                    <input type="number" className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required min="0" />
                  </div>
                  <div>
                    <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Original Price (₹) - Optional</label>
                    <input type="number" className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="For discounts" value={form.originalPrice || ""} onChange={e => setForm({ ...form, originalPrice: e.target.value ? Number(e.target.value) : undefined })} min="0" />
                  </div>
                  <div>
                    <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Category</label>
                    <select className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} required>
                      <option value="Coffee">Coffee</option>
                      {/* <option value="snacks">Snacks</option>
                      <option value="meals">Meals</option> */}
                      <option value="Drinks">Drinks</option>
                      {/* <option value="desserts">Desserts</option> */}
                      <option value="Mactha">Matcha</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
                  <div>
                    <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Homepage Custom Section (Optional)</label>
                    <input type="text" className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="e.g. Today's Specials" value={form.section || ""} onChange={e => setForm({ ...form, section: e.target.value })} />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Items with the same section name will be grouped together.</p>
                  </div>
                  <div>
                    <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Display Order (Position)</label>
                    <input type="number" className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="e.g. 1" value={form.sortOrder ?? 0} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} min="0" />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Lower numbers appear first in sliders.</p>
                  </div>
                </div>
                <div>
                  <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Description</label>
                  <textarea className="otw-input" style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box", minHeight: "80px", resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div>
                  <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Item Image</label>
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: "2px dashed var(--border)", borderRadius: "16px", padding: "40px 20px",
                    background: "#ffffff", cursor: "pointer", transition: "all 0.2s",
                    position: "relative", overflow: "hidden"
                  }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    {uploadingImage ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "30px", height: "30px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                        <div style={{ color: "var(--primary)", fontWeight: 700 }}>Uploading to Cloudinary...</div>
                      </div>
                    ) : form.image ? (
                      <>
                        <div style={{ position: "absolute", inset: 0 }}>
                          <Image src={form.image} alt="Preview" fill sizes="600px" style={{ objectFit: "contain" }} />
                        </div>
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                          Click to change image
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
                          <ImageIcon size={28} color="var(--primary)" />
                        </div>
                        <div style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: "1.1rem", marginBottom: "4px" }}>Click to upload image</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Supports JPG, PNG, WEBP</div>
                      </>
                    )}
                  </label>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#ffffff", borderRadius: "12px" }}>
                    <input type="checkbox" id="avail" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} style={{ width: 20, height: 20, cursor: "pointer", accentColor: "var(--primary)" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label htmlFor="avail" style={{ fontWeight: 700, cursor: "pointer", color: "var(--text-dark)" }}>Item is currently available</label>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Uncheck this if the item is out of stock.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#2a160c", border: "1px solid #4a2111", borderRadius: "12px" }}>
                    <input type="checkbox" id="popular" checked={form.isPopular || false} onChange={e => setForm({ ...form, isPopular: e.target.checked })} style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#EA580C" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label htmlFor="popular" style={{ fontWeight: 700, cursor: "pointer", color: "#9A3412" }}>🔥 Mark as Popular</label>
                      <span style={{ fontSize: "0.8rem", color: "#C2410C" }}>Will show up in the "Popular Items" sections.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#0d2b18", border: "1px solid #164f2b", borderRadius: "12px" }}>
                    <input type="checkbox" id="recommended" checked={form.isRecommended || false} onChange={e => setForm({ ...form, isRecommended: e.target.checked })} style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#16A34A" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label htmlFor="recommended" style={{ fontWeight: 700, cursor: "pointer", color: "#166534" }}>🎯 Mark as Recommended</label>
                      <span style={{ fontSize: "0.8rem", color: "#15803D" }}>Will show up in the "Recommended For You" section.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#0d1b2a", border: "1px solid #1a365d", borderRadius: "12px" }}>
                    <input type="checkbox" id="banner" checked={form.isBanner || false} onChange={e => setForm({ ...form, isBanner: e.target.checked })} style={{ width: 20, height: 20, cursor: "pointer", accentColor: "#2563EB" }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label htmlFor="banner" style={{ fontWeight: 700, cursor: "pointer", color: "#1E3A8A" }}>🎇 Feature in Top Banner</label>
                      <span style={{ fontSize: "0.8rem", color: "#1D4ED8" }}>Item will appear in the large moving carousel on the homepage.</span>
                    </div>
                  </div>
                </div>

                {/* ── Beverage Details ── */}
                <div style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Item Details (Ingredients, Quantity)</h3>
                    <button type="button" onClick={() => setForm(f => ({ ...f, details: [...(f.details || []), { label: "", value: "" }] }))} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>+ Add Detail</button>
                  </div>
                  {(!form.details || form.details.length === 0) && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No details added (e.g. Ingredients: Milk, Sugar).</div>
                  )}
                  {form.details?.map((detail, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                      <input type="text" placeholder="Label (e.g. Ingredients)" style={{ flex: 1, background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "6px", padding: "8px 12px", outline: "none", fontSize: "0.9rem" }} value={detail.label} onChange={e => {
                        const newDetails = [...form.details!];
                        newDetails[idx].label = e.target.value;
                        setForm({ ...form, details: newDetails });
                      }} />
                      <input type="text" placeholder="Value (e.g. Coffee, Milk)" style={{ flex: 2, background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "6px", padding: "8px 12px", outline: "none", fontSize: "0.9rem" }} value={detail.value} onChange={e => {
                        const newDetails = [...form.details!];
                        newDetails[idx].value = e.target.value;
                        setForm({ ...form, details: newDetails });
                      }} />
                      <button type="button" onClick={() => {
                        const newDetails = [...form.details!];
                        newDetails.splice(idx, 1);
                        setForm({ ...form, details: newDetails });
                      }} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* ── Glass Sizes ── */}
                <div style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Glass/Item Sizes</h3>
                    <button type="button" onClick={() => setForm(f => ({ ...f, sizes: [...(f.sizes || []), { name: "", price: form.price || 0 }] }))} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>+ Add Size</button>
                  </div>
                  {(!form.sizes || form.sizes.length === 0) && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No additional sizes. Item uses base price.</div>
                  )}
                  {form.sizes?.map((size, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                      <input type="text" placeholder="Size Name (e.g. Large)" style={{ flex: 1, background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "6px", padding: "8px 12px", outline: "none", fontSize: "0.9rem" }} value={size.name} onChange={e => {
                        const newSizes = [...form.sizes!];
                        newSizes[idx].name = e.target.value;
                        setForm({ ...form, sizes: newSizes });
                      }} />
                      <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", flex: 1 }}>
                        <span style={{ padding: "8px 10px", color: "var(--text-muted)", fontSize: "0.85rem", borderRight: "1px solid #cbd5e1", background: "#f8fafc" }}>₹</span>
                        <input type="number" placeholder="Price" style={{ width: "100%", background: "transparent", border: "none", color: "#0f172a", padding: "8px 12px", outline: "none", fontSize: "0.9rem" }} value={size.price} onChange={e => {
                          const newSizes = [...form.sizes!];
                          newSizes[idx].price = Number(e.target.value);
                          setForm({ ...form, sizes: newSizes });
                        }} />
                      </div>
                      <button type="button" onClick={() => {
                        const newSizes = [...form.sizes!];
                        newSizes.splice(idx, 1);
                        setForm({ ...form, sizes: newSizes });
                      }} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* ── Customizations Section ── */}
                <div style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Customizations (Add-ons)</h3>
                    <button type="button" onClick={() => setForm(f => ({ ...f, customizationCategories: [...(f.customizationCategories || []), { name: "", options: [], required: false, multiple: false }] }))} style={{ background: "#e2e8f0", color: "#0f172a", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>+ Add Category</button>
                  </div>

                  {(!form.customizationCategories || form.customizationCategories.length === 0) && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No customizations added (e.g. Milk Options, Add-ons).</div>
                  )}

                  {form.customizationCategories?.map((cat, catIdx) => (
                    <div key={catIdx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
                        <input type="text" placeholder="Category Name (e.g. Milk)" style={{ flex: 1, background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "6px", padding: "8px 12px", outline: "none", fontSize: "0.9rem" }} value={cat.name} onChange={e => {
                          const newCats = [...form.customizationCategories!];
                          newCats[catIdx].name = e.target.value;
                          setForm({ ...form, customizationCategories: newCats });
                        }} />
                        <button type="button" onClick={() => {
                          const newCats = [...form.customizationCategories!];
                          newCats.splice(catIdx, 1);
                          setForm({ ...form, customizationCategories: newCats });
                        }} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "12px", borderLeft: "2px solid #e2e8f0" }}>
                        {cat.options.map((opt, optIdx) => (
                          <div key={optIdx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="text" placeholder="Option (e.g. Oat Milk)" style={{ flex: 1, background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "6px", padding: "6px 10px", outline: "none", fontSize: "0.85rem" }} value={opt.name} onChange={e => {
                              const newCats = [...form.customizationCategories!];
                              newCats[catIdx].options[optIdx].name = e.target.value;
                              setForm({ ...form, customizationCategories: newCats });
                            }} />
                            <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                              <span style={{ padding: "6px 8px", color: "var(--text-muted)", fontSize: "0.85rem", borderRight: "1px solid #cbd5e1" }}>+₹</span>
                              <input type="number" placeholder="0" style={{ width: "60px", background: "transparent", border: "none", color: "#0f172a", padding: "6px", outline: "none", fontSize: "0.85rem" }} value={opt.price} onChange={e => {
                                const newCats = [...form.customizationCategories!];
                                newCats[catIdx].options[optIdx].price = Number(e.target.value);
                                setForm({ ...form, customizationCategories: newCats });
                              }} min="0" />
                            </div>
                            <button type="button" onClick={() => {
                              const newCats = [...form.customizationCategories!];
                              newCats[catIdx].options.splice(optIdx, 1);
                              setForm({ ...form, customizationCategories: newCats });
                            }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newCats = [...form.customizationCategories!];
                          newCats[catIdx].options.push({ name: "", price: 0 });
                          setForm({ ...form, customizationCategories: newCats });
                        }} style={{ background: "transparent", color: "var(--primary)", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", width: "fit-content", marginTop: "4px" }}>
                          <Plus size={14} /> Add Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border)", marginTop: "12px", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
                  <Dialog.Close asChild>
                    <button type="button" style={{ background: "transparent", color: "#334155", border: "1px solid #cbd5e1", padding: "14px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", minWidth: "120px" }}>Cancel</button>
                  </Dialog.Close>
                  <button type="submit" style={{ background: "#0055ff", color: "#0f172a", border: "none", padding: "14px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", minWidth: "160px" }}>
                    {editingItem ? "Save Changes" : "Create Item"}
                  </button>
                </div>

              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
