require('dotenv').config();

const express = require('express');
const path = require('path');
const { initSchema, seedProducts } = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const { apiLimiter, authLimiter, orderLimiter } = require('./middleware/rateLimit');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const FRONT_DIR = path.join(__dirname, '..', 'Front');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/orders', apiLimiter, orderLimiter, orderRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);

app.get('/api/config', (_req, res) => {
  res.json({
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
});

app.use(express.static(FRONT_DIR, { dotfiles: 'deny' }));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONT_DIR, 'index.html'));
});

async function start() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Add it to your .env file.');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      'Tip: Add SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API for reliable server access.'
    );
  }

  await initSchema();
  await seedProducts();

  app.listen(PORT, () => {
    console.log(`MOME server running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app;
