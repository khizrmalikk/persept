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
  title: "Persept — Software Innovation Lab",
  description:
    "Persept is a software innovation lab. We turn real-world problems into products worth shipping — from GYST (job applications on autopilot) to AI workforces and applied-data tooling.",
  metadataBase: new URL("https://persept.ai"),
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "theme-color": "#f4f2ec",
    "color-scheme": "light",
  },
  openGraph: {
    title: "Persept — Software Innovation Lab",
    description:
      "We turn real-world problems into products worth shipping. A software innovation lab building GYST, AI workforces, and applied-data tooling.",
    url: "https://persept.ai",
    siteName: "Persept Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "Persept — Software Innovation Lab",
    description: "We turn real-world problems into products worth shipping.",
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
