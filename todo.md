# Matri Jewellers Redesign — Todo

## Deliverables
- [x] Redesign tokens/variables, layout, components to "clean contemporary boutique"
- [x] Replace placeholder SVGs with rich hand-crafted jewellery artwork (fills whitespace)
- [x] Tanishq-inspired burgundy rebrand (colors, header + search/category menu, hero, footer)
- [x] Re-theme all SVG artwork to burgundy/rose-gold palette
- [x] Verify all JS functionality preserved + responsive
- [x] Product catalogue moved to `data/products.json` — add/edit one JSON entry and the collection grid updates (search + Load More read from the same file)
- [x] Category filter chips auto-built from `data/products.json` + name/category search (chips combine with the search box)

## Design tokens (css/variables.css)
- [x] Burgundy royal palette (replaces sapphire)
- [x] Add sp-7, sp-14; section-pad 7rem
- [x] Apple-style layered shadows
- [x] Radius 8/16/24 + xl 32
- [x] Larger type scale + fs-4xl
- [x] Script font (Dancing Script) for hero accent word

## HTML (index.html)
- [x] Remove marquee
- [x] Hero: full-bleed bg image + centered overlay content
- [x] Category cards: image media + white caption body
- [x] Hero + about image srcs use new artwork (no js/main.js change needed — product filenames unchanged)

## Component CSS (styles.css)
- [x] Header: white, burgundy logo + centered search + utility icons + category menu
- [x] Buttons: solid burgundy / rose-gold, pill
- [x] Hero overlay layout (sage tones + script typography + carousel dots)
- [x] Product/category/feature/testimonial cards clean + soft shadows
- [x] Forms minimal white
- [x] Footer: deep burgundy, 4-column, QR/stores, chat icons, social row
- [x] Responsive

## Image artwork (assets/images/*.svg)
- [x] hero-banner.svg — wide luxury necklace scene (16:9-ish)
- [x] about-artisan.svg — atelier scene 3:4
- [x] 4 category SVGs — rings/necklaces/earrings/bangles
- [x] 9 product SVGs — distinct jewellery illustrations
- [x] js/main.js img strings unchanged (filenames preserved)

## Verification
- [x] Image checks — all 15 SVGs referenced by HTML/JS exist on disk, no emoji placeholders remain
- [x] JS hook checks — all classes/IDs preserved (.reveal, .is-visible, nav/.is-open, hamburger/.is-open, header.is-scrolled, scroll-top.is-visible + 9 IDs)
- [x] Remove cart (header button, badge counter, Quick Add buttons) — see `#themeToggle` replacing `#cartBtn`
- [x] Day / night mode toggle — `data-theme` on `<html>`, tokens flipped in variables.css, persisted as `matri-theme` in localStorage, follows `prefers-color-scheme` until the user picks manually
- [x] Visual + responsive + interaction checks in a browser (open index.html or `python -m http.server 8000`)
  - [x] Hero carousel: all 3 slides render, GPU-accelerated slide animation, dots sync
  - [x] Responsive hero banners configured with `<picture>` art direction across Desktop, Tablet, and Mobile (`desktop_banner_*`, `tab_banner_*`, `phone_banner_*`)