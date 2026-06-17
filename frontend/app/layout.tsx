import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaProvider } from "@/src/components/pwa/PwaProvider";

export const metadata: Metadata = {
  title: "Triply - Planification de voyage",
  description: "Planifiez vos voyages facilement",
  applicationName: "Triply",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Triply",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // Charte designer : cyan --primary #0096C7 (barre d'état / theme-color PWA).
  themeColor: "#0096C7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('triply-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}` }} />
        <link rel="preload" href="/fonts/Chillax-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Book.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Medium.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Gotham-Bold.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body className="antialiased overflow-x-hidden min-h-dvh">
        <PwaProvider />
        <main className="flex min-h-dvh flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
