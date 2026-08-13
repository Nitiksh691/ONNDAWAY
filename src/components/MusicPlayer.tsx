"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, X, Music } from "lucide-react";

const TRACKS = [
  { id: 1, name: "Chill Vibes", url: "/music/track1.mp3" },
  { id: 2, name: "Good Mood", url: "/music/track2.mp3" },
];

export default function MusicPlayer() {
  const [isClosed, setIsClosed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Stop music when closed completely
  useEffect(() => {
    if (isClosed && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isClosed]);

  // Handle play/pause sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log("Audio play failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    handleNextTrack();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isMounted || isClosed) return null;

  return (
    <>
      <style>{`
        @keyframes music-glow-ring {
          0% { box-shadow: 0 0 0 0 rgba(1,53,251,0.6), 0 0 12px rgba(0,200,255,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(1,53,251,0), 0 0 20px rgba(0,200,255,0.5); }
          100% { box-shadow: 0 0 0 0 rgba(1,53,251,0), 0 0 12px rgba(0,200,255,0.3); }
        }
        @keyframes music-spin-border {
          0% { border-color: rgba(0,200,255,0.7); }
          33% { border-color: rgba(1,53,251,0.7); }
          66% { border-color: rgba(34,197,94,0.7); }
          100% { border-color: rgba(0,200,255,0.7); }
        }
      `}</style>
      <audio
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleEnded}
      />
      <motion.div
        drag
        dragMomentum={false}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: "fixed",
          bottom: "100px",
          left: "20px",
          zIndex: 99999,
          backgroundColor: isCollapsed ? "rgba(1, 53, 251, 0.9)" : "#0135FB",
          backdropFilter: isCollapsed ? "blur(8px)" : "none",
          color: "#ffffff",
          borderRadius: isCollapsed ? "50%" : "14px",
          cursor: "grab",
          touchAction: "none",
          border: isCollapsed ? "2px solid rgba(0,200,255,0.7)" : "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          width: isCollapsed ? "52px" : "auto",
          height: isCollapsed ? "52px" : "auto",
          animation: isCollapsed ? "music-glow-ring 2s ease-in-out infinite, music-spin-border 3s linear infinite" : "none",
        }}
        whileTap={{ cursor: "grabbing" }}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCollapsed(false)}
              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Music size={24} color={isPlaying ? "#4ade80" : "white"} />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 18px", whiteSpace: "nowrap" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", outline: "none" }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextTrack();
                }}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", outline: "none" }}
              >
                <SkipForward size={20} />
              </button>
              <span onClick={() => setIsCollapsed(true)} style={{ fontSize: "14px", fontWeight: 500, minWidth: "90px", userSelect: "none", cursor: "pointer" }}>
                {TRACKS[currentTrackIndex].name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsClosed(true);
                }}
                style={{ background: "none", border: "none", color: "#8e8e93", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", marginLeft: "8px", outline: "none" }}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
