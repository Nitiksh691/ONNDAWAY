import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ActiveOrderWidget from "@/components/ActiveOrderWidget";
import SupportFab from "@/components/SupportFab";
import BottomNav from "@/components/BottomNav";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import KitchenClosedBanner from "@/components/KitchenClosedBanner";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ONN D A WAY – Smart Campus Food Delivery",
  description: "Order meals, snacks, and beverages delivered right to your campus spot. Fast, fresh, and campus-first.",
  keywords: "campus food delivery, college food, campus meals, student food app",
  openGraph: {
    title: "ONN D A WAY – Smart Campus Food Delivery",
    description: "Order meals, snacks, and beverages delivered right to your campus spot.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#01235F" />
      </head>
      <body>
        <AppProvider>
          <MaintenanceOverlay />
          <KitchenClosedBanner />
          <Loader />
          <Navbar />
          <main style={{ minHeight: "100vh", paddingBottom: "env(safe-area-inset-bottom)" }}>{children}</main>
          <BottomNav />
          <ActiveOrderWidget />
          <SupportFab />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                borderRadius: "12px",
                fontSize: "0.9rem",
              },
              success: { iconTheme: { primary: "#01235F", secondary: "#FDF8F0" } },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
