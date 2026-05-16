import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ voter_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.voter_id || !form.password)
      return setError('Voter ID and password are required.');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        voter_id: form.voter_id.trim(),
        password: form.password,
      });
      localStorage.setItem('token',   res.data.token);
      localStorage.setItem('voterId', res.data.voter_id);
      router.push('/vote');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">🗳️</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Log in with your Voter ID to cast your vote</p>

        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Voter ID</label>
            <input className="form-input tracking-widest" type="text" name="voter_id"
              placeholder="e.g. VT-4821A9" value={form.voter_id} onChange={handleChange}
              autoComplete="username" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              placeholder="Your password" value={form.password} onChange={handleChange}
              autoComplete="current-password" />
          </div>

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Log In & Vote'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-500">
          Not registered?{' '}
          <Link href="/register" className="text-indigo-600 font-semibold hover:underline">Create an account</Link>
        </p>
        <p className="text-center text-sm text-gray-400 mt-3">
          <Link href="/admin/login" className="hover:text-indigo-600 transition">Admin login →</Link>
        </p>
      </div>
    </div>
  );
}
