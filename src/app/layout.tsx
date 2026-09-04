import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";
import GlobalSidebar from "@/components/GlobalSidebar";
import Loader from "@/components/Loader";
import dynamic from "next/dynamic";

const ActiveOrderWidget = dynamic(() => import("@/components/ActiveOrderWidget"));
const SupportFab = dynamic(() => import("@/components/SupportFab"));
const MaintenanceOverlay = dynamic(() => import("@/components/MaintenanceOverlay"));
const KitchenClosedBanner = dynamic(() => import("@/components/KitchenClosedBanner"));
const WaitlistOverlay = dynamic(() => import("@/components/WaitlistOverlay"));
const MusicPlayer = dynamic(() => import("@/components/MusicPlayer"));
const PwaInstallBanner = dynamic(() => import("@/components/PwaInstallBanner"));

import BottomNav from "@/components/BottomNav";
import BottomActionBar from "@/components/BottomActionBar";
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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" />
        <link rel="icon" href="/icon-512x512.png" type="image/png" />
        <meta name="mobile-web-app-capable" content="yes" />
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
          <MusicPlayer />
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
                // Auto-reload once on ChunkLoadError caused by stale SW cache
                function handleChunkError(msg) {
                  if (msg && (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Failed to load chunk') !== -1)) {
                    var key = '__chunk_reload__';
                    if (!sessionStorage.getItem(key)) {
                      sessionStorage.setItem(key, '1');
                      window.location.reload();
                    }
                  }
                }
                window.addEventListener('error', function(e) {
                  handleChunkError(e && e.message);
                });
                window.addEventListener('unhandledrejection', function(e) {
                  var msg = e && e.reason && (e.reason.message || String(e.reason));
                  handleChunkError(msg);
                });
              `,
            }}
          />
        </AppProvider>
        <PwaInstallBanner />
        <Analytics />
      </body>
    </html>
  );
}
