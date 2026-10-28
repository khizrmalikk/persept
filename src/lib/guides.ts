// The guides registry. One entry per article; `published` gates whether it
// appears in the /guides index and the sitemap. Adding a new guide = add an
// entry here and create src/app/guides/<slug>/{layout,page}.tsx.
// Keep this a plain data module (no server imports) so the sitemap, the index
// page and each article can all read it. See docs/SEO-CONTENT-PLAN.md.

export const SITE_URL = "https://persept.ai";

export type Guide = {
  slug: string;
  /** Card title + H1 source. */
  title: string;
  /** <title> tag — keep ≤ 60 chars. */
  metaTitle: string;
  /** Meta description — keep ≈ 150–160 chars. */
  description: string;
  /** One-line blurb for the index card. */
  excerpt: string;
  /** Small category tag shown above the card title. */
  eyebrow: string;
  /** Display date, e.g. "22 October 2026". */
  updated: string;
  /** Rough read time in minutes, for the article meta line. */
  readMinutes: number;
  /** Sitemap priority. */
  priority: number;
  published: boolean;
};

export const GUIDES: Guide[] = [
  {
    slug: "ai-workforce-dubai",
    title: "An AI workforce for Dubai businesses, explained plainly",
    metaTitle: "AI Workforce for Dubai Businesses: The 2026 Guide",
    description:
      "What an AI workforce actually is, what it costs, and where it fits a Dubai business. Named agents that draft the repetitive work — a person still presses send.",
    excerpt:
      "What an AI workforce actually is, the six jobs it does, what it costs, and the one rule that keeps it safe for a Dubai business.",
    eyebrow: "The guide",
    updated: "22 October 2026",
    readMinutes: 10,
    priority: 0.8,
    published: true,
  },
  {
    slug: "ai-guest-communication-dubai-hotels",
    title: "AI guest communication for Dubai hotels and holiday homes",
    metaTitle: "AI Guest Messaging for Dubai Hotels & Homes",
    description:
      "Answer guests in seconds on WhatsApp, chase reviews, and cut front-desk load — without a bot going rogue. How AI guest comms works for UAE properties.",
    excerpt:
      "WhatsApp replies in seconds, reviews handled, front desk lighter — with a person still on anything sensitive.",
    eyebrow: "Hospitality",
    updated: "",
    readMinutes: 8,
    priority: 0.7,
    published: false,
  },
  {
    slug: "ai-automation-cost-dubai",
    title: "What AI automation actually costs a Dubai SME in 2026",
    metaTitle: "What AI Automation Costs a Dubai SME in 2026",
    description:
      "A plain breakdown of what AI automation really costs a Dubai SME — setup, monthly, and what you save versus a new hire. Real AED numbers, no sales fog.",
    excerpt:
      "The honest AED ranges: setup, monthly, and what you save versus a new hire. No sales fog.",
    eyebrow: "Pricing",
    updated: "",
    readMinutes: 7,
    priority: 0.7,
    published: false,
  },
  {
    slug: "human-in-the-loop-ai-agents",
    title: "Human-in-the-loop AI: why a person should still press send",
    metaTitle: "Human-in-the-Loop AI: Why a Person Presses Send",
    description:
      "Autonomous agents are fast until they send the wrong thing. The case for AI that drafts and prepares while a human approves anything touching money or customers.",
    excerpt:
      "Autonomy earned per action, not granted per agent. Why the approval step makes AI faster, not slower.",
    eyebrow: "Point of view",
    updated: "",
    readMinutes: 8,
    priority: 0.7,
    published: false,
  },
  {
    slug: "ai-for-real-estate-dubai",
    title: "AI agents for Dubai real estate: from lead to closing",
    metaTitle: "AI Agents for Dubai Real Estate: Leads to Closings",
    description:
      "How Dubai agencies use AI agents to qualify leads, keep listings current, and follow up fast — while brokers keep every client call. A practical playbook.",
    excerpt:
      "Qualify leads the moment they land, keep listings current, follow up fast — brokers keep every call.",
    eyebrow: "Real estate",
    updated: "",
    readMinutes: 8,
    priority: 0.7,
    published: false,
  },
  {
    slug: "ai-employee-vs-hiring-dubai",
    title: "AI employees vs hiring in Dubai: the real math",
    metaTitle: "AI Employees vs Hiring in Dubai: The Real Math",
    description:
      "Visa, salary, and desk vs a per-month AI workforce. What a Dubai business actually spends and saves with AI agents instead of another admin hire.",
    excerpt:
      "Salary plus visa plus desk versus a per-month workforce. The side-by-side, done honestly.",
    eyebrow: "Comparison",
    updated: "",
    readMinutes: 6,
    priority: 0.7,
    published: false,
  },
];

export function publishedGuides(): Guide[] {
  return GUIDES.filter((g) => g.published);
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
