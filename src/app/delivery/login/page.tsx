"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Truck, ArrowRight, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function DeliveryLogin() {
  const { user, profile, loading } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user && profile?.role === "delivery") {
      router.push("/delivery/dashboard");
    }
  }, [user, profile, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    try {
      // Demo fallback logic
      if (email === "demo@delivery.com" && password === "demo123") {
         localStorage.setItem("otw_delivery_id", "demo1");
         toast.success("Logged in as Demo Partner!");
         router.push("/delivery/dashboard");
         return;
      }

      const res = await fetch("/api/delivery-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const dp = await res.json();
        localStorage.setItem("otw_delivery_id", dp.uid);
        toast.success("Login successful!");
        router.push("/delivery/dashboard");
      } else {
        toast.error("Invalid credentials.");
      }
    } catch {
      toast.error("Invalid credentials.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F1F5F9" }}>
      {/* Left decoration */}
      <div style={{ flex: 1, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }} className="hide-mobile">
        <div style={{ color: "white", textAlign: "center" }}>
          <Truck size={80} style={{ marginBottom: "24px", opacity: 0.9 }} />
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "16px" }}>Delivery Partner Portal</h1>
          <p style={{ opacity: 0.8, fontSize: "1.1rem", maxWidth: 400 }}>Manage your assigned orders, update statuses, and deliver happiness across the campus.</p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="otw-card" style={{ width: "100%", maxWidth: 440, padding: "40px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "12px", background: "var(--accent)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Partner Login</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>Sign in to view your deliveries</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label className="otw-label">Email</label>
              <input 
                type="email" 
                className="otw-input" 
                placeholder="partner@onndaway.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="otw-label">Password</label>
              <input 
                type="password" 
                className="otw-input" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div style={{ background: "#FEF3C7", padding: "12px", borderRadius: "8px", fontSize: "0.8rem", color: "#92400E", display: "flex", gap: "8px" }}>
              <strong>Demo:</strong> <span>Email: demo@delivery.com<br/>Pass: demo123</span>
            </div>

            <button 
              type="submit" 
              disabled={signingIn} 
              className="otw-btn otw-btn-primary" 
              style={{ width: "100%", padding: "14px", marginTop: "8px", fontSize: "1rem" }}
            >
              {signingIn ? "Signing In..." : <>Login <ArrowRight size={18}/></>}
            </button>
          </form>
        </div>
      </div>


    </div>
  );
}
