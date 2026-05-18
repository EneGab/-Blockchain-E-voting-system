import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) return setError('All fields required.');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/admin/login`, form);
      localStorage.setItem('adminToken', res.data.token);
      router.push('/secure-admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">🔐</div>
          <span className="font-bold text-xl text-gray-900">Admin Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Secure Admin Login</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Restricted — authorised personnel only</p>

        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Username</label>
            <input className="form-input" type="text" placeholder="admin"
              value={form.username} onChange={(e) => { setForm({ ...form, username: e.target.value }); setError(''); }} />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Admin password"
              value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }} />
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm"
            type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
