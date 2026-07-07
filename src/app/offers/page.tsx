"use client";
export default function OffersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "40px 24px" }}>
      <div className="otw-container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Offers & Promos</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "1.05rem" }}>
          Current deals available on ONN DA WAY.
        </p>
        <div className="item-glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-dark)" }}>No offers right now</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Check back later for exciting discounts!</p>
        </div>
      </div>
    </div>
  );
}
