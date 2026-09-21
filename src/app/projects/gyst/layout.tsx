import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GYST — the whole job search, one guided path",
  description:
    "GYST is Persept's job-search product: search every board, tailor a screening-ready CV to each role, find people who can refer you, and track it all on one board. £9.99/mo, 7-day trial.",
  alternates: { canonical: "/projects/gyst" },
  openGraph: {
    title: "GYST — the whole job search, one guided path",
    description:
      "Search every board, tailor a screening-ready CV to each role, reach people who can refer you, and track it all on one board. A Persept product. £9.99/mo.",
    url: "https://persept.ai/projects/gyst",
    type: "website",
  },
  twitter: {
    title: "GYST — the whole job search, one guided path",
    description:
      "Search every board, tailor a screening-ready CV to each role, and track it on one board. A Persept product.",
  },
};

const SITE_URL = "https://persept.ai";

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GYST",
  description:
    "A guided job-search product: multi-board AI search, screening-ready CVs and cover letters tailored to each role, an application assistant, a referral finder, and an automatic Kanban board.",
  url: "https://startgyst.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  publisher: { "@id": `${SITE_URL}/#organization` },
  offers: {
    "@type": "Offer",
    price: "9.99",
    priceCurrency: "GBP",
    description: "£9.99/mo with a 7-day free trial.",
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
      name: "GYST",
      item: `${SITE_URL}/projects/gyst`,
    },
  ],
};

export default function GystLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
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
