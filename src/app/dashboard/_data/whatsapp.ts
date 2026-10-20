// Build a wa.me deep link for a whatsapp approval. Pure and client-safe (no
// server imports), so both the desktop Approvals window and the mobile queue can
// use it. The recipient is "Name <number>" or a bare number, so take what's in
// the angle brackets (else the whole string) and reduce to digits only — the
// form wa.me wants (country code, no +, spaces or dashes) — then prefill the
// drafted message. Returns null when there's no usable number, so callers can
// hide the button rather than open a broken link.
export function waHref(to: string | undefined, body: string): string | null {
  if (!to) return null;
  const inAngle = to.match(/<([^>]+)>/);
  const digits = (inAngle ? inAngle[1] : to).replace(/\D/g, "");
  if (digits.length < 7) return null;
  const base = `https://wa.me/${digits}`;
  return body ? `${base}?text=${encodeURIComponent(body)}` : base;
}
