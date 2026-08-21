"use client";

// ONN DA WAY Gradient Footer
// Adapted from Ruixen Gradient Footer design — a rainbow glow that rises from the
// bottom of the viewport as you scroll to the end of the page.
// Styled to match ONN DA WAY's brand: deep blue (#0135FB) → indigo → white → gold.

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Stop = { offset: number; color: string };

const VBW = 1271;
const VBH = 599;

// ONN DA WAY brand palette — floor (0) → top (1):
// deep navy → brand blue → indigo → near-white → warm gold → coral → transparent
const OTW_STOPS: Stop[] = [
  { offset: 0,      color: "#0A0F2E" },
  { offset: 0.18,   color: "#0135FB" },
  { offset: 0.32,   color: "#2A55FF" },
  { offset: 0.50,   color: "#EEF1FF" },
  { offset: 0.65,   color: "#FFD400" },
  { offset: 0.78,   color: "#FF6B35" },
  { offset: 0.90,   color: "#FF35A0" },
  { offset: 1,      color: "#FF35A000" },
];

function bellHeights(n: number, peak: number, valley: number): number[] {
  const out: number[] = [];
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    const t = mid === 0 ? 0 : Math.abs(i - mid) / mid;
    const eased = 1 - Math.pow(t, 1.24);
    out.push(peak * VBH * (valley + (1 - valley) * eased));
  }
  return out;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

interface OTWGradientGlowProps {
  gradientHeight?: string;
  minReveal?: number;
  bars?: number;
  blur?: number;
  peak?: number;
  valley?: number;
  stops?: Stop[];
}

export function OTWGradientGlow({
  gradientHeight = "55vh",
  minReveal = 0.04,
  bars = 9,
  blur = 14,
  peak = 0.96,
  valley = 0.52,
  stops = OTW_STOPS,
}: OTWGradientGlowProps) {
  const uid = useId().replace(/:/g, "");
  const bandRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(minReveal);

  useEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView ?? window;
    const measure = () => {
      const h = el.offsetHeight || 1;
      const left =
        doc.documentElement.scrollHeight - win.innerHeight - win.scrollY;
      const t = clamp01((h - left) / h);
      setProgress(minReveal + (1 - minReveal) * t);
    };
    measure();
    win.addEventListener("scroll", measure, { passive: true });
    win.addEventListener("resize", measure, { passive: true });
    return () => {
      win.removeEventListener("scroll", measure);
      win.removeEventListener("resize", measure);
    };
  }, [minReveal]);

  const colW = VBW / bars;

  return (
    <div
      ref={bandRef}
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: gradientHeight,
        pointerEvents: "none",
        transformOrigin: "bottom",
        transform: `scaleY(${progress})`,
        willChange: "transform",
        zIndex: 0,
      }}
    >
      <svg
        style={{ height: "100%", width: "100%", display: "block" }}
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`otw-grad-${uid}`} x1="0" y1="1" x2="0" y2="0">
            {stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          <filter
            id={`otw-blur-${uid}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        </defs>
        {bellHeights(bars, peak, valley).map((barH, i) => (
          <g key={i} filter={`url(#otw-blur-${uid})`}>
            <rect
              x={i * colW}
              y={VBH - barH}
              width={colW * 1.23}
              height={barH}
              fill={`url(#otw-grad-${uid})`}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
