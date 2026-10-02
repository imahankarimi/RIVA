import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RIVA",
    short_name: "RIVA",
    description:
      "AI-powered accounting and financial intelligence for businesses.",
    start_url: "/home",
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
