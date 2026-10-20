import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest; Next injects the <link rel="manifest">.
// Dark brand ground + the new Signal mark (android-chrome icons live in /public).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Persept",
    short_name: "Persept",
    icons: [
      { src: "/android-chrome-192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: "#0c0c0c",
    background_color: "#0c0c0c",
    display: "standalone",
  };
}
