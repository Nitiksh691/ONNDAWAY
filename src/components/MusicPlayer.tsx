"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Square, Music2, ListMusic, X } from "lucide-react";
import { useApp } from "@/lib/context";
import { usePathname } from "next/navigation";
import { getActiveOrderId } from "@/lib/activeOrder";

interface Track {
  id: number;
  name: string;
  artist: string;
  url: string;
}

const TRACKS: Track[] = [
  { id: 1, name: "Rakh Lo Tum Chupa Ke", artist: "Lilu-G & Arpit Bala", url: "/music/track1.mp3" },
  { id: 2, name: "Toosie Slide", artist: "Drake", url: "/music/track2.mp3" },
  { id: 3, name: "Hypnotic", artist: "Deep Dhaliwal x Anker Deol", url: "/music/track3.mp3" }
];

export default function MusicPlayer() {
  const { cartCount, profile } = useApp();
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showList, setShowList] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsDismissed(true);
    setExpanded(false);
    window.dispatchEvent(new CustomEvent("otw:music-dismissed"));
  };

  // Close popup when clicking outside (NO backdrop overlay, NO screen blur)
  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [expanded]);

  useEffect(() => {
    const check = () => {
      const isDelivery = profile?.role === "delivery" || (typeof window !== "undefined" && !!localStorage.getItem("otw_delivery_id"));
      if (isDelivery) { setHasActiveOrder(false); return; }
      setHasActiveOrder(!!getActiveOrderId());
    };
    check();
    window.addEventListener("otw:active-order", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("otw:active-order", check);
      window.removeEventListener("storage", check);
    };
  }, [profile?.role]);

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-play on first user interaction
  useEffect(() => {
    if (!isMounted) return;
    const start = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
    };
    document.addEventListener("click", start, { once: true });
    document.addEventListener("touchstart", start, { once: true });
    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = TRACKS[currentIdx].url;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [currentIdx, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  const nextTrack = () => { setCurrentIdx(p => (p + 1) % TRACKS.length); setIsPlaying(true); };
  const prevTrack = () => { setCurrentIdx(p => (p - 1 + TRACKS.length) % TRACKS.length); setIsPlaying(true); };
  const stopTrack = () => {
    audioRef.current?.pause();
    if (audioRef.current) { audioRef.current.currentTime = 0; }
    setIsPlaying(false); setProgress(0);
  };
  const selectTrack = (idx: number) => { setCurrentIdx(idx); setIsPlaying(true); setShowList(false); };
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  if (!isMounted) return null;
  if (isDismissed) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery") || pathname.startsWith("/vendor")) return null;

  const track = TRACKS[currentIdx];
  const isCartPage = pathname === "/cart";
  const showCheckoutBar = cartCount > 0 && !isCartPage;
  const showTrackBar = hasActiveOrder && !pathname.startsWith("/track/");

  // FAB bottom offset calculation:
  // Mobile: floats cleanly above BottomNav (50px) or Cart Bar (~65px)
  const mobileBottom = isCartPage
    ? (showTrackBar ? 54 : 14)
    : showCheckoutBar
      ? (showTrackBar ? 124 : 80)
      : (showTrackBar ? 98 : 62);

  const desktopBottom = showTrackBar ? 52 : 28;

  const EqBars = ({ size = 14 }: { size?: number }) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: size }}>
      <span style={{ display: "inline-block", width: size * 0.18, height: size * 0.7, background: "rgba(255,255,255,0.9)", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite" }} />
      <span style={{ display: "inline-block", width: size * 0.18, height: size, background: "rgba(255,255,255,0.9)", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.1s" }} />
      <span style={{ display: "inline-block", width: size * 0.18, height: size * 0.58, background: "rgba(255,255,255,0.9)", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.2s" }} />
    </div>
  );

  return (
    <>
      <audio ref={audioRef} onEnded={nextTrack} />

      <style>{`
        @keyframes mp-eq { 0%,100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }
        @keyframes mp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mp-pulse-ring {
          0% { transform: scale(1); opacity: 0.65; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes mp-fadein { from { opacity:0; transform: scale(0.92) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }

        /* ── Shared FAB container ── */
        .mp-fab-wrap {
          position: fixed;
          right: 14px;
          bottom: var(--mp-bottom-mobile, 62px);
          z-index: 945;
          font-family: 'Outfit','Inter',system-ui,sans-serif;
          transition: bottom 0.28s cubic-bezier(0.4,0,0.2,1);
        }

        @media (min-width: 768px) {
          .mp-fab-wrap {
            right: 28px;
            bottom: var(--mp-bottom-desktop, 28px) !important;
          }
        }

        /* ── Circular vinyl button ── */
        .mp-vinyl-btn {
          width: 50px; height: 50px; border-radius: 50%;
          background: linear-gradient(135deg, #0135FB 0%, #1e40af 60%, #0284c7 100%);
          border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(1,53,251,0.5), 0 2px 6px rgba(0,0,0,0.25);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
          position: relative;
          overflow: visible;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-vinyl-btn:active { transform: scale(0.92); }
        .mp-vinyl-btn:hover { transform: scale(1.08); box-shadow: 0 10px 28px rgba(1,53,251,0.65); }
        .mp-vinyl-btn::before {
          content: '';
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid rgba(1,53,251,0.5);
          animation: mp-pulse-ring 1.8s ease-out infinite;
          pointer-events: none;
        }
        .mp-vinyl-btn::after {
          content: '';
          position: absolute; inset: -8px; border-radius: 50%;
          border: 1.5px solid rgba(1,53,251,0.25);
          animation: mp-pulse-ring 1.8s ease-out infinite 0.5s;
          pointer-events: none;
        }
        .mp-vinyl-inner {
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .mp-vinyl-btn.paused::before,
        .mp-vinyl-btn.paused::after { animation-play-state: paused; opacity: 0.25; }

        /* ── Compact floating card (NO screen blur) ── */
        .mp-panel {
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 290px;
          background: #0B1038;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(1,53,251,0.3);
          overflow: hidden;
          animation: mp-fadein 0.2s ease;
          z-index: 950;
        }
        .mp-disc {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #0135FB, #7C3AED);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .mp-disc-spin { animation: mp-spin 3s linear infinite; }
        .mp-panel-progress {
          height: 4px; background: rgba(255,255,255,0.1);
          cursor: pointer; margin: 12px 14px 0; border-radius: 9999px; overflow: hidden;
        }
        .mp-panel-fill {
          height: 100%; border-radius: 9999px;
          background: linear-gradient(90deg, #0135FB, #22C55E);
          transition: width 0.5s linear; pointer-events: none;
        }
        .mp-panel-controls {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 10px 14px 12px;
        }
        .mp-panel-ctrl {
          background: rgba(255,255,255,0.07); border: none;
          color: rgba(255,255,255,0.7); cursor: pointer; padding: 8px;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-panel-ctrl:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .mp-panel-ctrl:active { transform: scale(0.92); }
        .mp-panel-play {
          width: 40px; height: 40px; border-radius: 50%;
          background: #fff; border: none; color: #0135FB;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          transition: transform 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-panel-play:hover { transform: scale(1.08); }
        .mp-panel-play:active { transform: scale(0.92); }
        .mp-song-list { border-top: 1px solid rgba(255,255,255,0.07); max-height: 130px; overflow-y: auto; }
        .mp-song-item {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mp-song-item:hover { background: rgba(255,255,255,0.06); }
        .mp-song-item.active { background: rgba(1,53,251,0.25); }
      `}</style>

      {/* Single floating FAB with non-modal popup (NO background blur) */}
      <div
        ref={wrapRef}
        className="mp-fab-wrap"
        style={{
          ["--mp-bottom-mobile" as any]: `${mobileBottom}px`,
          ["--mp-bottom-desktop" as any]: `${desktopBottom}px`,
        }}
      >
        {/* Expanded panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="mp-panel"
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {/* Header */}
              <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 10 }}>
                <div className={`mp-disc${isPlaying ? " mp-disc-spin" : ""}`}>
                  <Music2 size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: "0.88rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                    {track.artist}
                  </div>
                </div>
                {isPlaying && <EqBars size={12} />}
                <button
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "none",
                    color: "rgba(255,255,255,0.6)", cursor: "pointer",
                    width: 26, height: 26, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  onClick={() => setExpanded(false)}
                  aria-label="Close music player"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Progress */}
              <div ref={progressRef} className="mp-panel-progress" onClick={handleProgressClick}>
                <div className="mp-panel-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Controls */}
              <div className="mp-panel-controls">
                <button className="mp-panel-ctrl" onClick={prevTrack} title="Previous" aria-label="Previous track">
                  <SkipBack size={15} />
                </button>
                <button className="mp-panel-play" onClick={() => setIsPlaying(p => !p)} aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause size={17} /> : <Play size={17} fill="#0135FB" />}
                </button>
                <button className="mp-panel-ctrl" onClick={nextTrack} title="Next" aria-label="Next track">
                  <SkipForward size={15} />
                </button>
                <button className="mp-panel-ctrl" onClick={stopTrack} title="Stop" aria-label="Stop playback">
                  <Square size={13} />
                </button>
                <button
                  className="mp-panel-ctrl"
                  onClick={() => setShowList(p => !p)}
                  style={{ color: showList ? "#22C55E" : undefined }}
                  title="Playlist"
                  aria-label="Toggle playlist"
                >
                  <ListMusic size={15} />
                </button>
                <button
                  className="mp-panel-ctrl"
                  onClick={handleDismiss}
                  title="Turn off"
                  aria-label="Turn off music"
                  style={{ color: "rgba(255,100,100,0.85)" }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Song list */}
              <AnimatePresence>
                {showList && (
                  <motion.div
                    className="mp-song-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "6px 14px 2px", fontSize: "0.55rem", fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Playlist</div>
                    {TRACKS.map((t, i) => (
                      <div key={t.id} className={`mp-song-item${i === currentIdx ? " active" : ""}`} onClick={() => selectTrack(i)}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: i === currentIdx ? "#0135FB" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800, color: i === currentIdx ? "#fff" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                          {i === currentIdx && isPlaying ? "▶" : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: "0.82rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                        {i === currentIdx && isPlaying && <div style={{ fontSize: "0.58rem", color: "#22C55E", fontWeight: 800 }}>NOW</div>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The vinyl FAB button */}
        <button
          className={`mp-vinyl-btn${isPlaying ? "" : " paused"}`}
          onClick={() => setExpanded(p => !p)}
          title="Music Player"
          aria-label="Toggle music player"
        >
          {isPlaying ? (
            <EqBars size={18} />
          ) : (
            <div className="mp-vinyl-inner">
              <Music2 size={11} color="rgba(255,255,255,0.9)" />
            </div>
          )}
        </button>
      </div>
    </>
  );
}
