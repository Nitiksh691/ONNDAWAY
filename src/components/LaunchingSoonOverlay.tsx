"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Rocket, Coffee } from "lucide-react";

export default function LaunchingSoonOverlay() {
  const { settings, profile } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isLaunchingSoon = settings?.launchingSoonMode ?? false;

  // Admin bypass — admins can browse normally
  const isAdmin = profile?.role === "admin";

  // Block list: paths that should redirect to /launching-soon
  const shouldBlock =
    isLaunchingSoon &&
    !isAdmin &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    pathname !== "/launching-soon" &&
    pathname !== "/join";

  useEffect(() => {
    if (shouldBlock) {
      router.replace("/launching-soon");
    }
  }, [shouldBlock, router]);

  return null;
}
