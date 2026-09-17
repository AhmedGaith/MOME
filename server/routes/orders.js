const express = require('express');
const { getClient, getServiceClient, hasServiceRoleKey } = require('../db');
const { authRequired, authOptional } = require('../middleware/auth');
const { orderRules, handleValidation } = require('../middleware/validation');
const { sendOrderConfirmation } = require('../utils/email');

const router = express.Router();

router.post('/', authOptional, orderRules, handleValidation, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const { fullName, phone, address, city, zip } = shippingAddress || {};
    if (!fullName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !zip?.trim()) {
      return res.status(400).json({ error: 'Shipping name, phone, and address are required.' });
    }

    const supabase = hasServiceRoleKey() ? getServiceClient() : getClient();
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .maybeSingle();

      if (error) throw error;
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      total += Number(product.price) * quantity;

      orderItems.push({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
        size: item.size || product.size,
        image: product.image,
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.auth?.userId || null,
        total,
        shipping_full_name: fullName.trim(),
        shipping_phone_number: phone.trim(),
        shipping_address: address.trim(),
        shipping_city: city.trim(),
        shipping_zip: zip.trim(),
      })
      .select('id, total, status, created_at')
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image,
      }))
    );

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    for (const item of orderItems) {
      try {
        const { data: prod } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        if (prod && typeof prod.stock === 'number') {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      } catch (stockErr) {
        console.error('Failed to update stock:', stockErr.message);
      }
    }

    res.status(201).json({
      order: {
        id: String(order.id),
        total: Number(order.total),
        status: order.status,
        createdAt: order.created_at,
      },
    });

    try {
      await sendOrderConfirmation(order, orderItems, req.auth?.userId);
    } catch (emailErr) {
      console.error('Failed to send order confirmation email:', emailErr.message);
    }
  } catch (error) {
    const message = error?.message || 'Could not place order.';
    const code = error?.code;

    if (code === '42501' || message.toLowerCase().includes('row-level security')) {
      return res.status(500).json({
        error:
          'Could not place order. Server write access is blocked by Supabase RLS. Add SUPABASE_SERVICE_ROLE_KEY to .env or update table policies.',
      });
    }

    if (message.includes('shipping_phone_number')) {
      return res.status(500).json({
        error:
          'Could not place order. The column shipping_phone_number is missing in Supabase. Run the migration SQL first.',
      });
    }

    if (
      (code === '23502' || message.toLowerCase().includes('not-null constraint')) &&
      message.includes('user_id')
    ) {
      return res.status(500).json({
        error:
          'Could not place order. The orders.user_id column is still NOT NULL. Run the migration SQL to allow guest checkout.',
      });
    }

    console.error('Order placement failed:', code || 'unknown', message);
    res.status(500).json({ error: `Could not place order. ${message}` });
  }
});

router.get('/', authRequired, async (req, res) => {
  try {
    const supabase = getClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.auth.userId)
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
        createdAt: order.created_at,
      });
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

module.exports = router;
