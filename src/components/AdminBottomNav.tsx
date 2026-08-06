"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Utensils, Settings, BarChart2, GripHorizontal, ChevronRight, ChevronLeft } from "lucide-react";

export default function AdminBottomNav() {
  const pathname = usePathname();
  const [isSqueezed, setIsSqueezed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Track whether the pointer has moved significantly (to block link clicks after a drag)
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedSqueezed = localStorage.getItem("adminNavSqueezed");
    if (savedSqueezed === "true") setIsSqueezed(true);
    setPosition({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 100 });
  }, []);

  const toggleSqueeze = () => {
    const newSqueezed = !isSqueezed;
    setIsSqueezed(newSqueezed);
    localStorage.setItem("adminNavSqueezed", newSqueezed.toString());
  };

  const handleGripPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    // Capture on the container so move events don't get lost
    containerRef.current?.setPointerCapture(e.pointerId);
    hasDragged.current = false;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Mark as dragged if moved more than 4px
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDragged.current = true;
    }

    let newX = dragRef.current.initialX + dx;
    let newY = dragRef.current.initialY + dy;
    const maxX = window.innerWidth - (isSqueezed ? 60 : 350);
    const maxY = window.innerHeight - 80;
    if (newX < 0) newX = 0;
    if (newX > maxX) newX = maxX;
    if (newY < 0) newY = 0;
    if (newY > maxY) newY = maxY;
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragRef.current = null;
  };

  if (!mounted || !pathname?.startsWith("/admin")) return null;

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: "Dash" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/admin/menu", icon: Utensils, label: "Menu" },
    { href: "/admin/analytics", icon: BarChart2, label: "Stats" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        padding: "8px",
        borderRadius: "999px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        transition: isDragging ? "none" : "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        touchAction: "none",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Drag Handle */}
      <div
        onPointerDown={handleGripPointerDown}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          borderRadius: "50%",
          touchAction: "none",
          flexShrink: 0,
        }}
        title="Drag to move"
      >
        <GripHorizontal size={18} />
      </div>

      {!isSqueezed && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  // Block navigation if user was dragging
                  if (hasDragged.current) {
                    e.preventDefault();
                    hasDragged.current = false;
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  padding: "6px 10px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive ? "#0135FB" : "#64748B",
                  background: isActive ? "#EEF1FF" : "transparent",
                  transition: "all 0.2s",
                  pointerEvents: isDragging ? "none" : "auto",
                }}
              >
                <link.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: "0.6rem", fontWeight: isActive ? 800 : 600 }}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Squeeze Toggle */}
      <button
        onClick={toggleSqueeze}
        title={isSqueezed ? "Expand" : "Collapse"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EEF1FF",
          border: "none",
          color: "#0135FB",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          transition: "all 0.2s",
          marginLeft: isSqueezed ? 0 : "4px",
          flexShrink: 0,
        }}
      >
        {isSqueezed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  );
}
