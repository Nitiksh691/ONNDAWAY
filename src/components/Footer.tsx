import Link from "next/link";
import { Camera, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, SUPPORT_EMAIL } from "@/lib/company";

export default function Footer() {
  return (
    <footer style={{ background: "var(--primary)", color: "white" }}>
      <style>{`
        .footer-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          padding: 48px 0 32px;
        }
        .footer-brand-col {}
        .footer-right-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        .footer-section-title {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          opacity: 0.5;
          margin-bottom: 16px;
        }
        .footer-link {
          display: block;
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          padding: 5px 0;
          transition: color 0.15s;
        }
        .footer-link:hover { color: white; }
        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          padding: 4px 0;
        }
        .footer-contact-item a { color: rgba(255,255,255,0.8); text-decoration: none; transition: color 0.15s; }
        .footer-contact-item a:hover { color: white; }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.12);
          padding: 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-social-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          color: white; text-decoration: none;
          transition: background 0.2s;
        }
        .footer-social-btn:hover { background: rgba(255,255,255,0.25); }
        @media (max-width: 640px) {
          .footer-main { grid-template-columns: 1fr; gap: 32px; padding: 32px 0 24px; }
          .footer-right-col { grid-template-columns: 1fr 1fr; gap: 24px; }
        }
      `}</style>

      <div className="otw-container">
        <div className="footer-main">
          {/* Left: Brand */}
          <div className="footer-brand-col">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "10px",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                <img src="/logo.png.jpeg" alt="ONN DA WAY" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.15rem", letterSpacing: "0.5px", lineHeight: 1.1 }}>ONN DA WAY</div>
                <div style={{ fontSize: "0.62rem", opacity: 0.6, letterSpacing: "1.5px", marginTop: "2px" }}>FOOD DELIVERY</div>
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.7, maxWidth: "280px" }}>
              Fresh meals, snacks & beverages delivered fast — built by students, for students.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <a href="#" className="footer-social-btn"><Camera size={15} /></a>
              <a href={`https://wa.me/${SUPPORT_PHONE_DISPLAY?.replace(/\D/g, "")}`} className="footer-social-btn"><MessageCircle size={15} /></a>
            </div>
          </div>

          {/* Right: Links + Contact */}
          <div className="footer-right-col">
            {/* Quick Links */}
            <div>
              <div className="footer-section-title">Explore</div>
              {[
                { label: "Menu", href: "/menu" },
                { label: "My Orders", href: "/orders" },
                { label: "About Us", href: "/about" },
                { label: "Become a Partner", href: "/delivery/login" },
              ].map(l => (
                <Link key={l.label} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div className="footer-section-title">Contact</div>
              <div className="footer-contact-item">
                <MapPin size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>Rohini, Delhi</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                <a href={SUPPORT_TEL}>{SUPPORT_PHONE_DISPLAY}</a>
              </div>
              <div className="footer-contact-item">
                <Mail size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>
            © {new Date().getFullYear()} ONN DA WAY. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy Policy", "Terms of Service"].map(l => (
              <a key={l} href="#" style={{ fontSize: "0.72rem", opacity: 0.5, color: "white", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
