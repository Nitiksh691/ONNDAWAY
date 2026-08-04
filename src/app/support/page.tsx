"use client";
import { Mail, Phone, MessageSquare, MapPin, ChevronRight, HelpCircle } from "lucide-react";

export default function SupportPage() {
  const CONTACTS = [
    { icon: <Phone size={24} />, title: "Call Us", desc: "+91 99999 99999", action: "Call now", link: "tel:+919999999999", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    { icon: <Mail size={24} />, title: "Email Us", desc: "support@onndaway.com", action: "Send email", link: "mailto:support@onndaway.com", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { icon: <MessageSquare size={24} />, title: "Live Chat", desc: "Chat with our team", action: "Start chat", link: "#", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    { icon: <MapPin size={24} />, title: "Visit Us", desc: "Find a store near you", action: "View map", link: "#", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  const FAQS = [
    { q: "How long does delivery take?", a: "Most deliveries arrive within 30-45 minutes depending on your location." },
    { q: "Can I cancel my order?", a: "You can cancel your order within 5 minutes of placing it from the active orders page." },
    { q: "Do you offer refunds?", a: "Yes, if there's an issue with your order, please contact support within 24 hours for a refund." }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "24px 20px 80px" }}>
      <div className="otw-container" style={{ maxWidth: 600 }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px", paddingTop: "20px" }}>
          <div style={{ display: "inline-flex", padding: "16px", background: "rgba(1,53,251,0.08)", borderRadius: "24px", color: "var(--primary)", marginBottom: "20px" }}>
            <HelpCircle size={48} />
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-dark)", letterSpacing: "-0.5px" }}>How can we help?</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            We're here to assist you with any questions or issues.
          </p>
        </div>
        
        {/* Contact Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "48px" }}>
          {CONTACTS.map((c, i) => (
            <a key={i} href={c.link} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "16px", background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 24px rgba(0,0,0,0.03)", transition: "transform 0.2s" }} className="hover-lift">
              <div style={{ width: 56, height: 56, borderRadius: "16px", background: c.bg, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: "1.05rem", marginBottom: "2px" }}>{c.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>{c.desc}</div>
              </div>
              <ChevronRight size={20} color="#cbd5e1" />
            </a>
          ))}
        </div>

        {/* FAQs */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "20px", color: "var(--text-dark)" }}>Frequently Asked Questions</h2>
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ padding: "24px", borderBottom: i !== FAQS.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "8px" }}>{faq.q}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5, fontWeight: 500 }}>{faq.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
