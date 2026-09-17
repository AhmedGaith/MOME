const { getClient } = require('../db');

async function getUserById(userId) {
  const { data, error } = await getClient()
    .from('users')
    .select('id, name, email, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function formatUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function formatProduct(row) {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    size: row.size,
    image: row.image,
    stock: row.stock != null ? Number(row.stock) : 0,
    createdAt: row.created_at,
  };
}

module.exports = { getUserById, formatUser, formatProduct };
