import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../utils/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  function validatePassword(pwd) {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Must contain at least one uppercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Must contain at least one number.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const pwdError = validatePassword(form.password);
    if (pwdError) return setError(pwdError);
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!token) return setError('Invalid or missing reset token.');

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl">🔒</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
            <div className="alert-success mb-6">✅ <strong>Your password has been updated successfully.</strong></div>
            <Link href="/login">
              <button className="btn-primary">Back to Login</button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Reset Password</h1>
            <p className="text-gray-500 text-sm text-center mb-8">Enter your new password below.</p>

            {error && <div className="alert-error mb-5">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" placeholder="Repeat new password"
                  value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
