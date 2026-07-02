"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Utensils, Settings, BarChart2, Maximize, Minimize } from "lucide-react";

export default function AdminBottomNav() {
  const pathname = usePathname();
  const [navMode, setNavMode] = useState<"flowing" | "attached">("flowing");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("adminNavMode");
    if (saved === "flowing" || saved === "attached") {
      setNavMode(saved);
    }
  }, []);

  const toggleMode = () => {
    const newMode = navMode === "flowing" ? "attached" : "flowing";
    setNavMode(newMode);
    localStorage.setItem("adminNavMode", newMode);
  };

  // Only render on admin pages, but not if it's SSR phase (to avoid hydration mismatch)
  if (!mounted || !pathname?.startsWith("/admin")) return null;

  const isFlowing = navMode === "flowing";

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: "Dash" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/admin/menu", icon: Utensils, label: "Menu" },
    { href: "/admin/analytics", icon: BarChart2, label: "Stats" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: isFlowing ? "20px" : "0",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)",
      padding: isFlowing ? "10px 16px" : "12px 24px",
      borderRadius: isFlowing ? "999px" : "20px 20px 0 0",
      border: "1px solid #E2E8F0",
      borderBottom: isFlowing ? "1px solid #E2E8F0" : "none",
      boxShadow: isFlowing ? "0 10px 30px rgba(0,0,0,0.1)" : "0 -4px 20px rgba(0,0,0,0.05)",
      width: isFlowing ? "auto" : "100%",
      maxWidth: isFlowing ? "auto" : "800px",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: isFlowing ? "8px 12px" : "6px 16px",
              borderRadius: "12px",
              textDecoration: "none",
              color: isActive ? "#0135FB" : "#64748B",
              background: isActive ? "#EEF1FF" : "transparent",
              transition: "all 0.2s",
              minWidth: "60px",
            }}
          >
            <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 800 : 600 }}>
              {link.label}
            </span>
          </Link>
        );
      })}

      <div style={{ width: "1px", height: "30px", background: "#E2E8F0", margin: "0 4px" }} />

      <button
        onClick={toggleMode}
        title={`Switch to ${isFlowing ? "Attached" : "Flowing"} Navigation`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#0F172A"; e.currentTarget.style.background = "#F1F5F9"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "transparent"; }}
      >
        {isFlowing ? <Maximize size={18} /> : <Minimize size={18} />}
      </button>
    </div>
  );
}
