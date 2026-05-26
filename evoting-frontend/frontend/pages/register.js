import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '', email: '', nin: '', date_of_birth: '', password: '', confirm: ''
  });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [newVoterId, setNewVoterId] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  // Checks password strength
  function validatePassword(pwd) {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Must contain at least one uppercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Must contain at least one number.';
    return null;
  }

  // Calculates voter age from date of birth
  function calculateAge(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Check all fields are filled
    if (!form.full_name || !form.email || !form.nin || !form.date_of_birth || !form.password || !form.confirm)
      return setError('All fields are required.');

    // NIN must be exactly 11 digits
    if (!/^\d{11}$/.test(form.nin))
      return setError('NIN must be exactly 11 digits.');

    // Voter must be 18 or older
    const age = calculateAge(form.date_of_birth);
    if (age < 18)
      return setError(`You must be at least 18 years old to register. Your current age is ${age}.`);

    // Password strength check
    const pwdError = validatePassword(form.password);
    if (pwdError) return setError(pwdError);

    // Passwords must match
    if (form.password !== form.confirm)
      return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        full_name:     form.full_name,
        email:         form.email,
        nin:           form.nin,
        date_of_birth: form.date_of_birth,
        password:      form.password,
      });
      setNewVoterId(res.data.voter_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen shown after registration ───────────────────────────────
  if (newVoterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your unique Voter ID has been generated.{' '}
            <strong className="text-red-600">Save it — you cannot recover it later.</strong>
          </p>
          <div className="bg-green-50 border-2 border-dashed border-green-500 rounded-xl p-5 mb-5">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Your Voter ID</p>
            <p className="text-3xl font-bold tracking-widest text-green-700">{newVoterId}</p>
          </div>
          <div className="alert-warning mb-6">
            ⚠️ <strong>Write this down now.</strong> You need this ID to log in and vote.
          </div>
          <button className="btn-primary" onClick={() => router.push('/login')}>
            Continue to Login →
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl">🗳️</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm text-center mb-4">Register to participate in the election</p>

        {/* Eligibility notice */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-6 text-xs text-yellow-800">
          ⚠️ <strong>Eligibility Requirements:</strong> You must be{' '}
          <strong>18 years or older</strong> and provide a valid{' '}
          <strong>11-digit NIN</strong> to register. Each NIN can only be used once.
        </div>

        {/* Error message */}
        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="full_name"
              placeholder="John Doe"
              value={form.full_name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* NIN */}
          <div>
            <label className="form-label">
              National Identification Number (NIN)
              <span className="text-gray-400 font-normal ml-1 text-xs">— 11 digits</span>
            </label>
            <input
              className="form-input tracking-widest"
              type="text"
              name="nin"
              placeholder="12345678901"
              maxLength={11}
              value={form.nin}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-400 mt-1">Each NIN can only be registered once.</p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="form-label">
              Date of Birth
              <span className="text-gray-400 font-normal ml-1 text-xs">— must be 18+</span>
            </label>
            <input
              className="form-input"
              type="date"
              name="date_of_birth"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                .toISOString().split('T')[0]}
              value={form.date_of_birth}
              onChange={handleChange}
            />
            {/* Live age indicator */}
            {form.date_of_birth && (
              <p className={`text-xs mt-1 font-semibold ${
                calculateAge(form.date_of_birth) >= 18 ? 'text-green-600' : 'text-red-500'
              }`}>
                {calculateAge(form.date_of_birth) >= 18
                  ? `✅ Age ${calculateAge(form.date_of_birth)} — Eligible to vote`
                  : `❌ Age ${calculateAge(form.date_of_birth)} — Must be 18 or older`}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              name="confirm"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  );
}