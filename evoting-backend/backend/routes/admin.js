const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../db/database');
const { adminAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

const DEFAULT_PASSWORD = 'admin123';

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password are required.' });

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

    // Check if still using default password
    const isDefault = bcrypt.compareSync(DEFAULT_PASSWORD, admin.password_hash);

    return res.json({
      message: 'Admin login successful.',
      token,
      requiresPasswordChange: isDefault,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

// POST /api/admin/set-password
router.post('/set-password', adminAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  if (!/[A-Z]/.test(password)) return res.status(400).json({ message: 'Must contain at least one uppercase letter.' });
  if (!/[0-9]/.test(password)) return res.status(400).json({ message: 'Must contain at least one number.' });

  try {
    const hash = bcrypt.hashSync(password, 12);
    await db('admins').where('id', req.admin.id).update({ password_hash: hash });
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ message: 'Failed to update password.' });
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
    const voters = await db('voters').select('id', 'unique_id', 'full_name', 'email', 'nin', 'date_of_birth', 'has_voted', 'created_at').orderBy('created_at', 'desc');
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
router.post('/candidates', adminAuth, upload.single('photo'), async (req, res) => {
  const { name, party, position, bio } = req.body;
  if (!name) return res.status(400).json({ message: 'Candidate name is required.' });

  // If a file was uploaded, build its public path; otherwise leave photo empty
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db('candidates').insert({ name: name.trim(), party, position, bio, photo });
    return res.status(201).json({ message: 'Candidate added successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add candidate.' });
  }
});

// PUT /api/admin/candidates/:id
router.put('/candidates/:id', adminAuth, upload.single('photo'), async (req, res) => {
  const { name, party, position, bio } = req.body;
  if (!name) return res.status(400).json({ message: 'Candidate name is required.' });

  try {
    // Build the fields to update
    const updateData = { name: name.trim(), party, position, bio };

    // Only update the photo if a new one was uploaded
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    await db('candidates').where('id', req.params.id).update(updateData);
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
