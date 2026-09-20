/* ==========================================================================
   MATRI JEWELLERS - main.js
   --------------------------------------------------------------------------
   Handles all client-side interactivity:
     1.  Product catalogue (data + dynamic card rendering + "load more")
     2.  Day / night mode toggle (persisted via localStorage)
     3.  Mobile navigation drawer
     4.  Scroll-based: nav reveal, back-to-top button
     5.  Scroll reveal animations (IntersectionObserver)
     6.  Newsletter form validation
     7.  Contact form validation
     8.  Auto-updating footer year
   ========================================================================== */

"use strict";

/* ==========================================================================
   1. PRODUCT CATALOGUE
   ========================================================================== */

/**
 * PRODUCT DATA - no longer hard-coded here.
 *
 * Products live in a single JSON file, `data/products.json`, and are fetched
 * on page load. To add or edit a product, just edit that file: every entry in
 * its array becomes a card in the collection grid and is searchable.
 *
 * See README.md - "Adding a product" for the field-by-field example.
 */
const PRODUCTS_URL = "data/products.json";

/** All products, loaded once from PRODUCTS_URL. */
let productsData = [];

/** True once productsData has been fetched successfully. */
let productsLoaded = false;

/** How many cards are rendered per "page" before Load More appears. */
const PRODUCTS_PER_PAGE = 6;

/** Internal sentinel key for the "All Jewellery" pseudo-category. */
const ALL_JEWELLERY_KEY = "__all_jewellery__";

/* ---- Metal mode (Gold / Silver) ---------------------------------------- */

/** Active metal filter: 'gold' or 'silver'. Set by the floating sidebar toggle. */
let activeMetal = "gold";

/* ---- Featured Products view (only featured: true) ---------------------- */

/** Live-filter search term for the Featured view (header search box). */
let featuredSearchTerm = "";

/** The current working subset of the Featured view. */
let featuredVisibleProducts = [];

/** How many Featured cards are currently shown. */
let featuredShownCount = 0;

/** DOM references for the Featured Products section. */
const featuredGrid = document.getElementById("productsGrid");
const featuredLoadMoreBtn = document.getElementById("loadMoreBtn");

/* ---- Category Products view (ALL products of one category) ------------- */

/** Currently selected category ('' = none). Set by the category cards. */
let activeCategory = "";

/** Live-filter search term for the Category Products view. */
let categorySearchTerm = "";

/** The current working subset of the Category view. */
let categoryVisibleProducts = [];

/** How many Category cards are currently shown. */
let categoryShownCount = 0;

/** DOM references for the separate Category Products section. */
const categoryGrid = document.getElementById("categoryProductsGrid");
const categoryLoadMoreBtn = document.getElementById("categoryLoadMoreBtn");
const categoryTitle = document.getElementById("categoryProductsTitle");
const categorySubtitle = document.getElementById("categoryProductsSubtitle");
const categorySection = document.getElementById("categoryProducts");

/**
 * Featured Products data: only products where `featured` is true, optionally
 * narrowed by the header search term (matches name and category).
 * The active category NEVER affects this list.
 */
function getFeaturedProducts() {
  const q = featuredSearchTerm.trim().toLowerCase();

  return productsData.filter((product) => {
    // Metal filter: only show products matching the active metal mode.
    if (product.metal !== activeMetal) return false;
    if (!product.featured) return false;
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    );
  });
}

/**
 * Category Products data: every product of the selected category, whether
 * featured or not, or the ENTIRE catalogue for the "All Jewellery" card.
 * Optionally narrowed by the header search term (matches name and category).
 */
function getCategoryProducts() {
  const q = categorySearchTerm.trim().toLowerCase();

  let results;
  // Always start with metal-filtered products.
  const metalFiltered = productsData.filter((p) => p.metal === activeMetal);

  if (activeCategory === ALL_JEWELLERY_KEY) {
    // "All Jewellery": every product matching the active metal.
    results = metalFiltered;
  } else {
    const category = activeCategory.trim().toLowerCase();
    results = metalFiltered.filter(
      (product) => product.category.toLowerCase() === category
    );
  }

  // Apply search filter if a term is set.
  if (q) {
    results = results.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
    );
  }

  return results;
}

/** Human-readable heading for the current category view. */
function categoryDisplayName() {
  return activeCategory === ALL_JEWELLERY_KEY
    ? "All Jewellery"
    : activeCategory;
}

/**
 * Render the next slice of Featured Products into the Featured grid.
 * Independent pagination: only advances featuredShownCount.
 */
function renderFeaturedProducts() {
  const slice = featuredVisibleProducts.slice(
    featuredShownCount,
    featuredShownCount + PRODUCTS_PER_PAGE
  );
  featuredShownCount += slice.length;

  const html = slice
    .map((product, index) => productCardHTML(product, index))
    .join("");
  featuredGrid.insertAdjacentHTML("beforeend", html);

  if (featuredVisibleProducts.length === 0) {
    const note = featuredSearchTerm.trim()
      ? ` matching “${featuredSearchTerm.trim()}”`
      : "";
    featuredGrid.innerHTML =
      `<p class="products__empty">No ${activeMetal} featured designs${note}. ` +
      "Try a different search.</p>";
  } else {
    featuredGrid.querySelector(".products__empty")?.remove();
  }

  featuredLoadMoreBtn.style.display =
    featuredShownCount >= featuredVisibleProducts.length ? "none" : "inline-block";

  // Re-observe newly injected cards so their reveal animation fires.
  observeReveals();
}

/**
 * Render the next slice of Category Products into the separate Category grid.
 * Independent pagination: only advances categoryShownCount.
 */
function renderCategoryProducts() {
  const slice = categoryVisibleProducts.slice(
    categoryShownCount,
    categoryShownCount + PRODUCTS_PER_PAGE
  );
  categoryShownCount += slice.length;

  const html = slice
    .map((product, index) => productCardHTML(product, index))
    .join("");
  categoryGrid.insertAdjacentHTML("beforeend", html);

  if (categoryVisibleProducts.length === 0) {
    const searchNote = categorySearchTerm.trim()
      ? ` matching “${categorySearchTerm.trim()}”`
      : "";
    categoryGrid.innerHTML =
      `<p class="products__empty">No ${activeMetal} designs${searchNote} in ` +
      `“${categoryDisplayName()}” yet. Try a different search.</p>`;
  } else {
    categoryGrid.querySelector(".products__empty")?.remove();
  }

  categoryLoadMoreBtn.style.display =
    categoryShownCount >= categoryVisibleProducts.length ? "none" : "inline-block";

  observeReveals();
}

/**
 * Update the Category Products heading, e.g. "Rings Collection".
 * For the "All Jewellery" card the heading becomes "All Jewellery Collection".
 */
function updateCategoryProductsHeading() {
  if (!categoryTitle || !categorySubtitle) return;
  const name = categoryDisplayName();
  const searching = categorySearchTerm.trim();
  categoryTitle.textContent = searching
    ? `Search results for “${searching.trim()}”`
    : `${name} Collection`;
  categorySubtitle.textContent = searching
    ? "Every match from across the collection."
    : name === "All Jewellery"
      ? "Every piece in our catalogue — the complete collection."
      : `Every ${name.toLowerCase()} design — the full collection.`;
}

/**
 * Highlight the "Shop by Category" card matching activeCategory.
 * The "All Jewellery" card is highlighted for the ALL_JEWELLERY_KEY.
 */
function syncCategoryCardSelection() {
  document.querySelectorAll(".category-card").forEach((card) => {
    const isAllCard = card.hasAttribute("data-all-jewellery");
    const on = activeCategory === ALL_JEWELLERY_KEY
      ? isAllCard
      : activeCategory !== "" &&
        (card.dataset.categoryName || "").toLowerCase() ===
          activeCategory.toLowerCase();
    card.classList.toggle("is-selected", on);
  });
}

/**
 * Select a category and show its products in the separate Category Products
 * section. This NEVER touches the Featured Products section, its search, or
 * its grid.
 */
function selectCategory(category) {
  activeCategory = category || "";
  categorySearchTerm = "";
  headerSearch && (headerSearch.value = "");

  syncCategoryCardSelection();

  categoryVisibleProducts = getCategoryProducts();
  categoryShownCount = 0;
  categoryGrid.innerHTML = "";
  categoryLoadMoreBtn.style.display = "inline-block";
  renderCategoryProducts();

  updateCategoryProductsHeading();

  if (categorySection) {
    categorySection.hidden = false;
    categorySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Apply a new header search term to the Featured Products view ONLY.
 * Never touches activeCategory or the Category Products view.
 */
function applyFeaturedSearch(term) {
  if (!productsLoaded) return;
  featuredSearchTerm = term;
  featuredVisibleProducts = getFeaturedProducts();
  featuredShownCount = 0;
  featuredGrid.innerHTML = "";
  featuredLoadMoreBtn.style.display = "inline-block";
  renderFeaturedProducts();
}

/**
 * Apply a new header search term to the Category Products view (Collection).
 * Enters "All Jewellery" mode so results span the whole catalogue, then
 * narrows the grid by the search term.
 */
function applyCategorySearch(term) {
  if (!productsLoaded) return;
  categorySearchTerm = term;
  activeCategory = ALL_JEWELLERY_KEY;
  categoryVisibleProducts = getCategoryProducts();
  categoryShownCount = 0;
  categoryGrid.innerHTML = "";
  categoryLoadMoreBtn.style.display = "inline-block";
  renderCategoryProducts();
  updateCategoryProductsHeading();
  if (categorySection) {
    categorySection.hidden = false;
  }
  syncCategoryCardSelection();
}

/** Friendly mappings so header-menu labels ("Finger Rings", "Chains", etc.)
 *  land on the matching category in data/products.json. */
const CATEGORY_ALIASES = {
  "finger rings": "Rings",
  "chains": "Necklaces",
  "necklace sets": "Necklaces",
};

/**
 * Enter "Shop by Category" mode for a category label from the header menus
 * (mega-menu / secondary nav). Unknown labels still switch the grid to
 * category mode and simply show an honest "No designs in X" empty state
 * instead of silently falling back to the Featured Products view.
 */
function enterCategory(label) {
  const name = (label || "").trim();
  const alias = CATEGORY_ALIASES[name.toLowerCase()];
  const target = alias || name;
  const existing = productsData.find(
    (p) => p.category.toLowerCase() === target.toLowerCase()
  );
  selectCategory(existing ? existing.category : target);
}

/**
 * Make the static "Shop by Category" cards clickable: clicking one calls
 * selectCategory(), which fills and scrolls to the separate Category Products
 * section. The "All Jewellery" card uses the internal ALL_JEWELLERY_KEY to
 * show the whole catalogue. The Featured Products section is never touched.
 */
function wireCategoryCards() {
  document.querySelectorAll(".category-card").forEach((card) => {
    if (card.dataset.wired) return;
    card.dataset.wired = "1";
    const nameEl = card.querySelector(".category-card__name");
    card.dataset.categoryName = nameEl ? nameEl.textContent.trim() : "";
    // A11y: expose as a button and activate via Enter/Space too.
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.addEventListener("click", () => {
      selectCategory(
        card.hasAttribute("data-all-jewellery")
          ? ALL_JEWELLERY_KEY
          : card.dataset.categoryName
      );
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });
}

/**
 * Wire the header navigation (mega-menu jewellery-type items + the secondary
 * nav) into the Category Products system:
 *   - a category name → enterCategory() → selectCategory() → Category section
 *   - "All Jewellery" → shows the FULL catalogue (like the All Jewellery card)
 */
function wireNavCategoryLinks() {
  // Mega-menu jewellery-type items.
  document.querySelectorAll(".mega-menu__item").forEach((item) => {
    if (item.dataset.wiredNav) return;
    item.dataset.wiredNav = "1";
    const nameEl = item.querySelector(".mega-menu__item-name");
    const label = nameEl ? nameEl.textContent.trim() : "";
    item.addEventListener("click", (event) => {
      event.preventDefault();
      if (/^all jeweller/i.test(label)) {
        selectCategory(ALL_JEWELLERY_KEY);
        return;
      }
      enterCategory(label);
    });
  });

  // Secondary-nav links that map to "All Jewellery" or a real category.
  document
    .querySelectorAll(".secondary-nav__list li a")
    .forEach((link) => {
      if (link.dataset.wiredNav) return;
      link.dataset.wiredNav = "1";
      const label = link.textContent.trim();

      if (/^all jeweller/i.test(label)) {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          selectCategory(ALL_JEWELLERY_KEY);
        });
        return;
      }

      const matched = productsData.find(
        (p) => p.category.toLowerCase() === label.toLowerCase()
      );
      if (matched) {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          selectCategory(matched.category);
        });
      }
      // Links that match no real category (Gold, Diamond, etc.) keep their
      // original behaviour: they simply scroll to the Shop by Category grid.
    });
}

/**
 * Replace the placeholder "N Designs" texts on the Shop by Category cards
 * with the real product counts from data/products.json, filtered by the
 * active metal mode (gold / silver).
 */
function updateCategoryCardCounts() {
  document.querySelectorAll(".category-card").forEach((card) => {
    const countEl = card.querySelector(".category-card__count");
    if (!countEl) return;
    let count;
    if (card.hasAttribute("data-all-jewellery")) {
      count = productsData.filter((p) => p.metal === activeMetal).length;
    } else {
      const name = (card.dataset.categoryName || "").toLowerCase();
      count = productsData.filter(
        (p) => p.metal === activeMetal && p.category.toLowerCase() === name
      ).length;
    }
    countEl.textContent = `${count} ${count === 1 ? "Design" : "Designs"}`;
  });
}

/**
 * Build the inner HTML for a single product card.
 * @param {Object} product - one entry from data/products.json
 * @param {number} index - used for staggered animation delays
 * @returns {string} card HTML
 */
function productCardHTML(product, index) {
  const price =
    `<span class="product-card__price">${product.price}` +
    (product.oldPrice ? ` <s>${product.oldPrice}</s>` : "") +
    `</span>`;

  const badge = product.badge
    ? `<span class="product-card__badge">${product.badge}</span>`
    : "";

  // Draw the real product photo once `img` is set; before then show a dashed
  // placeholder labelled with the suggested file name (`imgFile`).
  const imageHtml = product.img
    ? `<img class="product-card__image" src="${product.img}" alt="${product.name}" loading="lazy" />`
    : `
      <div class="product-card__image product-card__image--placeholder" aria-hidden="true">
        <span class="hero__placeholder-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="9" cy="10" r="1.6"/>
            <path d="M4.5 17.5l4.5-4.2 3 2.8 3.2-3 4.3 4.4"/>
          </svg>
        </span>
        <span class="hero__placeholder-title">Photo</span>
        <span class="hero__placeholder-hint">${product.imgFile}</span>
      </div>`;

  return `
    <article class="product-card reveal" style="transition-delay: ${(index % 3) * 0.08}s">
      <div class="product-card__media">
        ${badge}
        ${imageHtml}
      </div>
      <div class="product-card__body">
        <p class="product-card__category">${product.category}</p>
        <h3 class="product-card__name">${product.name}</h3>
        ${price}
      </div>
    </article>`;
}

/**
 * Fetch the catalogue from PRODUCTS_URL and render both independent views.
 * If the file cannot be read (e.g. the page was opened directly from disk,
 * where browsers block fetch on file://), show a short note instead of a
 * broken grid.
 */
async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    productsData = await response.json();
    featuredGrid.dataset.productCount = String(productsData.length);
  } catch (error) {
    featuredGrid.innerHTML =
      `<p class="products__empty">Couldn't load the collection. ` +
      "Open this site through a local server (e.g. <code>python -m " +
      "http.server 8000</code> → http://localhost:8000) so the products " +
      "file can be read.</p>";
    featuredLoadMoreBtn.style.display = "none";
    return;
  }

  productsLoaded = true;
  wireCategoryCards();
  wireNavCategoryLinks();
  updateCategoryCardCounts();
  applyFeaturedSearch("");
}

// Live-filter the Category Products (Collection) view from the header search
// box. Typing enters "All Jewellery" collection mode so results match across
// the whole catalogue.
const headerSearch = document.querySelector(".header__search input");
const collectionSection = document.getElementById("categoryProducts");
if (headerSearch) {
  let scrollTimer = null;
  headerSearch.addEventListener("input", (event) => {
    applyCategorySearch(event.target.value);

    // After typing a term, glide down to the Category Products grid so the
    // matching names/categories are actually visible.
    if (event.target.value.trim() && collectionSection) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        collectionSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    }
  });
}

/* Initial render + load-more handlers for BOTH independent grids. */


/* ==========================================================================
   2. DAY / NIGHT MODE
   ========================================================================== */

/** The toggle button in the header (sun/moon SVGs swap via CSS below). */
const themeToggle = document.getElementById("themeToggle");
/** The OS-level colour scheme preference. */
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

/** The theme currently applied on <html data-theme="…">. */
function currentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

/**
 * Apply a theme, sync the button's label/icon and persist the choice.
 * @param {string} theme - "light" or "dark"
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const night = theme === "dark";
  themeToggle.setAttribute("aria-label", night ? "Switch to day mode" : "Switch to night mode");
  themeToggle.setAttribute("aria-pressed", String(night));
  try {
    localStorage.setItem("matri-theme", theme);
  } catch (e) {
    /* Ignore private-mode / quota errors; the toggle still works in-session. */
  }
}

themeToggle.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
});

// Follow the OS preference only until the user picks a theme manually.
prefersDark.addEventListener("change", (event) => {
  let saved;
  try {
    saved = localStorage.getItem("matri-theme");
  } catch (err) {
    saved = null;
  }
  if (!saved) applyTheme(event.matches ? "dark" : "light");
});

// Sync the button with the FOUC-prevention script in <head> on load.
applyTheme(currentTheme());

/* ==========================================================================
   2b. METAL MODE (Gold / Silver)
   ========================================================================== */

/** The floating sidebar toggle container. */
const metalToggle = document.getElementById("metalToggle");

/**
 * Apply a metal mode, sync toggle UI, persist, and re-render all products.
 * @param {string} metal - "gold" or "silver"
 */
function setMetalMode(metal) {
  activeMetal = metal;
  // Sync toggle buttons.
  if (metalToggle) {
    metalToggle.querySelectorAll(".metal-toggle__btn").forEach((btn) => {
      const isActive = btn.dataset.metal === metal;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-checked", String(isActive));
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }
  // Apply to <html> so CSS theme tokens swap.
  document.documentElement.setAttribute("data-metal", metal);
  // Persist across page loads.
  try {
    localStorage.setItem("matri-metal", metal);
  } catch (e) { /* ignore */ }
  // Re-render both product views with the new metal filter.
  refreshAllProducts();
  // Re-sample the carousel so only pieces matching the active metal appear.
  rebuildCarousel();
}

/** Re-render both Featured and Category product views from scratch. */
function refreshAllProducts() {
  // Featured Products
  featuredVisibleProducts = getFeaturedProducts();
  featuredShownCount = 0;
  featuredGrid.innerHTML = "";
  renderFeaturedProducts();
  // Category Products
  categoryVisibleProducts = getCategoryProducts();
  categoryShownCount = 0;
  categoryGrid.innerHTML = "";
  renderCategoryProducts();
  updateCategoryProductsHeading();
  // Update category card product counts.
  updateCategoryCardCounts();
}

/**
 * Decorative accent colours for the pop — the incoming mode's vivid tone,
 * plus (below) the outgoing accent read live from the theme tokens.
 */
const MODE_POP_ACCENTS = {
  gold: "#E6C08A",
  silver: "#C6D2E0",
};

/**
 * Play a "mode pop" transition at the click point. Layers (bottom → top):
 * a radial accent veil, a gloss shine sweep, a centre bloom, three staggered
 * shockwave rings, arcing gravity-embers and spinning sparkle stars — mixed
 * in both the OUTGOING and INCOMING accent colours to sell the swap.
 * Purely decorative: the overlay has pointer-events: none and the element is
 * removed once the longest animation finishes.
 * @param {number} x - client X of the click (centre of the pressed button).
 * @param {number} y - client Y of the click.
 * @param {"gold"|"silver"} metal - the mode being switched TO.
 */
function playModePop(x, y, metal) {
  // Read the outgoing accent from the still-active theme BEFORE the swap,
  // so a few sparks carry the old colour over into the new mode.
  const outgoing =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-gold")
      .trim() || MODE_POP_ACCENTS[activeMetal];
  const incoming = MODE_POP_ACCENTS[metal] || MODE_POP_ACCENTS.gold;

  const overlay = document.createElement("div");
  overlay.className = "mode-pop";
  overlay.style.setProperty("--pop-x", `${x}px`);
  overlay.style.setProperty("--pop-y", `${y}px`);
  overlay.style.setProperty("--pop-color", incoming);
  overlay.style.setProperty("--pop-mix", outgoing);

  /** Randomly pick a particle colour — mixes outgoing & incoming accents. */
  const pick = () => (Math.random() < 0.5 ? outgoing : incoming);

  // Radial accent veil — light radiates from the press point.
  overlay.insertAdjacentHTML("beforeend", '<div class="mode-pop__veil"></div>');
  // Glossy shine sweep across the whole screen.
  overlay.insertAdjacentHTML("beforeend", '<div class="mode-pop__shine"></div>');
  // Bright bloom flash at the press point.
  overlay.insertAdjacentHTML("beforeend", '<div class="mode-pop__bloom"></div>');
  // Triple staggered shockwave rings.
  overlay.insertAdjacentHTML(
    "beforeend",
    '<div class="mode-pop__ring"></div>' +
      '<div class="mode-pop__ring"></div>' +
      '<div class="mode-pop__ring"></div>'
  );
  // Arcing embers — fly outward, then fall under "gravity" (inner <b>).
  const embers = 18;
  for (let k = 0; k < embers; k++) {
    const spark = document.createElement("i");
    const c = pick();
    spark.style.setProperty("--a", `${Math.random() * 360}deg`);
    spark.style.setProperty("--d", `${55 + Math.random() * 70}px`);
    spark.style.setProperty("--drop", `${26 + Math.random() * 44}px`);
    spark.style.background = c;
    spark.style.boxShadow = `0 0 7px ${c}, 0 0 18px ${c}`;
    if (Math.random() < 0.5) {
      spark.style.animationDuration = `${0.7 + Math.random() * 0.3}s`;
    }
    spark.appendChild(document.createElement("b"));
    overlay.appendChild(spark);
  }
  // Spinning sparkle stars twinkling at radiating points.
  const stars = 7;
  for (let k = 0; k < stars; k++) {
    const star = document.createElement("s");
    const c = pick();
    star.style.setProperty("--a", `${Math.random() * 360}deg`);
    star.style.setProperty("--d", `${24 + Math.random() * 52}px`);
    star.style.setProperty("--spin", `${60 + Math.random() * 120}deg`);
    star.style.background = c;
    star.style.boxShadow = `0 0 10px ${c}`;
    star.style.animationDuration = `${0.6 + Math.random() * 0.3}s`;
    overlay.appendChild(star);
  }

  document.body.appendChild(overlay);
  // Remove once the longest animation has finished.
  setTimeout(() => overlay.remove(), 1000);
}

// Listen for toggle clicks (delegated).
metalToggle?.addEventListener("click", (e) => {
  const btn = e.target.closest(".metal-toggle__btn");
  if (!btn) return;
  const metal = btn.dataset.metal;
  if (metal && metal !== activeMetal) {
    const rect = btn.getBoundingClientRect();
    playModePop(rect.left + rect.width / 2, rect.top + rect.height / 2, metal);
    setMetalMode(metal);
  }
});

// Sync the toggle with the FOUC-prevention script in <head> on load.
(function syncMetalToggle() {
  const initial = document.documentElement.getAttribute("data-metal") || "gold";
  activeMetal = initial;
  if (metalToggle) {
    metalToggle.querySelectorAll(".metal-toggle__btn").forEach((btn) => {
      const isActive = btn.dataset.metal === initial;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-checked", String(isActive));
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }
})();

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */

const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");

/**
 * Toggle the mobile nav drawer and sync ARIA attributes.
 * @param {boolean} [force] - optionally force open (true) or closed (false).
 */
function toggleMenu(force) {
  const isOpen =
    typeof force === "boolean" ? force : !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", isOpen);
  hamburger.classList.toggle("is-open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
  // Prevent page scroll while the drawer is open.
  document.body.style.overflow = isOpen ? "hidden" : "";
}

hamburger.addEventListener("click", toggleMenu);

const navClose = document.getElementById("navClose");
// The close button only exists inside the open drawer, so a tap always means
// "shut it".
if (navClose) navClose.addEventListener("click", () => toggleMenu(false));

// Close the drawer automatically when a nav link or category chip is tapped.
nav.addEventListener("click", (event) => {
  if (event.target.classList.contains("nav__link") ||
      event.target.classList.contains("nav__shop-link")) {
    toggleMenu();
  }
});

/* ==========================================================================
   4. SCROLL-BASED UI (header shadow, back-to-top)
   ========================================================================== */

/** The fixed header element. */
const header = document.querySelector(".header");
/** Back-to-top floating button. */
const scrollTopBtn = document.getElementById("scrollTop");

/** Update header & scroll-top visibility based on scroll position. */
function onScroll() {
  const scrolled = window.scrollY > 40;
  header.classList.toggle("is-scrolled", scrolled);
  scrollTopBtn.classList.toggle("is-visible", window.scrollY > 400);
}

window.addEventListener("scroll", onScroll, { passive: true });
// Run once on load so state is correct for pre-scrolled refreshes.
onScroll();

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ==========================================================================
   4b. HERO CAROUSEL (moving slides)
   ========================================================================== */

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hero = document.getElementById("home");
const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const heroDots = Array.from(document.querySelectorAll("[data-hero-dot]"));
/** The sliding track holding the slides; its translateX drives the animation. */
const heroTracks = document.querySelector(".hero__slides");
let heroIndex = 0;
let heroTimer = null;
// How long each slide stays on screen before advancing (ms).
const HERO_INTERVAL = 4000;

/* Preload every hero image up front so a delayed download can never
   leave an empty frame between transitions. */
function heroPreload() {
  heroSlides.forEach((slide) => {
    const sources = slide.querySelectorAll("picture source");
    sources.forEach((source) => {
      const srcset = source.getAttribute("srcset");
      if (srcset) {
        const pre = new Image();
        pre.src = srcset;
      }
    });
    const img = slide.querySelector("img.hero__bg");
    if (img && img.src) {
      const pre = new Image();
      pre.src = img.src;
    }
  });
}

// Pause auto-advance on hover/focus of anything in the hero; resume on leave.
function heroPause() {
  heroStop();
}
function heroResume() {
  heroStart();
}

/** Show the slide at `index` by sliding the track; sync dots + ARIA state. */
function heroShow(index) {
  heroIndex = (index + heroSlides.length) % heroSlides.length;
  heroTracks.style.transform = `translateX(-${heroIndex * 100}%)`;
  heroSlides.forEach((slide, i) => {
    const active = i === heroIndex;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
  });
  heroDots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === heroIndex);
    dot.setAttribute("aria-selected", String(i === heroIndex));
  });
}

function heroNext() {
  heroShow(heroIndex + 1);
}

function heroStart() {
  if (prefersReducedMotion || !hero || heroSlides.length < 2) return;
  heroStop();
  heroTimer = setInterval(heroNext, HERO_INTERVAL);
}

function heroStop() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

// Manual navigation via the dots (then restart the auto-timer).
heroDots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    heroShow(i);
    heroStart();
  });
  // Keep auto-play from firing while a dot is keyboard-focused.
  dot.addEventListener("focus", heroPause);
  dot.addEventListener("blur", heroResume);
});

if (hero && heroSlides.length > 1) {
  hero.addEventListener("mouseenter", heroPause);
  hero.addEventListener("mouseleave", heroResume);
  hero.addEventListener("focusin", heroPause);
  hero.addEventListener("focusout", heroResume);
  document.addEventListener("visibilitychange", () => {
    document.hidden ? heroPause() : heroResume();
  });
  heroPreload();
  heroStart();
}

/* ==========================================================================
   5. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
   ========================================================================== */

/** Elements carrying the .reveal class get faded in on first view. */
const revealEls = [];
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        // Reveal once, then stop watching.
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

/**
 * Attach the observer to every (new) .reveal element.
 */
function observeReveals() {
  /** All .reveal elements not yet observed. */
  const pending = document.querySelectorAll(".reveal:not(.is-observed)");
  pending.forEach((el) => {
    el.classList.add("is-observed");
    revealObserver.observe(el);
    revealEls.push(el);
  });
}

featuredLoadMoreBtn.addEventListener("click", renderFeaturedProducts);
categoryLoadMoreBtn.addEventListener("click", renderCategoryProducts);

// Load the catalogue from data/products.json, then render the grid.
loadProducts();

/* ==========================================================================
   6. NEWSLETTER FORM VALIDATION
   ========================================================================== */

const newsletterForm = document.getElementById("newsletterForm");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterNote = document.getElementById("newsletterNote");

/** Simple email check shared by the newsletter and contact forms. */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

newsletterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isValidEmail(newsletterEmail.value)) {
    newsletterEmail.classList.add("is-error");
    newsletterNote.textContent = "⚠️ Please enter a valid email address.";
    setTimeout(() => newsletterEmail.classList.remove("is-error"), 2500);
    return;
  }

  newsletterNote.textContent = "✅ You're in! Welcome to the Royal Circle.";
  newsletterEmail.value = "";
});

// Clear the error state once the user starts typing again.
newsletterEmail.addEventListener("input", () => {
  newsletterEmail.classList.remove("is-error");
  if (newsletterNote.textContent) newsletterNote.textContent = "";
});

/* ==========================================================================
   7. CONTACT FORM VALIDATION
   ========================================================================== */

const contactForm = document.getElementById("contactForm");

/** Holds runtime validation rules for each field. */
const contactRules = {
  contactName:  (v) => v.trim().length >= 2,
  contactEmail: (v) => isValidEmail(v),
  contactMessage: (v) => v.trim().length >= 10,
};

/**
 * Mark a field valid/invalid and show/hide its error message.
 * @param {string} id - input element id
 * @param {boolean} valid - is the field's value acceptable?
 */
function setFieldState(id, valid) {
  const field = document.getElementById(id);
  const msg = document.querySelector(`[data-error-for="${id}"]`);
  field.classList.toggle("is-error", !valid);
  if (msg) msg.classList.toggle("is-shown", !valid);
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  /** Whether all fields passed validation. */
  let allValid = true;

  Object.keys(contactRules).forEach((id) => {
    const valid = contactRules[id](document.getElementById(id).value);
    setFieldState(id, valid);
    if (!valid) allValid = false;
  });

  if (allValid) {
    // Static demo — replace with a real API/form-backend call in production.
    contactForm.reset();
    // Simple success feedback via a temporary button label change.
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = "✓ Message Sent!";
    setTimeout(() => (submitBtn.textContent = "Send Message"), 2500);
  }
});

// Live re-validation while the user types.
contactForm.addEventListener("input", (event) => {
  const id = event.target.id;
  if (contactRules[id]) {
    setFieldState(id, contactRules[id](event.target.value));
  }
});

/* ==========================================================================
   8. FOOTER YEAR
   ========================================================================== */

/** Keep the copyright year current automatically. */
document.getElementById("year").textContent = new Date().getFullYear();

/* ==========================================================================
   9. JEWELLERY CAROUSEL (vertical looping, 2 columns opposite directions)
   ========================================================================== */

/**
 * The carousel draws its photos from the product catalogue in
 * `data/products.json` — every product with a usable image becomes a
 * candidate. Each page load re-shuffles that pool and shows a fresh sample,
 * so returning visitors see different pieces.
 *
 * These bundled photos are only a fallback, used when the catalogue has no
 * loadable images yet, so the frame is never empty.
 */
const JEWELLERY_FALLBACK_IMAGES = [
  { src: "assets/images/GE_33.png", alt: "Elegant earrings" },
  { src: "assets/images/GC_50.png", alt: "Gold chain" },
  { src: "assets/images/GE_36.png", alt: "Designer earrings" },
  { src: "assets/images/GE_37.png", alt: "Pearl earrings" },
];

/** Most photos to put in the mix (4 per column). Caps the pool so the frame
 *  stays a calm sample rather than racing through the whole catalogue. */
const CAROUSEL_MAX_IMAGES = 8;

/** Seconds each card takes to pass through the frame. */
const CAROUSEL_SECONDS_PER_CARD = 12.5;

/** Resolve a product's image path: the real photo (`img`) when set,
 *  otherwise the suggested file name (`imgFile`) inside assets/images/. */
function productImageSrc(product) {
  if (product.img) return product.img;
  if (product.imgFile) return `assets/images/${product.imgFile}`;
  return "";
}

/** Resolves true/false once we know whether an image path actually loads. */
function imageLoads(src) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = src;
  });
}

/** Fisher-Yates shuffle — returns a new array, leaves the input alone. */
function shuffleList(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Assemble a random sample of photos: catalogue images first, then the
 * bundled fallbacks, then anything that fails to load is dropped.
 *
 * Products are filtered by the current metal mode (gold/silver) when
 * available. If too few products exist for the active metal, the pool
 * backfills from the opposite metal so the frame is never starved.
 *
 * @returns {Promise<Array<{src: string, alt: string}>>}
 */
async function collectCarouselImages() {
  const seen = new Set();
  const candidates = [];
  let productsByMetal = { gold: [], silver: [] };

  const add = (src, alt) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    candidates.push({ src, alt: alt || "Jewellery" });
  };

  try {
    const response = await fetch(PRODUCTS_URL);
    if (response.ok) {
      const products = await response.json();
      products.forEach((product) => {
        const metal = product.metal || "gold";
        productsByMetal[metal].push(product);
      });
    }
  } catch (_) {
    /* Catalogue unreachable (e.g. opened over file://) — the bundled
       photos below still fill the frame. */
  }

  const currentMetal = activeMetal || "gold";
  const otherMetal = currentMetal === "gold" ? "silver" : "gold";

  // Primary: all products matching the active metal.
  productsByMetal[currentMetal].forEach((product) =>
    add(productImageSrc(product), product.name)
  );

  // Backfill: if the active metal has fewer than CAROUSEL_MAX_IMAGES
  // catalogue entries, pull from the other metal to avoid a sparse frame.
  if (candidates.length < CAROUSEL_MAX_IMAGES) {
    productsByMetal[otherMetal].forEach((product) =>
      add(productImageSrc(product), product.name)
    );
  }

  JEWELLERY_FALLBACK_IMAGES.forEach((image) => add(image.src, image.alt));

  const checked = await Promise.all(
    candidates.map(async (candidate) =>
      (await imageLoads(candidate.src)) ? candidate : null
    )
  );

  return shuffleList(checked.filter(Boolean)).slice(0, CAROUSEL_MAX_IMAGES);
}

/**
 * Build one column's looping track. The set is added twice so the loop is
 * seamless; `--carousel-set` tells the CSS keyframes how far to shift.
 * @param {Array} images - photos for this column
 * @param {"up"|"down"} direction - scroll direction
 */
function buildCarouselTrack(images, direction) {
  const track = document.createElement("div");
  track.className = `jewellery-carousel__track jewellery-carousel__track--${direction}`;
  track.style.setProperty("--carousel-set", images.length);
  track.style.setProperty(
    "--carousel-duration",
    `${(images.length * CAROUSEL_SECONDS_PER_CARD).toFixed(1)}s`
  );

  [...images, ...images].forEach((image, index) => {
    const imgEl = document.createElement("img");
    imgEl.src = image.src;
    imgEl.alt = image.alt;
    imgEl.className = "jewellery-carousel__item";
    // The second copy only exists to hide the loop seam — keep it out of the
    // accessibility tree.
    if (index >= images.length) imgEl.setAttribute("aria-hidden", "true");
    track.appendChild(imgEl);
  });

  return track;
}

/**
 * Build both vertical carousel columns from a fresh random sample of the
 * catalogue.
 */
async function initJewelleryCarousel() {
  const carousel = document.getElementById("jewelleryCarousel");
  if (!carousel) return;

  const columns = carousel.querySelectorAll("[data-carousel-column]");
  if (columns.length !== 2) return;

  const images = await collectCarouselImages();
  if (images.length === 0) return;

  // Alternate photos between the columns so each side reads differently.
  const leftImages = images.filter((_, i) => i % 2 === 0);
  const rightImages = images.filter((_, i) => i % 2 === 1);

  columns[0].appendChild(buildCarouselTrack(leftImages, "up"));
  columns[1].appendChild(
    buildCarouselTrack(rightImages.length ? rightImages : leftImages, "down")
  );
}

/** Clear both columns and rebuild the carousel with a fresh metal-filtered
 *  sample. Called by setMetalMode() whenever the user switches metals. */
async function rebuildCarousel() {
  const carousel = document.getElementById("jewelleryCarousel");
  if (!carousel) return;
  const columns = carousel.querySelectorAll("[data-carousel-column]");
  columns.forEach((col) => (col.innerHTML = ""));
  await initJewelleryCarousel();
  sizeJewelleryCarousel();
}

/**
 * Size the carousel frame so it always shows exactly 2 whole cards per
 * column (4 pictures total) without cropping. Sets --carousel-item-h to a
 * column's width × the photos' aspect ratio, which the CSS uses for the
 * frame height and the seamless loop offset. Re-runs on resize / load.
 */
function sizeJewelleryCarousel() {
  const carousel = document.getElementById("jewelleryCarousel");
  if (!carousel) return;

  const columns = carousel.querySelectorAll("[data-carousel-column]");
  if (columns.length !== 2) return;

  // All carousel photos share one aspect ratio; read it from the first card,
  // defaulting to 3:4 until the image is actually loaded.
  const firstItem = carousel.querySelector(".jewellery-carousel__item");
  let heightPerWidth = 4 / 3;
  if (firstItem && firstItem.naturalWidth) {
    heightPerWidth = firstItem.naturalHeight / firstItem.naturalWidth;
  }

  const columnWidth = columns[0].clientWidth;
  if (columnWidth > 0) {
    carousel.style.setProperty(
      "--carousel-item-h",
      `${(columnWidth * heightPerWidth).toFixed(1)}px`
    );
  }
}

// Wrap the "Shop by Category" cards into category filters.
wireCategoryCards();

// Build the carousel from a fresh random sample, then size the frame.
initJewelleryCarousel().then(sizeJewelleryCarousel);

// Keep the frame sized correctly across resize, and refine once images load.
let carouselResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(carouselResizeTimer);
  carouselResizeTimer = setTimeout(sizeJewelleryCarousel, 150);
});
window.addEventListener("load", sizeJewelleryCarousel);

/* ==========================================================================
   10. WHY CHOOSE US — CINEMATIC FEATURES CAROUSEL
   ========================================================================== */

/** Auto-advance interval (ms) between slides. */
const FEATURES_INTERVAL = 5500;

(function initFeaturesCarousel() {
  const section = document.querySelector(".features-carousel");
  if (!section) return;

  const slides = section.querySelectorAll(".features-carousel__slide");
  const dots = section.querySelectorAll(".features-carousel__dot");
  const currentEl = section.querySelector(".features-carousel__current");
  const platformPrefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (slides.length === 0) return;

  let active = 0;
  let timer = null;

  /** Switch the carousel to slide `index`, wrapping around. */
  function goTo(index) {
    const count = slides.length;
    active = ((index % count) + count) % count;

    slides.forEach((slide, i) => {
      slide.classList.toggle("features-carousel__slide--active", i === active);
    });
    dots.forEach((dot, i) => {
      const on = i === active;
      dot.classList.toggle("features-carousel__dot--active", on);
      dot.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (currentEl) {
      currentEl.textContent = String(active + 1).padStart(2, "0");
    }
  }

  function startAuto() {
    if (timer !== null || platformPrefersReducedMotion) return;
    timer = setInterval(() => goTo(active + 1), FEATURES_INTERVAL);
  }

  function stopAuto() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Dot navigation (click/drag ripple-safe).
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      stopAuto();
      goTo(Number(dot.dataset.slide));
      startAuto();
    });
  });

  // Pause while the pointer is over the section (reader-friendly).
  // section.addEventListener("mouseenter", stopAuto);
  // section.addEventListener("mouseleave", startAuto);
  // section.addEventListener("touchstart", stopAuto, { passive: true });

  // Only resume auto-advance once the section is actually on screen.
  let hasStarted = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!hasStarted) {
          hasStarted = true;
          goTo(0);
        }
        startAuto();
      } else {
        stopAuto();
      }
    });
  }, { threshold: 0.25 });
  observer.observe(section);

  // Start immediately if already in view on load.
  if (section.getBoundingClientRect().top < window.innerHeight) {
    goTo(0);
    startAuto();
  }

  // Keyboard: left/right arrows step the carousel.
  section.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      stopAuto();
      goTo(active + 1);
      startAuto();
    } else if (event.key === "ArrowLeft") {
      stopAuto();
      goTo(active - 1);
      startAuto();
    }
  });
})();

/* ==========================================================================
   11. FLUENT TYPOGRAPHY — rotating typewriter placeholder in the search bar
   ========================================================================== */

/** Hints the placeholder types through, in order. */
const SEARCH_HINTS = [
  "Search rings…",
  "Search necklaces…",
  "Search earrings…",
  "Search bangles…",
  "Search by name or category…",
];

const FLUENT_DEFAULT_HINT = SEARCH_HINTS[SEARCH_HINTS.length - 1];

(function initFluentSearchTypewriter() {
  const input = document.querySelector(".header__search input");
  if (!input) return;

  const reducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Respect reduced-motion — keep the static placeholder only.
  if (reducedMotion) return;

  /** ▍ renders like a writing cursor inside a placeholder. */
  const CARET = "▍";

  let hintIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer = null;
  let blinkTimer = null;
  let caretHidden = false;

  const TYPE_MS = 55;    // speed of typing each character
  const ERASE_MS = 26;   // speed of erasing each character
  const HOLD_MS = 2000;  // pause with the full hint on screen
  const BLINK_MS = 520;  // caret blink interval while holding

  function render() {
    const hint = SEARCH_HINTS[hintIndex];
    const text = hint.slice(0, charIndex);
    input.placeholder = text + (deleting || caretHidden ? "" : CARET);
  }

  function stopTimers() {
    clearTimeout(timer);
    clearInterval(blinkTimer);
    timer = null;
    blinkTimer = null;
  }

  /** Erase & restart the current hint from scratch. */
  function restart() {
    stopTimers();
    deleting = true;
    charIndex = SEARCH_HINTS[hintIndex].length;
    tick();
  }

  function tick() {
    const hint = SEARCH_HINTS[hintIndex];

    // Pause entirely while the user is focused on (or typing in) the field.
    if (document.activeElement === input || input.value) {
      stopTimers();
      return;
    }

    clearInterval(blinkTimer);
    blinkTimer = null;
    caretHidden = false;

    if (!deleting) {
      if (charIndex < hint.length) {
        charIndex += 1;
        render();
        timer = setTimeout(tick, TYPE_MS);
      } else {
        // Hold the full hint on screen and blink the caret.
        render();
        blinkTimer = setInterval(() => {
          caretHidden = !caretHidden;
          render();
        }, BLINK_MS);
        deleting = true;
        timer = setTimeout(tick, HOLD_MS);
        return;
      }
    } else {
      if (charIndex > 0) {
        charIndex -= 1;
        render();
        timer = setTimeout(tick, ERASE_MS);
      } else {
        hintIndex = (hintIndex + 1) % SEARCH_HINTS.length;
        charIndex = 1;
        deleting = false;
        render();
        timer = setTimeout(tick, TYPE_MS);
      }
    }
  }

  // User takes over — freeze on the static hint so it's easy to read.
  input.addEventListener("focus", () => {
    stopTimers();
    input.placeholder = FLUENT_DEFAULT_HINT;
  });

  // Left empty again — let the typewriter take back over.
  input.addEventListener("blur", () => {
    stopTimers();
    if (!input.value) restart();
  });

  // Typed (or cleared) — restart the cycle if the box is now empty.
  input.addEventListener("input", () => {
    if (!input.value) restart();
  });

  // Kick off the animation (unless the page loads already focused).
  if (document.activeElement !== input && !input.value) {
    restart();
  }
})();

/* ==========================================================================
   10. SCROLL PROGRESS RIBBON
   --------------------------------------------------------------------------
   A thin gradient bar fixed to the top of the viewport, filled left→right
   as the user scrolls. Gradient auto-matches the active metal mode via CSS.
   ========================================================================== */

(function initScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = document.documentElement.clientHeight;
    const maxScroll = docHeight - viewHeight;
    const pct = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
    bar.style.transform = `scaleX(${pct.toFixed(4)})`;
  }

  window.addEventListener("scroll", update, { passive: true });
  // Run once on load so it's correct for pre-scrolled refreshes.
  update();

/* ==========================================================================
   13. CATEGORIES LOAD MORE
   ========================================================================== */
(function initCategoriesLoadMore() {
  const btn = document.getElementById("categoriesLoadMore");
  const grid = document.querySelector(".categories__grid");
  if (!btn || !grid) return;

  btn.addEventListener("click", () => {
    const expanded = grid.classList.toggle("is-expanded");
    btn.textContent = expanded ? "Show Less" : "Load More Categories";
    // Scroll smoothly back to the grid top when collapsing
    if (!expanded) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();
})();