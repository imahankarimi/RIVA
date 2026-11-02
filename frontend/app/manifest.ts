import type { MetadataRoute } from "next";

/**
 * RIVA Main — PWA manifest.
 *
 * Keep identical in shape to `webapp/app/manifest.ts`; only `start_url`
 * differs because the two apps have different entry routes (`/overview` vs
 * `/home`). Colours are the brand's Warm White (#F7F7F3) taken from
 * `design-system/tokens.css`; the manifest cannot read CSS variables, so this
 * is the one place the brand value is written out literally.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RIVA",
    short_name: "RIVA",
    description:
      "AI-powered accounting and financial intelligence for businesses.",
    start_url: "/overview",
    scope: "/",
    display: "standalone",
    background_color: "#F7F7F3",
    theme_color: "#F7F7F3",
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}