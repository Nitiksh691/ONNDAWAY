import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | Onn Da Way – Onndaway Coffee, Cold Brews & Snacks at DTU",
  description:
    "Explore the full menu of Onn Da Way (Onndaway). Handcrafted cold brews, hot coffee, munchies, snacks, and meals delivered to your spot across DTU campus in minutes.",
  keywords: [
    "onndaway coffee menu",
    "onn da way menu",
    "onn the way coffee menu",
    "onndaway dtu menu",
    "dtu cold brew coffee",
    "campus coffee menu",
    "onndaway prices",
  ],
  alternates: {
    canonical: "/menu",
  },
  openGraph: {
    title: "Menu | Onn Da Way – Onndaway Coffee & Campus Food at DTU",
    description: "Browse the menu and order fresh coffee, cold brews, and snacks at DTU.",
    url: "/menu",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
