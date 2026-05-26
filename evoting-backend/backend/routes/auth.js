const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { db }   = require('../db/database');

const router = express.Router();

// Generates a unique voter ID like VT-4F2A91
function generateVoterId() {
  const segment = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
  return `VT-${segment}`;
}

// Checks password strength
function validatePassword(pwd) {
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
  return null;
}

// Calculates age from date of birth
function calculateAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Checks NIN is exactly 11 digits
function validateNIN(nin) {
  return /^\d{11}$/.test(nin);
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { full_name, email, nin, date_of_birth, password } = req.body;

  // Check all fields are provided
  if (!full_name || !email || !nin || !date_of_birth || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  // NIN must be exactly 11 digits
  if (!validateNIN(nin))
    return res.status(400).json({ message: 'NIN must be exactly 11 digits.' });

  // Voter must be 18 or older
  const age = calculateAge(date_of_birth);
  if (isNaN(age) || age < 0)
    return res.status(400).json({ message: 'Invalid date of birth.' });
  if (age < 18)
    return res.status(400).json({
      message: `You must be at least 18 years old to register. Your current age is ${age}.`,
    });

  // Password strength check
  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    // Check if email is already registered
    const existingEmail = await db('voters').where('email', email.toLowerCase()).first();
    if (existingEmail)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    // Check if NIN is already registered — prevents multiple accounts
    const existingNIN = await db('voters').where('nin', nin.trim()).first();
    if (existingNIN)
      return res.status(409).json({
        message: 'This NIN is already registered. Each voter can only register once.',
      });

    // Generate a unique voter ID
    let unique_id, attempts = 0;
    do {
      unique_id = generateVoterId();
      attempts++;
    } while (await db('voters').where('unique_id', unique_id).first() && attempts < 10);

    // Hash the password before storing
    const password_hash = bcrypt.hashSync(password, 12);

    // Save voter to database
    await db('voters').insert({
      unique_id,
      full_name:     full_name.trim(),
      email:         email.toLowerCase().trim(),
      nin:           nin.trim(),
      date_of_birth: date_of_birth,
      password_hash,
    });

    return res.status(201).json({ message: 'Registration successful.', voter_id: unique_id });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { voter_id, password } = req.body;
  if (!voter_id || !password)
    return res.status(400).json({ message: 'Voter ID and password are required.' });

  try {
    // Find voter by their unique ID
    const voter = await db('voters').where('unique_id', voter_id.trim().toUpperCase()).first();
    if (!voter) return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    // Check password
    const valid = bcrypt.compareSync(password, voter.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid Voter ID or password.' });

    // Generate JWT token for the session
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
    return res.status(500).json({ message: 'Login failed.' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const voter = await db('voters').where('email', email.toLowerCase().trim()).first();

    // Always return success to prevent email guessing
    if (!voter)
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });

    // Generate a secure reset token that expires in 15 minutes
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db('password_resets').where('voter_id', voter.id).delete();
    await db('password_resets').insert({ voter_id: voter.id, token, expires_at: expires });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // In production this would send an email
    // For now the link is logged to the backend terminal
    console.log(`\n📧 Password reset link for ${email}:\n${resetUrl}\n`);

    return res.json({ message: 'If this email is registered, a reset link has been sent.', resetUrl });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Failed to process request.' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: 'Token and password are required.' });

  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ message: pwdError });

  try {
    // Find the reset token
    const record = await db('password_resets').where('token', token).first();
    if (!record)
      return res.status(400).json({ message: 'Invalid or expired reset token.' });

    // Check if token has expired
    if (new Date(record.expires_at) < new Date()) {
      await db('password_resets').where('token', token).delete();
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Update password
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