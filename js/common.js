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

function createProductCard(product, onClickFn) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${product.images?.[0] || ''}" alt="${product.name}" loading="lazy">
    <div class="name">${product.name}</div>
    <div class="price">₹${product.price}</div>
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
  document.getElementById("sideMenu")?.classList.toggle("active");
  document.getElementById("overlay")?.classList.toggle("active");
}

function toggleProducts() {
  const menu = document.getElementById("productSubmenu");
  const arrow = document.getElementById("arrow");

  if (!menu) return;

  const open = menu.style.display === "block";
  menu.style.display = open ? "none" : "block";
  if (arrow) arrow.innerText = open ? "▾" : "▴";
}

/* ===============================
   🚀 NAVIGATION ENGINE
================================ */

function navigateWithTransition(url) {
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
  }, 500); // little smoother
}

function goHome(){ navigateWithTransition("index.html"); }
function goToCart(){ navigateWithTransition("cart.html"); }
function goToLogin(){ navigateWithTransition("login.html"); }
function goToProfile(){ navigateWithTransition("profile.html"); }

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
        <div style="color:#d4af37;font-size:13px">₹${p.price}</div>
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
            <div style="color:#d4af37">₹${p.price}</div>
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

  if(window.scrollY > 50){
    header.style.background = "rgba(10,10,10,0.75)";
  }else{
    header.style.background = "rgba(10,10,10,0.55)";
  }
});

window.openSearch = openSearch;