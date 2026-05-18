const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { db }   = require('../db/database');

const router = express.Router();

function generateVoterId() {
  const segment = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
  return `VT-${segment}`;
}

function validatePassword(pwd) {
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
  return null;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const existing = await db('voters').where('email', email.toLowerCase()).first();
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

    let unique_id, attempts = 0;
    do {
      unique_id = generateVoterId();
      attempts++;
    } while (await db('voters').where('unique_id', unique_id).first() && attempts < 10);

    const password_hash = bcrypt.hashSync(password, 12);
    await db('voters').insert({ unique_id, full_name: full_name.trim(), email: email.toLowerCase().trim(), password_hash });

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
    if (!voter) return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    const valid = bcrypt.compareSync(password, voter.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    const token = jwt.sign(
      { id: voter.id, unique_id: voter.unique_id, role: 'voter' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({ message: 'Login successful.', token, voter_id: voter.unique_id, has_voted: voter.has_voted === 1 });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const voter = await db('voters').where('email', email.toLowerCase().trim()).first();

    // Always return success to prevent email enumeration
    if (!voter) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    // Generate token
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Save token to DB
    await db('password_resets').where('voter_id', voter.id).delete();
    await db('password_resets').insert({ voter_id: voter.id, token, expires_at: expires });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Log the reset URL (in production, send via email using nodemailer)
    console.log(`\n📧 Password reset link for ${email}:\n${resetUrl}\n`);

    return res.json({ message: 'If this email is registered, a reset link has been sent.', resetUrl });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Failed to process request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required.' });

  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    const record = await db('password_resets').where('token', token).first();
    if (!record) return res.status(400).json({ message: 'Invalid or expired reset token.' });

    if (new Date(record.expires_at) < new Date()) {
      await db('password_resets').where('token', token).delete();
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const password_hash = bcrypt.hashSync(password, 12);
    await db('voters').where('id', record.voter_id).update({ password_hash });
    await db('password_resets').where('token', token).delete();

    return res.json({ message: 'Your password has been updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
});

module.exports = router;
