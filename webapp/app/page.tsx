import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

// Canonical public origin for metadata. Production must never resolve to the
// raw Vercel deployment host: the official web app is app.theriva.ir. Preview
// deployments keep their own deployment origin.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://app.theriva.ir"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001");

const title = "RIVA Web — Beyond Accounting. Into Intelligence.";
const description =
  "RIVA Web brings AI-powered financial intelligence to your phone. Record transactions by conversation, see your live financial position, and ask questions grounded in your books.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "RIVA Web",
  keywords: [
    "financial intelligence",
    "AI accounting app",
    "mobile finance",
    "business finance",
    "financial analytics",
    "cash flow",
    "RIVA",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RIVA",
    title,
    description,
    url: "/",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "RIVA",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icons/icon-512.png"],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <LandingPage />;
}
