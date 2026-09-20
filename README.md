#  Matri Jewellers — Royal Website

A clean, contemporary marketing website for **Matri Jewellers**, a jewellery
boutique. Themed around a **burgundy royal palette** accented with rose gold,
restyled as a modern boutique: generous whitespace, soft layered shadows, and
hand-crafted jewellery artwork.

![Theme palette](#) — Burgundy `#5C1F1F` · Deep Burgundy `#3B0D0D` · Rose Gold `#D4A574` · Ivory `#FDFBF7`

---

##  Features

- **Landing page** with a full-bleed hero banner + centered overlay, about story
- **Collections grid** — Rings, Necklaces, Earrings, Bangles
- **Featured products** — the entire catalogue is driven by a single JSON
  file (`data/products.json`) with **Load More** pagination and live search
- **Why Choose Us** — trust badges
- **Testimonials**, **Newsletter sign-up**, and **Contact form** (client-side
  validation included)
- **Interactive JS**: mobile hamburger drawer, scroll-reveal animations,
  back-to-top button, live cart counter, auto-updating footer year
- **Responsive** at desktop (1200px), tablet (1024px), mobile (768px) and
  small mobile (560px) breakpoints
- Respects `prefers-reduced-motion` for accessibility

##  Getting Started

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

>  The collection is loaded from `data/products.json` over HTTP, so always
> prefer **option 2** (a local server). Opening `index.html` directly from disk
> (`file://`) can block that request in some browsers — in that case the
> collection area shows a short helper message instead of cards.

## 🗂️ File Structure

```
Matri Jewellers Website/
├── index.html              # Main landing page (all sections)
├── css/
│   ├── variables.css       # Design tokens: colors, fonts, spacing, shadows
│   └── styles.css          # All component styles + responsive rules
├── data/
│   └── products.json       # 🗂 The product catalogue - add/edit products here
├── js/
│   └── main.js             # Loads data/products.json + all interactivity
├── assets/
│   └── images/             # Hand-crafted SVG artwork (hero, about, categories, products)
└── README.md
```

##  Customisation

### Change the theme color

All colors live in one place — `css/variables.css`. Edit the `:root` block to
re-theme the entire site in seconds:

```css
--color-crimson: #5C1F1F;   /* primary burgundy */
--color-gold:    #D4A574;   /* rose gold accent  */
```

### Add real product photos

The catalogue ships without real photos — each card shows a labelled
placeholder and its `"img"` field is empty. To publish real photography:

1. Drop the image under `assets/images/` (PNG/JPG/WebP recommended)
2. In `data/products.json`, set that product's `"img"` to its path,
   e.g. `"img": "assets/images/product-necklace.png"`

The card swaps the placeholder for the photo automatically — no JS changes.

### Add / edit products — the JSON catalogue

The whole collection lives in **one file**: `data/products.json`. To add a
product (or edit an existing one), open that file and add or change an
object in the array — save, and reload the page. No JS or HTML changes
needed. (`PRODUCTS_PER_PAGE` in `js/main.js` still controls how many cards
appear before the "Load More" button.)

Every product entry looks like this:

```json
{
  "name": "Product name shown on the card",
  "category": "Rings",
  "price": "₹ 12,345",
  "oldPrice": "",
  "badge": "",
  "img": "",
  "imgFile": "product-photo.png"
}
```

| Field    | Meaning                                             | Example                              |
| -------- | --------------------------------------------------- | ------------------------------------ |
| `name`   | Shown on the card                                   | `"Royale Diamond Necklace"`         |
| `category` | Label used for search — any text is fine, old or new | `"Rings"`                         |
| `price`  | Displayed price, any format                         | `"₹ 89,999"`                  |
| `oldPrice` | Strike-through compare-at price; `""` hides it    | `"₹ 1,09,999"`                |
| `badge`  | Small corner label; `""` hides it                  | `"Bestseller"`                      |
| `img`    | Real photo path; `""` shows the placeholder        | `"assets/images/product-necklace.png"` |
| `imgFile` | Only labels the placeholder (used while `img` is empty) | `"product-necklace.png"`         |

Quick rules:

- **Commas** — every entry except the last one needs a comma after its closing `}`.
- **Copy-paste** — duplicate an existing entry to stay safe, then edit the fields.
- **New categories** — just type any `category` value; search picks it up
  automatically (no button or code to add).
- **Photos** — set `img` and the card uses the photo (see below).

### Searching & filtering (name **and** category)

- **Header search box** — matches product **name** *or* **category** as you
  type. E.g. `ring` finds rings *and* earrings; `bangles` finds the bangles.
- **Category chips** — the "All / Rings / Bangles / …" pills above the grid.
  They are built automatically from `data/products.json`, so a brand-new
  category (say `Tikka`) becomes a chip the moment you add a product with it.
- **They combine** — pick a chip *and* type in the search box: e.g. chip
  `Earrings` + search `gold` shows only gold earrings.
- **Shop by Category cards** — the cards in the "Shop by Category" section are
  clickable too: clicking (or keyboard-focusing) `Rings` / `Necklaces` / …
  lists every product with that category, scrolls to the grid, and keeps the
  matching chip + card highlight in sync. Their "N Designs" counts are the
  real live counts from `data/products.json`.

### Contact & newsletter forms

Both forms are **static demos** with client-side validation only. To send
messages for real, wire up a backend service (e.g. Formspree, a small
Express endpoint, or an email API) in the submit handlers in `js/main.js`.

##  Responsive Behaviour

| Breakpoint    | What changes                                       |
| ------------- | -------------------------------------------------- |
| ≤ 1024px      | Grids drop to 2 columns, footer to 2 columns       |
| ≤ 768px       | Nav becomes a slide-out drawer, sections stack     |
| ≤ 560px       | Single-column grids, tighter hero text             |

##  Section Index (index.html)

1. **Header / Navigation** — fixed, white with centered search + category menu
2. **Hero** — full-bleed sage SVG scene, elegant serif + script headline, CTAs, carousel dots
3. **About** — legacy story + atelier artwork
4. **Collections** — image cards with white caption bodies
5. **Featured Products** — JS-rendered cards
6. **Why Choose Us** — ivory trust-badge section
7. **Testimonials** — customer reviews with gold accent
8. **Newsletter** — email sign-up
9. **Contact** — details + validation form
10. **Footer** — links, socials, auto-year

---

Made with ♥ for Matri Jewellers.
