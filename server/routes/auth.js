const express = require('express');
const bcrypt = require('bcryptjs');
const { getClient } = require('../db');
const { signToken, authRequired, getUserById, formatUser } = require('../middleware/auth');
const { registerRules, loginRules, handleValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/register', registerRules, handleValidation, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await getClient()
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .select('id, name, email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      throw error;
    }

    const user = formatUser(data);
    const token = signToken({ userId: user.id, role: 'user' });

    res.status(201).json({ token, user });
  } catch {
    res.status(500).json({ error: 'Could not create account.' });
  }
});

router.post('/login', loginRules, handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: userRow, error } = await getClient()
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;

    if (!userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = formatUser(userRow);
    const token = signToken({ userId: user.id, role: 'user' });

    res.json({ token, user });
  } catch {
    res.status(500).json({ error: 'Could not log in.' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = formatUser(await getUserById(req.auth.userId));
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Could not load account.' });
  }
});

module.exports = router;
