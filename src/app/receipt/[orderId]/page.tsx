"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Order } from "@/lib/types";
import { COMPANY_NAME, COMPANY_TAGLINE, SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL } from "@/lib/company";
import { Download, ArrowLeft, CheckCircle, Printer } from "lucide-react";
import WalkingLoader from "@/components/WalkingLoader";

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setOrder(data);
      })
      .catch(() => setError("Failed to load receipt"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    try {
      // Use browser print-to-PDF as download fallback
      window.print();
    } catch {
      window.print();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F7FF" }}>
        <WalkingLoader size={60} color="#0135FB" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#F5F7FF" }}>
        <div style={{ fontSize: "3rem" }}>🧾</div>
        <h2 style={{ fontWeight: 800, color: "#0A0F2E" }}>Receipt not found</h2>
        <p style={{ color: "#6B7280" }}>{error || "This receipt doesn't exist or you don't have access."}</p>
        <Link href="/orders" style={{ background: "#0135FB", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>Back to Orders</Link>
      </div>
    );
  }

  const isOnline = order.paymentMethod === "RAZORPAY";
  const isPaid = order.paymentStatus === "PAID";
  const receiptDate = new Date(order.createdAt);

  const subtotal = order.items.reduce((sum, item) => sum + (item.unitPrice ?? item.item.price) * item.quantity, 0);
  const discount = order.discount || 0;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-root { box-shadow: none !important; border: none !important; }
        }
        @keyframes receipt-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Top action bar - hidden on print */}
      <div className="no-print" style={{ background: "#0135FB", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href={`/track/${order.id}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 700, fontSize: "0.88rem" }}>
          <ArrowLeft size={16} /> Back to Order
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            <Printer size={15} /> Print
          </button>
          <button onClick={handleDownload} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#0135FB", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div style={{ background: "#F5F7FF", minHeight: "100vh", padding: "32px 16px 60px" }}>
        <div
          ref={printRef}
          className="receipt-root"
          style={{
            maxWidth: 520,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 8px 40px rgba(1,53,251,0.12)",
            overflow: "hidden",
            animation: "receipt-in 0.4s ease",
          }}
        >
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #0135FB 0%, #0060D6 100%)",
            padding: "32px 28px 28px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: "3px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 6 }}>
              Official Receipt
            </div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.9rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
              {COMPANY_NAME}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", marginTop: 4, fontWeight: 500 }}>
              {COMPANY_TAGLINE}
            </div>

            {/* Status pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: 20, background: isPaid ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.15)",
              border: `1px solid ${isPaid ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: 999, padding: "6px 16px",
            }}>
              {isPaid
                ? <><CheckCircle size={14} color="#22C55E" /><span style={{ color: "#22C55E", fontWeight: 800, fontSize: "0.82rem" }}>Payment Confirmed</span></>
                : <><span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: "0.82rem" }}>Cash on Delivery</span></>
              }
            </div>
          </div>

          {/* Dotted tear line */}
          <div style={{ position: "relative", height: 24, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: -8, right: -8, top: "50%", borderTop: "2px dashed #e5e7eb" }} />
            <div style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "#F5F7FF" }} />
            <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "#F5F7FF" }} />
          </div>

          {/* Order meta */}
          <div style={{ padding: "0 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", padding: "16px 0", borderBottom: "1px dashed #e5e7eb" }}>
              {[
                { label: "Order ID", value: `#${order.id.slice(-8).toUpperCase()}` },
                { label: "Date", value: receiptDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                { label: "Time", value: receiptDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
                { label: "Customer", value: order.userName },
                { label: "Phone", value: `+91 ${order.userPhone}` },
                { label: "Delivery To", value: order.location },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0A0F2E" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ padding: "16px 0", borderBottom: "1px dashed #e5e7eb" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Items Ordered</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {order.items.map((item, i) => {
                  const unitP = item.unitPrice ?? item.item.price;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, position: "relative" }}>
                        <Image src={item.item.image} alt={item.item.name} fill sizes="40px" style={{ objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0A0F2E", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.item.name}</div>
                        {item.lineDetails && <div style={{ fontSize: "0.7rem", color: "#0135FB", marginTop: 2 }}>{item.lineDetails}</div>}
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>₹{unitP} × {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: "#0A0F2E", fontSize: "0.9rem", flexShrink: 0 }}>₹{unitP * item.quantity}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bill breakdown */}
            <div style={{ padding: "16px 0", borderBottom: "1px dashed #e5e7eb" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                  <span style={{ color: "#6B7280" }}>Subtotal</span>
                  <span style={{ fontWeight: 600, color: "#0A0F2E" }}>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <span style={{ color: "#22C55E" }}>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span style={{ fontWeight: 600, color: "#22C55E" }}>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                  <span style={{ color: "#6B7280" }}>Delivery Fee</span>
                  <span style={{ fontWeight: 600, color: "#0A0F2E" }}>₹{(order.total - subtotal + discount).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 900, paddingTop: 8, borderTop: "1px solid #f3f4f6", marginTop: 4 }}>
                  <span style={{ color: "#0A0F2E" }}>Total Paid</span>
                  <span style={{ color: "#0135FB" }}>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ padding: "14px 0", borderBottom: "1px dashed #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>Payment Method</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0A0F2E" }}>
                    {isOnline ? "💳 Online (Razorpay)" : "💵 Cash on Delivery"}
                  </div>
                </div>
                {isOnline && order.paymentAttempts?.[0]?.attemptId && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>Txn ID</div>
                    <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "#0135FB", fontFamily: "monospace" }}>
                      {order.paymentAttempts[0].attemptId.slice(-12).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thank you */}
            <div style={{ padding: "20px 0 24px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🙏</div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0A0F2E", marginBottom: 6 }}>Thank you for ordering with us!</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", lineHeight: 1.6 }}>
                {SUPPORT_EMAIL} · {SUPPORT_PHONE_DISPLAY}
              </div>
            </div>
          </div>

          {/* Barcode-style footer */}
          <div style={{ background: "#f9fafb", borderTop: "1px solid #f3f4f6", padding: "16px 28px", textAlign: "center" }}>
            <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 8 }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{ width: i % 3 === 0 ? 3 : 1, height: i % 5 === 0 ? 28 : 20, background: "#0A0F2E", borderRadius: 1, opacity: 0.7 + (i % 4) * 0.08 }} />
              ))}
            </div>
            <div style={{ fontSize: "0.65rem", color: "#9ca3af", letterSpacing: "3px", fontFamily: "monospace" }}>
              {order.id.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Action buttons below receipt */}
        <div className="no-print" style={{ maxWidth: 520, margin: "20px auto 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/track/${order.id}`} style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", color: "#0135FB", border: "1.5px solid #0135FB", padding: "12px 20px", borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
            <ArrowLeft size={15} /> Track Order
          </Link>
          <Link href="/" style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#0135FB", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: "0.9rem", boxShadow: "0 4px 0 #0028D4" }}>
            Order Again 🍔
          </Link>
        </div>
      </div>
    </>
  );
}
