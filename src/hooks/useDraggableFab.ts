"use client";
import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";

type FabPosition = { x: number; y: number };

export function useDraggableFab(
  defaultBottom = 20,
  defaultRight = 16,
  storageKey = "otw_fab_position",
) {
  const [offset, setOffset] = useState<FabPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0, moved: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setOffset(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  const persist = useCallback((pos: FabPosition) => {
    localStorage.setItem(storageKey, JSON.stringify(pos));
  }, [storageKey]);

  const clampOffset = useCallback((pos: FabPosition): FabPosition => {
    if (typeof window === "undefined") return pos;
    const margin = 12;
    const fabSize = 56;
    const maxLeft = window.innerWidth - fabSize - defaultRight - margin;
    const maxUp = window.innerHeight - fabSize - defaultBottom - margin;
    return {
      x: Math.max(-maxLeft, Math.min(margin, pos.x)),
      y: Math.max(-maxUp, Math.min(margin, pos.y)),
    };
  }, [defaultBottom, defaultRight]);

  const onDragStart = useCallback((clientX: number, clientY: number) => {
    dragState.current = {
      startX: clientX,
      startY: clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      moved: false,
    };
    setIsDragging(true);
  }, [offset]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragState.current.moved = true;
      const next = clampOffset({
        x: dragState.current.startOffsetX + dx,
        y: dragState.current.startOffsetY + dy,
      });
      setOffset(next);
    };

    const onEnd = () => {
      setIsDragging(false);
      setOffset(prev => {
        const clamped = clampOffset(prev);
        persist(clamped);
        return clamped;
      });
      setTimeout(() => { dragState.current.moved = false; }, 0);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
    };
  }, [isDragging, persist, clampOffset]);

  const style: CSSProperties = {
    position: "fixed",
    bottom: `max(${defaultBottom}px, env(safe-area-inset-bottom))`,
    right: `max(${defaultRight}px, env(safe-area-inset-right))`,
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    zIndex: 900,
    touchAction: "none",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const didDrag = () => dragState.current.moved;

  return { style, onDragStart, isDragging, didDrag };
}
