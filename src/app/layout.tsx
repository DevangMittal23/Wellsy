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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem("wellsy_appearance_theme") || "sleek";
                const storedAccent = localStorage.getItem("wellsy_appearance_accent") || "purple";
                
                const themes = {
                  sleek: {
                    background: "hsl(240 10% 3.9%)",
                    secondary: "hsl(240 6% 6%)",
                    surface: "hsl(240 6% 10%)",
                    surfaceHover: "hsl(240 5% 14%)",
                    border: "hsl(240 4% 16%)"
                  },
                  amethyst: {
                    background: "hsl(264 25% 4.5%)",
                    secondary: "hsl(264 20% 7%)",
                    surface: "hsl(264 18% 11%)",
                    surfaceHover: "hsl(264 16% 15%)",
                    border: "hsl(264 15% 18%)"
                  },
                  midnight: {
                    background: "hsl(222 35% 4.5%)",
                    secondary: "hsl(222 28% 7%)",
                    surface: "hsl(222 24% 11%)",
                    surfaceHover: "hsl(222 20% 15%)",
                    border: "hsl(222 18% 18%)"
                  },
                  obsidian: {
                    background: "hsl(0 0% 0%)",
                    secondary: "hsl(0 0% 3%)",
                    surface: "hsl(0 0% 7%)",
                    surfaceHover: "hsl(0 0% 11%)",
                    border: "hsl(0 0% 14%)"
                  }
                };

                const accents = {
                  purple: { color: "hsl(263 70% 58%)", hover: "hsl(263 70% 65%)" },
                  pink: { color: "hsl(340 82% 52%)", hover: "hsl(340 82% 58%)" },
                  teal: { color: "hsl(187 90% 42%)", hover: "hsl(187 90% 48%)" },
                  green: { color: "hsl(142 70% 45%)", hover: "hsl(142 70% 50%)" },
                  amber: { color: "hsl(38 90% 50%)", hover: "hsl(38 90% 55%)" }
                };

                const root = document.documentElement;
                
                const theme = themes[storedTheme] || themes.sleek;
                root.style.setProperty("--color-background", theme.background);
                root.style.setProperty("--color-background-secondary", theme.secondary);
                root.style.setProperty("--color-surface", theme.surface);
                root.style.setProperty("--color-surface-hover", theme.surfaceHover);
                root.style.setProperty("--color-border", theme.border);

                const accent = accents[storedAccent] || accents.purple;
                root.style.setProperty("--color-accent", accent.color);
                root.style.setProperty("--color-accent-hover", accent.hover);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
