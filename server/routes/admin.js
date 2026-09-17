const express = require('express');
const { getClient, getServiceClient, hasServiceRoleKey } = require('../db');
const { signToken, adminRequired } = require('../middleware/auth');
const { formatProduct } = require('../middleware/authHelpers');
const { adminProductRules, productIdRules, adminOrderStatusRules, handleValidation } = require('../middleware/validation');

const router = express.Router();

function sendServerWriteConfigError(res, error) {
  if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return res.status(500).json({
      error: 'Server product writes need SUPABASE_SERVICE_ROLE_KEY in .env.',
    });
  }
  return null;
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'mome2026';

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  const token = signToken({ role: 'admin' }, '12h');
  res.json({ token });
});

router.get('/products', adminRequired, async (_req, res) => {
  try {
    const { data, error } = await getClient()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((data || []).map(formatProduct));
  } catch {
    res.status(500).json({ error: 'Could not load products.' });
  }
});

router.post('/products', adminRequired, adminProductRules, handleValidation, async (req, res) => {
  try {
    const { name, category, description, price, size, image } = req.body;

    if (!name?.trim() || !category?.trim() || price == null || !image) {
      return res.status(400).json({ error: 'Name, category, price, and image are required.' });
    }

    const { data, error } = await getServiceClient()
      .from('products')
      .insert({
        name: name.trim(),
        category: category.trim(),
        description: description?.trim() || '',
        price: Number(price),
        size: size?.trim() || '',
        image,
        stock: Number(body.stock) || 100,
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(formatProduct(data));
  } catch (error) {
    if (sendServerWriteConfigError(res, error)) return;
    res.status(500).json({ error: 'Could not create product.' });
  }
});

router.put('/products/:id', adminRequired, productIdRules, handleValidation, async (req, res) => {
  try {
    const { name, category, description, price, size, image } = req.body;

    const { data, error } = await getServiceClient()
      .from('products')
      .update({
        name: name?.trim(),
        category: category?.trim(),
        description: description?.trim() || '',
        price: Number(price),
        size: size?.trim() || '',
        image,
        stock: body.stock != null ? Number(body.stock) : undefined,
      })
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(formatProduct(data));
  } catch (error) {
    if (sendServerWriteConfigError(res, error)) return;
    res.status(500).json({ error: 'Could not update product.' });
  }
});

router.delete('/products/:id', adminRequired, productIdRules, handleValidation, async (req, res) => {
  try {
    const { data, error } = await getServiceClient()
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .select('id');

    if (error) throw error;
    if (!data?.length) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product deleted.' });
  } catch (error) {
    if (sendServerWriteConfigError(res, error)) return;
    res.status(500).json({ error: 'Could not delete product.' });
  }
});

router.get('/orders', adminRequired, async (_req, res) => {
  try {
    const supabase = hasServiceRoleKey() ? getServiceClient() : getClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = [];

    for (const order of orders || []) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('name, price, quantity, size, image')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      result.push({
        id: String(order.id),
        total: Number(order.total),
        status: order.status,
        createdAt: order.created_at,
        customer: {
          name: order.users?.name || order.shipping_full_name || 'Guest',
          email: order.users?.email || 'Guest checkout',
        },
        shippingAddress: {
          fullName: order.shipping_full_name,
          phone: order.shipping_phone_number,
          address: order.shipping_address,
          city: order.shipping_city,
          zip: order.shipping_zip,
        },
        items: (items || []).map((i) => ({
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
          size: i.size,
          image: i.image,
        })),
      });
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

router.patch('/orders/:id', adminRequired, adminOrderStatusRules, handleValidation, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const { data, error } = await getServiceClient()
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select('id, status')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ id: String(data.id), status: data.status });
  } catch (error) {
    if (sendServerWriteConfigError(res, error)) return;
    res.status(500).json({ error: 'Could not update order.' });
  }
});

module.exports = router;