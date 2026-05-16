import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../utils/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 w-full max-w-md">

        {/* Logo */}
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
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Login as Admin'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/login" className="hover:text-indigo-600 transition">← Back to voter login</Link>
        </p>
      </div>
    </div>
  );
}
