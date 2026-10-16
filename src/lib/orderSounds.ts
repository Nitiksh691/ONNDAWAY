// Shared Sound & Notification Utility for Admin and Vendor Portals

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

/** Unlock audio on mobile devices during any user tap/gesture */
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    // Also warm up an empty audio element to unlock mobile Safari
    const dummyAudio = new Audio();
    dummyAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    dummyAudio.play().catch(() => {});
  } catch {}
}

/** Play loud urgent alarm for Admin (restaurant bell + digital beeps) */
export function playAdminOrderSound() {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // 2 rounds of triple-beeps
      playTone(880, 0.0, 0.18, "sine");
      playTone(1100, 0.22, 0.18, "sine");
      playTone(1320, 0.44, 0.28, "triangle");

      playTone(880, 0.85, 0.18, "sine");
      playTone(1100, 1.07, 0.18, "sine");
      playTone(1320, 1.29, 0.35, "triangle");
    }
  } catch {}

  // Fallback audio element
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
    audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch {}

  // Mobile vibration
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 150, 300, 150, 500]);
    }
  } catch {}
}

/** Play upbeat, distinct chime sequence for Vendor mobile ("Order Ready to Pack!") */
export function playVendorOrderSound() {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const playChime = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // High-register cash register / bell chime: E5 -> A5 -> C#6 -> E6 -> A6
      playChime(659.25, 0.00, 0.35);
      playChime(880.00, 0.14, 0.38);
      playChime(1108.73, 0.28, 0.45);
      playChime(1318.51, 0.42, 0.55);
      playChime(1760.00, 0.56, 0.80);
    }
  } catch {}

  // Fallback audio element
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch {}

  // Mobile vibration
  try {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([350, 120, 350, 120, 600]);
    }
  } catch {}
}

/** Request and trigger browser notification */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const res = await Notification.requestPermission();
    return res === "granted";
  }
  return false;
}

export function triggerBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      });
    } catch {}
  }
}
