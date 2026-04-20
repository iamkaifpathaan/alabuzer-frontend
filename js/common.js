/* ================================
   🌐 API CONFIGURATION
================================ */

const _API_BASE = (typeof window !== "undefined" && window.location.hostname === "localhost")
  ? "http://localhost:5000"
  : "https://alabuzer-backend.onrender.com";

/* ================================
   📡 API WRAPPER
================================ */

async function apiCall(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(_API_BASE + endpoint, options);
  return res.json();
}

/* ================================
   ✅ VALIDATORS
================================ */

const Validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[6-9]\d{9}$/.test(phone),
  password: (pwd) => pwd.length >= 8,
  otp: (otp) => /^\d{4,6}$/.test(otp),
  pincode: (pin) => /^[0-9]{6}$/.test(pin)
};

/* ================================
   🃏 UI BUILDERS
================================ */

/* ================================
   💰 PRICE DISPLAY HELPER
================================ */

function buildPriceHtml(product) {
  if (product.discountPrice && product.discountPrice < product.price) {
    const pct = Math.round((1 - product.discountPrice / product.price) * 100);
    return `<span class="price-current">₹${product.discountPrice}</span><span class="price-original">₹${product.price}</span><span class="price-badge">${pct}% OFF</span>`;
  }
  return `₹${product.price}`;
}

function createProductCard(product, onClickFn) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${product.images?.[0] || ''}" alt="${product.name}" loading="lazy">
    <div class="name">${product.name}</div>
    <div class="price">${buildPriceHtml(product)}</div>
  `;
  if (onClickFn) div.onclick = () => onClickFn(product);
  return div;
}

let allProducts = [];

async function loadGlobalProducts(){

  try{
    const data = await apiCall("/api/products");

    if(data.success){
      allProducts = data.data.filter(p => p.isActive !== false);
    }

  }catch(err){
    console.error("Global product load failed");
  }

}

// ===============================
// 🛒 GLOBAL CART ENGINE (STABLE)
// ===============================

// Keep globals minimal
window.selectedQty = window.selectedQty || 1;
window.currentSlug = window.currentSlug || null;

/* ===============================
   🛒 CART ENGINE
================================ */

function getCart(){
  try{
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  }catch{
    return [];
  }
}

function resetTransition(){
  const t = document.getElementById("pageTransition");
  if(!t) return;

  t.classList.remove("active");
}

function setCart(cart){
  if(!Array.isArray(cart)) cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function getCartItem(slug){
  if(!slug) return null;
  return getCart().find(item => item.slug === slug);
}

function upsertCartItem(product, qty){
  if(!product || !product.slug) return;

  qty = Number(qty) || 1;
  qty = Math.max(1, Math.min(qty, 10));

  let cart = getCart();
  const existing = cart.find(i => i.slug === product.slug);

  if(existing){
    existing.qty = qty;
  } else {
    cart.push({
      slug: product.slug,
      qty
    });
  }

  cart = cart.filter(i => i.qty > 0);
  setCart(cart);
  showCartButton();
}

function updateCartCount(){
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  const el = document.getElementById("cartCount");
  if(el) el.innerText = totalQty;
}

/* ===============================
   📂 MENU ENGINE
================================ */

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");
  const hamburger = document.querySelector(".hamburger");

  if (!menu) return;

  const isOpen = menu.classList.toggle("active");
  overlay?.classList.toggle("active", isOpen);

  // Body scroll lock
  document.body.style.overflow = isOpen ? "hidden" : "";

  // ARIA
  if (hamburger) {
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    hamburger.classList.toggle("open", isOpen);
  }
  menu.setAttribute("aria-hidden", isOpen ? "false" : "true");

  // focus first item when opened
  if (isOpen) {
    setTimeout(() => {
      const firstLink = menu.querySelector("a, [tabindex]");
      firstLink?.focus();
    }, 380);
  }
}

function closeMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");
  const hamburger = document.querySelector(".hamburger");

  if (!menu || !menu.classList.contains("active")) return;

  menu.classList.remove("active");
  overlay?.classList.remove("active");
  document.body.style.overflow = "";

  if (hamburger) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.classList.remove("open");
  }
  menu.setAttribute("aria-hidden", "true");
}

function toggleProducts() {
  const menu = document.getElementById("productSubmenu");
  const menuItem = document.querySelector(".menu-item[onclick*='toggleProducts']");

  if (!menu) return;

  const open = menu.style.display === "block";
  menu.style.display = open ? "none" : "block";

  // toggle open class on menu-item for arrow rotation
  menuItem?.classList.toggle("open", !open);
}

/* ===============================
   🚀 NAVIGATION ENGINE
================================ */

function navigateWithTransition(url) {
  // Close side menu if open
  closeMenu();

  const t = document.getElementById("pageTransition");

  if (!t) {
    window.location.href = url;
    return;
  }

  // reset first
  t.classList.remove("active");

  // force reflow
  void t.offsetWidth;

  // trigger animation
  t.classList.add("active");

  setTimeout(() => {
    window.location.href = url;
  }, 500);
}

function goHome(){ navigateWithTransition("index.html"); }
function goToCart(){ navigateWithTransition("cart.html"); }
function goToLogin(){ navigateWithTransition("login.html"); }
function goToProfile(){ navigateWithTransition("profile.html"); }

/* navigate to index with a category filter from any page */
function filterCategory(category) {
  const isIndex = window.location.pathname.endsWith("index.html") ||
                  window.location.pathname === "/" ||
                  window.location.pathname.endsWith("/");

  if (isIndex && typeof window._filterCategoryLocal === "function") {
    closeMenu();
    window._filterCategoryLocal(category);
  } else {
    navigateWithTransition("index.html?category=" + encodeURIComponent(category));
  }
}

function goBack(){
  window.history.back();
}

function goToOrders(){

  const user = getUserSafe();

  if(!user){
    alert("Please login to track your order");
    navigateWithTransition("login.html");
    return;
  }

  // send tab info using URL
  navigateWithTransition("profile.html?tab=orders");
}

/* ===============================
   👤 USER ENGINE
================================ */

function getUserSafe(){
  try{
    const raw = localStorage.getItem("user");
    if(!raw || raw === "null") return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

function updateUserUI(){
  const user = getUserSafe();
  const area = document.getElementById("userArea");
  if(!area) return;

  if(user){

    if(user.role === "admin"){
      area.innerHTML = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="8" r="4" stroke="#d4af37" stroke-width="2"/>
  <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="#d4af37" stroke-width="2"/>
</svg>
`;
      area.onclick = () => navigateWithTransition("admin.html");
      return;
    }

    area.innerHTML = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="8" r="4" stroke="#d4af37" stroke-width="2"/>
  <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="#d4af37" stroke-width="2"/>
</svg>
`;
    area.onclick = goToProfile;

  }else{
    area.innerHTML = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="8" r="4" stroke="#d4af37" stroke-width="2"/>
  <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="#d4af37" stroke-width="2"/>
</svg>
`;
    area.onclick = goToLogin;
  }
}

/* ===============================
   📦 STOCK CHECK
================================ */

function isProductPurchasable(product){
  if(!product) return false;
  if(product.isActive === false) return false;
  if(product.trackStock === false) return true;
  if(product.stock > 0) return true;
  if(product.allowBackorder) return true;
  return false;
}

/* ===============================
   ❤️ WISHLIST ENGINE (USER BASED)
================================ */

function getWishlist(){
  const user = getUserSafe();
  if(!user) return [];

  const key = "wishlist_" + user._id;

  try{
    return JSON.parse(localStorage.getItem(key)) || [];
  }catch{
    return [];
  }
}

function setWishlist(list){
  const user = getUserSafe();
  if(!user) return;

  const key = "wishlist_" + user._id;
  localStorage.setItem(key, JSON.stringify(list));
}

function isWishlisted(slug){
  return getWishlist().some(i => i.slug === slug);
}

function toggleWishlist(product){
  if(!product || !product.slug) return;

  let list = getWishlist();
  const exists = list.find(i => i.slug === product.slug);

  if(exists){
    list = list.filter(i => i.slug !== product.slug);
  }else{
    list.push({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0]
    });
  }

  setWishlist(list);
}

function showCartButton(){

  const cart = getCart();
  if(!cart.length) return;

  const btn = document.getElementById("goToCartBtn");
  if(!btn) return;

  // 🔥 save time
  localStorage.setItem("cartBtnTime", Date.now());

  btn.classList.add("show");
}

/* ===============================
   🔐 ADMIN GUARD
================================ */

function adminGuard(){
  const user = getUserSafe();
  if(!user || user.role !== "admin"){
    alert("Access Denied");
    navigateWithTransition("index.html");
  }
}

/* ===============================
   📱 MOBILE SCROLL CARD EFFECT
================================ */

function mobileCardHighlight(){

  if(window.innerWidth > 768) return;

  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if(entry.isIntersecting){
        entry.target.classList.add("active");
      }else{
        entry.target.classList.remove("active");
      }

    });

  },{
    threshold:0.3
  });

  cards.forEach(card => observer.observe(card));
}

function openSearch(){
  const overlay = document.getElementById("searchOverlay");

  if(!overlay){
    console.error("Search overlay not found");
    return;
  }

  overlay.style.display = "flex";
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "auto";

  setTimeout(()=>{
    document.getElementById("searchOverlayInput")?.focus();
  },100);
}

function closeSearch(){
  const overlay = document.getElementById("searchOverlay");
  if(!overlay) return;

  overlay.style.display = "none";
}

function handleSearchOverlay(){

  const query = document
    .getElementById("searchOverlayInput")
    .value
    .toLowerCase();

  const resultsBox = document.getElementById("searchResults");

  if(!query){
    resultsBox.innerHTML = "";
    return;
  }

  const filtered = allProducts
    .filter(p => p.name.toLowerCase().includes(query))
    .slice(0,6);

  resultsBox.innerHTML = filtered.map(p => `
    <div class="search-item"
      onclick="handleSearchClick('${p.slug}')">

      <img src="${p.images?.[0]}" 
        style="width:40px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px">

      <div>
        <div>${p.name}</div>
        <div style="font-size:13px">${buildPriceHtml(p)}</div>
      </div>

    </div>
  `).join("");

}

function handleSearchClick(slug){

  // 🔒 close overlay first
  const overlay = document.getElementById("searchOverlay");
  if(overlay) overlay.style.opacity = "0";;

  // 🧠 optional: clear results
  document.getElementById("searchResults").innerHTML = "";

  // 🚀 transition ke sath navigation
  setTimeout(()=>{
    navigateWithTransition(`product.html?slug=${slug}`);
  }, 100); // 🔥 small delay = smooth feel

}

function initCartButton(){

  const btn = document.getElementById("goToCartBtn");
  if(!btn) return;

  const savedTime = localStorage.getItem("cartBtnTime");
  if(!savedTime) return;

  const diff = Date.now() - Number(savedTime);

  // 🔥 10 seconds = 10000 ms
  if(diff < 10000){

    // ❌ hide on cart/checkout
    const path = window.location.pathname;

    if(path.includes("cart") || path.includes("checkout")){
      return;
    }

    btn.classList.add("show");

    // remaining time
    setTimeout(()=>{
      btn.classList.remove("show");
    }, 10000 - diff);

  }else{
    localStorage.removeItem("cartBtnTime");
  }
}


document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("searchInput");

  if(searchInput){
    searchInput.addEventListener("input", function(){

      const query = this.value.toLowerCase();
      const box = document.getElementById("searchResults");

      if(!query){
        box.innerHTML = "";
        return;
      }

      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query)
      ).slice(0,6);

      box.innerHTML = filtered.map(p => `
        <div class="search-item"
          onclick="navigateWithTransition('product.html?slug=${p.slug}')">

          <img src="${p.images?.[0]}">
          <div>
            <div>${p.name}</div>
            <div>${buildPriceHtml(p)}</div>
          </div>

        </div>
      `).join("");

    });
  }

});

document.addEventListener("DOMContentLoaded", mobileCardHighlight);

/* ===============================
   ⚡ INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateUserUI();
  initCartButton();
  loadGlobalProducts();
});

window.addEventListener("pageshow", function(event) {

  const t = document.getElementById("pageTransition");

  if (!t) return;

  // 🔥 only reset when coming from history (back button)
  if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    t.classList.remove("active");
  }

});

window.addEventListener("popstate", function(){
  const overlay = document.getElementById("searchOverlay");

  if(overlay && overlay.style.display === "flex"){
    overlay.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const overlay = document.getElementById("searchOverlay");

  if(overlay){
    overlay.addEventListener("click",(e)=>{
      if(e.target.id === "searchOverlay"){
        closeSearch();
      }
    });
  }

});

window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (!header) return;

  if(window.scrollY > 60){
    header.classList.add("scrolled");
    header.style.background = "";
  }else{
    header.classList.remove("scrolled");
    header.style.background = "";
  }
});

window.openSearch = openSearch;

/* ===============================
   ⌨️ ESC KEY — close menu / search
================================ */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenu();
    closeSearch();
  }
});

/* ===============================
   ⌨️ KEYBOARD — hamburger Enter
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  // menu-close keyboard support
  const menuClose = document.querySelector(".menu-close");
  if (menuClose) {
    menuClose.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeMenu();
      }
    });
  }
});

/* ===============================
   🔦 ACTIVE NAV HIGHLIGHT
================================ */
function initNavActive() {
  const path = window.location.pathname;
  const page = path.split("/").pop() || "index.html";

  const navItems = document.querySelectorAll(".nav-menu > div");
  navItems.forEach(item => {
    item.classList.remove("nav-active");
  });

  // Map pages to nav item text
  const pageMap = {
    "index.html": "Home",
    "": "Home",
    "contact.html": "Contact",
    "about.html": "About",
    "profile.html": "Track Order",
  };

  const activeLabel = pageMap[page];
  if (activeLabel) {
    navItems.forEach(item => {
      if (item.textContent.trim().startsWith(activeLabel)) {
        item.classList.add("nav-active");
      }
    });
  }

  // Track Order active on profile?tab=orders
  if (page === "profile.html" && window.location.search.includes("tab=orders")) {
    navItems.forEach(item => {
      if (item.textContent.includes("Track")) item.classList.add("nav-active");
    });
  }
}

document.addEventListener("DOMContentLoaded", initNavActive);