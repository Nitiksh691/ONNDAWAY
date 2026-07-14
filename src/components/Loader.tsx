"use client";
import { useEffect, useState } from "react";
import WalkingLoader from "./WalkingLoader";

export default function Loader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader for a much shorter time (300ms) just to mask initial mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--primary)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      animation: loading ? "none" : "fadeOut 0.4s ease forwards",
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
      `}}/>
      <WalkingLoader size={80} color="#FFFFFF" />
    </div>
  );
}
