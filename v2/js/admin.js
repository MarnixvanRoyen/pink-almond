/**
 * Pink Almond — admin / personeels-portaal
 *
 * Tabs:
 *   - Bestellingen   (lijst van open + voldaan, met één 'Voldaan'-knop)
 *   - Kassa          (snel afrekenen aan de balie)
 *   - Menu           (Mo wijzigt items, prijzen, categorieën, smaken)
 *   - Overzicht      (Chart.js grafieken: orders + omzet per dag/week/maand/jaar)
 *   - Instellingen   (pincode, demo-data, alles wissen)
 *
 * Status-flow van een bestelling: open → voldaan.
 * Geen urgentie-melding, geen geluid — bij ijs is alles meteen klaar.
 */

// =====================================================
// HELPERS
// =====================================================
const fmt = n => '€ ' + n.toFixed(2).replace('.', ',');

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('nl-NL', { hour:'2-digit', minute:'2-digit' });
}
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('nl-NL', { day:'2-digit', month:'2-digit' }) + ' ' + fmtTime(ts);
}
function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }
function startOfWeek()  { const d = new Date(); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d.getTime(); }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.getTime(); }
function startOfYear()  { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); return d.getTime(); }

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
// STORAGE
// =====================================================
function getOrders()        { try { return JSON.parse(localStorage.getItem('pa_orders') || '[]'); } catch { return []; } }
function saveOrders(o)      { localStorage.setItem('pa_orders', JSON.stringify(o)); }
function getMenu() {
  const stored = localStorage.getItem('pa_menu');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return JSON.parse(JSON.stringify(MENU_DATA));
}
function saveMenu(m)        { localStorage.setItem('pa_menu', JSON.stringify(m)); }
function resetMenu()        { localStorage.removeItem('pa_menu'); }
function getPin()           { return localStorage.getItem('pa_pin') || '1234'; }
function setPin(p)          { localStorage.setItem('pa_pin', p); }

function generateOrderId() {
  const c = parseInt(localStorage.getItem('pa_order_counter') || '0', 10) + 1;
  localStorage.setItem('pa_order_counter', c);
  return `PA-${String(c).padStart(4, '0')}`;
}

// =====================================================
// STATUS — simpel: open → voldaan
// =====================================================
const STATUS_LABEL = { open:'Open', voldaan:'Voldaan' };
const STATUS_NEXT  = { open:'voldaan', voldaan:null };
const STATUS_ORDER = ['open','voldaan'];

// =====================================================
// PIN-SCREEN
// =====================================================
function showPinScreen() {
  document.getElementById('pin-screen').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
  setTimeout(() => document.getElementById('pin-input').focus(), 60);
}
function unlockAdmin() {
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  initAdmin();
}

// =====================================================
// TABS
// =====================================================
function setupTabs() {
  document.getElementById('admin-tabs').addEventListener('click', e => {
    const t = e.target.closest('.admin-tab'); if (!t) return;
    document.querySelectorAll('#admin-tabs .admin-tab').forEach(x =>
      x.classList.toggle('is-active', x === t));
    ['orders','kassa','menu','overview','settings'].forEach(k => {
      const pane = document.getElementById('pane-' + k);
      if (pane) pane.style.display = (k === t.dataset.tab) ? 'block' : 'none';
    });
    if (t.dataset.tab === 'orders')   refreshOrders();
    if (t.dataset.tab === 'kassa')    renderKassa();
    if (t.dataset.tab === 'menu')     renderMenuEditor();
    if (t.dataset.tab === 'overview') renderOverview();
  });
}

// =====================================================
// STATS (bovenin)
// =====================================================
function updateStats() {
  const all = getOrders();
  const today = all.filter(o => o.timestamp >= startOfToday());
  document.getElementById('stat-new').textContent =
    all.filter(o => o.status === 'open').length;
  document.getElementById('stat-today-count').textContent = today.length;
  document.getElementById('stat-today-revenue').textContent =
    fmt(today.reduce((s, o) => s + o.total, 0));
  document.getElementById('stat-menu-items').textContent = getMenu().items.length;
}

// =====================================================
// ORDERS TAB
// =====================================================
let ordersFilter = 'open';

function refreshOrders() {
  updateStats();
  const wrap = document.getElementById('orders-list');
  let orders = getOrders();
  if (ordersFilter === 'open')  orders = orders.filter(o => o.status === 'open');
  if (ordersFilter === 'today') orders = orders.filter(o => o.timestamp >= startOfToday());
  if (ordersFilter === 'all')   {/* alle */}

  if (!orders.length) {
    wrap.innerHTML = `<div class="card" style="text-align:center; color:var(--muted)">Geen bestellingen in deze weergave.</div>`;
    return;
  }
  wrap.innerHTML = orders.map(renderOrderCard).join('');
  wrap.querySelectorAll('[data-advance]').forEach(b => b.addEventListener('click', () => advanceStatus(b.dataset.advance)));
  wrap.querySelectorAll('[data-revert]').forEach(b => b.addEventListener('click', () => revertStatus(b.dataset.revert)));
  wrap.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteOrder(b.dataset.delete)));
}

function renderOrderCard(o) {
  const statusBadge = `<span class="badge badge-${o.status}">${STATUS_LABEL[o.status]}</span>`;
  const sourceBadge = `<span class="badge badge-source-${o.source}">${o.source === 'kassa' ? 'kassa' : 'klant'}</span>`;
  const next = STATUS_NEXT[o.status];

  let lines = '';
  o.items.forEach(it => {
    it.lines.forEach(l => {
      lines += `
        <div class="order-card__line">
          <div>
            <strong>${escapeHtml(it.name)}</strong>
            ${l.config ? `<div class="order-card__line-meta">${escapeHtml(describePortion(it, l.config))}</div>` : ''}
          </div>
          <div>${fmt(l.price)}</div>
        </div>`;
    });
  });

  return `
    <div class="order-card" data-id="${o.id}">
      <div class="order-card__head">
        <div>
          <span class="order-card__title">${escapeHtml(o.customerName)}</span>
          <span class="order-card__id">· ${o.id} · ${fmtTime(o.timestamp)}</span>
        </div>
        <div class="row" style="gap:6px">${statusBadge}${sourceBadge}</div>
      </div>
      ${o.note ? `<div class="muted" style="font-size:.85rem; margin-bottom:6px">📝 ${escapeHtml(o.note)}</div>` : ''}
      <div class="order-card__lines">${lines}</div>
      <div class="order-card__total"><span>Totaal</span><span>${fmt(o.total)}</span></div>
      <div class="order-card__actions">
        ${next ? `<button class="btn btn-yellow btn-sm" data-advance="${o.id}">✅ Voldaan</button>` : ''}
        ${o.status === 'voldaan' ? `<button class="btn btn-ghost btn-sm" data-revert="${o.id}">↩ Terug naar open</button>` : ''}
        <button class="btn btn-ghost btn-sm" data-delete="${o.id}" style="color:var(--red)">🗑️</button>
      </div>
    </div>`;
}

function advanceStatus(orderId) {
  const arr = getOrders();
  const o = arr.find(x => x.id === orderId); if (!o) return;
  const next = STATUS_NEXT[o.status]; if (!next) return;
  o.status = next;
  saveOrders(arr);
  refreshOrders();
}
function revertStatus(orderId) {
  const arr = getOrders();
  const o = arr.find(x => x.id === orderId); if (!o) return;
  const idx = STATUS_ORDER.indexOf(o.status);
  if (idx <= 0) return;
  o.status = STATUS_ORDER[idx - 1];
  saveOrders(arr);
  refreshOrders();
}
function deleteOrder(orderId) {
  if (!confirm('Deze bestelling verwijderen?')) return;
  saveOrders(getOrders().filter(o => o.id !== orderId));
  refreshOrders();
}

// =====================================================
// KASSA TAB
// =====================================================
let kassaCart = [];
let kassaCategory = null;

function renderKassa() {
  const menu = getMenu();
  if (!kassaCategory) kassaCategory = menu.categories[0]?.id;

  // Categorie tabs
  const tabs = document.getElementById('kassa-cat-tabs');
  tabs.innerHTML = menu.categories.map(c =>
    `<button class="admin-tab ${c.id===kassaCategory?'is-active':''}" data-kcat="${c.id}">${escapeHtml(c.name)}</button>`
  ).join('');
  tabs.querySelectorAll('[data-kcat]').forEach(b => b.addEventListener('click', () => {
    kassaCategory = b.dataset.kcat;
    renderKassa();
  }));

  // Producten-grid
  const grid = document.getElementById('kassa-grid');
  const items = menu.items.filter(i => i.categoryId === kassaCategory);
  grid.innerHTML = items.map(i => `
    <button class="kassa-product" data-id="${i.id}">
      <div class="kassa-product__name">${escapeHtml(i.name)}</div>
      <div class="kassa-product__price">${fmt(i.price)}</div>
    </button>
  `).join('');
  grid.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => addKassaItem(b.dataset.id)));

  // Bon
  renderKassaBon();
}

function addKassaItem(itemId) {
  const item = getMenu().items.find(i => i.id === itemId); if (!item) return;
  if (item.configurable === 'ijs') {
    // simpel: voeg met default smaak toe (kassa = snel)
    const smaken = getMenu().smaken || MENU_DATA.smaken;
    kassaCart.push({
      itemId, name: item.name, price: item.price,
      config: { verpakking: 'Hoorntje', smaken: Array(item.scoops).fill(smaken[0]), slagroom: false, wafel: false }
    });
  } else {
    // Probeer te bundelen met identiek item
    const existing = kassaCart.find(x => x.itemId === itemId && !x.config);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else kassaCart.push({ itemId, name: item.name, price: item.price, qty: 1, config: null });
  }
  renderKassaBon();
}

function renderKassaBon() {
  const wrap = document.getElementById('kassa-lines');
  let total = 0;
  wrap.innerHTML = kassaCart.map((line, idx) => {
    const qty = line.qty || 1;
    const lineTotal = line.price * qty;
    total += lineTotal;
    return `
      <li class="kassa-bon__line">
        <div>
          <div class="name">${escapeHtml(line.name)}</div>
          ${line.config ? `<div class="meta">${escapeHtml(describePortion({}, line.config))}</div>` : ''}
          <div class="qty-row">
            ${line.config ? '' : `
              <span class="qty">
                <button data-kdec="${idx}">−</button>
                <span>${qty}</span>
                <button data-kinc="${idx}">+</button>
              </span>
            `}
            <button class="remove" data-krm="${idx}">verwijderen</button>
          </div>
        </div>
        <div><strong>${fmt(lineTotal)}</strong></div>
      </li>`;
  }).join('');
  document.getElementById('kassa-total').textContent = fmt(total);

  wrap.querySelectorAll('[data-kinc]').forEach(b => b.addEventListener('click', () => { kassaCart[+b.dataset.kinc].qty++; renderKassaBon(); }));
  wrap.querySelectorAll('[data-kdec]').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.kdec;
    kassaCart[i].qty = (kassaCart[i].qty || 1) - 1;
    if (kassaCart[i].qty <= 0) kassaCart.splice(i, 1);
    renderKassaBon();
  }));
  wrap.querySelectorAll('[data-krm]').forEach(b => b.addEventListener('click', () => { kassaCart.splice(+b.dataset.krm, 1); renderKassaBon(); }));
}

function kassaCheckout() {
  if (!kassaCart.length) return;
  // groepeer per item
  const itemsMap = {};
  kassaCart.forEach(line => {
    const key = line.itemId + (line.config ? '_' + JSON.stringify(line.config) : '');
    if (!itemsMap[key]) {
      itemsMap[key] = {
        itemId: line.itemId,
        name: line.name,
        basePrice: line.price,
        qty: 0,
        lines: []
      };
    }
    const qty = line.qty || 1;
    itemsMap[key].qty += qty;
    for (let i = 0; i < qty; i++) {
      itemsMap[key].lines.push({ config: line.config, price: line.price });
    }
  });

  const order = {
    id: generateOrderId(),
    customerName: '— balie —',
    note: '',
    source: 'kassa',
    status: 'voldaan',
    items: Object.values(itemsMap),
    total: kassaCart.reduce((s, x) => s + x.price * (x.qty || 1), 0),
    timestamp: Date.now(),
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  kassaCart = [];
  renderKassaBon();
  toast(`Afgerekend ${fmt(order.total)} ✅`);
  updateStats();
}

function kassaClear() {
  if (!kassaCart.length) return;
  if (confirm('Bon wissen?')) { kassaCart = []; renderKassaBon(); }
}

// =====================================================
// MENU-EDITOR TAB
// =====================================================
function renderMenuEditor() {
  const wrap = document.getElementById('menu-editor');
  const menu = getMenu();

  let html = `
    <div class="row-between" style="margin-bottom:14px">
      <h3 style="margin:0">📋 Menu beheren</h3>
      <div class="row" style="gap:6px">
        <button class="btn btn-yellow btn-sm" id="add-item-btn">+ Nieuw item</button>
        <button class="btn btn-outline btn-sm" id="add-cat-btn">+ Categorie</button>
        <button class="btn btn-ghost btn-sm" id="reset-menu-btn">↺ Standaard</button>
      </div>
    </div>
  `;

  menu.categories.forEach(cat => {
    const items = menu.items.filter(i => i.categoryId === cat.id);
    html += `
      <div class="menu-editor__category">
        <div class="menu-editor__cat-head">
          <div class="menu-editor__cat-name">${escapeHtml(cat.name)}</div>
          <div class="row" style="gap:6px">
            <button class="btn btn-ghost btn-sm" data-edit-cat="${cat.id}">✎ Naam</button>
            <button class="btn btn-ghost btn-sm" data-delete-cat="${cat.id}" style="color:var(--red)">🗑️</button>
          </div>
        </div>
        ${items.length === 0 ? `<div class="muted" style="padding:8px 0">Geen items in deze categorie.</div>` : ''}
        ${items.map(i => `
          <div class="menu-editor__item">
            <div class="menu-editor__item-info">
              <div class="menu-editor__item-name">${escapeHtml(i.name)}</div>
              ${i.description ? `<div class="menu-editor__item-desc">${escapeHtml(i.description)}</div>` : ''}
            </div>
            <div class="menu-editor__item-price">${fmt(i.price)}</div>
            <div class="row" style="gap:4px">
              <button class="btn btn-ghost btn-sm" data-edit-item="${i.id}">✎</button>
              <button class="btn btn-ghost btn-sm" data-delete-item="${i.id}" style="color:var(--red)">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  });

  html += `
    <div class="card" style="margin-top:14px">
      <h3>🍦 IJssmaken</h3>
      <p class="muted">Deze smaken verschijnen in het ijs-keuze-menu voor klanten.</p>
      <div id="smaak-list"></div>
      <div class="row" style="gap:6px; margin-top:8px">
        <input type="text" id="new-smaak" placeholder="Nieuwe smaak (bv. Tiramisu)" style="flex:1; padding:9px 12px; border-radius:10px; border:1.5px solid var(--border)">
        <button class="btn btn-yellow btn-sm" id="add-smaak-btn">+ Toevoegen</button>
      </div>
    </div>
  `;

  wrap.innerHTML = html;
  renderSmakenList();

  // Wire up buttons
  document.getElementById('add-item-btn').addEventListener('click', () => openItemModal(null));
  document.getElementById('add-cat-btn').addEventListener('click', () => openCategoryModal(null));
  document.getElementById('reset-menu-btn').addEventListener('click', () => {
    if (confirm('Het menu terugzetten naar de standaard? Eventuele wijzigingen gaan verloren.')) {
      resetMenu(); renderMenuEditor(); toast('Menu teruggezet');
    }
  });
  wrap.querySelectorAll('[data-edit-item]').forEach(b => b.addEventListener('click', () => openItemModal(b.dataset.editItem)));
  wrap.querySelectorAll('[data-delete-item]').forEach(b => b.addEventListener('click', () => deleteMenuItem(b.dataset.deleteItem)));
  wrap.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => openCategoryModal(b.dataset.editCat)));
  wrap.querySelectorAll('[data-delete-cat]').forEach(b => b.addEventListener('click', () => deleteMenuCategory(b.dataset.deleteCat)));
  document.getElementById('add-smaak-btn').addEventListener('click', addSmaak);
  document.getElementById('new-smaak').addEventListener('keydown', e => { if (e.key === 'Enter') addSmaak(); });
}

function renderSmakenList() {
  const wrap = document.getElementById('smaak-list');
  const smaken = getMenu().smaken || MENU_DATA.smaken;
  wrap.innerHTML = smaken.map((s, i) => `
    <div class="row-between" style="padding:6px 0; border-bottom:1px solid var(--border)">
      <span>${escapeHtml(s)}</span>
      <button class="btn btn-ghost btn-sm" data-rm-smaak="${i}" style="color:var(--red)">🗑️</button>
    </div>
  `).join('');
  wrap.querySelectorAll('[data-rm-smaak]').forEach(b => b.addEventListener('click', () => removeSmaak(+b.dataset.rmSmaak)));
}

function addSmaak() {
  const inp = document.getElementById('new-smaak');
  const v = inp.value.trim();
  if (!v) return;
  const menu = getMenu();
  menu.smaken = menu.smaken || [...MENU_DATA.smaken];
  if (menu.smaken.includes(v)) { toast('Bestaat al'); return; }
  menu.smaken.push(v);
  saveMenu(menu);
  inp.value = '';
  renderSmakenList();
  toast('Smaak toegevoegd 🍦');
}
function removeSmaak(idx) {
  const menu = getMenu();
  menu.smaken = menu.smaken || [...MENU_DATA.smaken];
  menu.smaken.splice(idx, 1);
  saveMenu(menu);
  renderSmakenList();
}

// --- ITEM MODAL ---
let editingItemId = null;
function openItemModal(itemId) {
  editingItemId = itemId;
  const menu = getMenu();
  const item = itemId ? menu.items.find(i => i.id === itemId) : null;
  document.getElementById('item-modal-title').textContent = item ? 'Item bewerken' : 'Nieuw item';
  document.getElementById('item-name').value = item?.name || '';
  document.getElementById('item-description').value = item?.description || '';
  document.getElementById('item-price').value = item?.price ?? '';

  const catSel = document.getElementById('item-category');
  catSel.innerHTML = menu.categories.map(c =>
    `<option value="${c.id}" ${item?.categoryId===c.id?'selected':''}>${escapeHtml(c.name)}</option>`
  ).join('');

  document.getElementById('item-configurable').checked = item?.configurable === 'ijs';
  document.getElementById('item-scoops').value = item?.scoops || 1;
  document.getElementById('item-has-slagroom').checked = !!item?.hasSlagroom;
  document.getElementById('item-has-wafel').checked = !!item?.hasWafel;
  toggleScoopsField();

  document.getElementById('delete-item-btn').style.display = item ? 'block' : 'none';
  document.getElementById('item-modal').classList.add('is-visible');
}
function closeItemModal() { document.getElementById('item-modal').classList.remove('is-visible'); editingItemId = null; }
function toggleScoopsField() {
  const isIce = document.getElementById('item-configurable').checked;
  document.getElementById('item-scoops-field').style.display = isIce ? 'block' : 'none';
}
function makeId(name) {
  return (name || '').toLowerCase()
    .replace(/[àáâã]/g,'a').replace(/[èéê]/g,'e').replace(/[ìí]/g,'i').replace(/[òóô]/g,'o').replace(/[ùú]/g,'u')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0, 30) + '-' + Math.random().toString(36).slice(2,5);
}
function saveItem() {
  const name  = document.getElementById('item-name').value.trim();
  const desc  = document.getElementById('item-description').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const cat   = document.getElementById('item-category').value;
  const isIce = document.getElementById('item-configurable').checked;
  const scoops = parseInt(document.getElementById('item-scoops').value, 10) || 1;
  const slag  = document.getElementById('item-has-slagroom').checked;
  const wafel = document.getElementById('item-has-wafel').checked;

  if (!name) { alert('Vul een naam in.'); return; }
  if (isNaN(price) || price < 0) { alert('Vul een geldige prijs in.'); return; }

  const menu = getMenu();
  if (editingItemId) {
    const it = menu.items.find(i => i.id === editingItemId);
    if (it) {
      it.name = name; it.description = desc; it.price = price; it.categoryId = cat;
      if (isIce) { it.configurable = 'ijs'; it.scoops = scoops; }
      else { delete it.configurable; delete it.scoops; }
      it.hasSlagroom = slag; it.hasWafel = wafel;
    }
  } else {
    const newItem = { id: makeId(name), categoryId: cat, name, description: desc, price };
    if (isIce) { newItem.configurable = 'ijs'; newItem.scoops = scoops; }
    if (slag)  newItem.hasSlagroom = true;
    if (wafel) newItem.hasWafel = true;
    menu.items.push(newItem);
  }
  saveMenu(menu);
  closeItemModal();
  renderMenuEditor();
  toast(editingItemId ? 'Item bijgewerkt' : 'Item toegevoegd');
}
function deleteMenuItem(itemId) {
  if (!confirm('Dit item verwijderen?')) return;
  const menu = getMenu();
  menu.items = menu.items.filter(i => i.id !== itemId);
  saveMenu(menu);
  renderMenuEditor();
  toast('Verwijderd');
}

// --- CATEGORIE MODAL ---
let editingCatId = null;
function openCategoryModal(catId) {
  editingCatId = catId;
  const menu = getMenu();
  const cat = catId ? menu.categories.find(c => c.id === catId) : null;
  document.getElementById('cat-modal-title').textContent = cat ? 'Categorie bewerken' : 'Nieuwe categorie';
  document.getElementById('cat-name').value = cat?.name || '';
  document.getElementById('delete-cat-btn').style.display = cat ? 'block' : 'none';
  document.getElementById('cat-modal').classList.add('is-visible');
}
function closeCategoryModal() { document.getElementById('cat-modal').classList.remove('is-visible'); editingCatId = null; }
function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  if (!name) { alert('Vul een naam in.'); return; }
  const menu = getMenu();
  if (editingCatId) {
    const c = menu.categories.find(x => x.id === editingCatId);
    if (c) c.name = name;
  } else {
    menu.categories.push({ id: makeId(name), name });
  }
  saveMenu(menu);
  closeCategoryModal();
  renderMenuEditor();
}
function deleteMenuCategory(catId) {
  const menu = getMenu();
  if (menu.items.some(i => i.categoryId === catId)) {
    alert('Deze categorie bevat nog items. Verwijder eerst de items, of verplaats ze naar een andere categorie.');
    return;
  }
  if (!confirm('Deze categorie verwijderen?')) return;
  menu.categories = menu.categories.filter(c => c.id !== catId);
  saveMenu(menu);
  renderMenuEditor();
}

// =====================================================
// OVERZICHT / RAPPORT TAB (Chart.js)
// =====================================================
let overviewPeriod = 'week';
let chartOrders = null, chartRevenue = null;

function renderOverview() {
  const all = getOrders();
  const buckets = computeBuckets(all, overviewPeriod);

  // Stats voor de geselecteerde periode
  const since = periodStart(overviewPeriod);
  const inPeriod = all.filter(o => o.timestamp >= since);
  const revenue = inPeriod.reduce((s, o) => s + o.total, 0);
  const itemsSold = inPeriod.reduce((s, o) => s + o.items.reduce((a, x) => a + x.qty, 0), 0);

  document.getElementById('ov-count').textContent = inPeriod.length;
  document.getElementById('ov-revenue').textContent = fmt(revenue);
  document.getElementById('ov-avg').textContent = fmt(inPeriod.length ? revenue / inPeriod.length : 0);
  document.getElementById('ov-items').textContent = itemsSold;

  // Top producten
  const map = {};
  inPeriod.forEach(o => o.items.forEach(it => {
    map[it.name] = (map[it.name] || { qty:0, rev:0 });
    map[it.name].qty += it.qty;
    map[it.name].rev += it.lines.reduce((s,l)=>s+l.price,0);
  }));
  const top = Object.entries(map).sort((a,b)=>b[1].qty-a[1].qty).slice(0, 8);
  document.getElementById('top-products').innerHTML = top.length
    ? top.map(([n, v]) => `<div class="row-between" style="padding:6px 0; border-bottom:1px solid var(--border)"><span>${escapeHtml(n)} <span class="muted">(${v.qty}×)</span></span><strong>${fmt(v.rev)}</strong></div>`).join('')
    : '<div class="muted">Nog geen verkoop in deze periode.</div>';

  // Grafieken
  const ctxO = document.getElementById('chart-orders');
  const ctxR = document.getElementById('chart-revenue');
  if (chartOrders)  chartOrders.destroy();
  if (chartRevenue) chartRevenue.destroy();
  const navy   = getCss('--navy')   || '#1d3a4a';
  const yellow = getCss('--yellow') || '#f4c430';

  chartOrders = new Chart(ctxO, {
    type: 'bar',
    data: { labels: buckets.labels, datasets: [{ label: 'Bestellingen', data: buckets.counts, backgroundColor: navy, borderRadius: 6 }] },
    options: chartOptions()
  });
  chartRevenue = new Chart(ctxR, {
    type: 'bar',
    data: { labels: buckets.labels, datasets: [{ label: 'Omzet (€)', data: buckets.revenue, backgroundColor: yellow, borderColor: navy, borderWidth: 1, borderRadius: 6 }] },
    options: chartOptions(true)
  });
}

function chartOptions(eur = false) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => eur ? '€ ' + v : v } } },
  };
}
function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function periodStart(period) {
  if (period === 'dag')   return startOfToday();
  if (period === 'week')  return startOfWeek();
  if (period === 'maand') return startOfMonth();
  return startOfYear();
}

function computeBuckets(orders, period) {
  // Buckets en labels per periode
  // dag → 24 uur (00–23), week → 7 dagen, maand → 4–5 weken, jaar → 12 maanden
  const labels = [];
  const counts = [];
  const revenue = [];
  const now = new Date();

  if (period === 'dag') {
    for (let h = 0; h < 24; h++) {
      labels.push(String(h).padStart(2,'0') + 'u');
      counts.push(0); revenue.push(0);
    }
    orders.filter(o => o.timestamp >= startOfToday()).forEach(o => {
      const h = new Date(o.timestamp).getHours();
      counts[h]++; revenue[h] += o.total;
    });
  } else if (period === 'week') {
    const start = startOfWeek();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start + i * 86400000);
      labels.push(['ma','di','wo','do','vr','za','zo'][i]);
      counts.push(0); revenue.push(0);
    }
    orders.filter(o => o.timestamp >= start).forEach(o => {
      const d = new Date(o.timestamp);
      const dayIdx = (d.getDay() + 6) % 7;
      counts[dayIdx]++; revenue[dayIdx] += o.total;
    });
  } else if (period === 'maand') {
    const start = startOfMonth();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) { labels.push(d); counts.push(0); revenue.push(0); }
    orders.filter(o => o.timestamp >= start).forEach(o => {
      const d = new Date(o.timestamp).getDate();
      counts[d-1]++; revenue[d-1] += o.total;
    });
  } else {
    // jaar
    const start = startOfYear();
    for (let m = 0; m < 12; m++) {
      labels.push(['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][m]);
      counts.push(0); revenue.push(0);
    }
    orders.filter(o => o.timestamp >= start).forEach(o => {
      const m = new Date(o.timestamp).getMonth();
      counts[m]++; revenue[m] += o.total;
    });
  }
  return { labels, counts, revenue };
}

// =====================================================
// CSV EXPORT
// =====================================================
function exportCsv() {
  const orders = getOrders().filter(o => o.timestamp >= periodStart(overviewPeriod));
  if (!orders.length) { toast('Geen bestellingen in deze periode'); return; }
  const rows = [['orderId','datetime','klant','bron','status','aantal_items','totaal_eur','items']];
  orders.forEach(o => {
    rows.push([
      o.id,
      new Date(o.timestamp).toISOString(),
      o.customerName,
      o.source,
      o.status,
      o.items.reduce((a,x)=>a+x.qty,0),
      o.total.toFixed(2).replace('.', ','),
      o.items.flatMap(it => it.lines.map(l => `${it.name}${l.config?` (${describePortion(it, l.config)})`:''}`)).join(' | ')
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pinkalmond-${overviewPeriod}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('CSV gedownload ⬇️');
}

// =====================================================
// SETTINGS / DEMO
// =====================================================
function savePinFromSettings() {
  const v = document.getElementById('new-pin').value.trim();
  if (!/^\d{4,6}$/.test(v)) { toast('Pincode moet 4–6 cijfers zijn'); return; }
  setPin(v);
  document.getElementById('new-pin').value = '';
  toast('Pincode opgeslagen 🔑');
}
function loadDemoData() {
  const now = Date.now();
  const make = (offset, name, items, src='klant', status='voldaan') => ({
    id: generateOrderId(), customerName: name, note: '', source: src, status,
    items, total: items.reduce((s, it) => s + it.lines.reduce((a, l) => a + l.price, 0), 0),
    timestamp: now - offset,
  });
  const demo = [
    make(1000*60*5, 'Lisa', [
      { itemId:'bol2', name:'2 bollen ijs', basePrice:3.50, qty:1,
        lines:[{ config:{ verpakking:'Hoorntje', smaken:['Pistache','Stracciatella'], slagroom:true, wafel:false }, price:4.30 }] },
      { itemId:'cappuccino', name:'Cappuccino', basePrice:3.50, qty:1, lines:[{ config:null, price:3.50 }] },
    ], 'klant', 'open'),
    make(1000*60*60*2, 'Jan', [
      { itemId:'wafel-ijs', name:'Wafel met ijs & slagroom', basePrice:5.75, qty:2,
        lines:[{ config:null, price:5.75 }, { config:null, price:5.75 }] }
    ], 'kassa'),
    make(1000*60*60*4, 'Anouk', [
      { itemId:'bol3', name:'3 bollen ijs', basePrice:5.25, qty:1,
        lines:[{ config:{ verpakking:'Bakje', smaken:['Vanille','Aardbei','Mango'], slagroom:false, wafel:false }, price:5.25 }] }
    ]),
    make(1000*60*60*24, 'Sam', [
      { itemId:'liter1', name:'1 liter ijs', basePrice:18.00, qty:1,
        lines:[{ config:{ verpakking:'Bakje', smaken:['Chocolade','Hazelnoot','Citroen'], slagroom:false, wafel:false }, price:18.00 }] },
      { itemId:'matcha', name:'Matcha latte', basePrice:3.75, qty:1, lines:[{ config:null, price:3.75 }] }
    ]),
    make(1000*60*60*48, 'Ben', [
      { itemId:'bol1', name:'1 bol ijs', basePrice:1.75, qty:1,
        lines:[{ config:{ verpakking:'Hoorntje', smaken:['Vanille'], slagroom:false, wafel:false }, price:1.75 }] },
      { itemId:'koffie', name:'Koffie', basePrice:3.00, qty:1, lines:[{ config:null, price:3.00 }] }
    ], 'kassa'),
    make(1000*60*60*96, 'Eva', [
      { itemId:'smoothie', name:'Verse smoothie', basePrice:5.50, qty:1, lines:[{ config:null, price:5.50 }] }
    ], 'kassa'),
  ];
  saveOrders([...demo, ...getOrders()]);
  initAdmin();
  toast('Demo-data toegevoegd 🍦');
}
function clearAllOrders() {
  if (!confirm('Alle bestellingen permanent verwijderen?')) return;
  saveOrders([]); initAdmin(); toast('Alle bestellingen gewist');
}

// =====================================================
// TOAST
// =====================================================
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

// =====================================================
// INIT
// =====================================================
function initAdmin() {
  updateStats();
  refreshOrders();
}

document.addEventListener('DOMContentLoaded', () => {
  // PIN-flow
  showPinScreen();
  document.getElementById('pin-submit').addEventListener('click', () => {
    const v = document.getElementById('pin-input').value;
    if (v === getPin()) { document.getElementById('pin-input').value = ''; unlockAdmin(); }
    else { toast('Onjuiste pincode 🔒'); }
  });
  document.getElementById('pin-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('pin-submit').click();
  });
  document.getElementById('logout-btn').addEventListener('click', () => {
    document.getElementById('pin-input').value = '';
    showPinScreen();
  });

  // Tabs
  setupTabs();

  // Order filters
  document.querySelectorAll('[data-orders-filter]').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-orders-filter]').forEach(x => x.classList.toggle('is-active', x === b));
      ordersFilter = b.dataset.ordersFilter;
      refreshOrders();
    })
  );

  // Kassa
  document.getElementById('kassa-checkout').addEventListener('click', kassaCheckout);
  document.getElementById('kassa-clear').addEventListener('click', kassaClear);

  // Item-modal
  document.getElementById('close-item-modal').addEventListener('click', closeItemModal);
  document.getElementById('save-item-btn').addEventListener('click', saveItem);
  document.getElementById('delete-item-btn').addEventListener('click', () => {
    if (editingItemId) { deleteMenuItem(editingItemId); closeItemModal(); }
  });
  document.getElementById('item-configurable').addEventListener('change', toggleScoopsField);
  document.getElementById('item-modal').addEventListener('click', e => {
    if (e.target.id === 'item-modal') closeItemModal();
  });

  // Categorie-modal
  document.getElementById('close-cat-modal').addEventListener('click', closeCategoryModal);
  document.getElementById('save-cat-btn').addEventListener('click', saveCategory);
  document.getElementById('delete-cat-btn').addEventListener('click', () => {
    if (editingCatId) { deleteMenuCategory(editingCatId); closeCategoryModal(); }
  });
  document.getElementById('cat-modal').addEventListener('click', e => {
    if (e.target.id === 'cat-modal') closeCategoryModal();
  });

  // Overzicht
  document.querySelectorAll('[data-overview-period]').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-overview-period]').forEach(x => x.classList.toggle('is-active', x === b));
      overviewPeriod = b.dataset.overviewPeriod;
      renderOverview();
    })
  );
  document.getElementById('export-csv-btn').addEventListener('click', exportCsv);

  // Settings
  document.getElementById('save-pin-btn').addEventListener('click', savePinFromSettings);
  document.getElementById('demo-btn').addEventListener('click', loadDemoData);
  document.getElementById('reset-orders-btn').addEventListener('click', clearAllOrders);

  // Refresh button (header)
  document.getElementById('refresh-btn').addEventListener('click', () => {
    initAdmin();
    toast('Vernieuwd ↻');
  });

  // Cross-tab: andere tab plaatste een nieuwe order? → refresh
  window.addEventListener('storage', e => {
    if (e.key === 'pa_orders') refreshOrders();
  });

  // Footer jaartal
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
