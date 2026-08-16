"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, ChevronUp, ChevronDown, Music2, X } from "lucide-react";
import { useDraggableFab } from "@/hooks/useDraggableFab";

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
  const [isClosed, setIsClosed] = useState(false);
  const [showList, setShowList] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Draggable hook — keeps the pill within viewport
  const { style: dragStyle, onDragStart, didDrag } = useDraggableFab(110, 20);

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-play on first user interaction — browsers require a gesture
  useEffect(() => {
    const tryAutoPlay = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
      }
      document.removeEventListener("click", tryAutoPlay);
      document.removeEventListener("touchstart", tryAutoPlay);
    };
    document.addEventListener("click", tryAutoPlay, { once: true });
    document.addEventListener("touchstart", tryAutoPlay, { once: true });
    return () => {
      document.removeEventListener("click", tryAutoPlay);
      document.removeEventListener("touchstart", tryAutoPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync play/pause and track
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.src = TRACKS[currentIdx].url;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [currentIdx, isPlaying]);

  // Stop when closed
  useEffect(() => {
    if (isClosed && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isClosed]);

  const nextTrack = () => {
    setCurrentIdx(p => (p + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const selectTrack = (idx: number) => {
    setCurrentIdx(idx);
    setIsPlaying(true);
    setShowList(false);
  };

  if (!isMounted || isClosed) return null;

  const track = TRACKS[currentIdx];

  return (
    <>
      <style>{`
        @keyframes mp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(1,53,251,0.35); }
          50%      { box-shadow: 0 0 0 7px rgba(1,53,251,0); }
        }
        @keyframes mp-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .mp-icon-spin { animation: mp-spin 3s linear infinite; }
        .mp-pill {
          position: fixed;
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(1,53,251,0.92);
          backdrop-filter: blur(14px);
          color: #fff;
          border-radius: 99px;
          padding: 6px 12px 6px 8px;
          box-shadow: 0 4px 20px rgba(1,53,251,0.3);
          cursor: grab;
          touch-action: none;
          user-select: none;
          animation: ${isPlaying ? "mp-pulse 2s ease-in-out infinite" : "none"};
          transition: border-radius 0.2s;
          min-width: 160px;
        }
        .mp-icon-wrap {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .mp-track-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .mp-track-name {
          font-size: 0.72rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .mp-artist {
          font-size: 0.62rem;
          opacity: 0.65;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mp-btn {
          background: none; border: none; color: #fff;
          cursor: pointer; padding: 3px; display: flex;
          align-items: center; justify-content: center;
          opacity: 0.85; transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .mp-btn:hover { opacity: 1; }
        .mp-list {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          background: rgba(10,15,46,0.96);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          overflow: hidden;
          min-width: 220px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .mp-list-header {
          padding: 10px 14px 8px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .mp-list-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .mp-list-item:last-child { border-bottom: none; }
        .mp-list-item:hover { background: rgba(1,53,251,0.25); }
        .mp-list-item.active { background: rgba(1,53,251,0.4); }
        .mp-list-num {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          font-size: 0.6rem;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5);
          flex-shrink: 0;
        }
        .mp-list-item.active .mp-list-num {
          background: #0135FB;
          color: #fff;
        }
        .mp-list-item-info { flex: 1; min-width: 0; }
        .mp-list-item-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mp-list-item-artist {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <audio ref={audioRef} onEnded={nextTrack} />

      <div
        className="mp-pill"
        style={{ ...dragStyle, left: "unset" }}
        onPointerDown={(e) => onDragStart(e.clientX, e.clientY)}
        onClickCapture={(e) => {
          if (didDrag()) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        {/* Animated icon */}
        <div className="mp-icon-wrap">
          <Music2 size={15} className={isPlaying ? "mp-icon-spin" : ""} />
        </div>

        {/* Track info */}
        <div className="mp-track-info">
          <div className="mp-track-name">{track.name}</div>
          <div className="mp-artist">{track.artist}</div>
        </div>

        {/* Play/Pause */}
        <button
          className="mp-btn"
          onClick={e => { e.stopPropagation(); setIsPlaying(p => !p); }}
          onPointerDown={e => e.stopPropagation()}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Skip */}
        <button
          className="mp-btn"
          onClick={e => { e.stopPropagation(); nextTrack(); }}
          onPointerDown={e => e.stopPropagation()}
        >
          <SkipForward size={13} />
        </button>

        {/* Expand track list */}
        <button
          className="mp-btn"
          onClick={e => { e.stopPropagation(); setShowList(p => !p); }}
          onPointerDown={e => e.stopPropagation()}
          style={{ opacity: showList ? 1 : 0.6 }}
        >
          {showList ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Close */}
        <button
          className="mp-btn"
          onClick={e => { e.stopPropagation(); setIsClosed(true); }}
          onPointerDown={e => e.stopPropagation()}
          style={{ opacity: 0.45 }}
        >
          <X size={12} />
        </button>

        {/* Track list popup */}
        <AnimatePresence>
          {showList && (
            <motion.div
              className="mp-list"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onPointerDown={e => e.stopPropagation()}
            >
              <div className="mp-list-header">Now Playing</div>
              {TRACKS.map((t, i) => (
                <div
                  key={t.id}
                  className={`mp-list-item${i === currentIdx ? " active" : ""}`}
                  onClick={() => selectTrack(i)}
                >
                  <div className="mp-list-num">
                    {i === currentIdx && isPlaying ? <Music2 size={9} /> : i + 1}
                  </div>
                  <div className="mp-list-item-info">
                    <div className="mp-list-item-name">{t.name}</div>
                    <div className="mp-list-item-artist">{t.artist}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
