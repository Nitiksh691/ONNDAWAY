import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import GlobalSidebar from "@/components/GlobalSidebar";
import Loader from "@/components/Loader";
import ActiveOrderWidget from "@/components/ActiveOrderWidget";
import SupportFab from "@/components/SupportFab";
import BottomNav from "@/components/BottomNav";
import BottomActionBar from "@/components/BottomActionBar";
import MaintenanceOverlay from "@/components/MaintenanceOverlay";
import KitchenClosedBanner from "@/components/KitchenClosedBanner";
import WaitlistOverlay from "@/components/WaitlistOverlay";
import MusicPlayer from "@/components/MusicPlayer";
import PwaInstallBanner from "@/components/PwaInstallBanner";
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
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ONNDAWAY" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#01235F" />
      </head>
      <body>
        <AppProvider>
          <MaintenanceOverlay />
          <WaitlistOverlay />
          <KitchenClosedBanner />
          <Loader />
          <Navbar />
          <div className="app-with-sidebar">
            <GlobalSidebar />
            <main className="app-content-slot" style={{ minHeight: "100vh", paddingBottom: "env(safe-area-inset-bottom)" }}>
              {children}
            </main>
          </div>
          <BottomNav />
          <BottomActionBar />
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
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
        </AppProvider>
        <PwaInstallBanner />
        <MusicPlayer />
        <Analytics />
      </body>
    </html>
  );
}
