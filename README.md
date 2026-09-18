# 💎 Matri Jewellers — Royal Website

A clean, contemporary marketing website for **Matri Jewellers**, a jewellery
boutique. Themed around a **midnight sapphire royal palette** accented with
champagne gold, restyled as a modern boutique: generous whitespace, soft
layered shadows, and hand-crafted jewellery artwork.

![Theme palette](#) — Sapphire `#2A5B8C` · Navy `#14213D` · Champagne Gold `#C9A227` · Ivory `#F6F7FB`

---

## ✨ Features

- **Landing page** with a full-bleed hero banner + centered overlay, about story
- **Collections grid** — Rings, Necklaces, Earrings, Bangles
- **Featured products** — cards rendered dynamically from JS data with
  "Quick Add" cart interaction and **Load More** pagination
- **Why Choose Us** — trust badges
- **Testimonials**, **Newsletter sign-up**, and **Contact form** (client-side
  validation included)
- **Interactive JS**: mobile hamburger drawer, scroll-reveal animations,
  back-to-top button, live cart counter, auto-updating footer year
- **Responsive** at desktop (1200px), tablet (1024px), mobile (768px) and
  small mobile (560px) breakpoints
- Respects `prefers-reduced-motion` for accessibility

## 🚀 Getting Started

There are no build steps or dependencies — it's a plain static site.

1. Open **`index.html`** in any modern browser, **or**
2. Serve it locally for the best experience:

   ```bash
   # any static server works, e.g. Python's built-in:
   python -m http.server 8000
   # then visit http://localhost:8000
   ```

No installation required. Google Fonts (Playfair Display + Poppins) load from
the CDN; everything else is self-contained.

## 🗂️ File Structure

```
Matri Jewellers Website/
├── index.html              # Main landing page (all sections)
├── css/
│   ├── variables.css       # Design tokens: colors, fonts, spacing, shadows
│   └── styles.css          # All component styles + responsive rules
├── js/
│   └── main.js             # Product data + all interactivity
├── assets/
│   └── images/             # Hand-crafted SVG artwork (hero, about, categories, products)
└── README.md
```

## 🎨 Customisation

### Change the theme color

All colors live in one place — `css/variables.css`. Edit the `:root` block to
re-theme the entire site in seconds:

```css
--color-crimson: #2A5B8C;   /* primary sapphire blue */
--color-gold:    #C9A227;   /* champagne gold accent  */
```

### Swap in real product photos

The site ships with **hand-crafted SVG artwork**. To publish real photography:

- Replace the `src` in each `<img>` tag in `index.html`, **and**
- Update the `img` field inside `PRODUCT_DATA` in `js/main.js`
- Add your photos under `assets/images/` (PNG/JPG/WebP recommended)

### Edit products / prices

Edit the `PRODUCT_DATA` array at the top of `js/main.js` — add or remove
objects to change what's displayed. `PRODUCTS_PER_PAGE` controls how many
cards show before the "Load More" button.

### Contact & newsletter forms

Both forms are **static demos** with client-side validation only. To send
messages for real, wire up a backend service (e.g. Formspree, a small
Express endpoint, or an email API) in the submit handlers in `js/main.js`.

## 📱 Responsive Behaviour

| Breakpoint    | What changes                                       |
| ------------- | -------------------------------------------------- |
| ≤ 1024px      | Grids drop to 2 columns, footer to 2 columns       |
| ≤ 768px       | Nav becomes a slide-out drawer, sections stack     |
| ≤ 560px       | Single-column grids, tighter hero text             |

## 🧭 Section Index (index.html)

1. **Header / Navigation** — fixed, white with soft blur, navy links
2. **Hero** — full-bleed SVG scene, gradient overlay, headline, CTAs, stat row
3. **About** — legacy story + atelier artwork
4. **Collections** — image cards with white caption bodies
5. **Featured Products** — JS-rendered cards
6. **Why Choose Us** — ivory trust-badge section
7. **Testimonials** — customer reviews with gold accent
8. **Newsletter** — email sign-up
9. **Contact** — details + validation form
10. **Footer** — links, socials, auto-year

