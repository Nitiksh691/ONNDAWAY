"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, ClipboardList, LogOut, Save, Settings, Package, MapPin, Calendar, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Order } from "@/lib/types";
import { setActiveOrderId, isActiveOrderStatus } from "@/lib/activeOrder";

export default function ProfilePage() {
  const { user, profile, loading, syncProfile } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info");
  
  // Profile edit state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCollege(profile.college || "");
      setYear(profile.year || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user && orders.length === 0) {
      setFetchingOrders(true);
      fetch(`/api/orders?userId=${user.uid}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setOrders(data);
          const inProgress = data.find((o: Order) => isActiveOrderStatus(o.status));
          if (inProgress) setActiveOrderId(inProgress.id);
          setFetchingOrders(false);
        })
        .catch(() => setFetchingOrders(false));
    }
  }, [user, orders.length]);

  const handleLogout = () => {
    localStorage.removeItem("otw_user_id");
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          name,
          phone,
          location: college,
          year,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated!");
        syncProfile(user.uid);
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };
  
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "placed": return <span className="otw-badge otw-badge-blue">Placed</span>;
      case "preparing": return <span className="otw-badge otw-badge-yellow">Preparing</span>;
      case "out_for_delivery": return <span className="otw-badge otw-badge-blue" style={{ background: "#E0F2FE", color: "#0284C7" }}>Out for Delivery</span>;
      case "delivered": return <span className="otw-badge otw-badge-green">Delivered</span>;
      case "cancelled": return <span className="otw-badge otw-badge-red">Cancelled</span>;
      default: return null;
    }
  };

  if (loading || !user) return <div style={{ minHeight: "60vh" }}></div>;

  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "Recently";

  return (
    <div style={{ background: "var(--bg-cream)", minHeight: "calc(100vh - 68px)", paddingBottom: "100px" }}>
      
      {/* Cover Banner */}
      <div style={{ 
        height: "200px", 
        background: "linear-gradient(135deg, var(--primary) 0%, #2A55FF 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative elements in banner */}
        <div style={{ position: "absolute", top: -50, right: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -80, left: 40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      </div>

      <div className="otw-container" style={{ maxWidth: "800px", marginTop: "-60px", position: "relative", zIndex: 10 }}>
        
        {/* Main Profile Card */}
        <div className="otw-card" style={{ padding: "0 0 24px 0", marginBottom: "24px", overflow: "visible" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 32px" }}>
            
            {/* Avatar - overlaps banner */}
            <div style={{
              width: 120, height: 120, borderRadius: "50%", background: "var(--white)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "5px solid white", boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              marginTop: "-40px", overflow: "hidden", position: "relative",
              color: "var(--primary)", fontSize: "3rem", fontWeight: 800
            }}>
              {profile?.image ? (
                <img src={profile.image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : profile?.gender ? (
                <img src={`/avatars/${profile.gender}.png`} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.1)" }} />
              ) : (
                profile?.name?.[0]?.toUpperCase() || "U"
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              {!isEditing && activeTab === "info" && (
                <button onClick={() => setIsEditing(true)} className="otw-btn otw-btn-outline otw-btn-sm" style={{ borderRadius: "20px" }}>
                  <Settings size={15} /> Edit Profile
                </button>
              )}
              <button onClick={handleLogout} className="otw-btn otw-btn-white otw-btn-sm" style={{ borderRadius: "20px", color: "var(--error)", boxShadow: "0 4px 0 rgba(239, 68, 68, 0.2)" }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* User Details */}
          <div style={{ padding: "16px 32px 0" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "4px", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
              {profile?.name || "User"}
              <span style={{ background: "var(--accent-2)", color: "var(--primary)", fontSize: "0.7rem", padding: "4px 8px", borderRadius: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                {profile?.role || "Foodie"}
              </span>
            </h1>
            
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "16px", fontWeight: 500 }}>
              +91 {profile?.phone || phone}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              {profile?.college && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-mid)", fontSize: "0.9rem", fontWeight: 600 }}>
                  <MapPin size={16} color="var(--primary)" /> {profile.college} {profile?.year ? `• ${profile.year}` : ""}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-mid)", fontSize: "0.9rem", fontWeight: 600 }}>
                <Calendar size={16} color="var(--primary)" /> Joined {joinDate}
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: "24px", paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-dark)" }}>{orders.length}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Orders</div>
              </div>
              {/* Could add more stats here in the future like 'Reviews' or 'Favorites' */}
            </div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", padding: "4px", background: "white", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <button 
            onClick={() => { setActiveTab("info"); setIsEditing(false); }}
            style={{ 
              flex: 1, padding: "12px", borderRadius: "12px", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s",
              background: activeTab === "info" ? "var(--accent-2)" : "transparent",
              color: activeTab === "info" ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            <User size={18} /> About
          </button>
          <button 
            onClick={() => { setActiveTab("orders"); setIsEditing(false); }}
            style={{ 
              flex: 1, padding: "12px", borderRadius: "12px", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s",
              background: activeTab === "orders" ? "var(--accent-2)" : "transparent",
              color: activeTab === "orders" ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            <Package size={18} /> Order History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="animate-fade-up">
            {isEditing ? (
              <div className="otw-card" style={{ padding: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Edit Profile Information</h2>
                  <button onClick={() => setIsEditing(false)} className="otw-btn otw-btn-ghost" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>Cancel</button>
                </div>
                
                <form onSubmit={handleSaveInfo} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Full Name</label>
                    <input type="text" className="otw-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Phone Number</label>
                    <input type="tel" className="otw-input" value={phone} disabled style={{ background: "#F3F4F6", cursor: "not-allowed", color: "#9CA3AF" }} />
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>Phone number is verified and cannot be changed.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Institution</label>
                      <input type="text" className="otw-input" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. IIT Delhi" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Year of Study</label>
                      <select className="otw-input" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                        <option value="PG / Masters">PG / Masters</option>
                      </select>
                    </div>
                  </div>
                  
                  <button type="submit" disabled={isSaving} className="otw-btn otw-btn-primary" style={{ marginTop: "12px", padding: "16px", borderRadius: "12px" }}>
                    <Save size={18} /> {isSaving ? "Saving changes..." : "Save Profile"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="otw-card" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "20px", color: "var(--text-dark)" }}>Personal Information</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Full Name</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-dark)" }}>{profile?.name || "Not set"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Phone</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-dark)" }}>+91 {profile?.phone || phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Institution</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-dark)" }}>{profile?.college || "Not specified"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Year</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-dark)" }}>{profile?.year || "Not specified"}</div>
                  </div>
                </div>

                {!profile?.college && (
                  <div style={{ marginTop: "24px", padding: "16px", background: "#FEF9C3", borderRadius: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.5rem" }}>👋</div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#854D0E", marginBottom: "4px" }}>Complete your profile</h4>
                      <p style={{ fontSize: "0.85rem", color: "#A16207", lineHeight: 1.4 }}>Add your college and year to help us personalize your campus delivery experience.</p>
                      <button onClick={() => setIsEditing(true)} style={{ background: "none", border: "none", color: "#854D0E", fontWeight: 800, fontSize: "0.85rem", marginTop: "8px", cursor: "pointer", textDecoration: "underline" }}>Edit Profile</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-fade-up">
            {fetchingOrders ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <div className="animate-spin" style={{ display: "inline-block", border: "3px solid rgba(1,53,251,0.2)", borderTopColor: "var(--primary)", borderRadius: "50%", width: "30px", height: "30px", marginBottom: "16px" }} />
                <p style={{ fontWeight: 600 }}>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="otw-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🛍️</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>No orders yet</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Hungry? Let's fix that right away.</p>
                <Link href="/menu" className="otw-btn otw-btn-primary" style={{ padding: "12px 24px", borderRadius: "12px" }}>Browse Menu</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orders.map(order => (
                  <div key={order.id} className="otw-card" style={{ padding: "20px", transition: "transform 0.2s", cursor: "pointer" }} onClick={() => router.push(`/track/${order.id}`)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14}/> {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--primary)" }}>
                        ₹{order.total}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.9rem", color: "var(--text-dark)", fontWeight: 500, marginBottom: "16px" }}>
                      {order.items.map(i => `${i.quantity}x ${i.item.name}`).join(", ")}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link href={`/track/${order.id}`} className="otw-btn otw-btn-outline otw-btn-sm" style={{ borderRadius: "10px" }} onClick={e => e.stopPropagation()}>
                        View Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
