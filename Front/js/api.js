const API_BASE = '/api';

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  const token = localStorage.getItem('mome_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const adminToken = localStorage.getItem('mome_admin_token');
  if (options.admin && adminToken) headers.Authorization = `Bearer ${adminToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

const api = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => apiRequest('/auth/me'),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => apiRequest('/products/categories'),

  placeOrder: (body) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrders: () => apiRequest('/orders'),

  sendContact: (body) => apiRequest('/contact', { method: 'POST', body: JSON.stringify(body) }),

  adminLogin: (password) =>
    apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminGetProducts: () => apiRequest('/admin/products', { admin: true }),
  adminCreateProduct: (body) =>
    apiRequest('/admin/products', { method: 'POST', body: JSON.stringify(body), admin: true }),
  adminUpdateProduct: (id, body) =>
    apiRequest(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body), admin: true }),
  adminDeleteProduct: (id) =>
    apiRequest(`/admin/products/${id}`, { method: 'DELETE', admin: true }),
  adminGetOrders: () => apiRequest('/admin/orders', { admin: true }),
  adminUpdateOrderStatus: (id, status) =>
    apiRequest(`/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      admin: true,
    }),
};

function formatPrice(price) {
  return `$${Number(price).toFixed(0)}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
