const CART_KEY = 'mome_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
  window.dispatchEvent(new CustomEvent('mome:cart-change'));
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => String(item.productId) === String(product.id));

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      image: product.image,
      quantity,
    });
  }

  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  let cart = getCart();
  cart = cart
    .map((item) => (String(item.productId) === String(productId) ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => String(item.productId) !== String(productId)));
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const cart = getCart();
  const count = getCartCount();
  const total = getCartTotal();

  if (countEl) {
    countEl.textContent = count;
    countEl.hidden = count === 0;
  }

  if (totalEl) totalEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  itemsEl.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${escapeAttr(item.productId)}">
      <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${formatPrice(item.price)} · ${escapeHtml(item.size)}</p>
        <div class="cart-item-controls">
          <button type="button" class="qty-btn" data-action="decrease" data-id="${escapeAttr(item.productId)}">−</button>
          <span>${item.quantity}</span>
          <button type="button" class="qty-btn" data-action="increase" data-id="${escapeAttr(item.productId)}">+</button>
          <button type="button" class="cart-remove" data-id="${escapeAttr(item.productId)}">Remove</button>
        </div>
      </div>
    </div>`
    )
    .join('');
}

async function checkout(shippingAddress) {
  const cart = getCart();
  if (cart.length === 0) return false;

  await api.placeOrder({
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
    })),
    shippingAddress,
  });

  clearCart();
  return true;
}
