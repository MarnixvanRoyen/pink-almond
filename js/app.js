/**
 * Pink Almond — klant-bestelpagina logica
 *
 * Verantwoordelijkheden:
 *  1. Menu renderen per categorie (sticky dropdown + scroll-spy)
 *  2. + en − knoppen — voor ijs opent een configurator-modal (smaak/verpakking/extras)
 *  3. Mandje als { itemId: [portie, portie, ...] } → elke portie kan eigen extras hebben
 *  4. Mandje-balk onderaan met aantal + totaal
 *  5. Checkout-modal: in zaak / afhalen, naam + ophaaltijd + telefoon
 *  6. Bestelnummer PA-0001 (oplopend), opslaan in localStorage
 *  7. Bevestigingsscherm na plaatsen
 *  8. Cross-tab sync: admin past menu aan → klant ziet update direct
 *
 * Bestelobject (zoals in localStorage 'pa_orders'):
 * {
 *   id: 'PA-0001',
 *   customerName: 'Lisa',
 *   note: '',
 *   source: 'klant' | 'kassa',
 *   status: 'open' | 'voldaan',
 *   items: [
 *     { itemId, name, qty, basePrice, lines: [{config, price}] }
 *   ],
 *   total: 7.80,
 *   timestamp: 1714663200000
 * }
 */

// =====================================================
// HELPERS
// =====================================================
const fmt = n => '€ ' + n.toFixed(2).replace('.', ',');

function getMenu() {
  const stored = localStorage.getItem('pa_menu');
  if (stored) {
    try { return JSON.parse(stored); }
    catch (e) { console.warn('Corrupt menu, gebruik default', e); }
  }
  return JSON.parse(JSON.stringify(MENU_DATA));
}
function findItem(id) { return getMenu().items.find(it => it.id === id); }
function findToppings() { return getMenu().toppings || MENU_DATA.toppings; }
function findSmaken()   { return getMenu().smaken   || MENU_DATA.smaken;   }

function generateOrderId() {
  const counter = parseInt(localStorage.getItem('pa_order_counter') || '0', 10) + 1;
  localStorage.setItem('pa_order_counter', counter);
  return `PA-${String(counter).padStart(4, '0')}`;
}

function priceForPortion(item, config) {
  let p = item.price;
  if (config && item.hasSlagroom && config.slagroom) p += findToppings().slagroom.price;
  if (config && item.hasWafel    && config.wafel)    p += findToppings().wafel.price;
  return p;
}

function describePortion(item, config) {
  if (!config) return '';
  const parts = [];
  if (config.verpakking) parts.push(config.verpakking);
  if (config.smaken && config.smaken.length) parts.push(config.smaken.join(' / '));
  if (config.slagroom) parts.push('+ slagroom');
  if (config.wafel)    parts.push('+ wafel');
  return parts.join(' · ');
}

// =====================================================
// STATE
// =====================================================
// cart structuur: { itemId: [portion, portion, ...] }
// elke portion: { config: {verpakking, smaken[], slagroom, wafel} | null }
let cart = {};

function getCartCount() {
  return Object.values(cart).reduce((sum, ports) => sum + ports.length, 0);
}
function getCartTotal() {
  let total = 0;
  Object.entries(cart).forEach(([itemId, portions]) => {
    const item = findItem(itemId); if (!item) return;
    portions.forEach(p => total += priceForPortion(item, p.config));
  });
  return total;
}

// =====================================================
// MENU RENDEREN
// =====================================================
function renderMenu() {
  const menuEl = document.getElementById('menu');
  const menu = getMenu();
  let html = '';
  menu.categories.forEach(cat => {
    const items = menu.items.filter(it => it.categoryId === cat.id);
    if (!items.length) return;
    html += `
      <section class="category" data-category-id="${cat.id}">
        <h2 class="category__title">${cat.name}</h2>
        ${items.map(renderItem).join('')}
      </section>`;
  });
  menuEl.innerHTML = html;
  menuEl.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', handleQty));
  renderCategoryNav();
  setupScrollSpy();
}

function renderItem(item) {
  const qty = (cart[item.id] || []).length;
  return `
    <div class="item ${qty > 0 ? 'is-in-cart' : ''}" data-item-id="${item.id}">
      <div class="item__info">
        <div class="item__name">${item.name}</div>
        ${item.description ? `<div class="item__description">${item.description}</div>` : ''}
        <div class="item__price">${fmt(item.price)}</div>
      </div>
      <div class="item__controls">
        <button class="qty-btn" data-action="decrease" data-item-id="${item.id}" ${qty===0?'disabled':''} aria-label="Minder">−</button>
        <span class="qty-display">${qty}</span>
        <button class="qty-btn" data-action="increase" data-item-id="${item.id}" aria-label="Meer">+</button>
      </div>
    </div>`;
}

function updateItemUI(itemId) {
  const el = document.querySelector(`.item[data-item-id="${itemId}"]`);
  if (!el) return;
  const qty = (cart[itemId] || []).length;
  el.classList.toggle('is-in-cart', qty > 0);
  el.querySelector('.qty-display').textContent = qty;
  el.querySelector('[data-action="decrease"]').disabled = qty === 0;
}

// =====================================================
// CATEGORIE-NAV (sticky dropdown + scroll-spy)
// =====================================================
function renderCategoryNav() {
  const panel = document.getElementById('category-nav-panel');
  const label = document.getElementById('category-nav-current');
  if (!panel) return;
  const menu = getMenu();
  const visible = menu.categories.filter(c => menu.items.some(i => i.categoryId === c.id));
  panel.innerHTML = visible.map(c =>
    `<button class="category-nav__option" data-cat-id="${c.id}" type="button">${c.name}</button>`
  ).join('');
  if (label && visible.length) label.textContent = visible[0].name;
  panel.querySelectorAll('.category-nav__option').forEach(opt =>
    opt.addEventListener('click', () => {
      const target = document.querySelector(`.category[data-category-id="${opt.dataset.catId}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeCategoryNav();
    })
  );
}
function toggleCategoryNav() {
  const nav = document.getElementById('category-nav');
  const trig = document.getElementById('category-nav-trigger');
  const open = nav.classList.toggle('is-open');
  trig.setAttribute('aria-expanded', String(open));
}
function closeCategoryNav() {
  const nav = document.getElementById('category-nav');
  if (!nav.classList.contains('is-open')) return;
  nav.classList.remove('is-open');
  document.getElementById('category-nav-trigger').setAttribute('aria-expanded', 'false');
}
let scrollSpy = null;
function setupScrollSpy() {
  if (typeof IntersectionObserver === 'undefined') return; // oude browser of test-env
  if (scrollSpy) scrollSpy.disconnect();
  const sections = document.querySelectorAll('.category[data-category-id]');
  if (!sections.length) return;
  scrollSpy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.categoryId;
      const name = e.target.querySelector('.category__title')?.textContent || '';
      const lbl = document.getElementById('category-nav-current');
      if (lbl) lbl.textContent = name;
      document.querySelectorAll('.category-nav__option').forEach(opt => {
        opt.classList.toggle('is-active', opt.dataset.catId === id);
      });
    });
  }, { rootMargin: '-130px 0px -55% 0px', threshold: 0 });
  sections.forEach(s => scrollSpy.observe(s));
}

// =====================================================
// QTY HANDLER (klant: + opent modal voor configurable items)
// =====================================================
function handleQty(e) {
  const btn = e.currentTarget;
  const itemId = btn.dataset.itemId;
  const action = btn.dataset.action;
  const item = findItem(itemId); if (!item) return;
  if (action === 'increase') {
    if (item.configurable === 'ijs' || item.hasSlagroom || item.hasWafel) {
      openIceModal(itemId);
    } else {
      addPortion(itemId, null);
    }
  } else if (action === 'decrease' && cart[itemId]?.length) {
    cart[itemId].pop();
    if (cart[itemId].length === 0) delete cart[itemId];
    updateItemUI(itemId);
    updateCartBar();
  }
}

function addPortion(itemId, config) {
  cart[itemId] = cart[itemId] || [];
  cart[itemId].push({ config });
  updateItemUI(itemId);
  updateCartBar();
  toast(`${findItem(itemId).name} toegevoegd 🛒`);
}

// =====================================================
// IJS-CONFIGURATOR MODAL
// =====================================================
let modalItemId = null;
let modalConfig = null;

function openIceModal(itemId) {
  const item = findItem(itemId); if (!item) return;
  modalItemId = itemId;
  const isIce = item.configurable === 'ijs';
  modalConfig = {
    verpakking: 'Hoorntje',
    smaken: isIce ? Array(item.scoops || 1).fill(findSmaken()[0]) : [],
    slagroom: false,
    wafel: false,
  };
  document.getElementById('ice-modal-title').textContent = item.name;
  document.getElementById('ice-modal-sub').textContent = isIce
    ? `Kies ${item.scoops} smaak${item.scoops>1?'en':''} en je extra's.`
    : `Stel je ${item.name.toLowerCase()} samen.`;

  // Verpakking-segment alleen tonen voor "echt" ijs (niet voor takeaway literen)
  const verpakkingField = document.getElementById('ice-verpakking-field');
  if (isIce && !item.takeawayOnly) {
    verpakkingField.style.display = 'block';
    document.querySelectorAll('#ice-verpakking-seg .segmented__option').forEach(b =>
      b.classList.toggle('is-active', b.dataset.val === 'Hoorntje')
    );
  } else {
    verpakkingField.style.display = 'none';
    if (item.takeawayOnly) modalConfig.verpakking = 'Bakje (om mee te nemen)';
  }

  // Smaak-rijen
  const smaakField = document.getElementById('ice-smaak-field');
  const smaakRows = document.getElementById('ice-smaak-rows');
  if (isIce) {
    smaakField.style.display = 'block';
    const smaken = findSmaken();
    smaakRows.innerHTML = '';
    for (let i = 0; i < item.scoops; i++) {
      const row = document.createElement('div');
      row.className = 'smaak-row';
      row.innerHTML = `<label>Bol ${i+1}</label>
        <select data-i="${i}">${smaken.map(s => `<option ${s===smaken[0]?'selected':''}>${s}</option>`).join('')}</select>`;
      smaakRows.appendChild(row);
    }
  } else {
    smaakField.style.display = 'none';
  }

  document.getElementById('ice-slagroom-row').style.display = item.hasSlagroom ? 'flex' : 'none';
  document.getElementById('ice-wafel-row').style.display    = item.hasWafel    ? 'flex' : 'none';
  document.getElementById('opt-slagroom').checked = false;
  document.getElementById('opt-wafel').checked = false;

  recalcModal();
  document.getElementById('ice-modal').classList.add('is-visible');
}

function closeIceModal() {
  document.getElementById('ice-modal').classList.remove('is-visible');
  modalItemId = null;
}

function recalcModal() {
  const item = findItem(modalItemId); if (!item) return;
  document.getElementById('ice-modal-price').textContent =
    fmt(priceForPortion(item, modalConfig));
}

function confirmIceModal() {
  const item = findItem(modalItemId); if (!item) return;
  // smaken uit de DOM lezen (in case user wijzigde zonder dat we elke change-event vingen)
  const sels = document.querySelectorAll('#ice-smaak-rows select');
  if (sels.length) modalConfig.smaken = Array.from(sels).map(s => s.value);
  modalConfig.slagroom = document.getElementById('opt-slagroom').checked;
  modalConfig.wafel    = document.getElementById('opt-wafel').checked;
  addPortion(modalItemId, { ...modalConfig });
  closeIceModal();
}

// =====================================================
// CART-BAR (vast onderaan)
// =====================================================
function updateCartBar() {
  const count = getCartCount();
  const total = getCartTotal();
  const bar = document.getElementById('cart-bar');
  bar.classList.toggle('is-visible', count > 0);
  document.getElementById('cart-count').textContent =
    count === 1 ? '1 item' : `${count} items`;
  document.getElementById('cart-total').textContent = fmt(total);
}

// =====================================================
// CHECKOUT-MODAL
// =====================================================
function openCheckout() {
  if (getCartCount() === 0) return;
  renderCheckoutLines();
  document.getElementById('customer-name').value = '';
  document.getElementById('order-note').value = '';
  document.getElementById('checkout-modal').classList.add('is-visible');
  setTimeout(() => document.getElementById('customer-name').focus(), 200);
}
function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('is-visible');
}

function renderCheckoutLines() {
  const linesEl = document.getElementById('checkout-lines');
  let html = '';
  Object.entries(cart).forEach(([itemId, portions]) => {
    const item = findItem(itemId); if (!item) return;
    portions.forEach(p => {
      const price = priceForPortion(item, p.config);
      html += `
        <div class="order-line">
          <div class="order-line__main">
            <span class="order-line__name">${item.name}</span>
            <span class="order-line__price">${fmt(price)}</span>
          </div>
          ${p.config ? `<div class="order-line__meta">${describePortion(item, p.config)}</div>` : ''}
        </div>`;
    });
  });
  linesEl.innerHTML = html;
  document.getElementById('checkout-total').textContent = fmt(getCartTotal());
}

function submitOrder() {
  const name = document.getElementById('customer-name').value.trim();
  const note = document.getElementById('order-note').value.trim();

  if (!name) { alert('Vul je naam in voordat je bestelt.'); document.getElementById('customer-name').focus(); return; }

  const items = [];
  Object.entries(cart).forEach(([itemId, portions]) => {
    const item = findItem(itemId);
    items.push({
      itemId,
      name: item.name,
      basePrice: item.price,
      qty: portions.length,
      lines: portions.map(p => ({
        config: p.config,
        price: priceForPortion(item, p.config),
      })),
    });
  });

  const order = {
    id: generateOrderId(),
    customerName: name,
    note,
    source: 'klant',
    status: 'open',
    items,
    total: getCartTotal(),
    timestamp: Date.now(),
  };

  const orders = JSON.parse(localStorage.getItem('pa_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('pa_orders', JSON.stringify(orders));

  document.getElementById('confirmation-id').textContent = `#${order.id}`;
  closeCheckout();
  document.getElementById('confirmation-modal').classList.add('is-visible');
  cart = {};
}

function resetForNewOrder() {
  document.getElementById('confirmation-modal').classList.remove('is-visible');
  renderMenu();
  updateCartBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================
// TOAST
// =====================================================
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateCartBar();

  // Cart-bar
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  // Checkout
  document.getElementById('close-checkout').addEventListener('click', closeCheckout);
  document.getElementById('submit-order').addEventListener('click', submitOrder);
  document.getElementById('checkout-modal').addEventListener('click', e => {
    if (e.target.id === 'checkout-modal') closeCheckout();
  });
  document.getElementById('customer-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitOrder();
  });
  // Confirmation
  document.getElementById('new-order').addEventListener('click', resetForNewOrder);
  // Ice modal
  document.getElementById('close-ice').addEventListener('click', closeIceModal);
  document.getElementById('ice-confirm').addEventListener('click', confirmIceModal);
  document.getElementById('ice-modal').addEventListener('click', e => {
    if (e.target.id === 'ice-modal') closeIceModal();
  });
  document.getElementById('ice-verpakking-seg').addEventListener('click', e => {
    const b = e.target.closest('.segmented__option'); if (!b) return;
    document.querySelectorAll('#ice-verpakking-seg .segmented__option').forEach(x =>
      x.classList.toggle('is-active', x === b));
    modalConfig.verpakking = b.dataset.val;
  });
  document.getElementById('ice-smaak-rows').addEventListener('change', e => {
    const sel = e.target.closest('select'); if (!sel) return;
    modalConfig.smaken[+sel.dataset.i] = sel.value;
  });
  document.getElementById('opt-slagroom').addEventListener('change', e => {
    modalConfig.slagroom = e.target.checked; recalcModal();
  });
  document.getElementById('opt-wafel').addEventListener('change', e => {
    modalConfig.wafel = e.target.checked; recalcModal();
  });

  // Categorie-nav
  document.getElementById('category-nav-trigger').addEventListener('click', toggleCategoryNav);
  document.addEventListener('click', e => {
    const nav = document.getElementById('category-nav');
    if (nav && !nav.contains(e.target)) closeCategoryNav();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCategoryNav(); closeIceModal(); closeCheckout(); }
  });

  // Cross-tab sync: admin past menu aan → ververs hier
  window.addEventListener('storage', e => {
    if (e.key === 'pa_menu') {
      const menu = getMenu();
      const valid = new Set(menu.items.map(i => i.id));
      Object.keys(cart).forEach(id => { if (!valid.has(id)) delete cart[id]; });
      renderMenu();
      updateCartBar();
      toast('Menu is bijgewerkt');
    }
  });

  // Jaartal in footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
