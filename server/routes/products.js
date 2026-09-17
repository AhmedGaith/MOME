const express = require('express');
const { getClient } = require('../db');
const { formatProduct } = require('../middleware/authHelpers');
const { productQueryRules, productIdRules, handleValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', productQueryRules, handleValidation, async (req, res) => {
  try {
    const { q = '', category = 'all' } = req.query;
    let query = getClient().from('products').select('*').order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.or(
        `name.ilike.${term},category.ilike.${term},description.ilike.${term},size.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(formatProduct));
  } catch {
    res.status(500).json({ error: 'Could not load products.' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const { data, error } = await getClient().from('products').select('category');
    if (error) throw error;

    const categories = [...new Set((data || []).map((r) => r.category))].sort();
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

router.get('/:id', productIdRules, handleValidation, async (req, res) => {
  try {
    const { data, error } = await getClient()
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(formatProduct(data));
  } catch {
    res.status(500).json({ error: 'Could not load product.' });
  }
});

module.exports = router;
