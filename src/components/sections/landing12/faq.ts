// Landing FAQ copy, shared between the client UI (Landing12) and the server
// page (page.tsx) so the on-page questions and the FAQPage JSON-LD never drift.
// Tuple shape: [question, answer].
export const FAQ: [string, string][] = [
  [
    "What exactly is an AI Workforce?",
    "A small team of AI agents, each with one job, built for your business and connected to your tools. They do the research, drafting and follow-ups. You approve what goes out.",
  ],
  [
    "Will it work for my business?",
    "If your team repeats the same work every week, very likely. On the first call we pick one workflow and tell you honestly whether it fits.",
  ],
  [
    "Do I need new software?",
    "No. It works with Gmail or Outlook, WhatsApp, Google Sheets, and Zoho or HubSpot if you already use them. You get one dashboard and a phone app for approvals.",
  ],
  [
    "What will the agents never do?",
    "Send, publish or pay without your approval, invent a price, or phone anyone. Calls are yours.",
  ],
  [
    "Who owns the data?",
    "You do. Export it any time. We delete our copy within 30 days of the contract ending.",
  ],
  [
    "How fast can we start?",
    "Your first workflow is usually live within 7 days of the first call.",
  ],
];
