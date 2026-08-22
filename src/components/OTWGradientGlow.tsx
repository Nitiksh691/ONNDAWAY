"use client";

// ONN DA WAY Gradient Footer
// A smooth blue glow that rises from the bottom of the viewport as you scroll
// to the end of the page — pure brand blue (#0135FB) palette, no rainbow.

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

// ONN DA WAY brand palette — pure blue theme, floor (0) → top (1):
// deep navy → rich brand blue → mid blue → sky blue → pale blue → transparent
const OTW_STOPS: Stop[] = [
  { offset: 0,      color: "#060C2E" },
  { offset: 0.15,   color: "#0135FB" },
  { offset: 0.35,   color: "#1D4BFF" },
  { offset: 0.55,   color: "#4169FF" },
  { offset: 0.72,   color: "#7EA3FF" },
  { offset: 0.87,   color: "#C2D3FF" },
  { offset: 1,      color: "#EEF1FF00" },
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
  minReveal = 0.01,
  bars = 9,
  blur = 16,
  peak = 0.88,
  valley = 0.45,
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
        transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
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
