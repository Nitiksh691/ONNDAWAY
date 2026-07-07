"use client";
import { useApp } from "@/lib/context";

export default function SettingsPage() {
  const { profile } = useApp();
  
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "40px 24px" }}>
      <div className="otw-container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Settings</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "1.05rem" }}>
          Manage your account preferences.
        </p>
        
        <div className="item-glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 16 }}>Profile Information</h2>
          {profile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, color: "var(--text-mid)" }}>
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Phone:</strong> {profile.phone}</div>
              <div><strong>College:</strong> {profile.college}</div>
              <div><strong>Role:</strong> {profile.role}</div>
            </div>
          ) : (
            <p>Please log in to view settings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
