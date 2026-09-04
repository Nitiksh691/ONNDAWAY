"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Automatically hides bottom bars (BottomNav, TrackBar, CartBar, MusicPlayer)
 * when the user scrolls down, and brings them back smoothly when scrolling up.
 */
export default function ScrollHideBars() {
  const pathname = usePathname();

  useEffect(() => {
    // Always reveal bars on navigation
    document.body.classList.remove("bars-hidden");
  }, [pathname]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      // If near the top (first 45px), always keep bars visible
      if (currentScrollY <= 45) {
        document.body.classList.remove("bars-hidden");
      } else if (diff > 8 && currentScrollY > 70) {
        // Scrolling DOWN -> hide bars to give 100% full screen
        document.body.classList.add("bars-hidden");
      } else if (diff < -8) {
        // Scrolling UP -> reveal bars immediately
        document.body.classList.remove("bars-hidden");
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("bars-hidden");
    };
  }, []);

  return null;
}
