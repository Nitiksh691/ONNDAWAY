"use client";
import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "otw_pwa_dismissed";
// Track visit count — require 5 visits minimum before showing
const VISITS_KEY = "otw_pwa_visits";
const MIN_VISITS = 5;

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin')) return;

    // Don't show if already installed as a PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed in the last 7 days
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const timeSinceDismissed = Date.now() - parseInt(dismissedAt);
      if (timeSinceDismissed < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Track visit count
    const visits = parseInt(localStorage.getItem(VISITS_KEY) || "0") + 1;
    localStorage.setItem(VISITS_KEY, visits.toString());
    if (visits < MIN_VISITS) return;

    const ua = window.navigator.userAgent;
    const isIosSafari =
      /iphone|ipad|ipod/i.test(ua) &&
      /safari/i.test(ua) &&
      !/chrome|crios|fxios/i.test(ua);

    if (isIosSafari) {
      setIsIos(true);
      // Show after 30s on iOS
      setTimeout(() => setShow(true), 30000);
      return;
    }

    // Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s delay
      setTimeout(() => setShow(true), 30000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShow(false);
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.removeItem(VISITS_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Dismiss for 7 days
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        .pwa-banner {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 1200;
          animation: pwa-slide-down 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
          width: calc(100% - 32px);
          max-width: 320px;
        }
        @keyframes pwa-slide-down {
          from { transform: translateY(-110%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pwa-card {
          background: #fff;
          border-radius: 18px;
          padding: 16px 16px 14px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .pwa-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pwa-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(1,53,251,0.18);
        }
        .pwa-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pwa-text { flex: 1; min-width: 0; }
        .pwa-title { font-size: 0.9rem; font-weight: 900; color: #0A0F2E; line-height: 1.2; }
        .pwa-sub { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
        .pwa-close {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: #CBD5E1; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .pwa-close:hover { color: #64748B; }
        .pwa-btn {
          width: 100%;
          background: #0135FB;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 0 #0028D4;
          transition: transform 0.1s;
          font-family: inherit;
        }
        .pwa-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #0028D4; }
        .pwa-ios-hint {
          background: #EFF6FF;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.78rem;
          color: #1E3A8A;
          line-height: 1.6;
          font-weight: 600;
        }
        .pwa-ios-hint strong { color: #0135FB; }
      `}</style>

      <div className="pwa-banner" role="dialog" aria-label="Install ONN D A WAY">
        <div className="pwa-card">
          <div className="pwa-header">
            <div className="pwa-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192x192.png" alt="ONN D A WAY icon" />
            </div>
            <div className="pwa-text">
              <div className="pwa-title">ONN D A WAY</div>
              <div className="pwa-sub">Add to Home Screen for instant access ⚡</div>
            </div>
            <button className="pwa-close" onClick={handleDismiss} aria-label="Dismiss install prompt">
              <X size={16} />
            </button>
          </div>

          {isIos ? (
            <div className="pwa-ios-hint">
              Tap <strong>Share ⎙</strong> in Safari → <strong>"Add to Home Screen"</strong> to install like a real app!
            </div>
          ) : (
            <button className="pwa-btn" onClick={handleInstall}>
              <Download size={15} /> Install Free App
            </button>
          )}
        </div>
      </div>
    </>
  );
}
