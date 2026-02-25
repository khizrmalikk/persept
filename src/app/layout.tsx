import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import localFont from "next/font/local";
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
  title: "Persept AI Workforce Solutions — AI Agents for Dubai Hospitality",
  description:
    "Save 15-20 hours per week with AI agents that handle guest communications, review management, scheduling, and reporting for Dubai hotels and restaurants.",
  metadataBase: new URL("https://persept.ai"),
  icons: {
    icon: "/logo_persept_red.png",
    shortcut: "/logo_persept_red.png",
    apple: "/logo_persept_red.png",
  },
  openGraph: {
    title: "Persept AI Workforce Solutions — AI Agents for Dubai Hospitality",
    description:
      "Save 15-20 hours per week with AI agents that handle guest communications, review management, scheduling, and reporting.",
    url: "https://persept.ai",
    siteName: "Persept AI Workforce Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Persept AI Workforce Solutions — AI Agents for Dubai Hospitality",
    description:
      "Save 15-20 hours per week with AI agents for guest communications, review management, scheduling, and reporting.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://assets.calendly.com/assets/external/widget.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${neueHaasDisplay.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
