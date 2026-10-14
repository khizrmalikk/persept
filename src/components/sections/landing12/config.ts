// Real config for the v12 landing — the design's bracketed placeholders
// ([business number], [AED …], proof stats) resolved to the values the current
// site already uses. WhatsApp + LinkedIn reuse the shared chrome exports so there
// is one source of truth across the marketing pages.
export { LINKEDIN_HREF, WHATSAPP_HREF } from "../pl-chrome";

export const EMAIL = "khizr@persept.ai";
export const EMAIL_HREF = "mailto:khizr@persept.ai?subject=AI%20Workforce";
export const GYST_HREF = "/projects/gyst";

// pricing — the four-tier menu (all AED). Founding is the limited, featured rate.
export type Tier = {
  name: string;
  tag?: string; // small chip next to the name
  featured?: boolean; // Founding — accent border
  guarantee?: boolean; // 30-day setup-refund guarantee applies
  gets: string; // "what they get"
  setup: string; // full display string incl. "from"
  monthly: string;
  term: string;
  live: string;
};

export const TIERS: Tier[] = [
  {
    name: "Founding",
    tag: "first 3 only",
    featured: true,
    guarantee: true,
    gets: "1 agent: lead response",
    setup: "AED 2,500",
    monthly: "AED 1,250",
    term: "3 months",
    live: "5 days",
  },
  {
    name: "Starter",
    guarantee: true,
    gets: "1 agent: lead response",
    setup: "AED 5,000",
    monthly: "AED 1,800",
    term: "3 months",
    live: "5 days",
  },
  {
    name: "Growth",
    gets: "3 agents: lead response, follow-up, weekly report",
    setup: "AED 12,000",
    monthly: "AED 4,000",
    term: "6 months",
    live: "2 weeks",
  },
  {
    name: "Workforce",
    gets: "5+ agents, custom to your operations",
    setup: "from AED 25,000",
    monthly: "from AED 7,500",
    term: "12 months",
    live: "4–6 weeks",
  },
];

// the standing entry monthly (Starter) — used for the comparison "cost" row
export const PRICE_FROM_MONTHLY = "AED 1,800";

// "Persept runs on Persept" proof stats (from the current landing)
export const PROOF = {
  companies: "1,284",
  month: "September",
  emails: "418",
  proposals: "23",
} as const;

// founder — photo still a slot (none supplied yet)
export const FOUNDER = {
  name: "Khizr Malik",
  photo: null as string | null,
} as const;
