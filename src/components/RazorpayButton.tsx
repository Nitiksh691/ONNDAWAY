"use client";
import { useState, useCallback } from "react";
import { ArrowRight, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Global type declaration for the Razorpay checkout script
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
  theme?: { color?: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayPaymentResponse) => void) => void;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ---------------------------------------------------------------------------
// Utility: load Razorpay checkout.js lazily (once)
// ---------------------------------------------------------------------------
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface RazorpayButtonProps {
  /** Total amount in **rupees** – converted to paise internally */
  amountRupees: number;
  /** Pre-fill customer name in the Razorpay modal */
  customerName?: string;
  /** Pre-fill customer phone in the Razorpay modal */
  customerPhone?: string;
  /** Disabled state (e.g. form not filled) */
  disabled?: boolean;
  /** Function to create the backend order */
  createOrder: () => Promise<{ order_id: string; amount: number; currency: string; internalOrderId: string }>;
  /** Called after successful payment + signature verification */
  onSuccess?: (paymentId: string, orderId: string, internalOrderId: string) => void;
  /** Called when a payment attempt fails */
  onFailure?: () => void;
  /** Called when the modal is dismissed without payment */
  onDismiss?: () => void;
  /** Hide the trust badge and inline dividers for a cleaner look */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RazorpayButton({
  amountRupees,
  customerName,
  customerPhone,
  disabled = false,
  createOrder,
  onSuccess,
  onFailure,
  onDismiss,
  compact = false,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePayment = useCallback(async () => {
    if (disabled || loading || paid) return;
    setLoading(true);

    // Step 0 – geo-restriction check
    try {
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings?.geoRestrictionEnabled && settings.geoLat && settings.geoLng) {
          const centerLat = parseFloat(settings.geoLat);
          const centerLng = parseFloat(settings.geoLng);
          const radiusKm = parseFloat(settings.geoRadiusKm || "1.0");
          // Request current location
          const userPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error("no_geo")); return; }
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          }).catch(() => null);

          if (userPos) {
            const toRad = (d: number) => (d * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(userPos.coords.latitude - centerLat);
            const dLng = toRad(userPos.coords.longitude - centerLng);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(centerLat)) * Math.cos(toRad(userPos.coords.latitude)) * Math.sin(dLng / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (dist > radiusKm) {
              toast.error(`Sorry! We only deliver within ${radiusKm} km of our campus. You appear to be ${dist.toFixed(1)} km away.`, { duration: 5000 });
              setLoading(false);
              return;
            }
          } else {
            // Location denied or unavailable — block the order
            toast.error("Please allow location access to place an order. We deliver only near our campus.", { duration: 5000 });
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      // If settings fetch fails, proceed without geo check
    }

    // Step 1 – load checkout.js
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error("Failed to load payment gateway. Please check your connection.");
      setLoading(false);
      return;
    }

    // Step 2 – create order on backend
    const amountPaise = Math.round(amountRupees * 100);
    if (amountPaise < 100) {
      toast.error("Minimum payable amount is ₹1.");
      setLoading(false);
      return;
    }

    let orderData: { order_id: string; amount: number; currency: string; internalOrderId: string };
    try {
      orderData = await createOrder();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not initiate payment";
      toast.error(message);
      setLoading(false);
      return;
    }

    // Step 3 – open Razorpay modal
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: orderData.amount as number,
      currency: orderData.currency,
      name: "ONNDAWAY",
      description: "Campus Delivery Order",
      order_id: orderData.order_id,
      prefill: {
        name: customerName ?? "",
        contact: customerPhone ? `+91${customerPhone}` : "",
      },
      theme: { color: "#0135FB" },
      handler: async (response: RazorpayPaymentResponse) => {
        // Step 4 – verify on backend
        try {
          const vRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!vRes.ok) {
            const vErr = await vRes.json().catch(() => ({}));
            throw new Error((vErr as { error?: string }).error ?? "Signature verification failed");
          }

          setPaid(true);
          toast.success("Payment successful! 🎉");
          onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id, orderData.internalOrderId);
        } catch (vErr: unknown) {
          const msg = vErr instanceof Error ? vErr.message : "Payment verification failed";
          toast.error(msg);
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          toast("Payment cancelled.", { icon: "ℹ️" });
          setLoading(false);
          onDismiss?.();
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Listen for payment failure events
    rzp.on("payment.failed", (response: RazorpayPaymentResponse) => {
      toast.error(`Payment failed. Please try again. (${(response as unknown as { error?: { description?: string } })?.error?.description ?? ""})`);
      setLoading(false);
      onFailure?.();
    });

    rzp.open();
  }, [disabled, loading, paid, amountRupees, customerName, customerPhone, onSuccess, onDismiss]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (paid) {
    return (
      <div
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "16px",
          background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontSize: "0.97rem",
          fontWeight: 900,
          textTransform: "uppercase" as const,
          letterSpacing: "1px",
          boxShadow: "0 4px 0 #15803D",
          fontFamily: "inherit",
        }}
      >
        <ShieldCheck size={20} />
        Payment Verified ✓
      </div>
    );
  }

  const isActive = !disabled && !loading;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        id="razorpay-pay-btn"
        onClick={handlePayment}
        disabled={!isActive}
        aria-label={`Pay ₹${amountRupees.toFixed(2)} online via Razorpay`}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "15px 16px",
          fontSize: "0.95rem",
          fontWeight: 900,
          background: isActive
            ? "linear-gradient(135deg, #0135FB 0%, #0026BE 100%)"
            : "#e5e7eb",
          color: isActive ? "#fff" : "#9ca3af",
          border: "none",
          borderRadius: "10px",
          cursor: isActive ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          textTransform: "uppercase" as const,
          letterSpacing: "1px",
          transition: "all 0.15s",
          boxShadow: isActive ? "0 4px 0 #0028D4" : "none",
          fontFamily: "inherit",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseOver={(e) => {
          if (isActive) {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #0028D4 0%, #001899 100%)";
            e.currentTarget.style.transform = "translateY(2px)";
            e.currentTarget.style.boxShadow = "0 2px 0 #0028D4";
          }
        }}
        onMouseOut={(e) => {
          if (isActive) {
            e.currentTarget.style.background =
              "linear-gradient(135deg, #0135FB 0%, #0026BE 100%)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 0 #0028D4";
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: "spin-wait 1s linear infinite" }} />
            Processing…
          </>
        ) : (
          <>
            <CreditCard size={18} />
            Pay ₹{amountRupees.toFixed(2)} Online
            <ArrowRight size={16} style={{ marginLeft: "auto" }} />
          </>
        )}
      </button>

      {/* Razorpay trust badge */}
      {!compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginTop: "2px",
          }}
        >
          <ShieldCheck size={12} color="#22C55E" />
          <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600 }}>
            Secured by Razorpay · UPI, Cards, Net Banking
          </span>
        </div>
      )}
    </div>
  );
}
