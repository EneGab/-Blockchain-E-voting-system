// routes/admin.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../db/database');
const { adminAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Username and password are required.' });

  try {
    const admin = await db('admins').where('username', username.trim()).first();
    if (!admin)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    return res.json({ message: 'Admin login successful.', token });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

// GET /api/admin/results
router.get('/results', adminAuth, async (req, res) => {
  try {
    const candidates = await db('candidates')
      .select('id', 'name', 'party', 'vote_count')
      .orderBy('vote_count', 'desc');

    const totalVotesRow  = await db('candidates').sum('vote_count as total').first();
    const totalVotersRow = await db('voters').count('id as total').first();

    return res.json({
      candidates,
      total_votes:  totalVotesRow.total  || 0,
      total_voters: totalVotersRow.total || 0,
    });
  } catch (err) {
    console.error('Results error:', err);
    return res.status(500).json({ message: 'Failed to fetch results.' });
  }
});

// GET /api/admin/voters
router.get('/voters', adminAuth, async (req, res) => {
  try {
    const voters = await db('voters')
      .select('id', 'unique_id', 'full_name', 'email', 'has_voted', 'created_at')
      .orderBy('created_at', 'desc');
    return res.json({ voters });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch voters.' });
  }
});

module.exports = router;
