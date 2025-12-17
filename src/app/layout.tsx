import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const neueHaasDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/NeueHaasDisplayThin.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/NeueHaasDisplayLight.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/NeueHaasDisplayRoman.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/NeueHaasDisplayMediu.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/NeueHaasDisplayBold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neue-haas",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persept · Week-one prototypes, launch-ready builds",
  description:
    "Persept builds bold software and marketing in a week. Week-one prototypes, launch-ready products, and creative under one roof.",
  metadataBase: new URL("https://persept.ai"),
  icons: {
    icon: "/logo_persept_red.png",
    shortcut: "/logo_persept_red.png",
    apple: "/logo_persept_red.png",
  },
  openGraph: {
    title: "Persept · Week-one prototypes, launch-ready builds",
    description:
      "We ship working prototypes in 7 days, production builds, and launch creative so you can reach users fast.",
    url: "https://persept.ai",
    siteName: "Persept",
  },
  twitter: {
    card: "summary_large_image",
    title: "Persept · Week-one prototypes, launch-ready builds",
    description:
      "Week-one prototypes, production builds, and launch creative to reach users fast.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${neueHaasDisplay.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
