import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";

/**
 * RIVA — font stack.
 *
 * `--font-ui` / `--font-ui-display` are assigned in `app/globals.css` based on
 * `html[data-locale]`, so `font-sans` and `font-display` are correct in both
 * Persian and English without any component hardcoding a family.
 *
 * Vazirmatn is loaded via CSS @font-face from the app's own /fonts directory
 * (app/vazirmatn.css). JetBrains Mono backs the preset's `font-mono` stack
 * (var(--font-mono)) used by money figures, code blocks and kbd hints.
 */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Sets .dark on <html> before paint so there's no light->dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body
          className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans`}
        >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}