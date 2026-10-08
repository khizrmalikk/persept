import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow building to an alternate output dir (NEXT_DIST_DIR) so a production
  // build can run without clobbering a live `npm run dev` .next. Defaults to .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // pdf-parse / mammoth run only server-side (knowledge text extraction). Keep them
  // external so their optional/test assets aren't traced into the bundle.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
