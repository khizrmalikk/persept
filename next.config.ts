import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // pdf-parse / mammoth run only server-side (knowledge text extraction). Keep them
  // external so their optional/test assets aren't traced into the bundle.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
