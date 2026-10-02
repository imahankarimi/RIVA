import type { Metadata } from "next";
import { IBM_Plex_Sans, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/ThemeProvider";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap"
});
const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn", display: "swap" });

export const metadata: Metadata = {
  title: "RIVA — talk to your books",
  description: "An AI accounting assistant for small business owners.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-locale="en" suppressHydrationWarning>
      <head>
        {/* Sets .dark on <html> before paint so there's no light->dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body
          className={`${ibmPlexSans.variable} ${vazirmatn.variable} font-sans`}
        >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
