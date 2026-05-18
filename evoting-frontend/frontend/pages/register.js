import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newVoterId, setNewVoterId] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function validatePassword(pwd) {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name || !form.email || !form.password || !form.confirm)
      return setError('All fields are required.');
    const pwdError = validatePassword(form.password);
    if (pwdError) return setError(pwdError);
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      setNewVoterId(res.data.voter_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (newVoterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-500 text-sm mb-6">Your unique Voter ID has been generated. <strong className="text-red-600">Save it — you cannot recover it later.</strong></p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl">🗳️</div>
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
              placeholder="Min. 8 chars, 1 uppercase, 1 number" value={form.password} onChange={handleChange} />
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
          <Link href="/login" className="text-green-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
