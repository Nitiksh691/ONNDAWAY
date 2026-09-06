"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Square, Music2, ListMusic, X, ChevronDown } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false); // mobile only
  const [showList, setShowList] = useState(false);
  const [expanded, setExpanded] = useState(false); // desktop: show full card
  const [progress, setProgress] = useState(0);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleDismiss = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsDismissed(true);
    window.dispatchEvent(new CustomEvent("otw:music-dismissed"));
  };

  useEffect(() => {
    const check = () => {
      const isDelivery = profile?.role === "delivery" || (typeof window !== "undefined" && !!localStorage.getItem("otw_delivery_id"));
      if (isDelivery) {
        setHasActiveOrder(false);
        return;
      }
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

  useEffect(() => {
    if (!audioRef.current) return;
    const tryPlay = () => {
      audioRef.current?.play()
        .then(() => setIsPlaying(true))
        .catch(() => { });
    };
    const t = setTimeout(tryPlay, 600);
    const onInteraction = () => {
      if (!isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
      }
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
    };
    document.addEventListener("click", onInteraction, { once: true });
    document.addEventListener("touchstart", onInteraction, { once: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const track = TRACKS[currentIdx];
  const isCartPage = pathname === "/cart";
  const showCheckoutBar = cartCount > 0 && !isCartPage;

  // ── Mobile & Desktop offset calculation ──
  // The Track bar sits directly over the bottom bar/checkout page (compact 36px).
  // Music player sits directly ABOVE the Track bar (Track bar is below the music layer).
  const showTrackBar = hasActiveOrder && !pathname.startsWith("/track/");
  const mobileOffset = isCartPage
    ? (showTrackBar ? "42px" : "0px")
    : showCheckoutBar
      ? (showTrackBar ? "106px" : "64px")
      : (showTrackBar ? "90px" : "50px");

  const desktopBottom = showTrackBar ? "52px" : "28px";

  const EqBars = () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      <span style={{ display: "inline-block", width: 2, height: 10, background: "#22C55E", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite" }} />
      <span style={{ display: "inline-block", width: 2, height: 14, background: "#22C55E", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.1s" }} />
      <span style={{ display: "inline-block", width: 2, height: 8, background: "#22C55E", borderRadius: 1, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.2s" }} />
    </div>
  );

  return (
    <>
      <audio ref={audioRef} onEnded={nextTrack} />

      <style>{`
        @keyframes mp-eq { 0%,100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }
        @keyframes mp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mp-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(1,53,251,0.4); } 70% { box-shadow: 0 0 0 10px rgba(1,53,251,0); } }
        @keyframes mp-fadein { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }

        /* ──────────── MOBILE: bottom bar ──────────── */
        .mp-mobile {
          display: block;
        }
        .mp-desktop {
          display: none;
        }

        @media (min-width: 768px) {
          .mp-mobile { display: none !important; }
          .mp-desktop { display: block !important; }
        }

        /* mobile bar — sits above the Track bar */
        .mp-bar {
          position: fixed;
          left: 0; right: 0;
          z-index: 940;
          font-family: 'Outfit','Inter',system-ui,sans-serif;
          transition: bottom 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .mp-bar-inner {
          background: rgba(1, 53, 251, 0.97);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 -4px 24px rgba(0,0,0,0.35);
        }
        .mp-progress-bar {
          height: 2px; background: rgba(255,255,255,0.1); cursor: pointer; position: relative;
        }
        .mp-progress-fill {
          height: 100%; background: linear-gradient(90deg,#0135FB,#22C55E);
          transition: width 0.5s linear; pointer-events: none;
        }
        .mp-controls-row {
          display: flex; align-items: center; gap: 8px; padding: 4px 14px 6px;
        }
        .mp-icon-wrap {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(0,0,0,0.2); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .mp-track-name {
          font-size: 0.78rem; font-weight: 800; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
        }
        .mp-ctrl-btn {
          background: none; border: none; color: rgba(255,255,255,0.8);
          cursor: pointer; padding: 5px; display: flex; align-items: center;
          justify-content: center; border-radius: 6px; flex-shrink: 0; transition: all 0.15s;
        }
        .mp-ctrl-btn:hover { color:#fff; background: rgba(255,255,255,0.1); }
        .mp-play-btn {
          width: 30px; height: 30px; border-radius: 50%; background: #fff;
          border: none; color: #0135FB; display: flex; align-items: center;
          justify-content: center; cursor: pointer; flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2); transition: transform 0.15s;
        }
        .mp-play-btn:hover { transform: scale(1.1); }
        .mp-mini-strip {
          display: flex; align-items: center; gap: 8px; padding: 4px 14px; cursor: pointer; height: 36px;
        }
        .mp-mini-name {
          font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.8);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
        }
        .mp-song-list {
          border-top: 1px solid rgba(255,255,255,0.07); max-height: 200px; overflow-y: auto;
        }
        .mp-song-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 14px;
          cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mp-song-item:hover { background: rgba(255,255,255,0.07); }
        .mp-song-item.active { background: rgba(255,255,255,0.12); }
        .mp-song-num {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(255,255,255,0.08); font-size: 0.58rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.4); flex-shrink: 0;
        }
        .mp-song-item.active .mp-song-num { background: rgba(255,255,255,0.2); color: #fff; }

        /* ──────────── DESKTOP: floating circular widget ──────────── */
        .mp-fab {
          position: fixed;
          bottom: 32px;
          right: 28px;
          z-index: 900;
          font-family: 'Outfit','Inter',system-ui,sans-serif;
        }
        .mp-fab-btn {
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #0135FB, #0051FF);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 24px rgba(1,53,251,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: mp-pulse 2s ease-in-out infinite;
          position: relative;
        }
        .mp-fab-btn:hover { transform: scale(1.1); box-shadow: 0 10px 32px rgba(1,53,251,0.55); }
        .mp-fab-card {
          position: absolute;
          bottom: 70px; right: 0;
          width: 280px;
          background: rgba(8,12,40,0.97);
          backdrop-filter: blur(24px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: mp-fadein 0.2s ease;
        }
        .mp-fab-header {
          padding: 16px 16px 10px;
          display: flex; align-items: center; gap: 12px;
        }
        .mp-fab-disc {
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #0135FB, #7C3AED);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; position: relative;
        }
        .mp-fab-disc-spin {
          animation: mp-spin 3s linear infinite;
        }
        .mp-fab-close {
          margin-left: auto; background: rgba(255,255,255,0.07);
          border: none; color: rgba(255,255,255,0.5); cursor: pointer;
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .mp-fab-close:hover { background: rgba(255,255,255,0.15); color:#fff; }
        .mp-fab-progress {
          height: 3px; background: rgba(255,255,255,0.08);
          cursor: pointer; margin: 0 16px 14px; border-radius: 9999px; overflow: hidden;
        }
        .mp-fab-fill {
          height: 100%; border-radius: 9999px;
          background: linear-gradient(90deg,#0135FB,#22C55E);
          transition: width 0.5s linear; pointer-events: none;
        }
        .mp-fab-controls {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 0 16px 14px;
        }
        .mp-fab-ctrl {
          background: rgba(255,255,255,0.07); border: none;
          color: rgba(255,255,255,0.7); cursor: pointer; padding: 9px;
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s;
        }
        .mp-fab-ctrl:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .mp-fab-play {
          width: 44px; height: 44px; border-radius: 50%;
          background: #fff; border: none; color: #0135FB;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          transition: transform 0.15s;
        }
        .mp-fab-play:hover { transform: scale(1.1); }
        .mp-fab-song-list {
          border-top: 1px solid rgba(255,255,255,0.06);
          max-height: 140px; overflow-y: auto;
        }
        .mp-fab-song-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 16px; cursor: pointer; transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mp-fab-song-item:hover { background: rgba(255,255,255,0.06); }
        .mp-fab-song-item.active { background: rgba(1,53,251,0.2); }
      `}</style>

      {/* ────────── MOBILE BOTTOM BAR ────────── */}
      <div className="mp-mobile mp-bar" style={{ bottom: mobileOffset }}>
        <div className="mp-bar-inner">
          <div ref={progressRef} className="mp-progress-bar" onClick={handleProgressClick}>
            <div className="mp-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {isCollapsed ? (
            <div className="mp-mini-strip" onClick={() => setIsCollapsed(false)}>
              <div className="mp-icon-wrap"><Music2 size={12} color="#fff" /></div>
              {isPlaying && <EqBars />}
              <span className="mp-mini-name">{track.name}</span>
              <button className="mp-ctrl-btn" onClick={e => { e.stopPropagation(); setIsCollapsed(false); }} title="Expand">▲</button>
              <button className="mp-ctrl-btn" onClick={e => { e.stopPropagation(); handleDismiss(); }} title="Turn off music" style={{ color: "rgba(255,255,255,0.7)" }}><X size={13} /></button>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {showList && (
                  <motion.div className="mp-song-list"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                    <div style={{ padding: "6px 14px 2px", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Playlist</div>
                    {TRACKS.map((t, i) => (
                      <div key={t.id} className={`mp-song-item${i === currentIdx ? " active" : ""}`} onClick={() => selectTrack(i)}>
                        <div className="mp-song-num">{i === currentIdx && isPlaying ? <EqBars /> : i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: "0.82rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                        {i === currentIdx && isPlaying && <div style={{ fontSize: "0.58rem", color: "#22C55E", fontWeight: 800 }}>NOW</div>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mp-controls-row">
                <div className="mp-icon-wrap"><Music2 size={13} color="#fff" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mp-track-name">{track.name}</div>
                </div>
                {isPlaying && <EqBars />}
                <button className="mp-ctrl-btn" onClick={prevTrack} title="Previous"><SkipBack size={14} /></button>
                <button className="mp-play-btn" onClick={() => setIsPlaying(p => !p)} title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause size={14} /> : <Play size={14} fill="#0135FB" />}
                </button>
                <button className="mp-ctrl-btn" onClick={nextTrack} title="Next"><SkipForward size={14} /></button>
                <button className="mp-ctrl-btn" onClick={stopTrack} title="Stop"><Square size={12} /></button>
                <button className="mp-ctrl-btn" onClick={() => setShowList(p => !p)} style={{ color: showList ? "#22C55E" : undefined }} title="Playlist"><ListMusic size={14} /></button>
                <button className="mp-ctrl-btn" onClick={() => { setIsCollapsed(true); setShowList(false); }} title="Minimize"><ChevronDown size={14} /></button>
                <button className="mp-ctrl-btn" onClick={handleDismiss} title="Turn off music" style={{ color: "rgba(255,255,255,0.7)" }}><X size={14} /></button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ────────── DESKTOP FLOATING CIRCULAR ────────── */}
      <div className="mp-desktop mp-fab" style={{ bottom: desktopBottom }}>
        {/* Expanded card */}
        <AnimatePresence>
          {expanded && (
            <motion.div className="mp-fab-card"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}>

              {/* Header */}
              <div className="mp-fab-header">
                <div className={`mp-fab-disc${isPlaying ? " mp-fab-disc-spin" : ""}`}>
                  <Music2 size={20} color="#fff" style={{ position: "absolute" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{track.artist}</div>
                </div>
                {isPlaying && <EqBars />}
                <button className="mp-fab-close" onClick={() => setExpanded(false)}><X size={13} /></button>
              </div>

              {/* Progress */}
              <div ref={progressRef} className="mp-fab-progress" onClick={handleProgressClick}>
                <div className="mp-fab-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Controls */}
              <div className="mp-fab-controls">
                <button className="mp-fab-ctrl" onClick={prevTrack} title="Previous"><SkipBack size={16} /></button>
                <button className="mp-fab-play" onClick={() => setIsPlaying(p => !p)}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#0135FB" />}
                </button>
                <button className="mp-fab-ctrl" onClick={nextTrack} title="Next"><SkipForward size={16} /></button>
                <button className="mp-fab-ctrl" onClick={stopTrack} title="Stop"><Square size={14} /></button>
                <button className="mp-fab-ctrl" onClick={() => setShowList(p => !p)} style={{ color: showList ? "#22C55E" : undefined }} title="Playlist"><ListMusic size={16} /></button>
              </div>

              {/* Song list */}
              <AnimatePresence>
                {showList && (
                  <motion.div className="mp-fab-song-list"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
                    <div style={{ padding: "6px 16px 2px", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Playlist</div>
                    {TRACKS.map((t, i) => (
                      <div key={t.id} className={`mp-fab-song-item${i === currentIdx ? " active" : ""}`} onClick={() => selectTrack(i)}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: i === currentIdx ? "#0135FB" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 800, color: i === currentIdx ? "#fff" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                          {i === currentIdx && isPlaying ? "▶" : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: "0.85rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                        {i === currentIdx && isPlaying && <div style={{ fontSize: "0.6rem", color: "#22C55E", fontWeight: 800 }}>NOW</div>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB circular button */}
        <button className="mp-fab-btn" onClick={() => setExpanded(p => !p)} title="Music Player" aria-label="Toggle music player">
          {isPlaying ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22 }}>
              <span style={{ display: "inline-block", width: 3, height: 14, background: "#fff", borderRadius: 2, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite" }} />
              <span style={{ display: "inline-block", width: 3, height: 22, background: "#fff", borderRadius: 2, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.1s" }} />
              <span style={{ display: "inline-block", width: 3, height: 16, background: "#fff", borderRadius: 2, transformOrigin: "bottom", animation: "mp-eq 0.6s ease-in-out infinite 0.2s" }} />
            </div>
          ) : (
            <Music2 size={24} color="#fff" />
          )}
        </button>
      </div>
    </>
  );
}
