"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function OrderTrackRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      const timer = setTimeout(() => {
        router.replace(`/track/${params.id}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [params, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F7FF" }}>
      <p style={{ color: "#64748B", fontWeight: 600, fontSize: "0.95rem" }}>Loading live order tracking...</p>
    </div>
  );
}
