"use client";
import { useState, useRef } from "react";
import { X, Upload, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "">("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    
    setLoading(true);
    try {
      let finalImage = image;
      if (!finalImage && gender) {
        finalImage = `/avatars/${gender}.png`;
      }

      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneDigits, name, image: finalImage, gender }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(name ? "Account verified!" : "Logged in successfully!");
        onSuccess(data.userId);
      } else {
        if (data.error?.includes("Name is required")) {
          toast.error("Looks like you are new! Please enter your name.");
        } else {
          toast.error(data.error || "Authentication failed");
        }
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Profile Image Upload */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 90, height: 90, borderRadius: "50%", border: "2px dashed var(--primary)",
                background: image ? "transparent" : "var(--accent-2)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                position: "relative"
              }}
            >
              {image ? (
                <img src={image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : gender ? (
                <img src={`/avatars/${gender}.png`} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--primary)" }}>
                  <Upload size={24} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: "4px" }}>PHOTO</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: "none" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Optional</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Mobile Number <span style={{color: "red"}}>*</span></label>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ padding: "14px 16px", borderRadius: "10px", border: "2px solid var(--border)", background: "var(--accent-2)", fontWeight: 800, fontSize: "0.95rem", color: "var(--primary)", flexShrink: 0 }}>🇮🇳 +91</div>
              <input type="tel" className="otw-input" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} style={{ flex: 1, borderRadius: "10px" }} required />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <UserIcon size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" className="otw-input" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: "44px", borderRadius: "10px" }} />
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>Only required if you are a new user.</p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-mid)", marginBottom: "8px", textTransform: "uppercase" }}>Avatar</label>
            <div style={{ display: "flex", gap: "12px" }}>
              <div 
                onClick={() => setGender("boy")}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: gender === "boy" ? "2px solid var(--primary)" : "2px solid #e5e7eb", textAlign: "center", cursor: "pointer", background: gender === "boy" ? "rgba(1,53,251,0.05)" : "transparent" }}
              >
                👦 Boy
              </div>
              <div 
                onClick={() => setGender("girl")}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: gender === "girl" ? "2px solid var(--primary)" : "2px solid #e5e7eb", textAlign: "center", cursor: "pointer", background: gender === "girl" ? "rgba(1,53,251,0.05)" : "transparent" }}
              >
                👧 Girl
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !isPhoneValid} className="otw-btn otw-btn-primary" style={{ width: "100%", padding: "16px", fontSize: "1.05rem", borderRadius: "12px", marginTop: "8px" }}>
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
