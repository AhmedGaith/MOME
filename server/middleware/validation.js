const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }).withMessage('Name too long.'),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const contactRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email.').normalizeEmail(),
  body('subject').optional().trim().isLength({ max: 100 }),
  body('message').trim().notEmpty().withMessage('Message is required.').isLength({ max: 5000 }),
];

const orderRules = [
  body('items').isArray({ min: 1 }).withMessage('Cart must contain at least one item.'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required.'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 255 }),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required.').isLength({ max: 50 }),
  body('shippingAddress.address').trim().notEmpty().withMessage('Address is required.').isLength({ max: 1000 }),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required.').isLength({ max: 100 }),
  body('shippingAddress.zip').trim().notEmpty().withMessage('ZIP code is required.').isLength({ max: 20 }),
];

const productQueryRules = [
  query('q').optional().trim().isLength({ max: 100 }),
  query('category').optional().trim().isLength({ max: 100 }),
];

const productIdRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID.'),
];

const adminProductRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }),
  body('category').trim().notEmpty().withMessage('Category is required.').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('size').optional().trim().isLength({ max: 100 }),
  body('image').trim().notEmpty().withMessage('Image URL is required.').isURL().withMessage('Image must be a valid URL.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
];

const adminOrderStatusRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order ID.'),
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status.'),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  contactRules,
  orderRules,
  productQueryRules,
  productIdRules,
  adminProductRules,
  adminOrderStatusRules,
};
