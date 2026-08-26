"use client";
import { useState, useEffect } from "react";
import { ClipboardList, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface InternApp {
  _id: string;
  name: string;
  year: string;
  branch: string;
  skills: string;
  project: string;
  reason: string;
  createdAt: string;
}

export default function AdminInternsPage() {
  const [interns, setInterns] = useState<InternApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intern", {
      headers: { "x-admin-token": sessionStorage.getItem("otw_admin_token") || "" }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInterns(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch intern applications");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-dark)", marginBottom: "8px" }}>
            Intern Applications
          </h1>
          <p style={{ color: "var(--text-muted)" }}>Review and manage candidates who want to join the team.</p>
        </div>
        <div style={{ background: "#EEF2FF", color: "#4F46E5", padding: "8px 16px", borderRadius: "20px", fontWeight: 700 }}>
          {interns.length} Total Applicants
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading applicants...</div>
      ) : interns.length === 0 ? (
        <div className="otw-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          <ClipboardList size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
          <h3>No applications yet</h3>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "24px" }}>
          {interns.map((app) => (
            <div key={app._id} className="otw-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "4px" }}>
                    {app.name}
                  </h2>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                    <span>📚 {app.branch}</span>
                    <span>🎓 {app.year}</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", height: "fit-content" }}>
                  <Calendar size={14} /> {new Date(app.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Skills</strong>
                <p style={{ fontSize: "0.95rem", marginTop: "4px", fontWeight: 500, color: "var(--primary)" }}>{app.skills}</p>
              </div>

              <div>
                <strong style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Top Project</strong>
                <p style={{ fontSize: "0.9rem", marginTop: "4px", lineHeight: 1.5, background: "#F8FAFC", padding: "12px", borderRadius: "8px", color: "var(--text-dark)" }}>
                  {app.project}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Why Join Us?</strong>
                <p style={{ fontSize: "0.9rem", marginTop: "4px", lineHeight: 1.5, background: "#F8FAFC", padding: "12px", borderRadius: "8px", color: "var(--text-dark)", fontStyle: "italic" }}>
                  "{app.reason}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
