import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
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

const SITE_URL = "https://persept.ai";
const DEFAULT_TITLE = "Persept — AI Workforce Studio in Dubai";
const DEFAULT_DESCRIPTION =
  "Persept is a Dubai AI workforce studio. We build agent teams that run real operations 24/7 — sold as a staffed outcome, not a tool — and ship our own product, GYST.";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s · Persept",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: "Persept",
  keywords: [
    "AI workforce",
    "AI agents",
    "Dubai software studio",
    "hospitality AI",
    "hotel AI workforce",
    "AI operations",
    "GYST",
    "agent workforce",
  ],
  authors: [{ name: "Persept", url: SITE_URL }],
  creator: "Persept",
  publisher: "Persept",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "theme-color": "#f7f2ea",
    "color-scheme": "light",
  },
  openGraph: {
    type: "website",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: "Persept",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description:
      "A Dubai AI workforce studio. Agent teams that run real operations 24/7, plus our own product, GYST.",
    creator: "@persept",
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Persept",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description: DEFAULT_DESCRIPTION,
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
  },
  email: "hello@persept.ai",
  sameAs: ["https://www.linkedin.com/company/persept", "https://x.com/persept"],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Persept",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
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
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        {children}
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
