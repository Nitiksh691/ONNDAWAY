"use client";

export default function SupportPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "40px 24px" }}>
      <div className="otw-container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Help & Support</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "1.05rem" }}>
          Need assistance? We're here to help.
        </p>
        
        <div className="item-glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 16 }}>Contact Us</h2>
          <p style={{ color: "var(--text-mid)", marginBottom: 8 }}>Email: support@onndaway.com</p>
          <p style={{ color: "var(--text-mid)", marginBottom: 8 }}>Phone: +91 99999 99999</p>
        </div>
      </div>
    </div>
  );
}
