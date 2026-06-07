import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';

export default function SetAdminPassword() {
  const router = useRouter();
  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function validate(pwd) {
    if (pwd.length < 8)        return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd))    return 'Must contain at least one uppercase letter.';
    if (!/[0-9]/.test(pwd))    return 'Must contain at least one number.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const pwdError = validate(form.password);
    if (pwdError) return setError(pwdError);
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await api.post('/api/admin/set-password',
        { password: form.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 w-full max-w-md">

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">🔐</div>
          <span className="font-bold text-xl text-gray-900">Admin Portal</span>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 font-bold text-sm">⚠️ Default password detected</p>
          <p className="text-yellow-700 text-xs mt-1">
            You are using the default admin password. Set a new secure password before continuing.
          </p>
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Set New Admin Password</h1>
        <p className="text-gray-400 text-sm text-center mb-6">This will be used for all future admin logins.</p>

        {error && <div className="alert-error mb-5">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">New Password</label>
            <input className="form-input" type="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password"
              placeholder="Repeat your new password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>

          {/* Live requirements */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            {[
              [form.password.length >= 8,    'At least 8 characters'],
              [/[A-Z]/.test(form.password),  'At least one uppercase letter'],
              [/[0-9]/.test(form.password),  'At least one number'],
            ].map(([ok, label]) => (
              <p key={label} className={ok ? 'text-green-600 font-semibold' : ''}>
                {ok ? '✅' : '○'} {label}
              </p>
            ))}
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800
                       hover:bg-gray-900 disabled:opacity-50 text-white font-semibold
                       rounded-lg transition text-sm"
            type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Set Password & Continue →'}
          </button>
        </form>

      </div>
    </div>
  );
}
