// =========================================================
// SkillBridge — shared script.js
// Loaded on every page. All features below check that their
// elements exist before wiring up, so this file is safe to
// include on pages that only use some of the features.
//
// IMPORTANT (read before reusing this in a real project):
// - The shopping cart / checkout flow does NOT process real
//   payments. Card fields are collected but never sent
//   anywhere or validated as real payment data. This is a
//   UI demo only.
// - The Login / Sign Up modal does NOT implement real
//   authentication. Anything typed in is accepted and stored
//   in the browser's localStorage as-is, including in plain
//   text. Never reuse this for a site with real user accounts
//   or real passwords — a real system needs a server, hashed
//   passwords, and proper session handling.
// =========================================================

// ---------- Storage keys ----------
const CART_KEY = 'skillbridge_cart';
const ORDERS_KEY = 'skillbridge_orders';
const USER_KEY = 'skillbridge_user';

// ---------- Storage helpers ----------
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(list) { localStorage.setItem(CART_KEY, JSON.stringify(list)); }

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch { return []; }
}
function saveOrders(list) { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); }

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
  catch { return null; }
}
function saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function clearUser() { localStorage.removeItem(USER_KEY); }

function makeId(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}
function formatPrice(price) {
  return price > 0 ? `$${price}` : 'FREE';
}

// ---------- Toast ----------
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* =========================================================
   CART (course tracks + paid add-ons, unified)
   ========================================================= */
const drawerToggle = document.getElementById('drawerToggle');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const drawerList = document.getElementById('drawerList');
const drawerTotal = document.getElementById('drawerTotal');
const cartCountEls = document.querySelectorAll('#cartCount');

function updateCartBadge() {
  const count = getCart().length;
  cartCountEls.forEach(el => { el.textContent = count; });
}

function renderDrawer() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  if (drawerTotal) drawerTotal.textContent = total > 0 ? `$${total}` : '$0';

  if (!drawerList) return;
  if (cart.length === 0) {
    drawerList.innerHTML = `<p class="drawer-empty">Your cart is empty. Add a course track or an add-on to get started.</p>`;
    return;
  }
  drawerList.innerHTML = cart.map(item => `
    <div class="drawer-item">
      <span>${item.name}<em>${formatPrice(item.price)}</em></span>
      <button data-remove="${item.name}">Remove</button>
    </div>
  `).join('');

  drawerList.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.remove;
      saveCart(getCart().filter(i => i.name !== name));
      renderDrawer();
      updateCartBadge();
      syncCartButtonStates();
    });
  });
}

function openDrawer() { if (drawer) { drawer.classList.add('open'); drawerOverlay.classList.add('show'); } }
function closeDrawer() { if (drawer) { drawer.classList.remove('open'); drawerOverlay.classList.remove('show'); } }
if (drawerToggle) drawerToggle.addEventListener('click', () => { renderDrawer(); openDrawer(); });
if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

// Sync every "add to cart" style button (course cards + add-on cards) to reflect current cart
function syncCartButtonStates() {
  const cart = getCart();
  document.querySelectorAll('[data-cart-name]').forEach(card => {
    const name = card.dataset.cartName;
    const btn = card.querySelector('.add-btn');
    if (!btn) return;
    const inCart = cart.some(i => i.name === name);
    if (inCart) {
      btn.textContent = 'ADDED ✓ — REMOVE';
      btn.classList.add('added');
    } else {
      btn.textContent = btn.dataset.defaultLabel || 'ADD TO CART';
      btn.classList.remove('added');
    }
  });
}

// Wire up all cart-add buttons (course tracks, price 0 — and paid add-ons, price from data-cart-price)
document.querySelectorAll('[data-cart-name]').forEach(card => {
  const btn = card.querySelector('.add-btn');
  if (!btn) return;
  btn.dataset.defaultLabel = btn.textContent.trim();

  btn.addEventListener('click', () => {
    const name = card.dataset.cartName;
    const price = parseFloat(card.dataset.cartPrice || '0');
    const type = card.dataset.cartType || 'track';

    let cart = getCart();
    const exists = cart.some(i => i.name === name);
    if (exists) {
      cart = cart.filter(i => i.name !== name);
      showToast(`Removed ${name} from your cart`);
    } else {
      cart.push({ name, price, type });
      showToast(`Added ${name} to your cart`);
    }
    saveCart(cart);
    syncCartButtonStates();
    updateCartBadge();
    renderDrawer();
  });
});

/* =========================================================
   COURSE FILTERS (courses.html)
   ========================================================= */
const filterBtns = document.querySelectorAll('.filter-btn');
if (filterBtns.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.filter;
      document.querySelectorAll('#courseGrid .course-card').forEach(card => {
        const show = category === 'all' || card.dataset.category === category;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* =========================================================
   FAQ ACCORDION
   ========================================================= */
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  if (!question) return;
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* =========================================================
   NEWSLETTER (footer, demo only)
   ========================================================= */
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletterEmail');
    if (!input.value || !input.value.includes('@')) {
      input.focus();
      return;
    }
    showToast('Subscribed! (demo only — no real email is sent)');
    newsletterForm.reset();
  });
}

/* =========================================================
   LOGIN / SIGN UP (mock, client-side only — see notice above)
   ========================================================= */
const authArea = document.getElementById('authArea');
const loginOverlay = document.getElementById('loginOverlay');
const loginModal = document.getElementById('loginModal');
const loginModalClose = document.getElementById('loginModalClose');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function renderAuthArea() {
  if (!authArea) return;
  const user = getUser();
  if (user) {
    authArea.innerHTML = `
      <div class="user-chip" id="userChip">
        <span>Hi, ${user.name.split(' ')[0]}</span>
        <span class="caret">▾</span>
        <div class="user-dropdown" id="userDropdown">
          <a href="courses.html#orders">My Orders</a>
          <button id="logoutBtn">Log Out</button>
        </div>
      </div>`;
    const chip = document.getElementById('userChip');
    chip.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn') return;
      document.getElementById('userDropdown').classList.toggle('show');
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearUser();
      renderAuthArea();
      showToast('Logged out');
    });
  } else {
    authArea.innerHTML = `<button class="btn btn-ghost-dark btn-sm" id="loginOpenBtn">LOGIN</button>`;
    document.getElementById('loginOpenBtn').addEventListener('click', openLoginModal);
  }
}

function openLoginModal() {
  if (!loginOverlay) return;
  loginOverlay.classList.add('show');
  loginModal.classList.add('open');
}
function closeLoginModal() {
  if (!loginOverlay) return;
  loginOverlay.classList.remove('show');
  loginModal.classList.remove('open');
}
if (loginModalClose) loginModalClose.addEventListener('click', closeLoginModal);
if (loginOverlay) loginOverlay.addEventListener('click', closeLoginModal);

if (tabLogin && tabSignup) {
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabSignup.classList.remove('active');
    loginForm.hidden = false; signupForm.hidden = true;
  });
  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active'); tabLogin.classList.remove('active');
    signupForm.hidden = false; loginForm.hidden = true;
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) return;
    const namePart = email.split('@')[0].replace(/[._]/g, ' ');
    saveUser({ name: namePart || 'Student', email });
    renderAuthArea();
    closeLoginModal();
    loginForm.reset();
    showToast('Logged in (demo account)');
  });
}
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    if (!name || !email) return;
    saveUser({ name, email });
    renderAuthArea();
    closeLoginModal();
    signupForm.reset();
    showToast(`Account created — welcome, ${name.split(' ')[0]}!`);
  });
}

/* =========================================================
   CHECKOUT PAGE (checkout.html only)
   ========================================================= */
const checkoutSummary = document.getElementById('checkoutSummary');
if (checkoutSummary) {
  const checkoutTotalEl = document.getElementById('checkoutTotal');
  const checkoutForm = document.getElementById('checkoutForm');
  const paymentFieldset = document.getElementById('paymentFieldset');
  const emptyState = document.getElementById('checkoutEmpty');
  const successPanel = document.getElementById('checkoutSuccess');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const checkoutInfoPanel = document.getElementById('checkoutInfoPanel');

  function renderCheckout() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.price, 0);

    if (cart.length === 0) {
      checkoutSummary.hidden = true;
      checkoutForm.hidden = true;
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    checkoutSummary.hidden = false;
    checkoutForm.hidden = false;

    checkoutSummary.innerHTML = cart.map(item => `
      <div class="summary-row">
        <span>${item.name} <em class="summary-type">${item.type === 'addon' ? 'Add-on' : 'Course Track'}</em></span>
        <span>${formatPrice(item.price)}</span>
      </div>
    `).join('') + `
      <div class="summary-row summary-total">
        <span>Total</span>
        <span>${total > 0 ? '$' + total : '$0'}</span>
      </div>`;

    checkoutTotalEl.textContent = total > 0 ? `$${total}` : '$0';

    if (total > 0) {
      paymentFieldset.hidden = false;
      placeOrderBtn.textContent = `PLACE ORDER & PAY $${total}`;
    } else {
      paymentFieldset.hidden = true;
      placeOrderBtn.textContent = 'SUBMIT APPLICATION';
    }
  }

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!checkoutForm.checkValidity()) { checkoutForm.reportValidity(); return; }

    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.price, 0);
    const whyField = document.getElementById('checkoutWhy');

    const order = {
      id: makeId('ORD'),
      fullName: document.getElementById('checkoutName').value.trim(),
      email: document.getElementById('checkoutEmail').value.trim(),
      phone: document.getElementById('checkoutPhone').value.trim(),
      why: whyField ? whyField.value.trim() : '',
      items: cart,
      total,
      placedAt: new Date().toISOString()
    };

    // ---- Local demo storage only. No real payment is processed. ----
    // For a real deployment, this is where you'd call a payment
    // provider (e.g. Stripe) and, on success, POST the order to your
    // own backend instead of localStorage.
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    saveCart([]);
    // ------------------------------------------------------------

    updateCartBadge();
    checkoutForm.hidden = true;
    checkoutSummary.hidden = true;
    if (checkoutInfoPanel) checkoutInfoPanel.hidden = true;
    successPanel.hidden = false;
    successPanel.querySelector('.order-id').textContent = order.id;
    successPanel.querySelector('.order-total').textContent = total > 0 ? `$${total}` : 'Free';
  });

  renderCheckout();
}

/* =========================================================
   MY ORDERS LIST (courses.html)
   ========================================================= */
const myOrdersSection = document.getElementById('myOrders');
const myOrdersList = document.getElementById('myOrdersList');
const clearOrdersBtn = document.getElementById('clearOrders');

function renderMyOrders() {
  if (!myOrdersSection || !myOrdersList) return;
  const orders = getOrders();
  if (orders.length === 0) {
    myOrdersSection.hidden = true;
    return;
  }
  myOrdersSection.hidden = false;
  myOrdersList.innerHTML = orders.map(o => `
    <div class="reg-item">
      <span><strong>${o.fullName}</strong> — ${o.items.map(i => i.name).join(', ')}</span>
      <span class="reg-id">${o.id} · ${o.total > 0 ? '$' + o.total : 'Free'}</span>
    </div>
  `).join('');
}
if (clearOrdersBtn) {
  clearOrdersBtn.addEventListener('click', () => {
    localStorage.removeItem(ORDERS_KEY);
    renderMyOrders();
  });
}

/* =========================================================
   INIT
   ========================================================= */
updateCartBadge();
syncCartButtonStates();
renderAuthArea();
renderMyOrders();
