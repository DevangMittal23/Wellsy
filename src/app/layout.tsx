import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WELLSY — Where conversations feel alive",
    template: "%s | WELLSY",
  },
  description:
    "A modern social platform where conversations feel alive. Connect, share, and experience premium social interactions.",
  keywords: [
    "social media",
    "messenger",
    "chat",
    "connect",
    "wellsy",
    "social platform",
  ],
  authors: [{ name: "WELLSY" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "WELLSY",
    title: "WELLSY — Where conversations feel alive",
    description:
      "A modern social platform where conversations feel alive.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WELLSY",
    description:
      "A modern social platform where conversations feel alive.",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
