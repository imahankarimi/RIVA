import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Inter, JetBrains_Mono, Manrope, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { LiquidLensInstaller } from "./LiquidLensInstaller";

/**
 * RIVA Main — font stack.
 *
 * Matches RIVA Web (`webapp/app/layout.tsx`) exactly so the two apps cannot
 * drift typographically. `app/globals.css` maps these CSS variables onto
 * `--font-ui` / `--font-ui-display` based on `html[data-locale]`, which is why
 * components can simply use `font-sans` / `font-display` and stay correct in
 * both Persian and English. See docs/DESIGN_SYSTEM.md → Typography.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap"
});
// Retained so any component still referencing the legacy variable keeps
// resolving to a real face instead of an empty string.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "RIVA — talk to your books",
  description: "An AI accounting assistant for small business owners.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Mobile viewport. `viewportFit: "cover"` lets content extend under the notch
 * and home indicator so the floating navigation can sit flush with the bottom
 * edge; every fixed element is then responsible for its own
 * `env(safe-area-inset-*)` padding. Do not remove it without re-checking the
 * safe-area padding on MobileNav and the chat composer.
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
      data-locale="en"
      suppressHydrationWarning
    >
      <head>
        {/* Sets .dark on <html> before paint so there's no light->dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} ${vazirmatn.variable} ${ibmPlexSans.variable} font-sans`}>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
        <LiquidLensInstaller />
      </body>
    </html>
  );
}