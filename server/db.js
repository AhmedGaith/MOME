const { getClient, getServiceClient, hasServiceRoleKey } = require('./utils/supabase/server');

const DEFAULT_PRODUCTS = [
  {
    name: 'Linen Overshirt',
    category: 'Tops',
    description: 'Relaxed-fit overshirt in breathable organic linen. Perfect for layering.',
    price: 89,
    size: 'S – XL',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
    stock: 45,
  },
  {
    name: 'Wide Leg Trousers',
    category: 'Bottoms',
    description: 'High-waisted wide leg trousers in a soft cotton blend. Timeless silhouette.',
    price: 75,
    size: 'XS – L',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
    stock: 32,
  },
  {
    name: 'Merino Wool Sweater',
    category: 'Knitwear',
    description: 'Fine-gauge merino crew neck. Lightweight warmth for every season.',
    price: 120,
    size: 'S – XXL',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80',
    stock: 28,
  },
  {
    name: 'Structured Blazer',
    category: 'Outerwear',
    description: 'Tailored single-breasted blazer with a modern relaxed cut.',
    price: 195,
    size: 'S – L',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
    stock: 15,
  },
  {
    name: 'Organic Cotton Tee',
    category: 'Tops',
    description: 'Essential crew neck tee in heavyweight organic cotton. Soft and durable.',
    price: 45,
    size: 'XS – XXL',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    stock: 100,
  },
  {
    name: 'Pleated Midi Skirt',
    category: 'Bottoms',
    description: 'Flowing pleated midi skirt with an elastic waistband for comfort.',
    price: 68,
    size: 'XS – L',
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80',
    stock: 38,
  },
];

async function initSchema() {
  const supabase = getClient();
  const { error } = await supabase.from('products').select('id').limit(1);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      throw new Error(
        'Database tables not found. Open Supabase → SQL Editor and run server/schema.sql'
      );
    }
    throw new Error(`Supabase connection failed: ${error.message}`);
  }

  console.log('Connected to Supabase');
}

async function seedProducts() {
  if (!hasServiceRoleKey()) {
    console.warn(
      'Skipping default product seed because SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env to allow server writes.'
    );
    return;
  }

  const supabase = getServiceClient();
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;
  if (count > 0) return;

  const { error } = await supabase.from('products').insert(DEFAULT_PRODUCTS);
  if (error) throw error;

  console.log('Seeded default products');
}

module.exports = { initSchema, seedProducts, getClient, getServiceClient, hasServiceRoleKey };
