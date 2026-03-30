import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegistrar from "@/src/components/PwaRegistrar/PwaRegistrar";

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
        {/* PWA / ajout à l'écran d'accueil */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/Logo-triply.svg" />
      </head>
      <body className="antialiased overflow-x-hidden min-h-dvh">
        <PwaRegistrar />
        <main className="flex min-h-dvh flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
