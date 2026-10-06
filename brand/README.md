# Persept brand assets

Everything here is generated from the two mark shapes and the brand colours by
`_generate.mjs` (vector-rendered, so crisp at any size). The originals in
`~/Downloads/persept-logo` carry embedded C2PA provenance metadata; the vector
masters here are clean copies with that stripped.

## The mark

Two shapes, always in these colours:

| Shape | Colour | Notes |
|-------|--------|-------|
| Slash (tall parallelogram) | amber `#f2a93b` | never recolour |
| Bar (top) | cream `#f4f1ec` on dark · near-black `#0e0d0c` on light | matches the surface |

- **Clear space:** keep at least the height of the bar clear on every side.
- **Minimum size:** 16px tall.
- **Wordmark:** "Persept" in **Archivo 800**, letter-spacing −0.02em. Mark ≈ 1.3× the
  cap height, gap ≈ 0.4× the mark height. The lockup PNGs in `wordmark/` already do this.

## What to use where

| Need | File |
|------|------|
| **LinkedIn / X / Instagram profile or company logo** | `avatar/persept-avatar-dark-400.png` (or `-light-` on light themes). Use `-1024` where a big source is asked for. |
| **LinkedIn company page cover** | `social/persept-linkedin-company-1128x191.png` |
| **LinkedIn personal cover** | `social/persept-linkedin-personal-1584x396.png` |
| **Google Workspace org logo** (Admin console) | `wordmark/persept-wordmark-dark-1024.png` (transparent) or `avatar/persept-avatar-dark-512.png` |
| **Gmail / Workspace profile photo** | `avatar/persept-avatar-dark-512.png` |
| **Email signature / docs / slides** | `wordmark/persept-wordmark-dark-1024.png` or `-light-` on white |
| **Favicon** | `favicon/favicon.svg` (+ `favicon-32.png`, `favicon-16.png`) |
| **App icon / apple-touch** | `app-icon/persept-app-icon-1024.png`, `app-icon/apple-touch-icon-180.png` |
| **Social share / OG image** | `social/persept-og-1200x630.png` |
| **Overlay the mark on any background** | `transparent/…` |
| **Source vector for a designer / print** | `vector/…` |

## Folders

- `vector/` — clean SVG masters. `persept-mark.svg` is the main one (amber + cream, for
  dark). `-light` swaps the bar to near-black for light surfaces; `-cream` / `-black` are
  single-colour.
- `avatar/` — square tiles (dark + light) at 1024 / 512 / 400 / 240 for profile & company logos.
- `wordmark/` — mark + "Persept" lockup, transparent PNG, dark + light, 1024 / 512.
- `transparent/` — the mark alone on transparent (colour, cream, black).
- `app-icon/` — rounded iOS-style tile + apple-touch (180).
- `favicon/` — favicon.svg + 32 / 16 PNG.
- `social/` — LinkedIn covers + 1200×630 OG card.

## Regenerating

```bash
mkdir -p /tmp/perseptfonts/cache
curl -fsSL https://raw.githubusercontent.com/Omnibus-Type/Archivo/master/fonts/ttf/Archivo-ExtraBold.ttf \
  -o /tmp/perseptfonts/Archivo-ExtraBold.ttf
printf '%s\n' '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/tmp/perseptfonts</dir><cachedir>/tmp/perseptfonts/cache</cachedir></fontconfig>' \
  > /tmp/perseptfonts/fonts.conf
FONTCONFIG_FILE=/tmp/perseptfonts/fonts.conf node brand/_generate.mjs
```

Archivo ExtraBold (SIL OFL) is only needed to render the wordmark/social text; the mark,
avatars, favicon and icons need no fonts.
