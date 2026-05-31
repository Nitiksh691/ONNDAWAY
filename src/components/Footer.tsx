import Link from "next/link";
import { Camera, MessageCircle, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--primary)",
      color: "white",
      padding: "60px 0 28px",
    }}>
      <div className="otw-container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "40px",
          marginBottom: "48px",
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "10px",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="2.5" fill="white"/>
                  <path d="M12 8.5 L9 12 L12 11 L15 12 Z" fill="white"/>
                  <path d="M12 11 L10 16 M12 11 L14 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 16 L8.5 20 M14 16 L15.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>ONN D A WAY</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.7, letterSpacing: "0.05em" }}>COFFEE</div>
              </div>
            </div>
            <p style={{ fontSize: "0.88rem", opacity: 0.8, lineHeight: 1.7, maxWidth: 260 }}>
              Coffee & food delivery, reimagined. Fresh, fast, and delivered right to your doorstep.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              {[
                { icon: <Camera size={16}/>, href: "#" },
                { icon: <MessageCircle size={16}/>, href: "#" },
                { icon: <Mail size={16}/>, href: "mailto:hello@onndaway.com" },
              ].map((s, i) => (
                <a key={i} href={s.href} style={{
                  width: 36, height: 36, borderRadius: "8px",
                  background: "rgba(255,255,255,0.15)", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "white",
                  textDecoration: "none", transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: "16px", fontSize: "0.95rem" }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Menu", href: "/" },
                { label: "My Orders", href: "/orders" },
                { label: "Track Order", href: "/orders" },
                { label: "Delivery Partner", href: "/delivery/login" },
              ].map(l => (
                <Link key={l.label} href={l.href} style={{
                  color: "rgba(255,255,255,0.8)", textDecoration: "none",
                  fontSize: "0.88rem", transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: "16px", fontSize: "0.95rem" }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { icon: <MapPin size={15}/>, text: "Delivering fresh food daily" },
                { icon: <Phone size={15}/>, text: "+91 8130939274" },
                { icon: <Mail size={15}/>, text: "nitikshpal@gmail.com" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "0.88rem", opacity: 0.85 }}>
                  <span style={{ marginTop: 1, flexShrink: 0 }}>{c.icon}</span>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
        }}>
          <p style={{ fontSize: "0.82rem", opacity: 0.65 }}>
            © {new Date().getFullYear()} ONN D A WAY Coffee. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy Policy", "Terms of Service"].map(l => (
              <a key={l} href="#" style={{ fontSize: "0.82rem", opacity: 0.65, color: "white", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
