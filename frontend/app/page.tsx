import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

// Canonical public origin for metadata. Production must never resolve to the
// raw Vercel deployment host: the official main website is theriva.ir. Preview
// deployments keep their own deployment origin.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://theriva.ir"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const title = "RIVA — Beyond Accounting. Into Intelligence.";
const description =
  "RIVA is an AI-powered financial intelligence OS. It transforms business financial data into actionable intelligence — so you can understand your position, anticipate risk, and make better decisions.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "RIVA",
  keywords: [
    "financial intelligence",
    "AI accounting",
    "business finance",
    "financial analytics",
    "cash flow",
    "financial reporting",
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
