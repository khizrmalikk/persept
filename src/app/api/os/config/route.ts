import { NextResponse } from "next/server";
import { fxToAed } from "@/lib/workforce/stripe";

// Static-ish OS config the client can read without a table. Currently just the
// bridge's Stripe FX rate (USD→AED). Server-side (no secret leaves here — the rate
// is not a secret); cached an hour. The tick also ships `stripe_fx_to_aed`, so most
// callers never need this; it exists for a standalone fetch.

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { stripe_fx_to_aed: fxToAed() },
    { headers: { "cache-control": "max-age=3600" } },
  );
}
