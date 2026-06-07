import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY;

export default function AdminLoginPage() {
  const router = useRouter();

  // Gate state
  const [accessKey,    setAccessKey]    = useState('');
  const [keyError,     setKeyError]     = useState('');
  const [keyAttempts,  setKeyAttempts]  = useState(0);
  const [gateUnlocked, setGateUnlocked] = useState(false);

  // Login state
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Step 1: Access key gate ───────────────────────────────────────────────
  function handleKeySubmit(e) {
    e.preventDefault();
    if (accessKey.trim() === ADMIN_KEY) {
      setGateUnlocked(true);
      setKeyError('');
    } else {
      const attempts = keyAttempts + 1;
      setKeyAttempts(attempts);
      setAccessKey('');
      setKeyError(
        attempts >= 3
          ? 'Access denied. Too many incorrect attempts.'
          : 'Invalid access key.'
      );
    }
  }

  // ── Step 2: Admin username + password login ───────────────────────────────
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) return setError('All fields required.');
    setLoading(true);
    try {
      const res = await api.post('/api/admin/login', form);
      localStorage.setItem('adminToken', res.data.token);
      router.push(res.data.requiresPasswordChange ? '/admin/set-password' : '/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  // ── Gate screen ───────────────────────────────────────────────────────────
  if (!gateUnlocked) {
    const locked = keyAttempts >= 3;
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Minimal branding — no mention of "admin" */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-9 h-9 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-lg">🔑</div>
            <span className="text-gray-400 font-semibold text-sm tracking-widest uppercase">Restricted Area</span>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Access Key
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm
                           text-white placeholder-gray-600 focus:outline-none focus:border-gray-500
                           focus:ring-1 focus:ring-gray-500 font-mono tracking-widest transition"
                placeholder="Enter access key"
                value={accessKey}
                onChange={e => { setAccessKey(e.target.value); setKeyError(''); }}
                disabled={locked}
                autoComplete="off"
              />
            </div>

            {keyError && (
              <p className="text-red-400 text-xs font-semibold flex items-center gap-1">
                🚫 {keyError}
              </p>
            )}

            <button
              type="submit"
              disabled={locked || !accessKey}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40
                         disabled:cursor-not-allowed text-white text-sm font-semibold
                         rounded-lg transition border border-gray-700"
            >
              {locked ? 'Access Denied' : 'Continue →'}
            </button>
          </form>

          {/* No link back anywhere — dead end for unauthorised visitors */}
          <p className="text-center text-gray-700 text-xs mt-8">
            Unauthorised access is prohibited and logged.
          </p>

        </div>
      </div>
    );
  }

  // ── Login form (only shown after correct access key) ──────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 w-full max-w-md">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">🔐</div>
          <span className="font-bold text-xl text-gray-900">Admin Panel</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Login</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Restricted — authorised personnel only</p>

        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" name="username"
              placeholder="admin" value={form.username} onChange={handleChange} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              placeholder="Admin password" value={form.password} onChange={handleChange} />
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800
                       hover:bg-gray-900 disabled:opacity-50 text-white font-semibold
                       rounded-lg transition text-sm mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Login as Admin'}
          </button>
        </form>

        {/* No public link back — admin portal is a closed door */}
        <p className="text-center text-xs text-gray-300 mt-6">
          SecureVote · Election Management System
        </p>

      </div>
    </div>
  );
}
