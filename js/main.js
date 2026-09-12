/* ==========================================================================
   MATRI JEWELLERS - main.js
   --------------------------------------------------------------------------
   Handles all client-side interactivity:
     1.  Product catalogue (data + dynamic card rendering + "load more")
     2.  Shopping-cart counter (demo)
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
 * Product data for the featured grid.
 * NOTE: `img` points to SVG placeholders in /assets/images.
 * Swap these for real product photos in production.
 */
const PRODUCT_DATA = [
  {
    name: "Royale Diamond Necklace",
    category: "Necklaces",
    price: "₹ 89,999",
    oldPrice: "₹ 1,09,999",
    badge: "Bestseller",
    img: "assets/images/product-necklace.svg",
  },
  {
    name: "Crimson Kundan Ring",
    category: "Rings",
    price: "₹ 24,499",
    oldPrice: "",
    badge: "",
    img: "assets/images/product-ring.svg",
  },
  {
    name: "Morning Dew Earrings",
    category: "Earrings",
    price: "₹ 15,999",
    oldPrice: "₹ 19,999",
    badge: "Sale",
    img: "assets/images/product-earrings.svg",
  },
  {
    name: "Heritage Temple Bangle",
    category: "Bangles",
    price: "₹ 48,750",
    oldPrice: "",
    badge: "Handcrafted",
    img: "assets/images/product-bangle.svg",
  },
  {
    name: "Aureate Pendant Set",
    category: "Pendants",
    price: "₹ 32,400",
    oldPrice: "₹ 39,999",
    badge: "Sale",
    img: "assets/images/product-pendant.svg",
  },
  {
    name: "Blossom Rose Stud Set",
    category: "Earrings",
    price: "₹ 9,999",
    oldPrice: "",
    badge: "",
    img: "assets/images/product-stud.svg",
  },
  {
    name: "Empress Diamond Bangle",
    category: "Bangles",
    price: "₹ 1,25,000",
    oldPrice: "",
    badge: "Limited",
    img: "assets/images/product-bangle-2.svg",
  },
  {
    name: "Gilded Temple Choker",
    category: "Necklaces",
    price: "₹ 65,800",
    oldPrice: "₹ 78,000",
    badge: "Bestseller",
    img: "assets/images/product-choker.svg",
  },
  {
    name: "Vintage Solitaire Ring",
    category: "Rings",
    price: "₹ 42,900",
    oldPrice: "",
    badge: "",
    img: "assets/images/product-ring-2.svg",
  },
];

/** How many cards are rendered per "page" before Load More appears. */
const PRODUCTS_PER_PAGE = 6;

/** DOM references for the product section. */
const productsGrid = document.getElementById("productsGrid");
const loadMoreBtn = document.getElementById("loadMoreBtn");

/* Keep track of how many products are currently shown. */
let shownCount = 0;

/**
 * Build the inner HTML for a single product card.
 * @param {Object} product - one entry from PRODUCT_DATA
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

  return `
    <article class="product-card reveal" style="transition-delay: ${(index % 3) * 0.08}s">
      <div class="product-card__media">
        ${badge}
        <img class="product-card__image" src="${product.img}" alt="${product.name}" loading="lazy" />
        <button class="product-card__quick-add" data-add-name="${product.name}">
          + Quick Add
        </button>
      </div>
      <div class="product-card__body">
        <p class="product-card__category">${product.category}</p>
        <h3 class="product-card__name">${product.name}</h3>
        ${price}
      </div>
    </article>`;
}

/**
 * Render the next slice of products into the grid.
 */
function renderProducts() {
  const slice = PRODUCT_DATA.slice(shownCount, shownCount + PRODUCTS_PER_PAGE);
  const html = slice.map(productCardHTML).join("");
  productsGrid.insertAdjacentHTML("beforeend", html);
  shownCount += slice.length;

  // Re-observe newly injected cards so their reveal animation fires.
  observeReveals();

  // Hide the button once everything is on screen.
  if (shownCount >= PRODUCT_DATA.length) {
    loadMoreBtn.style.display = "none";
  }
}

/* Initial render + load-more handler. */


/* ==========================================================================
   2. SHOPPING CART COUNTER (demo)
   ========================================================================== */

/** Cart badge element and its numeric value. */
const cartCountEl = document.getElementById("cartCount");
let cartItems = 0;

/**
 * Increment the demo cart counter (optionally by a given amount of items).
 * @param {number} n - number of items to add
 */
function addToCart(n = 1) {
  cartItems += n;
  cartCountEl.textContent = cartItems;
}

// Event delegation: "Quick Add" buttons on cards bump the cart counter.
// Also give visual feedback by briefly styling the clicked button.
productsGrid.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-add-name]");
  if (!btn) return;

  addToCart(1);

  const original = btn.textContent;
  btn.textContent = "✓ Added!";
  btn.style.background = "var(--color-gold)";
  btn.style.color = "#fff";

  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = "";
    btn.style.color = "";
  }, 1200);
});

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */

const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");

/** Open/close the mobile nav drawer and sync ARIA attributes. */
function toggleMenu() {
  const isOpen = nav.classList.toggle("is-open");
  hamburger.classList.toggle("is-open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
  // Prevent page scroll while the drawer is open.
  document.body.style.overflow = isOpen ? "hidden" : "";
}

hamburger.addEventListener("click", toggleMenu);

// Close the drawer automatically when a nav link is tapped (mobile only).
nav.addEventListener("click", (event) => {
  if (event.target.classList.contains("nav__link")) {
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

observeReveals();
renderProducts();
loadMoreBtn.addEventListener("click", renderProducts);

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