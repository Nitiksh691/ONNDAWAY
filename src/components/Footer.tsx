import Link from "next/link";
import { Camera, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, SUPPORT_EMAIL, COMPANY_BLURB } from "@/lib/company";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--primary)",
      color: "white",
      padding: "20px 0 16px",
    }}>
      <div className="otw-container">
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px",
        }}>
          {/* Brand - take up more space */}
          <div style={{ flex: "1 1 300px", minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "8px",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="2.5" fill="white"/>
                  <path d="M12 8.5 L9 12 L12 11 L15 12 Z" fill="white"/>
                  <path d="M12 11 L10 16 M12 11 L14 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 16 L8.5 20 M14 16 L15.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.1 }}>ONN D A WAY</div>
                <div style={{ fontSize: "0.6rem", opacity: 0.7, letterSpacing: "0.05em" }}>FOOD DELIVERY</div>
              </div>
            </div>
            <p style={{ fontSize: "0.8rem", opacity: 0.8, lineHeight: 1.5, maxWidth: "100%" }}>
              {COMPANY_BLURB}
            </p>
          </div>

          {/* Links and Contact side-by-side if space allows */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", flex: "2 1 auto", justifyContent: "flex-end" }}>
            {/* Quick Links */}
            <div style={{ minWidth: "140px" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", fontSize: "0.9rem" }}>Quick Links</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Menu", href: "/menu" },
                  { label: "My Orders", href: "/orders" },
                  { label: "About Us", href: "/about" },
                  { label: "Delivery Partner", href: "/delivery/login" },
                ].map(l => (
                  <Link key={l.label} href={l.href} style={{
                    color: "rgba(255,255,255,0.8)", textDecoration: "none",
                    fontSize: "0.8rem", transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div style={{ minWidth: "180px" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", fontSize: "0.9rem" }}>Contact & Socials</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: <MapPin size={14}/>, text: "Delivering fresh food daily" },
                  { icon: <Phone size={14}/>, text: SUPPORT_PHONE_DISPLAY, href: SUPPORT_TEL },
                  { icon: <Mail size={14}/>, text: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.8rem", opacity: 0.85 }}>
                    <span style={{ flexShrink: 0 }}>{c.icon}</span>
                    {"href" in c && c.href ? (
                      <a href={c.href} style={{ color: "inherit", textDecoration: "none" }}>{c.text}</a>
                    ) : (
                      <span>{c.text}</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {[
                  { icon: <Camera size={14}/>, href: "#" },
                  { icon: <MessageCircle size={14}/>, href: "#" },
                ].map((s, i) => (
                  <a key={i} href={s.href} style={{
                    width: 28, height: 28, borderRadius: "6px",
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
          </div>
        </div>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
        }}>
          <p style={{ fontSize: "0.75rem", opacity: 0.65 }}>
            © {new Date().getFullYear()} ONN D A WAY. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {["Privacy Policy", "Terms of Service"].map(l => (
              <a key={l} href="#" style={{ fontSize: "0.75rem", opacity: 0.65, color: "white", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
