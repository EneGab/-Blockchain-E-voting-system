// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db }  = require('../db/database');

const router = express.Router();

function generateVoterId() {
  const segment = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
  return `VT-${segment}`;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  try {
    const existing = await db('voters').where('email', email.toLowerCase()).first();
    if (existing)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    // Generate unique voter ID
    let unique_id;
    let attempts = 0;
    do {
      unique_id = generateVoterId();
      attempts++;
    } while (
      await db('voters').where('unique_id', unique_id).first() && attempts < 10
    );

    const password_hash = bcrypt.hashSync(password, 12);

    await db('voters').insert({
      unique_id,
      full_name: full_name.trim(),
      email:     email.toLowerCase().trim(),
      password_hash,
    });

    return res.status(201).json({ message: 'Registration successful.', voter_id: unique_id });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { voter_id, password } = req.body;

  if (!voter_id || !password)
    return res.status(400).json({ message: 'Voter ID and password are required.' });

  try {
    const voter = await db('voters').where('unique_id', voter_id.trim().toUpperCase()).first();
    if (!voter)
      return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    const valid = bcrypt.compareSync(password, voter.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    const token = jwt.sign(
      { id: voter.id, unique_id: voter.unique_id, role: 'voter' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message:   'Login successful.',
      token,
      voter_id:  voter.unique_id,
      has_voted: voter.has_voted === 1,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

module.exports = router;
