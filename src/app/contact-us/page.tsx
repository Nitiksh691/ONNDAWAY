import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, ShoppingBag, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — ONN DA WAY",
  description: "Get in touch with ONN DA WAY for order support, delivery queries, payment issues, and general questions.",
};

export default function ContactUsPage() {
  return (
    <div style={{ background: "#F5F7FF", minHeight: "100vh", paddingBottom: "60px" }}>
      <style>{`
        @keyframes contact-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .contact-fade-up { animation: contact-fade-up 0.5s ease both; }
        .contact-card {
          background: #fff;
          border-radius: 16px;
          padding: 28px 24px;
          box-shadow: 0 2px 16px rgba(1,53,251,0.07);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .contact-card:hover {
          box-shadow: 0 8px 32px rgba(1,53,251,0.13);
          transform: translateY(-2px);
        }
        .contact-method-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 12px;
          background: #F5F7FF;
          text-decoration: none;
          color: #0A0F2E;
          transition: background 0.15s, transform 0.15s;
          border: 1.5px solid transparent;
        }
        .contact-method-link:hover {
          background: #EEF1FF;
          border-color: rgba(1,53,251,0.2);
          transform: translateX(4px);
        }
        .contact-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          background: #EEF1FF;
          color: #0135FB;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .policy-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          background: #F5F7FF;
          border: 1.5px solid #e5e7eb;
          color: #0135FB;
          text-decoration: none;
          font-size: 0.83rem;
          font-weight: 700;
          transition: all 0.15s;
        }
        .policy-link-btn:hover {
          background: #EEF1FF;
          border-color: #0135FB;
        }
      `}</style>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0135FB 0%, #2A55FF 100%)",
        padding: "56px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)" }} />
        <div className="contact-fade-up" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: "18px",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            backdropFilter: "blur(8px)",
          }}>
            <MessageCircle size={30} color="white" />
          </div>
          <h1 style={{
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: 900,
            color: "#fff",
            marginBottom: "10px",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>Contact Us</h1>
          <p style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: "1rem",
            maxWidth: 420,
            margin: "0 auto",
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            We&apos;re here to help with your orders, delivery questions, payment issues and general queries.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>

        {/* Main contact methods */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: "-28px", position: "relative", zIndex: 2 }} className="contact-fade-up">
          <a href="tel:+918130939274" className="contact-card" style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg, #0135FB, #2A55FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(1,53,251,0.35)" }}>
              <Phone size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Call Us</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0135FB" }}>+91 8130939274</div>
              <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>Tap to call</div>
            </div>
          </a>

          <a href="mailto:nitikshpal@gmail.com" className="contact-card" style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg, #7C3AED, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.35)" }}>
              <Mail size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Email Us</div>
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#7C3AED" }}>nitikshpal@gmail.com</div>
              <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>We reply as soon as possible</div>
            </div>
          </a>

          <a href="https://wa.me/918130939274" target="_blank" rel="noopener noreferrer" className="contact-card" style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg, #22C55E, #16A34A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(34,197,94,0.35)" }}>
              <MessageCircle size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>WhatsApp</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#22C55E" }}>+91 8130939274</div>
              <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>Chat with us</div>
            </div>
          </a>
        </div>

        {/* Policy Links */}
        <div className="contact-card" style={{ marginTop: 20, animationDelay: "0.25s" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2A3060", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Helpful Policies</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: "Terms & Conditions", href: "/terms-and-conditions" },
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Delivery Policy", href: "/delivery-policy" },
              { label: "Cancellation & Refund", href: "/cancellation-and-refund" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="policy-link-btn"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 36, padding: "32px 24px", background: "linear-gradient(135deg, #0135FB 0%, #2A55FF 100%)", borderRadius: 20, color: "#fff" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" }}>Ready to order?</h2>
          <p style={{ opacity: 0.8, marginBottom: 20, fontSize: "0.92rem" }}>Fresh beverages and meals delivered to your campus spot.</p>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", color: "#0135FB",
            padding: "13px 28px", borderRadius: "12px",
            fontWeight: 900, textDecoration: "none",
            fontSize: "0.95rem", letterSpacing: "0.2px",
            boxShadow: "0 4px 0 rgba(0,0,0,0.15)",
          }}>
            Browse Menu
          </Link>
        </div>

      </div>
    </div>
  );
}
