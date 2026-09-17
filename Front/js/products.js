let allProducts = [];
let categories = [];

async function loadProducts(query = '', category = 'all') {
  const params = {};
  if (query.trim()) params.q = query.trim();
  if (category && category !== 'all') params.category = category;

  allProducts = await api.getProducts(params);
  return allProducts;
}

async function loadCategories() {
  categories = await api.getCategories();
  return categories;
}

function getProducts() {
  return allProducts;
}

function getCategories() {
  return categories;
}

function searchProducts(query, category = 'all') {
  return allProducts;
}
