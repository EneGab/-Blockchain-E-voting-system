import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab,        setTab]        = useState('overview');
  const [results,    setResults]    = useState([]);
  const [voters,     setVoters]     = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [stats,      setStats]      = useState({ total_votes: 0, total_voters: 0 });
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);

  // Candidate form state
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [cForm,      setCForm]      = useState({ name: '', party: '', position: '', bio: '', photo: '' });
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/secure-admin'); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [r, v, c] = await Promise.all([
        axios.get(`${API}/api/admin/results`,    { headers: authHeaders() }),
        axios.get(`${API}/api/admin/voters`,     { headers: authHeaders() }),
        axios.get(`${API}/api/admin/candidates`, { headers: authHeaders() }),
      ]);
      setResults(r.data.candidates  || []);
      setStats({ total_votes: r.data.total_votes || 0, total_voters: r.data.total_voters || 0 });
      setVoters(v.data.voters       || []);
      setCandidates(c.data.candidates || []);
    } catch (err) {
      if (err.response?.status === 401) router.push('/secure-admin');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    router.push('/secure-admin');
  }

  function openAdd() {
    setEditId(null);
    setCForm({ name: '', party: '', position: '', bio: '', photo: '' });
    setShowForm(true);
  }

  function openEdit(c) {
    setEditId(c.id);
    setCForm({ name: c.name, party: c.party || '', position: c.position || '', bio: c.bio || '', photo: c.photo || '' });
    setShowForm(true);
  }

  async function saveCandidate() {
    if (!cForm.name) return showToast('Candidate name is required.', 'error');
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API}/api/admin/candidates/${editId}`, cForm, { headers: authHeaders() });
        showToast('Candidate updated successfully.');
      } else {
        await axios.post(`${API}/api/admin/candidates`, cForm, { headers: authHeaders() });
        showToast('Candidate added successfully.');
      }
      setShowForm(false);
      fetchAll();
    } catch {
      showToast('Failed to save candidate.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCandidate(id) {
    try {
      await axios.delete(`${API}/api/admin/candidates/${id}`, { headers: authHeaders() });
      setDeleteId(null);
      showToast('Candidate deleted.');
      fetchAll();
    } catch {
      showToast('Failed to delete candidate.', 'error');
    }
  }

  const turnout  = stats.total_voters ? Math.round((stats.total_votes / stats.total_voters) * 100) : 0;
  const maxVotes = results.length ? Math.max(...results.map(c => c.vote_count), 1) : 1;
  const sorted   = [...results].sort((a, b) => b.vote_count - a.vote_count);

  const tabs = [
    { id: 'overview',    label: '📊 Overview'    },
    { id: 'candidates',  label: '👤 Candidates'  },
    { id: 'results',     label: '🏆 Results'     },
    { id: 'voters',      label: '👥 Voters'      },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="spinner-green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-gray-900 text-white px-4 py-3 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-base">🔐</div>
            <span className="font-bold text-sm">SecureVote Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()}
              className="text-xs border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition">
              🖨️ Print
            </button>
            <button onClick={handleLogout}
              className="text-xs border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {[
                { label: 'Total Votes Cast',  value: stats.total_votes,  icon: '🗳️', color: 'text-green-600'  },
                { label: 'Registered Voters', value: stats.total_voters, icon: '👥', color: 'text-gray-700'   },
                { label: 'Voter Turnout',     value: `${turnout}%`,      icon: '📊', color: 'text-green-600'  },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Live vote chart */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Live Vote Distribution</h2>
              <div className="space-y-4">
                {sorted.map((c, i) => {
                  const pct = stats.total_votes ? Math.round((c.vote_count / stats.total_votes) * 100) : 0;
                  const barW = Math.round((c.vote_count / maxVotes) * 100);
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">#{i+1}</span>
                          <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                          {i === 0 && stats.total_votes > 0 && (
                            <span className="badge-success">LEADING</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-green-600">{c.vote_count} votes ({pct}%)</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-green-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${barW}%` }} />
                      </div>
                    </div>
                  );
                })}
                {sorted.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">No votes cast yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CANDIDATES ── */}
        {tab === 'candidates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-gray-900 text-lg">Manage Candidates</h2>
              <button onClick={openAdd} className="btn-primary w-auto px-5 py-2">
                + Add Candidate
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidates.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name}
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-3 border-2 border-green-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 text-xl font-bold flex items-center justify-center mx-auto mb-3">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-center">{c.name}</h3>
                  {c.party    && <p className="text-green-600 text-xs text-center font-semibold mt-1">{c.party}</p>}
                  {c.position && <p className="text-gray-400 text-xs text-center">{c.position}</p>}
                  {c.bio      && <p className="text-gray-500 text-xs text-center mt-2 line-clamp-2">{c.bio}</p>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(c)}
                      className="flex-1 text-xs py-2 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 font-semibold transition">
                      ✏️ Edit
                    </button>
                    <button onClick={() => setDeleteId(c.id)}
                      className="flex-1 text-xs py-2 rounded-lg border border-red-400 text-red-500 hover:bg-red-50 font-semibold transition">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">
                  No candidates yet. Click "Add Candidate" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {tab === 'results' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Election Results</h2>
              <button onClick={() => window.print()} className="text-xs text-gray-500 hover:text-green-600">🖨️ Print</button>
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
                    const pct  = stats.total_votes ? Math.round((c.vote_count / stats.total_votes) * 100) : 0;
                    const barW = Math.round((c.vote_count / maxVotes) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-300">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-800">{c.name}</span>
                            {i === 0 && stats.total_votes > 0 && <span className="badge-success">LEADING</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{c.party || '—'}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{c.vote_count}</td>
                        <td className="px-6 py-4">
                          <div className="bg-gray-100 rounded-full h-2 w-36 overflow-hidden">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${barW}%` }} />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VOTERS ── */}
        {tab === 'voters' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Registered Voters ({voters.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Voter ID</th>
                    <th className="px-6 py-3 text-left">Full Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {voters.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-green-700 text-xs">{v.unique_id}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{v.full_name}</td>
                      <td className="px-6 py-4 text-gray-500">{v.email}</td>
                      <td className="px-6 py-4">
                        {v.has_voted
                          ? <span className="badge-success">Voted</span>
                          : <span className="badge-warning">Not Voted</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Candidate Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-6">{editId ? 'Edit Candidate' : 'Add New Candidate'}</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Alice Johnson"
                  value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Political Party</label>
                <input className="form-input" placeholder="e.g. Progressive Party"
                  value={cForm.party} onChange={e => setCForm({ ...cForm, party: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Position</label>
                <input className="form-input" placeholder="e.g. President"
                  value={cForm.position} onChange={e => setCForm({ ...cForm, position: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Photo URL</label>
                <input className="form-input" placeholder="https://example.com/photo.jpg"
                  value={cForm.photo} onChange={e => setCForm({ ...cForm, photo: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Bio / Description</label>
                <textarea className="form-input" rows={3} placeholder="Brief candidate description..."
                  value={cForm.bio} onChange={e => setCForm({ ...cForm, bio: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={saveCandidate} disabled={saving}>
                {saving ? <span className="spinner" /> : editId ? 'Save Changes' : 'Add Candidate'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Candidate?</h2>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone. All votes for this candidate will remain in the database.</p>
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={() => deleteCandidate(deleteId)}>Yes, Delete</button>
              <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
