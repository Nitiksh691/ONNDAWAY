"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function WaitlistOverlay() {
  const { profile, loading, settings } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  
  const waitlistMode = settings?.waitlistMode || false;
  const checking = !settings;

  useEffect(() => {
    // If not waitlist mode, checking, or loading profile, do nothing
    if (!waitlistMode || checking || loading) return;

    // Admins bypass waitlist mode
    if (profile?.role === "admin") return;

    // Allowed paths: /admin and /join
    if (pathname.startsWith("/admin") || pathname === "/join" || pathname.startsWith("/api")) return;

    // Redirect to join page after router initialization
    const timer = setTimeout(() => {
      router.replace("/join");
    }, 0);
    return () => clearTimeout(timer);
  }, [waitlistMode, checking, loading, profile, pathname, router]);

  return null;
}
