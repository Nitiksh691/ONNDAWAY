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
    <div style={{ background: "#F5F7FF", minHeight: "calc(100vh - 60px)" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #01235F 0%, #0135FB 60%, #3b82f6 100%)",
        color: "#fff", padding: "72px 24px 80px", textAlign: "center",
      }}>
        <div className="otw-container" style={{ maxWidth: 720 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", opacity: 0.85, marginBottom: 16 }}>
            About {COMPANY_NAME}
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.15 }}>
            {COMPANY_TAGLINE}
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            {COMPANY_BLURB}
          </p>
          <div style={{ marginTop: 28, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 700 }}>
            🌱 Bootstrapped · Independent · Student-founded
          </div>
        </div>
      </section>

      <div className="otw-container" style={{ maxWidth: 900, marginTop: -40, paddingBottom: 60 }}>
        {/* Story */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 8px 32px rgba(1,35,95,0.08)", marginBottom: 32, border: "1px solid #e8ecf8" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.6rem", fontWeight: 900, color: "#01235F", marginBottom: 16 }}>Our Story</h2>
          <p style={{ color: "#475569", lineHeight: 1.8, fontSize: "1rem", marginBottom: 16 }}>
            ONN D A WAY started with a simple frustration: great food was always just out of reach — long waits, closed canteens, and delivery apps that didn&apos;t understand campus life. We decided to build something better ourselves.
          </p>
          <p style={{ color: "#475569", lineHeight: 1.8, fontSize: "1rem" }}>
            Today we&apos;re a lean, bootstrapped team serving freshly prepared coffee, snacks, and meals directly to hostels, PGs, and campus locations. No outside investors telling us to compromise — just a focus on quality, speed, and the people we serve every day.
          </p>
        </div>

        {/* Agenda / Mission */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 8px 32px rgba(1,35,95,0.08)", marginBottom: 32, border: "1px solid #e8ecf8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Target size={24} color="#0135FB" />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.6rem", fontWeight: 900, color: "#01235F", margin: 0 }}>Our Agenda</h2>
          </div>
          <ul style={{ color: "#475569", lineHeight: 2, fontSize: "1rem", paddingLeft: 20, margin: 0 }}>
            <li>Make fresh, affordable food accessible to every student and campus resident</li>
            <li>Build technology that makes ordering and tracking effortless</li>
            <li>Support local kitchens and delivery partners with fair practices</li>
            <li>Grow sustainably — reinvesting profits into better food and service</li>
            <li>Stay independent and customer-first, always</li>
          </ul>
        </div>

        {/* Values grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: "1px solid #e8ecf8", boxShadow: "0 4px 16px rgba(1,35,95,0.05)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EEF1FF", color: "#0135FB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                {v.icon}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#01235F", marginBottom: 8 }}>{v.title}</h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Founder */}
        <div style={{ background: "linear-gradient(135deg, #01235F, #0135FB)", borderRadius: 20, padding: "40px 36px", color: "#fff", marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.6rem", fontWeight: 900, marginBottom: 20 }}>Founder</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 900, flexShrink: 0,
            }}>N</div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 900, fontSize: "1.3rem", marginBottom: 4 }}>Nitiksh Pal</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.75, marginBottom: 14, fontWeight: 600 }}>Founder & Builder</div>
              <p style={{ opacity: 0.9, lineHeight: 1.75, fontSize: "0.95rem", margin: 0 }}>
                Nitiksh founded ONN D A WAY after experiencing firsthand how broken campus food delivery was. With a background in building products and a passion for good food, he bootstrapped the platform from scratch — handling everything from the menu to the tech stack to rider coordination. His vision: a delivery service that actually understands campus life.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "36px", textAlign: "center", border: "1px solid #e8ecf8", boxShadow: "0 8px 32px rgba(1,35,95,0.08)" }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.4rem", fontWeight: 900, color: "#01235F", marginBottom: 8 }}>Get in Touch</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: "0.95rem" }}>Questions, feedback, or partnership ideas — we&apos;d love to hear from you.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={SUPPORT_TEL} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#01235F", color: "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}>
              <Phone size={18} /> {SUPPORT_PHONE_DISPLAY}
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF1FF", color: "#0135FB", padding: "12px 24px", borderRadius: 10, fontWeight: 800, textDecoration: "none", fontSize: "0.95rem", border: "1px solid #c7d2fe" }}>
              <Mail size={18} /> Email Us
            </a>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#94a3b8", fontSize: "0.85rem" }}>
            <MapPin size={14} /> Serving campus & PG communities daily
          </div>
          <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#0135FB", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
            ← Back to Menu
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
