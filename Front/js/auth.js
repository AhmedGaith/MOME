let currentUser = null;

function getToken() {
  return localStorage.getItem('mome_token');
}

function setSession(token, user) {
  localStorage.setItem('mome_token', token);
  currentUser = user;
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('mome:auth-change', { detail: { user } }));
}

function clearSession() {
  localStorage.removeItem('mome_token');
  currentUser = null;
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('mome:auth-change', { detail: { user: null } }));
}

function isLoggedIn() {
  return !!getToken() && !!currentUser;
}

async function initAuth() {
  const token = getToken();
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const { user } = await api.me();
    currentUser = user;
  } catch {
    clearSession();
  }

  updateAuthUI();
}

async function register(name, email, password) {
  const { token, user } = await api.register({ name, email, password });
  setSession(token, user);
  return user;
}

async function login(email, password) {
  const { token, user } = await api.login({ email, password });
  setSession(token, user);
  return user;
}

function logout() {
  clearSession();
}

function updateAuthUI() {
  const accountLabel = document.getElementById('accountLabel');
  const accountBtn = document.getElementById('accountBtn');
  const accountTab = document.querySelector('.auth-tab[data-tab="account"]');
  const ordersNav = document.getElementById('ordersNav');
  const ordersSection = document.getElementById('orders');

  if (accountLabel) {
    accountLabel.textContent = currentUser ? currentUser.name.split(' ')[0] : 'Account';
  }

  if (accountBtn) {
    accountBtn.title = currentUser ? `Signed in as ${currentUser.email}` : 'Sign in or create account';
  }

  if (accountTab) {
    accountTab.hidden = !currentUser;
  }

  if (ordersNav) {
    ordersNav.hidden = !currentUser;
  }

  if (ordersSection) {
    ordersSection.hidden = !currentUser;
  }
}

function requireAuth(message = 'Please sign in to place an order.') {
  if (isLoggedIn()) return true;
  openAuthModal('login', message);
  return false;
}
