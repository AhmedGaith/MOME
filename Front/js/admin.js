const ADMIN_TOKEN_KEY = 'mome_admin_token';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('loginGate').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';

  const form = document.getElementById('loginForm');
  const error = document.getElementById('loginError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const { token } = await api.adminLogin(document.getElementById('adminPassword').value);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      error.classList.remove('visible');
      showDashboard();
    } catch {
      error.classList.add('visible');
    }
  });
}

function showDashboard() {
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  initAdminTabs();
  initAdminForm();
  renderAdminList();
  initLogout();
}

function initAdminTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
  });
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  document.getElementById('productsPanel').hidden = tab !== 'products';
  document.getElementById('ordersPanel').hidden = tab !== 'orders';

  if (tab === 'orders') renderAdminOrders();
}

function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    location.reload();
  });
}

let editingId = null;
let currentImage = '';

function initAdminForm() {
  const form = document.getElementById('productForm');
  const cancelBtn = document.getElementById('cancelEdit');
  const imageFileInput = document.getElementById('prodImageFile');
  const imageUrlInput = document.getElementById('prodImage');
  const imagePreviewWrap = document.getElementById('prodImagePreviewWrap');
  const imagePreview = document.getElementById('prodImagePreview');

  const updatePreview = (src) => {
    if (!src) {
      imagePreviewWrap.hidden = true;
      imagePreview.removeAttribute('src');
      return;
    }
    imagePreview.src = src;
    imagePreviewWrap.hidden = false;
  };

  imageFileInput.addEventListener('change', () => {
    const file = imageFileInput.files?.[0];
    if (!file) {
      updatePreview(imageUrlInput.value.trim() || currentImage);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast('Image must be 5 MB or smaller.', true);
      imageFileInput.value = '';
      updatePreview(imageUrlInput.value.trim() || currentImage);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updatePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  });

  imageUrlInput.addEventListener('input', () => {
    if (imageFileInput.files?.length) return;
    updatePreview(imageUrlInput.value.trim() || currentImage);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uploadedFile = imageFileInput.files?.[0];
    let image = '';

    try {
      if (uploadedFile) {
        image = await compressImage(uploadedFile);
      } else if (imageUrlInput.value.trim()) {
        image = imageUrlInput.value.trim();
      } else if (currentImage) {
        image = currentImage;
      }
    } catch {
      showToast('Could not process the image.', true);
      return;
    }

    const data = {
      name: document.getElementById('prodName').value.trim(),
      category: document.getElementById('prodCategory').value.trim(),
      description: document.getElementById('prodDesc').value.trim(),
      price: parseFloat(document.getElementById('prodPrice').value),
      size: document.getElementById('prodSize').value.trim(),
      image,
    };

    if (!data.name || !data.category || !data.price || !data.image) {
      showToast('Please fill in all required fields and add an image.', true);
      return;
    }

    try {
      if (editingId) {
        await api.adminUpdateProduct(editingId, data);
        showToast('Product updated!');
        cancelEdit();
      } else {
        await api.adminCreateProduct(data);
        showToast('Product added!');
        form.reset();
        currentImage = '';
        updatePreview('');
      }

      renderAdminList();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  cancelBtn.addEventListener('click', cancelEdit);
}

function cancelEdit() {
  editingId = null;
  currentImage = '';
  document.getElementById('productForm').reset();
  document.getElementById('formTitle').textContent = 'Add New Product';
  document.getElementById('submitBtn').textContent = 'Add Product';
  document.getElementById('cancelEdit').style.display = 'none';
  document.getElementById('prodImagePreviewWrap').hidden = true;
  document.getElementById('prodImagePreview').removeAttribute('src');
}

async function startEdit(id) {
  try {
    const products = await api.adminGetProducts();
    const product = products.find((p) => String(p.id) === String(id));
    if (!product) return;

    editingId = id;
    currentImage = product.image;

    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodDesc').value = product.description;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodSize').value = product.size;
    document.getElementById('prodImage').value = product.image.startsWith('data:') ? '' : product.image;
    document.getElementById('prodImageFile').value = '';
    document.getElementById('prodImagePreview').src = product.image;
    document.getElementById('prodImagePreviewWrap').hidden = false;

    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('submitBtn').textContent = 'Save Changes';
    document.getElementById('cancelEdit').style.display = 'inline-flex';

    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast(err.message, true);
  }
}

async function renderAdminList() {
  const list = document.getElementById('adminProductList');
  const count = document.getElementById('productCount');

  try {
    const products = await api.adminGetProducts();
    count.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
      list.innerHTML = '<div class="admin-empty">No products yet. Add your first item!</div>';
      return;
    }

    list.innerHTML = products
      .map(
        (p) => `
      <div class="admin-product-item" data-id="${p.id}">
        <div class="admin-product-thumb">
          <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}">
        </div>
        <div class="admin-product-details">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="admin-product-meta">${escapeHtml(p.category)} · ${formatPrice(p.price)} · ${escapeHtml(p.size)}</p>
        </div>
        <div class="admin-product-actions">
          <button class="admin-btn admin-btn-edit" onclick="startEdit('${p.id}')">Edit</button>
          <button class="admin-btn admin-btn-danger" onclick="removeProduct('${p.id}')">Delete</button>
        </div>
      </div>`
      )
      .join('');
  } catch (err) {
    list.innerHTML = `<div class="admin-empty">${escapeHtml(err.message)}</div>`;
  }
}

async function removeProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;

  try {
    await api.adminDeleteProduct(id);
    if (editingId === id) cancelEdit();
    renderAdminList();
    showToast('Product deleted.');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function renderAdminOrders() {
  const list = document.getElementById('adminOrderList');
  const count = document.getElementById('orderCount');

  list.innerHTML = '<div class="admin-empty">Loading orders…</div>';

  try {
    const orders = await api.adminGetOrders();
    count.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
      list.innerHTML = '<div class="admin-empty">No orders yet.</div>';
      return;
    }

    list.innerHTML = orders.map((order) => renderOrderCard(order)).join('');

    list.querySelectorAll('.order-status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const orderId = select.dataset.id;
        const previous = select.dataset.current;
        try {
          await api.adminUpdateOrderStatus(orderId, select.value);
          select.dataset.current = select.value;
          showToast('Order status updated.');
        } catch (err) {
          select.value = previous;
          showToast(err.message, true);
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="admin-empty">${escapeHtml(err.message)}</div>`;
  }
}

function renderOrderCard(order) {
  const date = new Date(order.createdAt).toLocaleString();
  const itemRows = order.items
    .map(
      (item) => `
      <li class="admin-order-item">
        <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}">
        <span>${escapeHtml(item.name)} × ${item.quantity}</span>
        <span>${formatPrice(item.price)} · ${escapeHtml(item.size)}</span>
      </li>`
    )
    .join('');

  return `
    <article class="admin-order-card">
      <div class="admin-order-head">
        <div>
          <h3>Order #${escapeHtml(order.id)}</h3>
          <p class="admin-order-meta">${escapeHtml(date)} · ${escapeHtml(order.customer.name)} · ${escapeHtml(order.customer.email)}</p>
        </div>
        <div class="admin-order-head-actions">
          <strong>${formatPrice(order.total)}</strong>
          <select class="order-status-select status-${escapeAttr(order.status)}" data-id="${escapeAttr(order.id)}" data-current="${escapeAttr(order.status)}">
            <option value="pending"${order.status === 'pending' ? ' selected' : ''}>Pending</option>
            <option value="confirmed"${order.status === 'confirmed' ? ' selected' : ''}>Confirmed</option>
            <option value="shipped"${order.status === 'shipped' ? ' selected' : ''}>Shipped</option>
            <option value="delivered"${order.status === 'delivered' ? ' selected' : ''}>Delivered</option>
            <option value="cancelled"${order.status === 'cancelled' ? ' selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>
      <div class="admin-order-shipping">
        <strong>Ship to:</strong>
        ${escapeHtml(order.shippingAddress.fullName)},
        ${escapeHtml(order.shippingAddress.phone || '')},
        ${escapeHtml(order.shippingAddress.address)},
        ${escapeHtml(order.shippingAddress.city)} ${escapeHtml(order.shippingAddress.zip)}
      </div>
      <ul class="admin-order-items">${itemRows}</ul>
    </article>`;
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

function compressImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };

    img.src = url;
  });
}
