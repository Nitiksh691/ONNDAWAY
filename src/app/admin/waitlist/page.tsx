"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Trash2,
  Users,
  Filter,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface WaitlistEntry {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  branch: string;
  year: string;
  createdAt: string;
}

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Biotechnology",
  "Mathematics",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Alumni"];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch data ──
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (branch) params.set("branch", branch);
      if (year) params.set("year", year);

      const res = await fetch(`/api/waitlist?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error("Failed to fetch waitlist");
    } finally {
      setLoading(false);
    }
  }, [search, branch, year]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ── Delete entry ──
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this person from the waitlist?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/waitlist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch {
      console.error("Failed to delete entry");
    } finally {
      setDeleting(null);
    }
  };

  // ── Export CSV ──
  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (branch) params.set("branch", branch);
    if (year) params.set("year", year);
    params.set("format", "csv");
    window.open(`/api/waitlist?${params.toString()}`, "_blank");
  };

  // ── Format date ──
  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: "-0.02em",
            }}
          >
            <Users size={22} color="#0055ff" />
            Waitlist
            <span
              style={{
                background: "linear-gradient(135deg, #0055ff, #0033cc)",
                color: "white",
                fontSize: "0.78rem",
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 100,
                marginLeft: 4,
              }}
            >
              {total}
            </span>
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              color: "#64748b",
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Manage students who joined the waitlist
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={fetchEntries}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              color: "#334155",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#e2e8f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#f1f5f9")
            }
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={total === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              background: total > 0 ? "linear-gradient(135deg, #0055ff, #0033cc)" : "#e2e8f0",
              border: "none",
              borderRadius: 10,
              color: total > 0 ? "white" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: total > 0 ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow: total > 0 ? "0 2px 8px rgba(0,85,255,0.25)" : "none",
              transition: "all 0.2s",
            }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            position: "relative",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 40px",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: "0.9rem",
              fontFamily: "inherit",
              fontWeight: 500,
              color: "#0f172a",
              background: "#f8fafc",
              outline: "none",
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0055ff";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(0,85,255,0.1)";
              e.currentTarget.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#f8fafc";
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            background: showFilters ? "rgba(0,85,255,0.08)" : "#f1f5f9",
            border: `1px solid ${showFilters ? "rgba(0,85,255,0.2)" : "#e2e8f0"}`,
            borderRadius: 10,
            color: showFilters ? "#0055ff" : "#64748b",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          <Filter size={15} />
          Filters
          <ChevronDown
            size={14}
            style={{
              transform: showFilters ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
            padding: "16px 20px",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <label
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Branch
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.88rem",
                fontFamily: "inherit",
                fontWeight: 600,
                color: "#0f172a",
                background: "white",
                cursor: "pointer",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.88rem",
                fontFamily: "inherit",
                fontWeight: 600,
                color: "#0f172a",
                background: "white",
                cursor: "pointer",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {(branch || year) && (
            <button
              onClick={() => {
                setBranch("");
                setYear("");
              }}
              style={{
                alignSelf: "flex-end",
                padding: "10px 16px",
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            <RefreshCw
              size={24}
              style={{ animation: "spin 1s linear infinite", marginBottom: 12 }}
            />
            <p>Loading waitlist...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertCircle size={32} />
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>
              No waitlist entries found
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              {search || branch || year
                ? "Try adjusting your search or filters."
                : "Share your join page to get students on the waitlist!"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.88rem",
                minWidth: 700,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  {[
                    "Username",
                    "Email",
                    "Phone",
                    "Branch",
                    "Year",
                    "Joined On",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry._id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fafbfc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 700,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.username}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 500,
                        color: "#334155",
                      }}
                    >
                      {entry.email}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 500,
                        color: "#334155",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.phoneNumber}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: "rgba(0,85,255,0.07)",
                          color: "#0055ff",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.branch}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: "#f0fdf4",
                          color: "#16a34a",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.year}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 500,
                        color: "#64748b",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(entry.createdAt)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        disabled={deleting === entry._id}
                        title="Delete"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 34,
                          height: 34,
                          background:
                            deleting === entry._id ? "#fef2f2" : "transparent",
                          border: "1px solid transparent",
                          borderRadius: 8,
                          color: "#ef4444",
                          cursor:
                            deleting === entry._id
                              ? "not-allowed"
                              : "pointer",
                          transition: "all 0.2s",
                          opacity: deleting === entry._id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (deleting !== entry._id) {
                            e.currentTarget.style.background = "#fef2f2";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deleting !== entry._id) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "transparent";
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <style>{`
        @media (max-width: 768px) {
          .admin-wl-table-wrap table { display: none; }
        }
      `}</style>

      {/* Mobile stacked cards (visible only on small screens) */}
      {!loading && entries.length > 0 && (
        <div className="admin-wl-mobile-cards">
          <style>{`
            .admin-wl-mobile-cards {
              display: none;
            }
            @media (max-width: 768px) {
              .admin-wl-mobile-cards {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 16px;
              }
            }
          `}</style>
          {entries.map((entry) => (
            <div
              key={`m-${entry._id}`}
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      fontSize: "1rem",
                    }}
                  >
                    {entry.username}
                  </div>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {entry.email}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry._id)}
                  disabled={deleting === entry._id}
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    color: "#ef4444",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    background: "rgba(0,85,255,0.07)",
                    color: "#0055ff",
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {entry.branch}
                </span>
                <span
                  style={{
                    background: "#f0fdf4",
                    color: "#16a34a",
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {entry.year}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#94a3b8",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                }}
              >
                <span>📱 {entry.phoneNumber}</span>
                <span>{formatDate(entry.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
