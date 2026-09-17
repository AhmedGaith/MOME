document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSearch();
  initAuthModal();
  initCart();
  initContactForm();

  try {
    await initAuth();
    await loadCategories();
    initFilters();
    await renderProducts();
  } catch (err) {
    showShopError(err.message);
  }
});

function showShopError(message) {
  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Could not load products</h3>
        <p>${escapeHtml(message)}</p>
        <p>Make sure the server is running and PostgreSQL is connected.</p>
      </div>`;
  }
}

function initNavigation() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const links = nav.querySelectorAll('a');

  toggle?.addEventListener('click', () => nav.classList.toggle('open'));

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('open')) return;
    if (nav.contains(e.target) || toggle?.contains(e.target)) return;
    nav.classList.remove('open');
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach((l) => {
            l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((s) => observer.observe(s));
}

function initSearch() {
  const input = document.getElementById('searchInput');
  const headerInput = document.getElementById('headerSearch');

  let debounce;
  const handleSearch = (value) => {
    if (headerInput && headerInput !== input) headerInput.value = value;
    if (input && input !== headerInput) input.value = value;

    clearTimeout(debounce);
    debounce = setTimeout(() => renderProducts(value, getActiveCategory()), 250);
  };

  input?.addEventListener('input', (e) => handleSearch(e.target.value));
  headerInput?.addEventListener('input', (e) => handleSearch(e.target.value));
}

function getActiveCategory() {
  const active = document.querySelector('.filter-btn.active');
  return active?.dataset.category || 'all';
}

function initFilters() {
  const container = document.getElementById('filters');
  if (!container) return;

  const cats = ['all', ...getCategories()];

  container.innerHTML = cats
    .map(
      (cat) =>
        `<button class="filter-btn${cat === 'all' ? ' active' : ''}" data-category="${cat}">${
          cat === 'all' ? 'All' : cat
        }</button>`
    )
    .join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    container.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const query =
      document.getElementById('searchInput')?.value ||
      document.getElementById('headerSearch')?.value ||
      '';

    renderProducts(query, btn.dataset.category);
  });
}

async function renderProducts(query = '', category = 'all') {
  const grid = document.getElementById('productGrid');
  const info = document.getElementById('searchResultsInfo');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state"><p>Loading products…</p></div>';

  try {
    await loadProducts(query, category);
    const results = getProducts();

    if (info) {
      if (query || category !== 'all') {
        info.textContent = `${results.length} item${results.length !== 1 ? 's' : ''} found${
          query ? ` for "${query}"` : ''
        }${category !== 'all' ? ` in ${category}` : ''}`;
      } else {
        info.textContent = '';
      }
    }

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No items found</h3>
          <p>Try a different search term or category.</p>
        </div>`;
      return;
    }

    grid.innerHTML = results
      .map(
        (p) => `
      <article class="product-card ${p.stock === 0 ? 'out-of-stock' : ''}">
        <div class="product-image">
          <img src="${escapeAttr(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
          ${p.stock === 0 ? '<span class="out-of-stock-badge">Sold Out</span>' : ''}
          ${p.stock < 10 && p.stock > 0 ? '<span class="low-stock-badge">Only ' + p.stock + ' left</span>' : ''}
        </div>
        <div class="product-info">
          <p class="product-category">${escapeHtml(p.category)}</p>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-desc">${escapeHtml(p.description)}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(p.price)}</span>
            <span class="product-size">${escapeHtml(p.size)}</span>
          </div>
          <button type="button" class="btn btn-dark btn-add-cart ${p.stock === 0 ? 'disabled' : ''}" data-id="${escapeAttr(p.id)}" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </article>`
      )
      .join('');

    grid.querySelectorAll('.btn-add-cart').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = results.find((p) => String(p.id) === String(btn.dataset.id));
        if (product && (product.stock === undefined || product.stock > 0)) {
          addToCart(product);
          openCart();
        }
      });
    });
  } catch (err) {
    showShopError(err.message);
  }
}

function initAuthModal() {
  const modal = document.getElementById('authModal');
  const accountBtn = document.getElementById('accountBtn');
  const closeBtn = document.getElementById('authClose');
  const tabs = modal?.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const authNotice = document.getElementById('authNotice');

  accountBtn?.addEventListener('click', () => {
    openAuthModal(isLoggedIn() ? 'account' : 'login');
  });

  closeBtn?.addEventListener('click', closeAuthModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });

  tabs?.forEach((tab) => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();

    try {
      await login(
        document.getElementById('loginEmail').value,
        document.getElementById('loginPassword').value
      );
      closeAuthModal();
    } catch (err) {
      showAuthError(err.message);
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();

    try {
      await register(
        document.getElementById('registerName').value,
        document.getElementById('registerEmail').value,
        document.getElementById('registerPassword').value
      );
      closeAuthModal();
    } catch (err) {
      showAuthError(err.message);
    }
  });

  logoutBtn?.addEventListener('click', () => {
    logout();
    switchAuthTab('login');
    closeAuthModal();
  });

  window.addEventListener('mome:auth-change', () => {
    updateAccountPanel();
    if (authNotice) authNotice.hidden = true;
  });
}

function openAuthModal(tab = 'login', notice = '') {
  const modal = document.getElementById('authModal');
  const authNotice = document.getElementById('authNotice');

  switchAuthTab(isLoggedIn() ? 'account' : tab);

  if (notice && authNotice) {
    authNotice.textContent = notice;
    authNotice.hidden = false;
  }

  modal?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('open');
  document.body.style.overflow = '';
  clearAuthError();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.auth-panel').forEach((p) => {
    p.hidden = p.dataset.panel !== tab;
  });
  updateAccountPanel();
}

function updateAccountPanel() {
  const nameEl = document.getElementById('accountName');
  const emailEl = document.getElementById('accountEmail');

  if (currentUser) {
    if (nameEl) nameEl.textContent = currentUser.name;
    if (emailEl) emailEl.textContent = currentUser.email;
  }
}

function showAuthError(message) {
  const el = document.getElementById('authError');
  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
}

function clearAuthError() {
  const el = document.getElementById('authError');
  if (el) el.hidden = true;
}

function initCart() {
  const cartBtn = document.getElementById('cartBtn');
  const cartClose = document.getElementById('cartClose');
  const cartOverlay = document.getElementById('cartOverlay');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const cartItems = document.getElementById('cartItems');

  updateCartUI();

  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  cartItems?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    const item = getCart().find((i) => i.productId === id);
    if (!item) return;

    if (btn.dataset.action === 'increase') updateCartQuantity(id, item.quantity + 1);
    if (btn.dataset.action === 'decrease') updateCartQuantity(id, item.quantity - 1);
    if (btn.classList.contains('cart-remove')) removeFromCart(id);
  });

  checkoutBtn?.addEventListener('click', () => {
    document.getElementById('checkoutSection').hidden = false;
  });

  checkoutForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const success = document.getElementById('checkoutSuccess');
    const error = document.getElementById('checkoutError');
    error.hidden = true;

    try {
      await checkout({
        fullName: document.getElementById('shipName').value,
        phone: document.getElementById('shipPhone').value,
        address: document.getElementById('shipAddress').value,
        city: document.getElementById('shipCity').value,
        zip: document.getElementById('shipZip').value,
      });

      checkoutForm.reset();
      document.getElementById('checkoutSection').hidden = true;
      success.hidden = false;
      setTimeout(() => {
        success.hidden = true;
        closeCart();
      }, 3000);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    }
  });
}

function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartUI();
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const error = document.getElementById('formError');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    success?.classList.remove('visible');
    if (error) error.hidden = true;

    try {
      await api.sendContact({
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
      });

      success?.classList.add('visible');
      form.reset();
      setTimeout(() => success?.classList.remove('visible'), 5000);
    } catch (err) {
      if (error) {
        error.textContent = err.message;
        error.hidden = false;
      }
    }
  });
}

async function renderOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container || !isLoggedIn()) return;

  container.innerHTML = '<div class="loading-state"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';

  try {
    const orders = await api.getOrders();

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="empty-orders">
          <h3>No orders yet</h3>
          <p>You haven't placed any orders. <a href="#shop">Start shopping</a></p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-status status-${order.status}">${order.status}</span>
          <span class="order-date">${new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <img src="${escapeAttr(item.image)}" alt="${escapeHtml(item.name)}">
              <div class="order-item-details">
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.size)} · Qty: ${item.quantity}</p>
              </div>
              <span class="order-item-price">$${Number(item.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-footer">
          <span class="order-total">Total: $${Number(order.total).toFixed(2)}</span>
          <span class="order-shipping">${order.shippingAddress?.fullName}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Could not load orders</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
  }
}

// Load orders when switching to account tab
function initOrderHistory() {
  const accountTab = document.querySelector('.auth-tab[data-tab="account"]');
  accountTab?.addEventListener('click', renderOrders);
}

initOrderHistory();

// Scroll reveal animation
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-grid');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// Newsletter form
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const success = document.getElementById('newsletterSuccess');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.style.display = 'none';
    success.style.display = 'block';
  });
}

initNewsletter();

// Add reveal classes to sections
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('section').forEach((section, index) => {
    if (section.id !== 'home') {
      section.classList.add('reveal');
    }
  });
  document.querySelectorAll('.product-grid').forEach(grid => {
    grid.classList.add('reveal-grid');
  });
  initScrollReveal();
});
