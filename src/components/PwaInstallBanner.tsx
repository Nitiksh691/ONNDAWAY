"use client";
import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "otw_pwa_dismissed";
// Only check within the current session — sessionStorage clears when the tab/browser closes
// So if user dismissed it, it won't show again THIS visit, but WILL show next time they open the site
const VISITS_KEY = "otw_pwa_visits";
// Still require 3 visits minimum before showing (tracked in localStorage across sessions)
const MIN_VISITS = 3;

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Don't show if already installed as a PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if already dismissed THIS session (sessionStorage clears on tab close)
    const dismissedThisSession = sessionStorage.getItem(STORAGE_KEY);
    if (dismissedThisSession) return;

    // Track visit count — only show to returning users who've visited 3+ times
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
      // Show after 8s on iOS — user has spent time on the site
      setTimeout(() => setShow(true), 8000);
      return;
    }

    // Android/Chrome: capture the deferred install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 8s delay
      setTimeout(() => setShow(true), 8000);
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
      // Reset visit counter so it never shows again
      localStorage.removeItem(VISITS_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Use sessionStorage — will clear when tab/browser is closed
    // So next time they open the site fresh, the banner can show again
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes pwa-slide-up {
          from { transform: translateY(110%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pwa-banner {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 1200;
          animation: pwa-slide-up 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
          padding: 0 12px env(safe-area-inset-bottom, 12px);
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
        .pwa-card {
          background: #fff;
          border-radius: 20px 20px 16px 16px;
          padding: 18px 18px 16px;
          box-shadow: 0 -2px 30px rgba(1,35,95,0.12), 0 6px 0 rgba(1,53,251,0.85);
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 4px;
        }
        .pwa-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pwa-icon {
          width: 50px; height: 50px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(1,53,251,0.18);
        }
        .pwa-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pwa-text { flex: 1; min-width: 0; }
        .pwa-title { font-size: 0.95rem; font-weight: 900; color: #0A0F2E; line-height: 1.2; }
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
