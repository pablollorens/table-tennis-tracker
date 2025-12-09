import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnalyticsProvider } from "./analytics-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Office Pong - Track Matches & Rankings",
  description: "Track your office ping pong matches, view ELO rankings, and analyze your game statistics. The ultimate table tennis tracker for competitive office play.",
  keywords: ["ping pong", "table tennis", "office games", "ELO ranking", "match tracker", "sports tracker"],
  authors: [{ name: "Office Pong Team" }],
  creator: "Office Pong",
  publisher: "Office Pong",
  metadataBase: new URL("https://table-tennis-tracker.web.app"),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://table-tennis-tracker.web.app',
    siteName: 'Office Pong',
    title: 'Office Pong - Track Matches & Rankings',
    description: 'Track your office ping pong matches, view ELO rankings, and analyze your game statistics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Office Pong - Table Tennis Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Office Pong - Track Matches & Rankings',
    description: 'Track your office ping pong matches, view ELO rankings, and analyze your game statistics.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Office Pong',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster />
        <HotToaster />
        <SpeedInsights />
        <Analytics />

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
              .then((registration) => {
                console.log('Service Worker registered:', registration);
              })
              .catch((error) => {
                console.error('Service Worker registration failed:', error);
              });
          }
        `}
        </Script>
      </body>
    </html>
  );
}
