const express = require('express');
const { getClient } = require('../db');
const { contactRules, handleValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/', contactRules, handleValidation, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const { error } = await getClient().from('contacts').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject || 'general',
      message: message.trim(),
    });

    if (error) throw error;
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch {
    res.status(500).json({ error: 'Could not send message.' });
  }
});

module.exports = router;
