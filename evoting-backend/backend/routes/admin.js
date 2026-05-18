const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../db/database');
const { adminAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });

  try {
    const admin = await db('admins').where('username', username.trim()).first();
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    return res.json({ message: 'Admin login successful.', token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

// GET /api/admin/results
router.get('/results', adminAuth, async (req, res) => {
  try {
    const candidates     = await db('candidates').select('id', 'name', 'party', 'position', 'vote_count').orderBy('vote_count', 'desc');
    const totalVotesRow  = await db('candidates').sum('vote_count as total').first();
    const totalVotersRow = await db('voters').count('id as total').first();
    return res.json({ candidates, total_votes: totalVotesRow.total || 0, total_voters: totalVotersRow.total || 0 });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch results.' });
  }
});

// GET /api/admin/voters
router.get('/voters', adminAuth, async (req, res) => {
  try {
    const voters = await db('voters').select('id', 'unique_id', 'full_name', 'email', 'has_voted', 'created_at').orderBy('created_at', 'desc');
    return res.json({ voters });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch voters.' });
  }
});

// GET /api/admin/candidates
router.get('/candidates', adminAuth, async (req, res) => {
  try {
    const candidates = await db('candidates').select('*').orderBy('name');
    return res.json({ candidates });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch candidates.' });
  }
});

// POST /api/admin/candidates
router.post('/candidates', adminAuth, async (req, res) => {
  const { name, party, position, bio, photo } = req.body;
  if (!name) return res.status(400).json({ message: 'Candidate name is required.' });
  try {
    await db('candidates').insert({ name: name.trim(), party, position, bio, photo });
    return res.status(201).json({ message: 'Candidate added successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add candidate.' });
  }
});

// PUT /api/admin/candidates/:id
router.put('/candidates/:id', adminAuth, async (req, res) => {
  const { name, party, position, bio, photo } = req.body;
  if (!name) return res.status(400).json({ message: 'Candidate name is required.' });
  try {
    await db('candidates').where('id', req.params.id).update({ name: name.trim(), party, position, bio, photo });
    return res.json({ message: 'Candidate updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update candidate.' });
  }
});

// DELETE /api/admin/candidates/:id
router.delete('/candidates/:id', adminAuth, async (req, res) => {
  try {
    await db('candidates').where('id', req.params.id).delete();
    return res.json({ message: 'Candidate deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete candidate.' });
  }
});

module.exports = router;
