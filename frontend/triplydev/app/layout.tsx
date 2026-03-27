import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triply - Planification de voyage",
  description: "Planifiez vos voyages facilement",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <head>
        <link rel="preload" href="/fonts/Chillax-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Book.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Medium.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Bold.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body className="antialiased overflow-x-hidden min-h-dvh">
        <main className="flex min-h-dvh flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
