import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]         = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [newVoterId, setNewVoterId] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name || !form.email || !form.password || !form.confirm)
      return setError('All fields are required.');
    if (form.password !== form.confirm)
      return setError('Passwords do not match.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
      });
      setNewVoterId(res.data.voter_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (newVoterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-500 text-sm mb-6">Save your Voter ID — you will need it to log in.</p>

          <div className="bg-indigo-50 border-2 border-dashed border-indigo-400 rounded-xl p-5 mb-5">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Your Voter ID</p>
            <p className="text-3xl font-bold tracking-widest text-indigo-700">{newVoterId}</p>
          </div>

          <div className="alert-info mb-6">
            ⚠️ Write this down. You cannot recover it later.
          </div>

          <button className="btn-primary" onClick={() => router.push('/login')}>
            Continue to Login →
          </button>
        </div>
      </div>
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-green-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">🗳️</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Register to participate in the election</p>

        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" name="full_name"
              placeholder="John Doe" value={form.full_name} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" name="email"
              placeholder="john@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" name="confirm"
              placeholder="Repeat your password" value={form.confirm} onChange={handleChange} />
          </div>

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
