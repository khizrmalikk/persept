import assert from "node:assert/strict";
import { test } from "node:test";
import { type BlockPart, blockMeta, parseBlocks } from "./blocks";

// Run with a TS-aware runner, e.g. Node 22+:  node --test --experimental-strip-types
// src/lib/workforce/blocks.test.ts  (the repo's Node 20 can't strip types).

const blocks = (text: string): BlockPart[] =>
  parseBlocks(text).parts.filter((p): p is BlockPart => p.kind === "block");

// ── the samples the brief names: two COPY REQUESTs + a LEAD ───────────────────

const TWO_COPY_REQUESTS = [
  "here are the two posts Hunter asked for.",
  "",
  "COPY REQUEST",
  "kind: linkedin-post",
  "channel: linkedin",
  "company: Acme Co",
  "contact: Jo Bloggs",
  "campaign: holiday-homes-dubai",
  "context: they just launched a new booking site;",
  "the angle is the hours it saves their ops team.",
  "",
  "COPY REQUEST",
  "kind: linkedin-post",
  "channel: linkedin",
  "company: Beta Ltd",
  "campaign: spring",
  "context: warm — they asked about pricing last week.",
].join("\n");

const LEAD_MESSAGE = [
  "found one worth a look this week.",
  "",
  "LEAD",
  "company: Gamma Group",
  "website: gamma.ae",
  "contact: sam@gamma.ae",
  "channel: email",
  "size: 20-50",
  "angle: scaling ops, posted 3 new roles this month",
  "evidence: careers page lists 3 ops hires",
  "source: linkedin",
  "campaign: spring",
].join("\n");

test("parses two stacked COPY REQUESTs with multi-line context", () => {
  const bs = blocks(TWO_COPY_REQUESTS);
  assert.equal(bs.length, 2);
  assert.equal(bs[0].type, "COPY REQUEST");
  assert.equal(bs[0].fields.company, "Acme Co");
  assert.equal(bs[0].fields.kind, "linkedin-post");
  // context spans two source lines → joined
  assert.equal(
    bs[0].fields.context,
    "they just launched a new booking site;\nthe angle is the hours it saves their ops team.",
  );
  assert.equal(bs[1].fields.company, "Beta Ltd");
  // leading prose is its own text part
  const first = parseBlocks(TWO_COPY_REQUESTS).parts[0];
  assert.equal(first.kind, "text");

  const meta = blockMeta(bs[0]);
  assert.equal(meta.target, "scribe");
  assert.equal(meta.title, "linkedin-post · Acme Co");
});

test("parses a LEAD with every documented field", () => {
  const bs = blocks(LEAD_MESSAGE);
  assert.equal(bs.length, 1);
  assert.equal(bs[0].type, "LEAD");
  assert.equal(bs[0].op, "");
  assert.equal(bs[0].fields.company, "Gamma Group");
  assert.equal(bs[0].fields.website, "gamma.ae");
  assert.equal(bs[0].fields.size, "20-50");
  assert.equal(bs[0].fields.source, "linkedin");
  const meta = blockMeta(bs[0]);
  assert.equal(meta.target, "hunter");
  assert.equal(meta.title, "Gamma Group");
});

// ── header op forms ───────────────────────────────────────────────────────────

test("LEAD accept|dismiss|leave carries the op and id", () => {
  const bs = blocks("LEAD dismiss #42\nreason: already a client");
  assert.equal(bs[0].op, "dismiss");
  assert.equal(bs[0].fields.id, "42");
  assert.equal(bs[0].fields.reason, "already a client");
  assert.equal(blockMeta(bs[0]).title, "dismiss lead #42");
});

test("BACKLOG add with an inline id and body fields", () => {
  const bs = blocks(
    [
      "BACKLOG add #a1b2",
      "title: wire up the metrics page",
      "owner: fixer",
      "priority: high",
      "detail: once tasks has a week of rows",
    ].join("\n"),
  );
  assert.equal(bs[0].type, "BACKLOG");
  assert.equal(bs[0].op, "add");
  assert.equal(bs[0].fields.id, "a1b2");
  assert.equal(bs[0].fields.title, "wire up the metrics page");
  assert.equal(blockMeta(bs[0]).target, "fixer");
});

test("APPROVAL REQUEST targets you (amber) with the action as title", () => {
  const bs = blocks(
    [
      "APPROVAL REQUEST",
      "action: send the pricing email to Acme Co",
      "why: they asked twice",
      "draft: Hi Jo, here's the pricing…",
      "risk: low",
    ].join("\n"),
  );
  assert.equal(bs[0].type, "APPROVAL REQUEST");
  const meta = blockMeta(bs[0]);
  assert.equal(meta.target, "you");
  assert.equal(meta.title, "send the pricing email to Acme Co");
});

test("TASK <id>: <title> captures the rest as detail", () => {
  const bs = blocks(
    [
      "TASK 91: draft the Acme post",
      "use the warm angle,",
      "keep it short",
    ].join("\n"),
  );
  assert.equal(bs[0].type, "TASK");
  assert.equal(bs[0].fields.id, "91");
  assert.equal(bs[0].fields.title, "draft the Acme post");
  assert.equal(bs[0].fields.detail, "use the warm angle,\nkeep it short");
});

test("RUN PR_OPEN for fix … parses status, id and quoted title", () => {
  const bs = blocks(
    'RUN PR_OPEN for fix f12: "fix the webhook retry"\nopened pr #34',
  );
  assert.equal(bs[0].type, "RUN");
  assert.equal(bs[0].op, "PR_OPEN");
  assert.equal(bs[0].fields.id, "f12");
  assert.equal(bs[0].fields.title, "fix the webhook retry");
  assert.equal(bs[0].fields.body, "opened pr #34");
});

// ── system lines and text ─────────────────────────────────────────────────────

test("system summary lines become system parts, not blocks", () => {
  const r = parseBlocks(
    [
      "5 COPY REQUESTS from scribe",
      "SENT (email) to Acme Co",
      "PUBLISHED the launch post",
      "APPROVAL DECISION for request #7: approved",
      "CONFIG result: hunter now on routine",
      "[image attached: logo.png]",
    ].join("\n"),
  );
  assert.equal(r.parts.length, 6);
  assert.ok(r.parts.every((p) => p.kind === "system"));
});

test("a bare CONFIG header is a block, but 'CONFIG result:' is a system line", () => {
  const block = blocks("CONFIG\nagent: hunter\nmodel: cheap\nwhy: save spend");
  assert.equal(block.length, 1);
  assert.equal(block[0].type, "CONFIG");
  assert.equal(block[0].fields.agent, "hunter");
  const sys = parseBlocks("CONFIG result: applied").parts;
  assert.equal(sys[0].kind, "system");
});

test("unknown all-caps headers stay as text", () => {
  const r = parseBlocks("WIDGET REPORT\nnothing structured here");
  assert.equal(r.parts.length, 1);
  assert.equal(r.parts[0].kind, "text");
});

test("plain prose with no blocks → one text part", () => {
  const r = parseBlocks("just a normal reply, nothing to see.");
  assert.equal(r.parts.length, 1);
  assert.equal(r.parts[0].kind, "text");
});

test("raw holds the exact source of the block", () => {
  const bs = blocks("LEAD\ncompany: Gamma Group\nsource: linkedin");
  assert.equal(bs[0].raw, "LEAD\ncompany: Gamma Group\nsource: linkedin");
});

// ── never throws on malformed input ───────────────────────────────────────────

test("never throws on malformed, empty or odd input", () => {
  const inputs: unknown[] = [
    "",
    "\n\n\n",
    "COPY REQUEST",
    "COPY REQUEST\n:",
    "LEAD #\nreason:",
    "BACKLOG add\n\n\n",
    "RUN PR_OPEN for fix",
    'RUN PR_OPEN for fix f1: "unterminated',
    "::::\n::::",
    // biome-ignore lint/suspicious/noExplicitAny: deliberately feeding wrong types
    null as any,
    // biome-ignore lint/suspicious/noExplicitAny: deliberately feeding wrong types
    undefined as any,
    // biome-ignore lint/suspicious/noExplicitAny: deliberately feeding wrong types
    { not: "a string" } as any,
  ];
  for (const inp of inputs) {
    assert.doesNotThrow(() => {
      const r = parseBlocks(inp as string);
      assert.ok(Array.isArray(r.parts));
    });
  }
});
