import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Tennis Tracker",
  description: "Track ping pong matches and rankings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
