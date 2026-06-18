"use client";
import { useState, useRef } from "react";
import { X, Upload, User as UserIcon } from "lucide-react";
import SignInButton from "./SignInButton";
import toast from "react-hot-toast";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(phoneDigits);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOTPVerify = async (user_json_url: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_json_url, name, image }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(name ? "Account verified!" : "Logged in successfully!");
        onSuccess(data.userId);
      } else {
        toast.error(data.error || "Authentication failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }} onClick={onClose} />
      
      <div className="otw-card animate-fade-up" style={{
        position: "relative", width: "100%", maxWidth: "420px", zIndex: 10000, 
        padding: "32px", background: "white", borderRadius: "24px"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%",
          background: "var(--accent-2)", color: "var(--text-dark)", border: "none", 
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--primary)", marginBottom: "8px" }}>Welcome</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Login or create an account to track your orders faster.</p>
        </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Verify with Phone/Email</label>
            {loading ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--primary)", fontWeight: 700 }}>
                 Verifying...
              </div>
            ) : (
              <SignInButton onVerify={handleOTPVerify} />
            )}
          </div>
      </div>
    </div>
  );
}
