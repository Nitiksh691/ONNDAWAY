"use client";
import React, { useState, useEffect, useCallback } from "react";
import "./AdAnimation.css";

/*
 * ──────────────────────────────────────────────────────────────
 * ONN DA WAY — Cinematic Ad Animation
 * ──────────────────────────────────────────────────────────────
 * A premium, multi-scene animated advertisement telling the
 * story of two college friends craving coffee — and discovering
 * ONN DA WAY. Built entirely with CSS animations and React
 * state orchestration. No external libraries needed.
 * ──────────────────────────────────────────────────────────────
 */

// Scene definitions (step index → scene)
// 0  — Opening: Dark screen with "Late Night..." text
// 1  — Phone vibration notification
// 2  — Chat: "Bro, I'm dying for a coffee ☕"
// 3  — Chat: "Same here 😩 but where?"
// 4  — Chat: "Café down the road? They close early..."
// 5  — Chat: "Food court? Too far, too expensive"
// 6  — Chat: "Ugh, we always have this problem 😭"
// 7  — Dramatic pause — "But then..." overlay
// 8  — A third friend chimes in
// 9  — Chat: "Have you guys heard of ONN DA WAY?"
// 10 — Chat: "What's that?"
// 11 — Chat: "It's this new place near campus!"
// 12 — Product showcase — coffee, snacks, meals
// 13 — Chat: "Wait... they deliver too?! 🤯"
// 14 — Chat: "Bro. Let's go. RIGHT NOW."
// 15 — Transition to logo reveal
// 16 — Full logo + tagline + CTA

const AdAnimation = () => {
  const [step, setStep] = useState(0);
  const [replay, setReplay] = useState(0);

  const handleReplay = useCallback(() => {
    setStep(0);
    setReplay(r => r + 1);
  }, []);

  useEffect(() => {
    const timings = [
      2800,  // 0 → 1  Opening → Phone buzz
      2200,  // 1 → 2  Phone → First message
      2800,  // 2 → 3  Msg → Reply
      3000,  // 3 → 4  Reply → Suggestion 1
      2800,  // 4 → 5  Suggestion → Counter
      3000,  // 5 → 6  Counter → Frustration
      2500,  // 6 → 7  Frustration → "But then..."
      2500,  // 7 → 8  But then → Third friend
      3200,  // 8 → 9  Third friend → ONN DA WAY mention
      2200,  // 9 → 10 → "What's that?"
      3500,  // 10 → 11 → Description
      3500,  // 11 → 12 → Product showcase
      3000,  // 12 → 13 → "They deliver too?!"
      2500,  // 13 → 14 → "Let's go!"
      2500,  // 14 → 15 → Transition
      100,   // 15 → 16 → Logo reveal (instant)
    ];

    if (step < timings.length) {
      const timer = setTimeout(() => setStep(s => s + 1), timings[step]);
      return () => clearTimeout(timer);
    }
  }, [step, replay]);

  return (
    <div className="ad-root" key={replay}>
      {/* Ambient background particles */}
      <div className="ad-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            opacity: 0.2 + Math.random() * 0.4,
          }} />
        ))}
      </div>

      {/* Ambient light flares */}
      <div className="ad-flare flare-1" />
      <div className="ad-flare flare-2" />
      <div className="ad-flare flare-3" />

      {/* ═══════════ SCENE 0: Opening ═══════════ */}
      {step === 0 && (
        <div className="scene scene-opening">
          <div className="opening-time">11:47 PM</div>
          <div className="opening-text typewriter">Late Night at Campus...</div>
          <div className="opening-dots">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      )}

      {/* ═══════════ SCENE 1: Phone Buzz ═══════════ */}
      {step === 1 && (
        <div className="scene scene-phone">
          <div className="phone-device">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-notification shake-phone">
                <div className="notif-icon">💬</div>
                <div className="notif-body">
                  <div className="notif-app">Messages</div>
                  <div className="notif-text">Arjun: Bro, I'm dying for a coffee ☕</div>
                </div>
              </div>
            </div>
          </div>
          <div className="phone-glow" />
        </div>
      )}

      {/* ═══════════ SCENES 2–6: Chat Conversation ═══════════ */}
      {step >= 2 && step <= 6 && (
        <div className="scene scene-chat">
          <div className="chat-header">
            <div className="chat-header-avatar">☕</div>
            <div>
              <div className="chat-header-title">Late Night Cravings 🌙</div>
              <div className="chat-header-sub">3 members</div>
            </div>
          </div>

          <div className="chat-messages">
            {step >= 2 && (
              <div className="msg msg-left anim-msg-in">
                <div className="msg-avatar-wrap"><span className="msg-avatar">A</span></div>
                <div className="msg-content">
                  <div className="msg-name">Arjun</div>
                  <div className="msg-bubble msg-bubble-other">
                    Bro, I'm dying for a coffee ☕
                  </div>
                </div>
              </div>
            )}
            {step >= 3 && (
              <div className="msg msg-right anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-content">
                  <div className="msg-name msg-name-right">Priya</div>
                  <div className="msg-bubble msg-bubble-self">
                    Same here 😩 but where do we even go at this hour?
                  </div>
                </div>
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-alt">P</span></div>
              </div>
            )}
            {step >= 4 && (
              <div className="msg msg-left anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-avatar-wrap"><span className="msg-avatar">A</span></div>
                <div className="msg-content">
                  <div className="msg-name">Arjun</div>
                  <div className="msg-bubble msg-bubble-other">
                    That café down the road? They close by 9 😒
                  </div>
                </div>
              </div>
            )}
            {step >= 5 && (
              <div className="msg msg-right anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-content">
                  <div className="msg-name msg-name-right">Priya</div>
                  <div className="msg-bubble msg-bubble-self">
                    Food court? Too far... too expensive 💸
                  </div>
                </div>
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-alt">P</span></div>
              </div>
            )}
            {step >= 6 && (
              <div className="msg msg-left anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-avatar-wrap"><span className="msg-avatar">A</span></div>
                <div className="msg-content">
                  <div className="msg-name">Arjun</div>
                  <div className="msg-bubble msg-bubble-other">
                    Ugh, we ALWAYS have this problem 😭
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ SCENE 7: "But then..." ═══════════ */}
      {step === 7 && (
        <div className="scene scene-transition">
          <div className="transition-line" />
          <div className="transition-text cinematic-text">But then...</div>
          <div className="transition-line" />
        </div>
      )}

      {/* ═══════════ SCENES 8–14: Discovery ═══════════ */}
      {step >= 8 && step <= 14 && (
        <div className="scene scene-chat scene-chat-discovery">
          <div className="chat-header chat-header-glow">
            <div className="chat-header-avatar">✨</div>
            <div>
              <div className="chat-header-title">Late Night Cravings 🌙</div>
              <div className="chat-header-sub">3 members</div>
            </div>
          </div>

          <div className="chat-messages">
            {step >= 8 && (
              <div className="msg msg-center anim-msg-in">
                <div className="msg-system">
                  <span className="msg-system-icon">👤</span>
                  Rahul joined the chat
                </div>
              </div>
            )}
            {step >= 9 && (
              <div className="msg msg-left anim-msg-in">
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-new">R</span></div>
                <div className="msg-content">
                  <div className="msg-name msg-name-highlight">Rahul</div>
                  <div className="msg-bubble msg-bubble-highlight">
                    Guys... have you heard of <strong>ONN DA WAY</strong>? 🔥
                  </div>
                </div>
              </div>
            )}
            {step >= 10 && (
              <div className="msg msg-right anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-content">
                  <div className="msg-name msg-name-right">Priya</div>
                  <div className="msg-bubble msg-bubble-self">
                    ONN DA WAY? 🤔 What's that??
                  </div>
                </div>
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-alt">P</span></div>
              </div>
            )}
            {step >= 11 && (
              <div className="msg msg-left anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-new">R</span></div>
                <div className="msg-content">
                  <div className="msg-name msg-name-highlight">Rahul</div>
                  <div className="msg-bubble msg-bubble-highlight">
                    It's this amazing new place near campus! ☕🍟🍜 Great coffee, killer snacks, and affordable af! They're open late too!
                  </div>
                </div>
              </div>
            )}

            {/* Product showcase */}
            {step >= 12 && (
              <div className="product-showcase anim-msg-in" style={{ animationDelay: "0.2s" }}>
                <div className="product-card">
                  <div className="product-emoji">☕</div>
                  <div className="product-label">Premium Coffee</div>
                  <div className="product-price">from ₹49</div>
                </div>
                <div className="product-card">
                  <div className="product-emoji">🍟</div>
                  <div className="product-label">Hot Snacks</div>
                  <div className="product-price">from ₹29</div>
                </div>
                <div className="product-card">
                  <div className="product-emoji">🍜</div>
                  <div className="product-label">Full Meals</div>
                  <div className="product-price">from ₹89</div>
                </div>
              </div>
            )}

            {step >= 13 && (
              <div className="msg msg-left anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-avatar-wrap"><span className="msg-avatar">A</span></div>
                <div className="msg-content">
                  <div className="msg-name">Arjun</div>
                  <div className="msg-bubble msg-bubble-other">
                    Wait... they DELIVER too?! 🤯🤯🤯
                  </div>
                </div>
              </div>
            )}
            {step >= 14 && (
              <div className="msg msg-right anim-msg-in" style={{ animationDelay: "0.15s" }}>
                <div className="msg-content">
                  <div className="msg-name msg-name-right">Priya</div>
                  <div className="msg-bubble msg-bubble-self msg-bubble-excited">
                    BRO. Let's go. RIGHT NOW. 🏃‍♀️💨
                  </div>
                </div>
                <div className="msg-avatar-wrap"><span className="msg-avatar msg-avatar-alt">P</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ SCENE 15: Transition ═══════════ */}
      {step === 15 && (
        <div className="scene scene-logo-transition">
          <div className="logo-burst" />
        </div>
      )}

      {/* ═══════════ SCENE 16: Grand Finale ═══════════ */}
      {step >= 16 && (
        <div className="scene scene-finale">
          {/* Radial light rays */}
          <div className="finale-rays" />
          
          {/* Floating particles for the finale */}
          <div className="finale-sparkles">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="sparkle" style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }} />
            ))}
          </div>

          <div className="finale-content">
            <div className="finale-logo-box">
              <div className="finale-logo-ring" />
              <div className="finale-logo-ring ring-2" />
              <h1 className="finale-logo">ONN DA WAY</h1>
            </div>
            <p className="finale-tagline">Your campus. Your cravings. Our way.</p>
            <div className="finale-features">
              <span className="finale-chip">☕ Premium Coffee</span>
              <span className="finale-chip">🍟 Hot Snacks</span>
              <span className="finale-chip">🚀 Fast Delivery</span>
            </div>
            <button className="finale-cta" onClick={() => window.location.href = "/"}>
              ORDER NOW →
            </button>
            <button className="replay-btn" onClick={handleReplay}>
              ↻ Watch Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdAnimation;
