// Persept brand-asset generator.
//
// Regenerates everything under brand/ from the two mark paths + brand colours.
// The mark is two shapes (see brand/README.md):
//   slash — the tall parallelogram, amber #f2a93b
//   bar   — the top bar, cream #f4f1ec on dark, near-black #0e0d0c on light
//
// Run:
//   1. Archivo ExtraBold (OFL) must be visible to fontconfig for the wordmarks:
//        curl -fsSL https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/Archivo-ExtraBold.ttf -o /tmp/perseptfonts/Archivo-ExtraBold.ttf
//        (with a /tmp/perseptfonts/fonts.conf pointing <dir> at it)
//   2. FONTCONFIG_FILE=/tmp/perseptfonts/fonts.conf node brand/_generate.mjs
//
// Everything is vector-rendered, so it is crisp at every size.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = dirname(fileURLToPath(import.meta.url));
const out = (...p) => join(ROOT, ...p);

// ── The mark ──────────────────────────────────────────────────────────────────
const VB_W = 136.6;
const VB_H = 125.56;
const SLASH =
  "M27.37,119.56L96.19,1.97c.71-1.22,2.02-1.97,3.44-1.97h32.97c3.08,0,5,3.35,3.44,6l-69.05,117.59c-.72,1.22-2.02,1.97-3.44,1.97H30.81c-3.08,0-4.99-3.34-3.44-6Z";
const BAR =
  "M95.24,0H3.94C.67,0-1.17,3.76.83,6.34l19.74,25.49c.75.96,1.89,1.53,3.11,1.53h52.04";

const AMBER = "#f2a93b";
const CREAM = "#f4f1ec";
const INK = "#0e0d0c";

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const markPaths = (barFill) =>
  `<path d="${SLASH}" fill="${AMBER}"/><path d="${BAR}" fill="${barFill}"/>`;

// A standalone mark SVG at the natural aspect ratio (transparent).
const markSvg = (barFill) =>
  `<svg ${NS} viewBox="0 0 ${VB_W} ${VB_H}">${markPaths(barFill)}</svg>`;

// A square tile: solid bg + centred mark occupying `cover` of the width.
const tileSvg = (size, bg, barFill, cover = 0.58, rx = 0) => {
  const k = (cover * size) / VB_W;
  const mw = VB_W * k;
  const mh = VB_H * k;
  const tx = (size - mw) / 2;
  const ty = (size - mh) / 2;
  const bgEl = bg
    ? `<rect width="${size}" height="${size}" rx="${rx}" fill="${bg}"/>`
    : "";
  return `<svg ${NS} width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgEl}<g transform="translate(${tx} ${ty}) scale(${k})">${markPaths(barFill)}</g></svg>`;
};

const png = (svg) => sharp(Buffer.from(svg)).png();

async function writeSvg(path, svg) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${svg}\n`, "utf8");
}
async function writePng(path, svg) {
  await mkdir(dirname(path), { recursive: true });
  await png(svg).toFile(path);
}

// ── Wordmark lockup (mark + "Persept" in Archivo 800), precise via measure ──────
async function wordmark(barFill, textFill, targetH) {
  // 1. render the word, trimmed to its ink, so we know its exact box
  const fs = Math.round(targetH * 1.34);
  const ls = (-0.02 * fs).toFixed(2); // -0.02em tracking
  const wordSvg = `<svg ${NS} width="${fs * 6}" height="${Math.round(
    fs * 1.6,
  )}"><text x="10" y="${Math.round(
    fs * 1.15,
  )}" font-family="Archivo" font-weight="800" font-size="${fs}" letter-spacing="${ls}" fill="${textFill}">Persept</text></svg>`;
  const word = await sharp(Buffer.from(wordSvg)).trim().png().toBuffer();
  const wm = await sharp(word).metadata();

  // 2. mark sized to ~1.3x the wordmark cap height (≈ trimmed height)
  const markH = Math.round(wm.height * 1.28);
  const markW = Math.round((markH * VB_W) / VB_H);
  const mark = await png(
    `<svg ${NS} width="${markW}" height="${markH}" viewBox="0 0 ${VB_W} ${VB_H}">${markPaths(
      barFill,
    )}</svg>`,
  ).toBuffer();

  const gap = Math.round(markH * 0.34);
  const pad = Math.round(markH * 0.22);
  const H = Math.max(markH, wm.height) + pad * 2;
  const W = markW + gap + wm.width + pad * 2;
  const midY = Math.round(H / 2);

  const canvas = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([
    { input: mark, left: pad, top: midY - Math.round(markH / 2) },
    {
      input: word,
      left: pad + markW + gap,
      top: midY - Math.round(wm.height / 2),
    },
  ]);
  return canvas.png();
}

// ── Social cards (dark, glow, centred lockup + tagline) ─────────────────────────
async function socialCard(path, W, H, { markH, fs, tagFs, tagline }) {
  const bg = `<svg ${NS} width="${W}" height="${H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="34%" r="70%">
        <stop offset="0%" stop-color="#241a10"/>
        <stop offset="55%" stop-color="#141110"/>
        <stop offset="100%" stop-color="#0b0a09"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <circle cx="${W / 2}" cy="${H * 0.34}" r="${W * 0.28}" fill="${AMBER}" opacity="0.05"/>
  </svg>`;
  const base = await sharp(Buffer.from(bg)).png().toBuffer();

  const markW = Math.round((markH * VB_W) / VB_H);
  const mark = await png(
    `<svg ${NS} width="${markW}" height="${markH}" viewBox="0 0 ${VB_W} ${VB_H}">${markPaths(
      CREAM,
    )}</svg>`,
  ).toBuffer();

  const ls = (-0.02 * fs).toFixed(2);
  const wordSvg = `<svg ${NS} width="${fs * 6}" height="${Math.round(
    fs * 1.6,
  )}"><text x="6" y="${Math.round(
    fs * 1.15,
  )}" font-family="Archivo" font-weight="800" font-size="${fs}" letter-spacing="${ls}" fill="${CREAM}">Persept</text></svg>`;
  const word = await sharp(Buffer.from(wordSvg)).trim().png().toBuffer();
  const wm = await sharp(word).metadata();

  const gap = Math.round(markH * 0.34);
  const total = markW + gap + wm.width;
  const x0 = Math.round((W - total) / 2);
  const rowY = tagline ? Math.round(H * 0.42) : Math.round(H / 2);

  const layers = [
    { input: mark, left: x0, top: rowY - Math.round(markH / 2) },
    { input: word, left: x0 + markW + gap, top: rowY - Math.round(wm.height / 2) },
  ];

  if (tagline) {
    const tagSvg = `<svg ${NS} width="${W}" height="${Math.round(
      tagFs * 2,
    )}"><text x="${W / 2}" y="${Math.round(
      tagFs * 1.2,
    )}" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="${tagFs}" letter-spacing="${(
      -0.01 * tagFs
    ).toFixed(2)}" fill="#c9c2b8">${tagline}</text></svg>`;
    const tag = await sharp(Buffer.from(tagSvg)).trim().png().toBuffer();
    const tm = await sharp(tag).metadata();
    layers.push({
      input: tag,
      left: Math.round((W - tm.width) / 2),
      top: Math.round(H * 0.66),
    });
  }

  await mkdir(dirname(path), { recursive: true });
  await sharp(base).composite(layers).png().toFile(path);
}

// ── favicon.svg (clean, self-contained, no metadata) ────────────────────────────
const faviconSvg = (() => {
  const S = 32;
  const cover = 0.6;
  const k = (cover * S) / VB_W;
  const mw = VB_W * k;
  const mh = VB_H * k;
  const tx = (S - mw) / 2;
  const ty = (S - mh) / 2;
  return `<svg ${NS} width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="7" fill="${INK}"/><g transform="translate(${tx.toFixed(
    2,
  )} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">${markPaths(CREAM)}</g></svg>`;
})();

// ── Build ───────────────────────────────────────────────────────────────────────
async function main() {
  // vector masters (clean, transparent)
  await writeSvg(out("vector", "persept-mark.svg"), markSvg(CREAM)); // dark-bg master
  await writeSvg(out("vector", "persept-mark-light.svg"), markSvg(INK));
  await writeSvg(out("vector", "persept-mark-cream.svg"), markSvg(CREAM));
  await writeSvg(
    out("vector", "persept-mark-black.svg"),
    `<svg ${NS} viewBox="0 0 ${VB_W} ${VB_H}"><path d="${SLASH}" fill="${INK}"/><path d="${BAR}" fill="${INK}"/></svg>`,
  );

  // square avatars — profile pictures / company logos
  for (const s of [1024, 512, 400, 240]) {
    await writePng(out("avatar", `persept-avatar-dark-${s}.png`), tileSvg(s, INK, CREAM));
    await writePng(
      out("avatar", `persept-avatar-light-${s}.png`),
      tileSvg(s, CREAM, INK),
    );
  }

  // transparent marks — overlay on any surface
  await writePng(out("transparent", "persept-mark-color-dark-1024.png"), markSvg(CREAM));
  await writePng(out("transparent", "persept-mark-color-light-1024.png"), markSvg(INK));
  await writePng(
    out("transparent", "persept-mark-cream-1024.png"),
    markSvg(CREAM),
  );
  await writePng(
    out("transparent", "persept-mark-black-1024.png"),
    `<svg ${NS} viewBox="0 0 ${VB_W} ${VB_H}"><path d="${SLASH}" fill="${INK}"/><path d="${BAR}" fill="${INK}"/></svg>`,
  );

  // wordmark lockups (transparent) — email signatures, docs, Workspace
  await mkdir(out("wordmark"), { recursive: true });
  await (await wordmark(CREAM, CREAM, 300)).toFile(
    out("wordmark", "persept-wordmark-dark-1024.png"),
  );
  await (await wordmark(CREAM, CREAM, 150)).toFile(
    out("wordmark", "persept-wordmark-dark-512.png"),
  );
  await (await wordmark(INK, INK, 300)).toFile(
    out("wordmark", "persept-wordmark-light-1024.png"),
  );
  await (await wordmark(INK, INK, 150)).toFile(
    out("wordmark", "persept-wordmark-light-512.png"),
  );

  // favicon
  await writeSvg(out("favicon", "favicon.svg"), faviconSvg);
  await writePng(out("favicon", "favicon-32.png"), faviconSvg);
  await sharp(Buffer.from(faviconSvg)).resize(16, 16).png().toFile(
    out("favicon", "favicon-16.png"),
  );

  // app icon (rounded dark tile, iOS-style corner)
  await writePng(
    out("app-icon", "persept-app-icon-1024.png"),
    tileSvg(1024, INK, CREAM, 0.62, 224),
  );
  await writePng(
    out("app-icon", "apple-touch-icon-180.png"),
    tileSvg(180, INK, CREAM, 0.62, 40),
  );

  // social cards
  await socialCard(out("social", "persept-linkedin-company-1128x191.png"), 1128, 191, {
    markH: 84,
    fs: 78,
    tagline: null,
  });
  await socialCard(
    out("social", "persept-linkedin-personal-1584x396.png"),
    1584,
    396,
    { markH: 150, fs: 140, tagFs: 40, tagline: "AI workforce for small businesses" },
  );
  await socialCard(out("social", "persept-og-1200x630.png"), 1200, 630, {
    markH: 190,
    fs: 176,
    tagFs: 44,
    tagline: "AI workforce for small businesses",
  });

  console.log("brand assets generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
