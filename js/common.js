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
  document.getElementById("searchOverlay").style.display = "flex";
  document.getElementById("searchOverlayInput").focus();

  // 🔥 push state
  history.pushState({ searchOpen: true }, "");
}

function closeSearch(){
  document.getElementById("searchOverlay").style.display = "none";
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

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(query)
  );

  resultsBox.innerHTML = filtered.map(p => `
    <div class="search-item" onclick="openProduct('${p.slug}')">
      ${p.name}
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", mobileCardHighlight);

/* ===============================
   ⚡ INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateUserUI();
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

document.getElementById("searchOverlay").addEventListener("click",(e)=>{
  if(e.target.id === "searchOverlay"){
    history.back(); // 🔥 instead of direct close
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