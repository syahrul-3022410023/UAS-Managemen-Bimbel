import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Bimble Smart",
  description: "Aplikasi manajemen Bimble Smart",
  icons: {
    icon: "/logo-bimbel.png",
    shortcut: "/logo-bimbel.png",
    apple: "/logo-bimbel.png",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
