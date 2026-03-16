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

  t.classList.add("active");

  setTimeout(() => {
    window.location.href = url;
  }, 450);
}

function goHome(){ navigateWithTransition("index.html"); }
function goToCart(){ navigateWithTransition("cart.html"); }
function goToLogin(){ navigateWithTransition("login.html"); }
function goToProfile(){ navigateWithTransition("profile.html"); }

function goBack(){

  const t = document.getElementById("pageTransition");

  if(!t){
    history.back();
    return;
  }

  t.classList.add("active");

  setTimeout(()=>{

    const ref = document.referrer;

    if(ref){
      window.location.href = ref;
    }else{
      window.location.href = "index.html";
    }

  },400);

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

    // ADMIN ROLE
    if(user.role === "admin"){
      area.innerText = "🛠 Admin";
      area.onclick = () => navigateWithTransition("admin.html");
      return;
    }

    area.innerText = "👤 " + (user.name || "User");
    area.onclick = goToProfile;

  }else{
    area.innerText = "Login";
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
    threshold:0.6
  });

  cards.forEach(card => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", mobileCardHighlight);

/* ===============================
   ⚡ INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateUserUI();
});

window.addEventListener("pageshow", () => {
  const t = document.getElementById("pageTransition");
  if(t) t.classList.remove("active");
});