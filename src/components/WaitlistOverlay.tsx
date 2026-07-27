"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context";

export default function WaitlistOverlay() {
  const { profile, loading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [waitlistMode, setWaitlistMode] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/settings/status")
      .then(res => res.json())
      .then(data => {
        setWaitlistMode(data.waitlistMode);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    // If not waitlist mode, checking, or loading profile, do nothing
    if (!waitlistMode || checking || loading) return;

    // Admins bypass waitlist mode
    if (profile?.role === "admin") return;

    // Allowed paths: /admin and /join
    if (pathname.startsWith("/admin") || pathname === "/join" || pathname.startsWith("/api")) return;

    // Redirect to join page
    router.replace("/join");
  }, [waitlistMode, checking, loading, profile, pathname, router]);

  return null;
}
