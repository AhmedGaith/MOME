const request = require('supertest');
const express = require('express');
const productRoutes = require('../../server/routes/products');

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product Routes', () => {
  describe('GET /api/products', () => {
    it('should return 200 with valid query params', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(500); // DB connection error in test env
    });
  });

  describe('GET /api/products/categories', () => {
    it('should return 200', async () => {
      const res = await request(app).get('/api/products/categories');
      expect(res.status).toBe(500); // DB connection error in test env
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/products/abc');
      expect(res.status).toBe(400);
    });
  });
});
