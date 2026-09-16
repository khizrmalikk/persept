# Persept brand assets

Logo set in the **Terracotta Sand** theme. Every logo ships as both `.svg`
(preferred — scales cleanly) and `.png` (transparent background, retina width).

## Folders

| Folder      | What it is                                        |
| ----------- | ------------------------------------------------- |
| `lockup/`   | Full logo — aperture mark **+** "Persept" wordmark |
| `mark/`     | The aperture "P" mark on its own (favicon, avatar) |
| `wordmark/` | The "Persept" wordmark on its own                  |

## Colorways

Each form comes in three variants:

| Variant       | Hex       | Use on                                          |
| ------------- | --------- | ----------------------------------------------- |
| `ink`         | `#17140f` | Default — paper / light surfaces                |
| `paper`       | `#f7f2ea` | Reversed — dark / `.panel-dark` / GYST near-black |
| `terracotta`  | `#cf5a34` | Accent lockups and expressive placements        |

Example: `brand/lockup/persept-lockup-paper.svg`

## In-app usage

The site header/footer render the logo as a **live, theme-aware React component**
(`src/components/ui/logo.tsx`) whose strokes inherit `var(--ink)` — use that in the
app, not these files. The favicon is `src/app/icon.svg` (Next.js convention).

These exported files are for **external** use: email signatures, decks, social,
press kits, favicons for other properties.

## Regenerating

All variants are produced from the `-ink` SVGs by re-coloring. To rebuild after a
theme or path change:

```bash
node scripts/build-brand-assets.mjs
```
