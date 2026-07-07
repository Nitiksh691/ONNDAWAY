"use client";
import Link from "next/link";
import { Menu, Bell, User as UserIcon, ShoppingCart, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/context";
import { usePathname } from "next/navigation";

export default function TopNavbar() {
  const { toggleSidebar, cartCount, profile } = useApp();
  const pathname = usePathname();

  if (pathname.startsWith("/delivery")) return null;

  return (
    <nav style={{
      height: "64px",
      background: "var(--bg-main)",
      borderBottom: "1px solid var(--border-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 90,
      width: "100%"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button 
          onClick={toggleSidebar}
          style={{ 
            background: "transparent", border: "none", color: "var(--text-dark)", 
            cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" 
          }}
        >
          <Menu size={24} />
        </button>
        
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "6px",
            background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="5.5" r="3" fill="white"/>
              <path d="M16 9 L13.5 17 L18.5 17 Z" fill="white"/>
              <path d="M13.5 11 L10 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 11 L22 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 17 L11 23 L9 27" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 17 L20 22 L22 26" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--text-dark)", lineHeight: 1, textTransform: "uppercase" }}>MONKY SHOP</div>
          </div>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
          <Bell size={20} />
        </button>
        
        {profile?.role === "admin" && (
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
            <ShieldCheck size={18} /> ADMIN PANEL
          </Link>
        )}
        
        <Link href="/profile" style={{ color: "var(--text-muted)", display: "flex" }}>
          <UserIcon size={20} />
        </Link>
        
        <Link href="/cart" style={{ color: "var(--text-muted)", display: "flex", position: "relative" }}>
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -8, background: "var(--primary)", color: "white",
              fontSize: "0.65rem", fontWeight: 800, minWidth: "16px", height: "16px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px"
            }}>
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
