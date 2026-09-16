/**
 * Build the Persept brand asset set (SVG + PNG) in the new Terracotta Sand theme.
 *
 * Reads the three canonical vector sources (mark, wordmark, full lockup), which
 * all ship in the legacy ink `#16150f`, and re-colors them into the theme
 * colorways. Rasterizes each SVG to a transparent-background PNG via sharp.
 *
 *   ink        #17140f  default — on paper / light surfaces
 *   paper      #f7f2ea  reversed — on dark / GYST near-black surfaces
 *   terracotta #cf5a34  accent
 *
 * Run: node scripts/build-brand-assets.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

// Matches any brand ink (legacy `#16150f` or current `#17140f`) so re-runs are idempotent.
const INK = /#16150f|#17140f/gi;
const COLORS = {
  ink: "#17140f",
  paper: "#f7f2ea",
  terracotta: "#cf5a34",
};

// Canonical vector sources are the ink variants inside brand/. Read once, recolor per variant.
const SOURCES = {
  mark: {
    file: "brand/mark/persept-mark-ink.svg",
    pngWidth: 512,
    dir: "brand/mark",
  },
  wordmark: {
    file: "brand/wordmark/persept-wordmark-ink.svg",
    pngWidth: 1000,
    dir: "brand/wordmark",
  },
  lockup: {
    file: "brand/lockup/persept-lockup-ink.svg",
    pngWidth: 1400,
    dir: "brand/lockup",
  },
};

// The mark/lockup sources have no explicit title beyond aria-label; keep as-is.
function recolor(raw, hex) {
  return raw.replace(INK, hex);
}

async function build() {
  const written = [];
  for (const [form, cfg] of Object.entries(SOURCES)) {
    const raw = readFileSync(join(pub, cfg.file), "utf8");
    for (const [variant, hex] of Object.entries(COLORS)) {
      const svg = recolor(raw, hex);
      const base = `persept-${form === "lockup" ? "lockup" : form}-${variant}`;
      const svgPath = join(pub, cfg.dir, `${base}.svg`);
      const pngPath = join(pub, cfg.dir, `${base}.png`);
      writeFileSync(svgPath, svg);
      await sharp(Buffer.from(svg), { density: 384 })
        .resize({ width: cfg.pngWidth })
        .png()
        .toFile(pngPath);
      written.push(`${cfg.dir}/${base}.svg`, `${cfg.dir}/${base}.png`);
    }
  }
  console.log("Wrote:\n" + written.map((w) => "  public/" + w).join("\n"));
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
