# Product Filtering System Guide

Your website has **two completely independent product views** with separate
state, grids, search, and pagination. They never interfere with each other.

```
SHOP BY CATEGORY
 ├── Rings          ──click──▶  CATEGORY PRODUCTS section
 ├── Necklaces                      (ALL products of that category,
 ├── Earrings                       featured AND non-featured)
 └── ...

FEATURED PRODUCTS section (always on page)
 └── Only `featured: true` products

Header search box  ──▶  opens CATEGORY PRODUCTS in "All Jewellery" mode
                         and filters the whole catalogue by name/category

GOLD / SILVER MODE (floating sidebar toggle)  ──▶  filters EVERY view
                         (Featured, Category, All Jewellery, search) to
                         only products whose `metal` matches the mode.
                         Silver mode also swaps the site's color accent.
```

---

## 1. Featured Products Section (`#products`)

- Shows **only** products with `"featured": true` in `data/products.json`.
- Always visible on the page — it does not depend on any category selection.
- The **header search box** does NOT touch this section. It opens the
  Category Products section (Collection) instead — see section 3.
- Has its own grid (`#productsGrid`) and its own "Load More" button.

## 2. Shop by Category Section (`#categories`)

- Contains **only category cards** — no search bar, no filter chips, no
  product cards.
- Clicking a category card (e.g. `Rings`) opens the separate
  **Category Products section** below it.
- The first card, **All Jewellery**, shows the **entire catalogue** (every
  product, featured and non-featured) under the heading
  "All Jewellery Collection".
- Category cards show live product counts.

## 3. Category Products Section (`#categoryProducts`)

- Hidden until a category is clicked **or** the user types in the header.
- On click it shows **every product of that category**, regardless of the
  `featured` flag:
  - `Rings` → Crimson Kundan Ring (non-featured) **and** Vintage Solitaire
    Ring (featured)
  - `Earrings` → Morning Dew Earrings, Blossom Rose Stud Set, **and**
    Golden Hoop Cascade (non-featured)
- Heading becomes e.g. **"Rings Collection"**.
- Has its own grid (`#categoryProductsGrid`) and its own "Load More" button.
- Clicking a category card scrolls to this section — **not** to Featured
  Products.
- **Header search** opens this section in "All Jewellery" mode and filters
  the whole catalogue by name and category. Heading becomes e.g.
  **"Search results for 'ring'"**. Clearing the box shows the full
  "All Jewellery Collection". Selecting a category card clears the search.

---

## Independence (the important part)

| Action | Effect on Featured Products | Effect on Category Products |
|---|---|---|
| Click a category card | None | Shows all products of that category |
| Type in the header search | None | Shows matching products across the whole catalogue |
| Click "Load More" (Featured) | Shows more featured | None |
| Click "Load More" (Category) | None | Shows more of that category |

---

## Gold / Silver Mode (floating sidebar toggle)

A floating toggle on the right edge of the page switches between **Gold** and
**Silver** mode. It is an **independent global filter** that applies to *every*
product view at once — it does not replace categories or search.

- **Gold mode (default)** → every view shows only products with
  `"metal": "gold"`.
- **Silver mode** → every view shows only products with
  `"metal": "silver"`, *and* the site's color accent switches from the warm
  burgundy + rose-gold palette to a cool navy + silver palette
  (`[data-metal="silver"]` tokens in `css/variables.css`).
- Categories still work inside the active mode: clicking **Rings** in Silver
  mode shows only silver rings.
- Header search still works inside the active mode: searching in Silver mode
  matches only silver products.
- Category card product counts update to reflect the active mode.
- The choice is remembered across page loads (`localStorage: matri-metal`).
- Clicking a mode plays a brief **"mode pop"** — an accent-coloured veil,
  expanding ring, and metallic spark burst at the press point
  (`playModePop()` in `js/main.js`; styles under `.mode-pop` in
  `css/styles.css`). Disabled for `prefers-reduced-motion` users.

The mode is driven by three files:
- `data/products.json` — each product has a `"metal": "gold" | "silver"` field.
- `js/main.js` — `activeMetal` state + `setMetalMode()` + `refreshAllProducts()`
  re-renders both grids; `getFeaturedProducts()` / `getCategoryProducts()`
  filter by metal first.
- `css/variables.css` — `[data-metal="silver"]` and
  `[data-metal="silver"][data-theme="dark"]` token overrides.

---

## Adding Products

Edit `data/products.json`:

```json
{
  "name": "Product Name",
  "category": "Rings",
  "price": "₹ 24,499",
  "oldPrice": "",
  "badge": "",
  "img": "",
  "imgFile": "product-ring.png",
  "featured": true,
  "metal": "gold"
}
```

- **`featured: true`** → appears in **both** the Featured Products section and
  its category's Category Products section.
- **`featured: false`** → appears **only** in its category's Category Products
  section.
- **`metal`** → `"gold"` or `"silver"`. Controls which products show in Gold
  vs Silver mode. Every product must have this field.

---

## Header Navigation (mega-menu + secondary nav)

- Clicking a category name (e.g. `Earrings`, `Pendants`, `Bangles`) in the
  header menus opens that category's **Category Products** section.
- Clicking **All Jewellery** opens the full catalogue (the same as the "All
  Jewellery" card).
- Labels that don't exist in `data/products.json` (e.g. `Mangalsutra`,
  `Bracelets`) show an honest "No designs in X yet." empty state.
- Friendly aliases: "Finger Rings" → Rings, "Chains"/"Necklace Sets" →
  Necklaces.

---

## Testing

1. **Header search → Collection:** load the page, type `ring` in the header
   search → Category Products section opens in "All Jewellery" mode,
   showing only products whose name or category contains "ring" (Crimson
   Kundan Ring, Vintage Solitaire Ring), headed "Search results for 'ring'".
   Featured Products section is untouched.
2. **Category Products:** click the `Earrings` category card → Category
   Products section appears with all 3 earrings (including the non-featured
   "Golden Hoop Cascade"), headed "Earrings Collection". Header search box
   is cleared. Featured Products grid is untouched.
3. **Independence:** click a category card to enter a specific category, then
   type in the header search — the search enters "All Jewellery" mode and
   re-renders the collection with matching results. Click "Load More" in
   one section — only that section changes.
4. **Gold/Silver mode:** load the page (Gold default) → warm burgundy accent
   everywhere. Click the floating **Silver** toggle → every view now shows
   only `metal: "silver"` products, category counts shrink, and the accent
   switches to cool navy + silver. Click a category (e.g. Rings) → only silver
   rings show. Refresh → Silver mode is remembered.
5. **Search within a mode:** in Silver mode, type `ring` in the header search →
   only silver products matching "ring" appear. Switch to Gold → search still
   applies but to gold products only.
6. **Dark + Silver:** enable night mode, then Silver mode → dark navy theme
   with cool chalk text and steel accents (no skin-tone clash).