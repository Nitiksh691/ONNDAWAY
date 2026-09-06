"use client";
import Link from "next/link";
import { Phone, Mail, MapPin, Heart, Coffee, Truck, Users, Target } from "lucide-react";
import Footer from "@/components/Footer";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL, SUPPORT_EMAIL, COMPANY_NAME, COMPANY_TAGLINE, COMPANY_BLURB } from "@/lib/company";

const VALUES = [
  { icon: <Coffee size={22} />, title: "Fresh, Always", desc: "Every order is prepared fresh — no reheated leftovers, no shortcuts." },
  { icon: <Truck size={22} />, title: "Campus-First", desc: "Built around hostels, PGs, and campus spots — we know where you actually are." },
  { icon: <Heart size={22} />, title: "People Over Profit", desc: "Bootstrapped and independent. We grow by serving better, not by cutting corners." },
  { icon: <Users size={22} />, title: "Community Driven", desc: "Founded by students who lived the problem — late-night hunger, long queues, no good options." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "#ffffff", minHeight: "calc(100vh - 60px)" }}>
      {/* Hero */}
      <section style={{
        padding: "100px 24px 60px", textAlign: "center",
      }}>
        <div className="otw-container" style={{ maxWidth: 720 }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.15, color: "#0A0F2E" }}>
            Fresh food, direct to campus.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#64748B", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 28px" }}>
            ONN D A WAY is a lean, independent platform built for students. We skip the middlemen to bring you freshly prepared meals, snacks, and beverages without the long waits or crazy fees.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F1F5F9", color: "#475569", borderRadius: 999, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 700 }}>
            🌱 Bootstrapped · Independent · Student-founded
          </div>
        </div>
      </section>

      <div className="otw-container" style={{ maxWidth: 900, paddingBottom: 80 }}>
        {/* Values grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 60 }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ padding: "24px 0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1F5F9", color: "#0A0F2E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {v.icon}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0A0F2E", marginBottom: 8 }}>{v.title}</h3>
              <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{ textAlign: "center", padding: "60px 24px", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "#0A0F2E", marginBottom: 12 }}>Say Hello</h2>
          <p style={{ color: "#64748B", marginBottom: 24, fontSize: "0.95rem" }}>Have questions or want to partner with us? We're just a message away.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={SUPPORT_TEL} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0A0F2E", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}>
              <Phone size={18} /> {SUPPORT_PHONE_DISPLAY}
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F1F5F9", color: "#0A0F2E", padding: "12px 24px", borderRadius: 12, fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}>
              <Mail size={18} /> Email Us
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
