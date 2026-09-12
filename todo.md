# Matri Jewellers Redesign — Todo

## Deliverables
- [x] Redesign tokens/variables, layout, components to "clean contemporary boutique"
- [x] Replace placeholder SVGs with rich hand-crafted jewellery artwork (fills whitespace)
- [ ] Verify all JS functionality preserved + responsive

## Design tokens (css/variables.css)
- [x] Sapphire palette (done in previous task)
- [x] Add sp-7, sp-14; section-pad 7rem
- [x] Apple-style layered shadows
- [x] Radius 8/16/24 + xl 32
- [x] Larger type scale + fs-4xl

## HTML (index.html)
- [x] Remove marquee
- [x] Hero: full-bleed bg image + centered overlay content
- [x] Category cards: image media + white caption body
- [x] Hero + about image srcs use new artwork (no js/main.js change needed — product filenames unchanged)

## Component CSS (styles.css)
- [x] Header: white, navy links
- [x] Buttons: solid navy / gold, pill
- [x] Hero overlay layout
- [x] Product/category/feature/testimonial cards clean + soft shadows
- [x] Forms minimal white
- [x] Responsive

## Image artwork (assets/images/*.svg)
- [x] hero-banner.svg — wide luxury necklace scene (16:9-ish)
- [x] about-artisan.svg — atelier scene 3:4
- [x] 4 category SVGs — rings/necklaces/earrings/bangles
- [x] 9 product SVGs — distinct jewellery illustrations
- [x] js/main.js img strings unchanged (filenames preserved)

## Verification
- [x] Image checks — all 15 SVGs referenced by HTML/JS exist on disk, no emoji placeholders remain
- [x] JS hook checks — all classes/IDs preserved (.reveal, .is-visible, .product-card__quick-add, nav/.is-open, hamburger/.is-open, header.is-scrolled, scroll-top.is-visible + 9 IDs)
- [ ] Visual + responsive + interaction checks in a browser (open index.html or `python -m http.server 8000`)