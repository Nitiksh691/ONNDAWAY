"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Square, ChevronUp, ChevronDown, Music2, ListMusic } from "lucide-react";
import { useApp } from "@/lib/context";
import { usePathname } from "next/navigation";

interface Track {
  id: number;
  name: string;
  artist: string;
  url: string;
}

const TRACKS: Track[] = [
  { id: 1, name: "Chill Vibes", artist: "ONN DA WAY", url: "/music/track1.mp3" },
  { id: 2, name: "Good Mood", artist: "ONN DA WAY", url: "/music/track2.mp3" },
];

export default function MusicPlayer() {
  const { cartCount } = useApp();
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showList, setShowList] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-play on mount — try immediately, fallback to first click
  useEffect(() => {
    if (!audioRef.current) return;
    const tryPlay = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {/* will retry on first click */});
      }
    };
    // Short delay to let audio element initialize
    const t = setTimeout(tryPlay, 600);
    // Fallback: play on first user interaction
    const onInteraction = () => {
      if (!isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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

  // Sync audio src + play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = TRACKS[currentIdx].url;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [currentIdx, isPlaying]);

  // Track progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  const nextTrack = () => {
    setCurrentIdx(p => (p + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentIdx(p => (p - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const selectTrack = (idx: number) => {
    setCurrentIdx(idx);
    setIsPlaying(true);
    setShowList(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * audioRef.current.duration;
  };

  if (!isMounted) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  const track = TRACKS[currentIdx];
  // Bottom nav is 58px (mobile only, shows only when cart=0)
  // Cart checkout bar is ~64px (shows when cart>0)
  // Music player sits above whichever is visible
  const isCartPage = pathname === "/cart";
  const showCheckoutBar = cartCount > 0 && !isCartPage;
  // On mobile: if cart bar visible → 64px, else bottom nav → 58px
  return (
    <>
      <audio ref={audioRef} onEnded={nextTrack} />

      <style>{`
        .mp-bar {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 9500;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          bottom: var(--mobile-offset);
        }
        @media (min-width: 768px) {
          .mp-bar {
            bottom: var(--desktop-offset);
          }
          .mp-bar-inner {
            max-width: 600px;
            margin: 0 auto;
            border-radius: 12px 12px 0 0;
            border-bottom: none;
          }
          .mp-mini-strip {
            padding: 10px 24px !important;
            gap: 12px !important;
          }
          .mp-mini-name {
            font-size: 0.85rem !important;
          }
          .mp-mini-strip .mp-icon-wrap {
            width: 28px !important;
            height: 28px !important;
          }
        }
        .mp-bar-inner {
          background: rgba(1, 53, 251, 0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 -4px 24px rgba(0,0,0,0.35);
          transition: all 0.3s ease;
        }
        .mp-collapsed-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 16px;
          cursor: pointer;
          gap: 10px;
        }
        .mp-controls-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px 10px;
        }
        .mp-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }
        .mp-track-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .mp-track-name {
          font-size: 0.8rem;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .mp-artist {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mp-ctrl-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .mp-ctrl-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
        }
        .mp-ctrl-btn.active {
          color: #0135FB;
        }
        .mp-play-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          border: none;
          color: #0135FB;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .mp-play-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .mp-progress-bar {
          height: 2px;
          background: rgba(255,255,255,0.1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .mp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0135FB, #22C55E);
          transition: width 0.5s linear;
          pointer-events: none;
        }
        @keyframes mp-equalizer {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .mp-eq-bar {
          display: inline-block;
          width: 2px;
          background: #22C55E;
          border-radius: 1px;
          transform-origin: bottom;
        }
        .mp-eq-bar:nth-child(1) { animation: mp-equalizer 0.6s ease-in-out infinite; }
        .mp-eq-bar:nth-child(2) { animation: mp-equalizer 0.6s ease-in-out infinite 0.1s; }
        .mp-eq-bar:nth-child(3) { animation: mp-equalizer 0.6s ease-in-out infinite 0.2s; }
        .mp-song-list {
          border-top: 1px solid rgba(255,255,255,0.07);
          max-height: 220px;
          overflow-y: auto;
        }
        .mp-song-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mp-song-item:last-child { border-bottom: none; }
        .mp-song-item:hover { background: rgba(255,255,255,0.07); }
        .mp-song-item.active { background: rgba(1,53,251,0.15); }
        .mp-song-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          font-size: 0.6rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .mp-song-item.active .mp-song-num {
          background: #0135FB;
          color: #fff;
        }
        .mp-song-info { flex: 1; min-width: 0; }
        .mp-song-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mp-song-artist {
          display: none;
        }
        .mp-collapse-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 16px 5px;
          cursor: pointer;
          border-top: 1px solid rgba(255,255,255,0.05);
          justify-content: center;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .mp-collapse-strip:hover { opacity: 1; }
        .mp-mini-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          cursor: pointer;
        }
        .mp-mini-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
      `}</style>

      <div 
        className="mp-bar" 
        style={{ 
          "--mobile-offset": showCheckoutBar ? "64px" : "58px",
          "--desktop-offset": showCheckoutBar ? "64px" : "0px"
        } as React.CSSProperties}
      >
        <div className="mp-bar-inner">
          {/* Progress bar at the very top */}
          <div
            ref={progressRef}
            className="mp-progress-bar"
            onClick={handleProgressClick}
            title="Seek"
          >
            <div className="mp-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {isCollapsed ? (
            /* Collapsed mini strip */
            <div
              className="mp-mini-strip"
              onClick={() => setIsCollapsed(false)}
            >
              <div className="mp-icon-wrap" style={{ width: 22, height: 22, borderRadius: 5 }}>
                <Music2 size={11} color="#fff" />
              </div>
              {isPlaying && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
                  <span className="mp-eq-bar" style={{ height: 10 }} />
                  <span className="mp-eq-bar" style={{ height: 14 }} />
                  <span className="mp-eq-bar" style={{ height: 8 }} />
                </div>
              )}
              <span className="mp-mini-name">{track.name}</span>
              <ChevronUp size={13} color="rgba(255,255,255,0.5)" />
            </div>
          ) : (
            <>
              {/* Song list */}
              <AnimatePresence>
                {showList && (
                  <motion.div
                    className="mp-song-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "8px 16px 4px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "1.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                      Playlist
                    </div>
                    {TRACKS.map((t, i) => (
                      <div
                        key={t.id}
                        className={`mp-song-item${i === currentIdx ? " active" : ""}`}
                        onClick={() => selectTrack(i)}
                      >
                        <div className="mp-song-num">
                          {i === currentIdx && isPlaying ? (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                              <span className="mp-eq-bar" style={{ height: 7 }} />
                              <span className="mp-eq-bar" style={{ height: 10 }} />
                              <span className="mp-eq-bar" style={{ height: 6 }} />
                            </div>
                          ) : i + 1}
                        </div>
                        <div className="mp-song-info">
                          <div className="mp-song-name">{t.name}</div>
                          <div className="mp-song-artist">{t.artist}</div>
                        </div>
                        {i === currentIdx && isPlaying && (
                          <div style={{ fontSize: "0.6rem", color: "#22C55E", fontWeight: 800 }}>NOW</div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main controls row */}
              <div className="mp-controls-row">
                {/* Disc icon */}
                <div className="mp-icon-wrap">
                  <Music2 size={15} color="#fff" style={{ animation: isPlaying ? "mp-equalizer 1.5s ease-in-out infinite" : "none" }} />
                </div>

                {/* Track info */}
                <div className="mp-track-info">
                  <div className="mp-track-name">{track.name}</div>
                </div>

                {/* Equalizer when playing */}
                {isPlaying && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18, flexShrink: 0 }}>
                    <span className="mp-eq-bar" style={{ height: 10 }} />
                    <span className="mp-eq-bar" style={{ height: 18 }} />
                    <span className="mp-eq-bar" style={{ height: 13 }} />
                  </div>
                )}

                {/* Controls */}
                <button className="mp-ctrl-btn" onClick={prevTrack} title="Previous" aria-label="Previous track">
                  <SkipBack size={15} />
                </button>

                <button
                  className="mp-play-btn"
                  onClick={() => setIsPlaying(p => !p)}
                  title={isPlaying ? "Pause" : "Play"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} fill="#0135FB" />}
                </button>

                <button className="mp-ctrl-btn" onClick={nextTrack} title="Next" aria-label="Next track">
                  <SkipForward size={15} />
                </button>

                <button className="mp-ctrl-btn" onClick={stopTrack} title="Stop" aria-label="Stop">
                  <Square size={13} />
                </button>

                <button
                  className={`mp-ctrl-btn${showList ? " active" : ""}`}
                  onClick={() => setShowList(p => !p)}
                  title="Song list"
                  aria-label="Toggle song list"
                >
                  <ListMusic size={15} />
                </button>

                {/* Collapse */}
                <button
                  className="mp-ctrl-btn"
                  onClick={() => { setIsCollapsed(true); setShowList(false); }}
                  title="Minimize player"
                  aria-label="Minimize music player"
                >
                  <ChevronDown size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
