import type { Metadata, Viewport } from "next";
import { Inter, Manrope, JetBrains_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { LiquidLensInstaller } from "./LiquidLensInstaller";

/**
 * RIVA Web — font stack.
 *
 * `--font-ui` / `--font-ui-display` are assigned in `app/globals.css` based on
 * `html[data-locale]`, so `font-sans` and `font-display` are correct in both
 * Persian and English without any component hardcoding a family. Keep this list
 * identical to `frontend/app/layout.tsx`. See docs/DESIGN_SYSTEM.md → Typography.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn", display: "swap" });

export const metadata: Metadata = {
  title: "RIVA Web",
  description: "RIVA — talk to your books",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Mobile viewport. `viewportFit: "cover"` lets content extend under the notch
 * and home indicator so the floating Liquid Glass navigation can sit flush with
 * the bottom edge; every fixed element is then responsible for its own
 * `env(safe-area-inset-*)` padding (see `MobileTabBar` and `ChatInput`).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F7F7F3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${mono.variable} ${vazirmatn.variable}`}
    >
      <head>
        {/* Sets .dark on <html> before paint so there's no light->dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
        <LiquidLensInstaller />
      </body>
    </html>
  );
}