import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotel AI Workforce — AI operations for hospitality",
  description:
    "An AI agent workforce that runs guest messaging, housekeeping dispatch and owner reporting 24/7 inside WhatsApp for Dubai's holiday-home operators. Priced per unit, humans in command.",
  alternates: { canonical: "/projects/hotel" },
  openGraph: {
    title: "Hotel AI Workforce — AI operations for property hospitality",
    description:
      "AI agents that run guest messaging, housekeeping dispatch and owner reporting 24/7 inside WhatsApp for Dubai holiday-home operators. Priced per unit.",
    url: "https://persept.ai/projects/hotel",
    type: "website",
  },
  twitter: {
    title: "Hotel AI Workforce — AI operations for hospitality",
    description:
      "AI agents that run guest messaging, dispatch and owner reporting 24/7 inside WhatsApp. Priced per unit.",
  },
};

const SITE_URL = "https://persept.ai";

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Hotel AI Workforce",
  serviceType: "AI operations for property hospitality",
  description:
    "An AI agent workforce that runs guest messaging, housekeeping dispatch and owner reporting 24/7 inside WhatsApp for holiday-home operators. A staffed outcome, priced per unit, with humans approving anything touching money, access or disputes.",
  url: `${SITE_URL}/projects/hotel`,
  category: "Hospitality operations",
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: {
    "@type": "Place",
    name: "Dubai, United Arab Emirates",
  },
  offers: {
    "@type": "Offer",
    priceCurrency: "AED",
    price: "2500",
    description: "Per unit tier, starting at AED 2,500/month.",
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Work",
      item: `${SITE_URL}/projects`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Hotel AI Workforce",
      item: `${SITE_URL}/projects/hotel`,
    },
  ],
};

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
