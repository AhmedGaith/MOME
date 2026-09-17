const request = require('supertest');
const express = require('express');
const contactRoutes = require('../../server/routes/contact');

const app = express();
app.use(express.json());
app.use('/api/contact', contactRoutes);

describe('Contact Routes', () => {
  describe('POST /api/contact', () => {
    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/api/contact').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app).post('/api/contact').send({
        name: 'Test',
        email: 'invalid',
        message: 'Hello',
      });
      expect(res.status).toBe(400);
    });
  });
});
