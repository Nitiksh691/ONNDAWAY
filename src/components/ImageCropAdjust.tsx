"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, Move, Check, X } from "lucide-react";

interface CropState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

interface Props {
  imageSrc: string;
  outputSize?: { w: number; h: number };
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const DEFAULT_OUTPUT = { w: 600, h: 600 };
const PREVIEW = 320;

export default function ImageCropAdjust({ imageSrc, outputSize = DEFAULT_OUTPUT, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [state, setState] = useState<CropState>({ zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Draw function reads from ref so it never goes stale
  const draw = useCallback((s: CropState) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW, PREVIEW);
    ctx.save();
    ctx.translate(PREVIEW / 2 + s.offsetX, PREVIEW / 2 + s.offsetY);
    ctx.rotate((s.rotation * Math.PI) / 180);

    const scale = s.zoom;
    const baseScale = PREVIEW / Math.max(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * scale * baseScale;
    const h = img.naturalHeight * scale * baseScale;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Rule of thirds grid overlay
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((PREVIEW / 3) * i, 0);
      ctx.lineTo((PREVIEW / 3) * i, PREVIEW);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (PREVIEW / 3) * i);
      ctx.lineTo(PREVIEW, (PREVIEW / 3) * i);
      ctx.stroke();
    }
  }, []);

  // Load image once
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
  }, [imageSrc]);

  // Redraw whenever state or image changes
  useEffect(() => {
    if (imgLoaded) draw(state);
  }, [state, imgLoaded, draw]);

  // Attach non-passive wheel listener manually (required to call preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setState(s => ({ ...s, zoom: Math.min(5, Math.max(0.3, s.zoom - e.deltaY * 0.003)) }));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // ── Drag handling ──
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: state.offsetX, oy: state.offsetY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setState(s => ({ ...s, offsetX: dragStart.current!.ox + dx, offsetY: dragStart.current!.oy + dy }));
  };
  const onPointerUp = () => { setDragging(false); dragStart.current = null; };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const out = document.createElement("canvas");
    out.width = outputSize.w;
    out.height = outputSize.h;
    const ctx = out.getContext("2d")!;
    const scale = outputSize.w / PREVIEW;

    ctx.save();
    ctx.translate(outputSize.w / 2 + state.offsetX * scale, outputSize.h / 2 + state.offsetY * scale);
    ctx.rotate((state.rotation * Math.PI) / 180);

    const baseScale = PREVIEW / Math.max(img.naturalWidth, img.naturalHeight);
    const w = img.naturalWidth * state.zoom * baseScale * scale;
    const h = img.naturalHeight * state.zoom * baseScale * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    onConfirm(out.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(10,15,46,0.88)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "0",
        width: "100%", maxWidth: "420px", boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        overflow: "hidden", border: "1px solid rgba(1,53,251,0.15)",
      }}>
        {/* Header */}
        <div style={{ background: "#0135FB", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>Adjust Image</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Drag · Scroll to zoom · Use sliders</div>
          </div>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Canvas */}
        <div style={{ background: "#1a1a2e", display: "flex", justifyContent: "center", padding: "16px", position: "relative" }}>
          {!imgLoaded && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.85rem" }}>
              Loading…
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={PREVIEW}
            height={PREVIEW}
            style={{
              width: PREVIEW, height: PREVIEW,
              borderRadius: "12px", cursor: dragging ? "grabbing" : "grab",
              userSelect: "none", touchAction: "none",
              border: "2px solid rgba(255,255,255,0.1)",
              display: "block",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Zoom */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>Zoom</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0135FB" }}>{Math.round(state.zoom * 100)}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setState(s => ({ ...s, zoom: Math.max(0.3, parseFloat((s.zoom - 0.15).toFixed(2))) }))}
                style={{ width: 32, height: 32, borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#374151" }}>
                <ZoomOut size={15} />
              </button>
              <input
                type="range" min="0.3" max="5" step="0.05"
                value={state.zoom}
                onChange={e => setState(s => ({ ...s, zoom: parseFloat(e.target.value) }))}
                style={{ flex: 1, accentColor: "#0135FB", height: 4, cursor: "pointer" }}
              />
              <button
                onClick={() => setState(s => ({ ...s, zoom: Math.min(5, parseFloat((s.zoom + 0.15).toFixed(2))) }))}
                style={{ width: 32, height: 32, borderRadius: "8px", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#374151" }}>
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>Rotation</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0135FB" }}>{state.rotation}°</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RotateCw size={15} style={{ color: "#6b7280", flexShrink: 0 }} />
              <input
                type="range" min="-180" max="180" step="1"
                value={state.rotation}
                onChange={e => setState(s => ({ ...s, rotation: parseInt(e.target.value, 10) }))}
                style={{ flex: 1, accentColor: "#0135FB", height: 4, cursor: "pointer" }}
              />
              <button
                onClick={() => setState({ zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 })}
                style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0135FB", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                Reset
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.73rem", color: "#9ca3af", background: "#f9fafb", borderRadius: "8px", padding: "8px 12px" }}>
            <Move size={13} style={{ flexShrink: 0 }} />
            Drag canvas to reposition · Scroll wheel to zoom
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "13px", background: "#f3f4f6", color: "#374151",
            border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={{
            flex: 2, padding: "13px", background: "#0135FB", color: "#fff",
            border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "0 4px 0 #0028D4",
          }}>
            <Check size={16} /> Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
}
