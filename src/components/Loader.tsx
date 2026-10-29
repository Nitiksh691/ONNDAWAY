"use client";
import React, { useEffect, useState } from "react";
import WalkingLoader from "./WalkingLoader";

export default function Loader() {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 380);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0135FB",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        transition: "opacity 0.38s ease",
        opacity: exiting ? 0 : 1,
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <WalkingLoader size={90} color="#FFFFFF" />

    </div>
  );
}
