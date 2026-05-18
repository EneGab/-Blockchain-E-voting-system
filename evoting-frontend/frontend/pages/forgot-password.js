import { useState } from 'react';
import Link from 'next/link';
import api from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl">🔑</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-6">
              We sent a password reset link to <strong>{email}</strong>. It expires in <strong>15 minutes</strong>.
            </p>
            <div className="alert-success mb-6">✅ <strong>Password reset link sent successfully.</strong></div>
            <Link href="/login">
              <button className="btn-primary">Back to Login</button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Forgot Password?</h1>
            <p className="text-gray-500 text-sm text-center mb-8">
              Enter your registered email and we'll send you a reset link.
            </p>

            {error && <div className="alert-error mb-5">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email"
                  placeholder="john@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{' '}
              <Link href="/login" className="text-green-600 font-semibold hover:underline">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
