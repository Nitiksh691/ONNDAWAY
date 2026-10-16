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
const LaunchingSoonOverlay = dynamic(() => import("@/components/LaunchingSoonOverlay"));

import BottomNav from "@/components/BottomNav";
import BottomActionBar from "@/components/BottomActionBar";
import ScrollHideBars from "@/components/ScrollHideBars";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://onndaway.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Onn Da Way | Onndaway Coffee & Campus Food Delivery at DTU",
    template: "%s | Onn Da Way",
  },
  description:
    "Onn Da Way (Onndaway) – Order delicious cold brews, artisan coffee, snacks, and meals delivered to your spot at DTU (Delhi Technological University) in minutes. The official onn the way coffee & campus delivery app.",
  applicationName: "Onn Da Way",
  authors: [{ name: "Onn Da Way Team", url: siteUrl }],
  generator: "Next.js",
  keywords: [
    // Core brand queries requested by user
    "onndaway",
    "onn da way",
    "onn the way",
    "onndaway coffee",
    "onn the way coffee",
    "onn da way coffee",
    "onndaway dtu",
    "onn da way dtu",
    "onn the way dtu",
    "onndaway campus delivery",
    "onndaway online order",
    "onndaway menu",
    "onndaway food",
    // DTU & Campus Specific
    "dtu food delivery",
    "dtu coffee",
    "dtu cold brew",
    "delhi technological university food delivery",
    "delhi technological university coffee",
    "food delivery in dtu campus",
    "best coffee at dtu",
    "dtu canteen online",
    "dtu late night food",
    // Food & Category terms
    "campus food delivery",
    "cold brew coffee delivery",
    "iced coffee online",
    "student food app",
    "college food delivery",
    "quick bites college",
  ],
  creator: "Onn Da Way",
  publisher: "Onn Da Way",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Onn Da Way – Onndaway Coffee & Fast Campus Food Delivery at DTU",
    description:
      "Order fresh cold brews, artisan coffee, snacks, and meals delivered right to your campus spot at DTU in minutes. Onn Da Way, always.",
    url: siteUrl,
    siteName: "Onn Da Way (Onndaway)",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Onn Da Way - Onndaway Coffee & Campus Food Delivery",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Onn Da Way – Onndaway Coffee & Campus Food Delivery at DTU",
    description:
      "Cold brews, iced coffee, snacks & meals delivered to your campus spot at DTU in minutes. Onn Da Way, always.",
    images: ["/icon-512x512.png"],
    creator: "@onndaway",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "food & beverage",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512x512.png",
    apple: "/icon-512x512.png",
  },
};

const jsonLdData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "name": "Onn Da Way",
    "alternateName": [
      "onndaway",
      "onn da way",
      "onn the way",
      "onndaway coffee",
      "onn the way coffee",
      "onndaway dtu",
      "onn da way dtu",
      "onn the way dtu",
      "onndaway food",
      "onndaway app"
    ],
    "url": siteUrl,
    "description": "Onn Da Way (Onndaway) – Best fresh cold brews, artisan coffee, snacks, and meals delivered to your campus spot at DTU in minutes.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${siteUrl}/#restaurant`,
    "name": "Onn Da Way – Onndaway Coffee & Campus Food Delivery",
    "alternateName": [
      "Onndaway Coffee",
      "Onn The Way Coffee",
      "Onndaway DTU",
      "Onn Da Way DTU",
      "Onn The Way DTU"
    ],
    "url": siteUrl,
    "logo": `${siteUrl}/icon-512x512.png`,
    "image": `${siteUrl}/icon-512x512.png`,
    "description": "Artisanal cold brews, handcrafted coffee, burgers, rolls, and quick snacks delivered across Delhi Technological University (DTU) campus in minutes.",
    "servesCuisine": ["Coffee", "Cold Brews", "Snacks", "Fast Food", "Beverages"],
    "priceRange": "₹₹",
    "currenciesAccepted": "INR",
    "paymentAccepted": "Cash, Credit Card, UPI, Razorpay",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Delhi Technological University (DTU), Shahbad Daulatpur, Main Bawana Road",
      "addressLocality": "Delhi",
      "addressRegion": "Delhi",
      "postalCode": "110042",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.7499,
      "longitude": 77.1170
    },
    "hasMenu": `${siteUrl}/menu`
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": "Onn Da Way",
    "alternateName": [
      "onndaway",
      "onn the way",
      "onndaway coffee",
      "onndaway dtu"
    ],
    "url": siteUrl,
    "logo": `${siteUrl}/icon-512x512.png`
  }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" />
        <link rel="icon" href="/icon-512x512.png" type="image/png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ONNDAWAY" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0135FB" />
        <meta name="geo.region" content="IN-DL" />
        <meta name="geo.placename" content="Delhi Technological University (DTU), Shahbad Daulatpur, Bawana, Delhi 110042" />
        <meta name="geo.position" content="28.7499;77.1170" />
        <meta name="ICBM" content="28.7499, 77.1170" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdData),
          }}
        />
      </head>
      <body>
        <AppProvider>
          <MaintenanceOverlay />
          <WaitlistOverlay />
          <LaunchingSoonOverlay />
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
          <ScrollHideBars />
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
