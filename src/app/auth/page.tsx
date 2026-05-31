"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { LogIn, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { user, loading, checkSession } = useApp();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setSubmitting(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      localStorage.setItem("otw_user_id", data.userId);
      await checkSession();
      
      if (isLogin) {
        toast.success(`Welcome back, ${username}!`, { style: { background: "#111", color: "#fff" } });
        router.push("/");
      } else {
        toast.success("Account created! Let's set up your profile 🎉", { style: { background: "#111", color: "#fff" } });
        router.push("/onboarding");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", { style: { background: "#111", color: "#fff" } });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111", padding: "24px", color: "#e4e4e7"
    }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#18181b", borderRadius: "24px",
        border: "1px solid #27272a",
        padding: "48px 36px",
        animation: "fade-in 0.5s ease-out",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: "linear-gradient(135deg, #0055ff, #0033cc)", 
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(0,85,255,0.4)",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="2.5" fill="white"/>
              <path d="M12 8.5 L9 12 L12 11 L15 12 Z" fill="white"/>
              <path d="M12 11 L10 16 M12 11 L14 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 16 L8.5 20 M14 16 L15.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontFamily: "inherit", fontWeight: 900, fontSize: "1.8rem", color: "#fff", letterSpacing: "1px" }}>ONN D A WAY</div>
          <div style={{ fontFamily: "inherit", fontSize: "0.8rem", color: "#a0a0a0", letterSpacing: "0.2em", fontWeight: 700, marginTop: "4px" }}>COFFEE PARTNER</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", width: "100%", background: "#0f0f0f", borderRadius: "12px", padding: "6px", marginBottom: "32px", border: "1px solid #27272a" }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: "0.95rem", transition: "all 0.2s",
              fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px",
              background: isLogin ? "#27272a" : "transparent",
              color: isLogin ? "#fff" : "#6b7280",
              boxShadow: isLogin ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            }}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: "0.95rem", transition: "all 0.2s",
              fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px",
              background: !isLogin ? "#27272a" : "transparent",
              color: !isLogin ? "#fff" : "#6b7280",
              boxShadow: !isLogin ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Username</label>
            <input 
              type="text" 
              placeholder="e.g. admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #3f3f46", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, outline: "none", background: "#111", color: "#fff", transition: "border 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#0055ff"}
              onBlur={e => e.currentTarget.style.borderColor = "#3f3f46"}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", color: "#a0a0a0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #3f3f46", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, outline: "none", background: "#111", color: "#fff", transition: "border 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#0055ff"}
              onBlur={e => e.currentTarget.style.borderColor = "#3f3f46"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "18px", borderRadius: "12px", marginTop: "8px",
              border: "none", background: "linear-gradient(135deg, #0055ff, #0033cc)", color: "white",
              fontFamily: "inherit", fontWeight: 900, fontSize: "1.1rem",
              textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,85,255,0.3)", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseOver={e => !submitting && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseOut={e => !submitting && (e.currentTarget.style.transform = "translateY(0)")}
          >
            {submitting ? "Processing..." : isLogin ? <><LogIn size={20}/> Log In</> : <><UserPlus size={20}/> Create Account</>}
          </button>
        </form>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontFamily: "inherit", color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500 }}>
            This portal is for <strong style={{color:"#a0a0a0"}}>admin</strong> and <strong style={{color:"#a0a0a0"}}>delivery staff</strong> only. 
            Customers do not need to login here.
          </p>
        </div>
      </div>
    </div>
  );
}
