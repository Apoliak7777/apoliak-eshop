// Apoliak Shops — jednoduchý e-shop (frontend mock, lokálne)
// Funkcie: generovanie produktov, modal product view, košík (add/remove/update), checkout simulácia, localStorage persist

document.addEventListener('DOMContentLoaded', () => {
  // Rok v patičke
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Ukážkové produkty (môžeš nahradiť reálnymi dátami alebo API)
  const products = [
    { id: 'p1', title: 'Štýlová mikina', price: 49.00, desc: 'Čierna mikina s decentným logom.', colors: ['čierna','zelená'] },
    { id: 'p2', title: 'Apoliak tričko', price: 24.50, desc: 'Pohodlné tričko z organickej bavlny.', colors: ['čierna','biela'] },
    { id: 'p3', title: 'Minimal taška', price: 19.90, desc: 'Praktická taška na laptop alebo nákupy.', colors: ['čierna'] },
    { id: 'p4', title: 'Digitálny voucher', price: 99.00, desc: 'Darčekový poukaz na tvorbu webu (digitálna dodávka).', colors: [] },
    { id: 'p5', title: 'Káva pre vývojára', price: 7.50, desc: 'Balíček výberovej kávy 250g.', colors: [] },
    { id: 'p6', title: 'Nálepka Apoliak', price: 2.50, desc: 'Vinylová nálepka — ukáž svoj štýl.', colors: [] }
  ];

  // Košík: {id, qty}
  const CART_KEY = 'apoliak_shop_cart_v1';
  let cart = loadCart();

  // Elementy
  const productsGrid = document.getElementById('products-grid');
  const cartBtn = document.getElementById('cart-btn');
  const cartEl = document.getElementById('cart');
  const cartCountEl = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById('cart-items');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const closeCartBtn = document.getElementById('close-cart');
  const clearCartBtn = document.getElementById('clear-cart');
  const checkoutBtn = document.getElementById('checkout-btn');

  const productModal = document.getElementById('product-modal');
  const modalContent = document.getElementById('modal-content');
  const closeModalBtn = document.getElementById('close-modal');

  // Render produkty
  function renderProducts() {
    productsGrid.innerHTML = '';
    products.forEach(p => {
      const el = document.createElement('article');
      el.className = 'product-card';
      el.innerHTML = `
        <div class="prod-thumb" data-id="${p.id}">
          <svg viewBox="0 0 200 140" aria-hidden="true">
            <defs>
              <linearGradient id="grad-${p.id}" x1="0" x2="1">
                <stop offset="0" stop-color="#003b2b"/>
                <stop offset="1" stop-color="#001f12"/>
              </linearGradient>
            </defs>
            <rect x="8" y="8" width="184" height="124" rx="8" fill="url(#grad-${p.id})" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.08)" font-size="18">${p.title}</text>
          </svg>
        </div>
        <div class="prod-meta">
          <div class="prod-title">${p.title}</div>
          <div class="prod-price">€${p.price.toFixed(2)}</div>
        </div>
        <div class="card-actions">
          <button class="btn-view" data-id="${p.id}">Pozrieť</button>
          <button class="btn-add pulse" data-id="${p.id}">Pridať do košíka</button>
        </div>
      `;
      productsGrid.appendChild(el);
    });
  }

  // Cart logic
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function getCartCount() {
    return cart.reduce((s, i) => s + i.qty, 0);
  }
  function getCartSubtotal() {
    return cart.reduce((s, i) => {
      const p = products.find(x => x.id === i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function addToCart(id, qty = 1) {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, qty });
    saveCart();
    renderCart();
    flashCart();
  }

  function updateQty(id, qty) {
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = qty;
    if (it.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
  }

  function renderCart() {
    // Update badge
    cartCountEl.textContent = String(getCartCount());
    // Render items
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="empty">Košík je prázdny.</p>';
      cartSubtotalEl.textContent = '€0.00';
      return;
    }
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-thumb">${p.title.split(' ')[0]}</div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong style="font-size:0.95rem">${p.title}</strong>
            <span style="font-weight:700">€${(p.price * item.qty).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <div class="qty-controls">
              <button class="qty-decrease" data-id="${p.id}">−</button>
              <span style="padding:0 8px">${item.qty}</span>
              <button class="qty-increase" data-id="${p.id}">+</button>
            </div>
            <button class="btn-view" data-id="${p.id}" style="padding:6px 10px">Upraviť</button>
            <button class="btn-ghost" data-remove="${p.id}" style="padding:6px 8px">X</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
    cartSubtotalEl.textContent = `€${getCartSubtotal().toFixed(2)}`;
  }

  function flashCart() {
    cartEl.classList.add('open');
    setTimeout(() => cartEl.classList.remove('open'), 1800);
  }

  // Modal
  function openProductModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    modalContent.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">
        <div style="background:linear-gradient(120deg,#001f1a,#003b33);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 200 140" style="width:90%;height:90%">
            <rect x="8" y="8" width="184" height="124" rx="8" fill="#032b20"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.08)" font-size="18">${p.title}</text>
          </svg>
        </div>
        <div>
          <h3 style="margin-top:0">${p.title}</h3>
          <p style="color:var(--muted)">${p.desc}</p>
          <p style="font-weight:700;font-size:1.1rem">€${p.price.toFixed(2)}</p>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button id="modal-add" class="btn-add">Pridať do košíka</button>
            <button id="modal-close" class="btn btn-ghost">Zavrieť</button>
          </div>
        </div>
      </div>
    `;
    productModal.classList.add('show');
    productModal.setAttribute('aria-hidden', 'false');

    document.getElementById('modal-add').addEventListener('click', () => {
      addToCart(p.id, 1);
      closeModal();
    });
    document.getElementById('modal-close').addEventListener('click', closeModal);
  }
  function closeModal() {
    productModal.classList.remove('show');
    productModal.setAttribute('aria-hidden', 'true');
  }

  // Events
  productsGrid.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('btn-add')) {
      addToCart(id, 1);
    } else if (e.target.classList.contains('btn-view') || e.target.closest('.prod-thumb')) {
      openProductModal(id);
    }
  });

  cartBtn && cartBtn.addEventListener('click', () => {
    cartEl.classList.toggle('open');
  });
  closeCartBtn && closeCartBtn.addEventListener('click', () => cartEl.classList.remove('open'));
  clearCartBtn && clearCartBtn.addEventListener('click', () => clearCart());

  cartItemsEl.addEventListener('click', (e) => {
    const inc = e.target.classList.contains('qty-increase');
    const dec = e.target.classList.contains('qty-decrease');
    const remove = e.target.dataset.remove;
    const id = e.target.dataset.id || remove;
    if (!id) return;
    if (inc) {
      const it = cart.find(i => i.id === id);
      if (it) updateQty(id, it.qty + 1);
    } else if (dec) {
      const it = cart.find(i => i.id === id);
      if (it) updateQty(id, it.qty - 1);
    } else if (remove) {
      removeFromCart(remove);
    } else if (e.target.classList.contains('btn-view')) {
      openProductModal(id);
    }
  });

  checkoutBtn && checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Košík je prázdny.');
      return;
    }
    // Jednoduchá simulácia checkoutu
    const subtotal = getCartSubtotal();
    if (confirm(`Celková suma: €${subtotal.toFixed(2)}\nChceš simulovať platbu a dokončiť objednávku?`)) {
      clearCart();
      alert('Ďakujeme! Objednávka bola úspešne odoslaná (simulácia). Ozvem sa s detailmi.');
    }
  });

  // Contact form mock
  const form = document.getElementById('contact-form');
  const formMsg = document.getElementById('form-msg');
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    formMsg.textContent = 'Odosielam dopyt...';
    setTimeout(() => {
      formMsg.textContent = 'Dopyt odoslaný! Ozvem sa do 24 hodín.';
      form.reset();
    }, 900);
  });

  // Mailto button fallback for contact
  const mailtoBtn = document.getElementById('mailto-btn');
  mailtoBtn && mailtoBtn.addEventListener('click', () => {
    const name = form.querySelector('[name=name]').value || 'Zákazník';
    const subject = encodeURIComponent('Dopyt na e-shop — Apoliak Shops');
    const body = encodeURIComponent(`Ahoj,\n\nVolám sa ${name} a mal by som záujem o e-shop. Napíš mi, prosím, termín a cenu.\n\nS pozdravom,\n${name}`);
    window.location.href = `mailto:apoliak@example.com?subject=${subject}&body=${body}`;
  });

  // Modal close overlay
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal || e.target.id === 'close-modal') closeModal();
  });
  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      cartEl.classList.remove('open');
    }
  });

  // Hamburger (mobile)
  const hamburger = document.querySelector('.hamburger');
  hamburger && hamburger.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    const opened = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!opened));
    if(nav) nav.style.display = opened ? 'none' : 'flex';
  });

  // Inicializácia
  renderProducts();
  renderCart();
});