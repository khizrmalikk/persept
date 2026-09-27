import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMarkdownTable } from "./markdown-table";

// Run with a TS-aware runner, e.g. Node 22+:  node --test --experimental-strip-types
// src/lib/workforce/markdown-table.test.ts  (the repo's Node 20 can't strip types).

// The current PROSPECTS.md header — note `campaign` now sits before `notes`.
const HEADER =
  "| company | contact | channel | address | priority | status | next_due | campaign | angle | notes |";
const SEP = "|---|---|---|---|---|---|---|---|---|---|";

test("reads columns from the header row and ignores a pipe-bearing legend above the table", () => {
  const md = [
    "# Hunter — prospects",
    "",
    "legend: status = new | approached | replied", // pipes, but NOT the table
    "",
    HEADER,
    SEP,
    "| Acme Co | Jo Bloggs | email | jo@acme.co | 1 | new | 2026-09-25 | holiday-homes-dubai | saw their new site | first touch |",
    "| Beta Ltd | Sam Lee | linkedin | sam@beta.io | 2 | replied | 2026-09-26 | spring | asked for pricing | warm |",
    "",
    "some trailing prose that is not part of the table",
  ].join("\n");

  const t = parseMarkdownTable(md);
  assert.deepEqual(t.columns, [
    "company",
    "contact",
    "channel",
    "address",
    "priority",
    "status",
    "next_due",
    "campaign",
    "angle",
    "notes",
  ]);
  assert.equal(t.rows.length, 2);
  assert.equal(t.rows[0].campaign, "holiday-homes-dubai");
  assert.equal(t.rows[0].notes, "first touch");
  assert.equal(t.rows[1].company, "Beta Ltd");
});

test("tolerates missing leading/trailing pipes and extra whitespace", () => {
  const md = [
    "company | contact | campaign | notes",
    "--- | --- | --- | ---",
    "  Acme   |  Jo  |  spring  |  hi there  ",
  ].join("\n");
  const t = parseMarkdownTable(md);
  assert.deepEqual(t.columns, ["company", "contact", "campaign", "notes"]);
  assert.equal(t.rows.length, 1);
  assert.equal(t.rows[0].company, "Acme");
  assert.equal(t.rows[0].notes, "hi there");
});

test("keeps escaped pipes inside a cell", () => {
  const md = [
    "| company | angle |",
    "| --- | --- |",
    "| Acme | a \\| b \\| c |",
  ].join("\n");
  const t = parseMarkdownTable(md);
  assert.equal(t.rows.length, 1);
  assert.equal(t.rows[0].angle, "a | b | c");
});

test("skips stray separator rows anywhere in the body", () => {
  const md = [
    "| company | status |",
    "| --- | --- |",
    "| Acme | new |",
    "| --- | --- |",
    "| Beta | replied |",
  ].join("\n");
  const t = parseMarkdownTable(md);
  assert.equal(t.rows.length, 2);
  assert.equal(t.rows[1].company, "Beta");
});

test("missing content → empty; prose without a table → empty", () => {
  assert.deepEqual(parseMarkdownTable(null), { columns: [], rows: [] });
  assert.deepEqual(parseMarkdownTable("just some prose, no table here"), {
    columns: [],
    rows: [],
  });
});
