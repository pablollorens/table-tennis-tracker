import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnalyticsProvider } from "./analytics-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Table Tennis Tracker",
  description: "Track ping pong matches and rankings",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ping Pong" />
      </head>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster />
        <HotToaster />
        <SpeedInsights />

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
