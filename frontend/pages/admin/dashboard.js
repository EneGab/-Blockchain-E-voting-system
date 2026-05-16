import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function AdminDashboard() {
  const router = useRouter();
  const [results,  setResults]  = useState([]);
  const [stats,    setStats]    = useState({ total_votes: 0, total_voters: 0 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }
    fetchResults(token);
  }, []);

  async function fetchResults(token) {
    try {
      const res = await axios.get(`${API}/api/admin/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data.candidates || []);
      setStats({ total_votes: res.data.total_votes || 0, total_voters: res.data.total_voters || 0 });
    } catch (err) {
      if (err.response?.status === 401) router.push('/admin/login');
      else setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  }

  const maxVotes   = results.length ? Math.max(...results.map((c) => c.vote_count)) : 1;
  const turnout    = stats.total_voters
    ? Math.round((stats.total_votes / stats.total_voters) * 100)
    : 0;
  const sorted     = [...results].sort((a, b) => b.vote_count - a.vote_count);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366F1', width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white px-4 py-3 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-base">🔐</div>
            <span className="font-bold text-sm">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="text-xs border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              🖨️ Print Results
            </button>
            <button
              onClick={handleLogout}
              className="text-xs border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Election Results</h1>
        <p className="text-gray-400 text-sm mb-8">Live vote counts — refresh to update</p>

        {error && <div className="alert-error mb-6">⚠️ {error}</div>}

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Total Votes Cast',  value: stats.total_votes,  icon: '🗳️', color: 'text-indigo-600' },
            { label: 'Registered Voters', value: stats.total_voters, icon: '👥', color: 'text-gray-700'   },
            { label: 'Voter Turnout',     value: `${turnout}%`,      icon: '📊', color: 'text-green-600'  },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Results table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Candidate Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Candidate</th>
                  <th className="px-6 py-3 text-left">Party</th>
                  <th className="px-6 py-3 text-left">Votes</th>
                  <th className="px-6 py-3 text-left">Progress</th>
                  <th className="px-6 py-3 text-left">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((c, i) => {
                  const pct = stats.total_votes
                    ? Math.round((c.vote_count / stats.total_votes) * 100) : 0;
                  const barW = maxVotes
                    ? Math.round((c.vote_count / maxVotes) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-300">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          {i === 0 && stats.total_votes > 0 && (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                              LEADING
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{c.party || '—'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-base">{c.vote_count}</td>
                      <td className="px-6 py-4">
                        <div className="bg-gray-100 rounded-full h-2 w-36 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-600">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
