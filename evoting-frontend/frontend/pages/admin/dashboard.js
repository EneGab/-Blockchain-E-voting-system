import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
}

// ── Shared empty-state ────────────────────────────────────────────────────────
function Empty({ text }) {
  return <p className="text-center text-gray-400 text-sm py-12">{text}</p>;
}

// ── Results Tab ───────────────────────────────────────────────────────────────
function ResultsTab() {
  const [candidates, setCandidates] = useState([]);
  const [stats,      setStats]      = useState({ total_votes: 0, total_voters: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await axios.get(`${API}/api/admin/results`, { headers: authHeaders() });
      setCandidates(res.data.candidates || []);
      setStats({ total_votes: res.data.total_votes || 0, total_voters: res.data.total_voters || 0 });
    } catch {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  }

  const sorted  = [...candidates].sort((a, b) => b.vote_count - a.vote_count);
  const maxVotes = sorted.length ? Math.max(...sorted.map(c => c.vote_count)) : 1;
  const turnout  = stats.total_voters
    ? Math.round((stats.total_votes / stats.total_voters) * 100) : 0;

  if (loading) return <div className="flex justify-center py-16"><span className="spinner-green" /></div>;
  if (error)   return <div className="alert-error">{error}</div>;

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Votes Cast',  value: stats.total_votes,  icon: '🗳️', color: 'text-indigo-600' },
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

      {/* Candidate table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Candidate Results</h2>
          <button onClick={() => window.print()}
            className="text-xs border border-gray-300 hover:border-gray-500 text-gray-500 px-3 py-1.5 rounded-lg transition">
            🖨️ Print
          </button>
        </div>
        {sorted.length === 0 ? <Empty text="No votes recorded yet." /> : (
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
                  const barW = maxVotes ? Math.round((c.vote_count / maxVotes) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-bold text-gray-300">{i + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.photo
                            ? <img src={`${API}${c.photo}`} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                            : <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">{c.name.charAt(0)}</div>
                          }
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          {i === 0 && stats.total_votes > 0 && (
                            <span className="badge-success">LEADING</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{c.party || '—'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-base">{c.vote_count}</td>
                      <td className="px-6 py-4">
                        <div className="bg-gray-100 rounded-full h-2 w-36 overflow-hidden">
                          <div className="bg-indigo-500 h-2 rounded-full transition-all duration-700" style={{ width: `${barW}%` }} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-600">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Voters Tab ────────────────────────────────────────────────────────────────
function VotersTab() {
  const [voters,  setVoters]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await axios.get(`${API}/api/admin/voters`, { headers: authHeaders() });
      setVoters(res.data.voters || []);
    } catch {
      setError('Failed to load voters.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = voters.filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.unique_id?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const voted    = voters.filter(v => v.has_voted).length;
  const notVoted = voters.length - voted;

  if (loading) return <div className="flex justify-center py-16"><span className="spinner-green" /></div>;
  if (error)   return <div className="alert-error">{error}</div>;

  return (
    <div>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Registered', value: voters.length,  color: 'text-gray-800' },
          { label: 'Voted',            value: voted,           color: 'text-green-600' },
          { label: 'Not Yet Voted',    value: notVoted,        color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        className="form-input mb-4"
        placeholder="Search by name, voter ID, or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? <Empty text="No voters found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Voter ID</th>
                  <th className="px-5 py-3 text-left">Full Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">NIN</th>
                  <th className="px-5 py-3 text-left">DOB</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-green-700">{v.unique_id}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">{v.full_name}</td>
                    <td className="px-5 py-3 text-gray-500">{v.email}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">
                      {'*'.repeat(7)}{v.nin?.slice(-4)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{v.date_of_birth}</td>
                    <td className="px-5 py-3">
                      {v.has_voted
                        ? <span className="badge-success">Voted</span>
                        : <span className="badge-warning">Pending</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Candidates Tab ────────────────────────────────────────────────────────────
function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [modal,      setModal]      = useState(null); // null | 'add' | candidate-object
  const [form,       setForm]       = useState({ name: '', party: '', position: '', bio: '' });
  const [photo,      setPhoto]      = useState(null);
  const [formError,  setFormError]  = useState('');
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await axios.get(`${API}/api/admin/candidates`, { headers: authHeaders() });
      setCandidates(res.data.candidates || []);
    } catch {
      setError('Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ name: '', party: '', position: '', bio: '' });
    setPhoto(null);
    setFormError('');
    setModal('add');
  }

  function openEdit(c) {
    setForm({ name: c.name, party: c.party || '', position: c.position || '', bio: c.bio || '' });
    setPhoto(null);
    setFormError('');
    setModal(c);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Candidate name is required.');
    setSaving(true);
    setFormError('');
    try {
      const fd = new FormData();
      fd.append('name',     form.name.trim());
      fd.append('party',    form.party);
      fd.append('position', form.position);
      fd.append('bio',      form.bio);
      if (photo) fd.append('photo', photo);

      if (modal === 'add') {
        await axios.post(`${API}/api/admin/candidates`, fd, { headers: authHeaders() });
      } else {
        await axios.put(`${API}/api/admin/candidates/${modal.id}`, fd, { headers: authHeaders() });
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save candidate.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this candidate? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/api/admin/candidates/${id}`, { headers: authHeaders() });
      load();
    } catch {
      alert('Failed to delete candidate.');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><span className="spinner-green" /></div>;
  if (error)   return <div className="alert-error">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} registered</p>
        <button onClick={openAdd} className="btn-primary w-auto px-5">
          + Add Candidate
        </button>
      </div>

      {candidates.length === 0 ? <Empty text="No candidates added yet." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                {c.photo
                  ? <img src={`${API}${c.photo}`} alt={c.name} className="w-12 h-12 rounded-full object-cover border-2 border-green-100" />
                  : <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg flex items-center justify-center">{c.name.charAt(0)}</div>
                }
                <div>
                  <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                  {c.party    && <p className="text-green-600 text-xs font-semibold">{c.party}</p>}
                  {c.position && <p className="text-gray-400 text-xs">{c.position}</p>}
                </div>
              </div>
              {c.bio && <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-1">{c.bio}</p>}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => openEdit(c)}
                  className="flex-1 text-xs border border-gray-300 hover:border-indigo-400 hover:text-indigo-600
                             text-gray-600 py-1.5 rounded-lg transition font-semibold">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                  className="flex-1 text-xs border border-gray-300 hover:border-red-400 hover:text-red-500
                             text-gray-600 py-1.5 rounded-lg transition font-semibold disabled:opacity-40">
                  {deleting === c.id ? '…' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {modal === 'add' ? 'Add New Candidate' : `Edit — ${modal.name}`}
            </h2>

            {formError && <div className="alert-error mb-4">⚠️ {formError}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Candidate name"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Party</label>
                <input className="form-input" placeholder="Political party"
                  value={form.party} onChange={e => setForm({ ...form, party: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Position / Role</label>
                <input className="form-input" placeholder="e.g. Presidential Candidate"
                  value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Bio</label>
                <textarea className="form-input resize-none" rows={3} placeholder="Short biography…"
                  value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Photo {modal !== 'add' && '(leave blank to keep existing)'}</label>
                <input ref={fileRef} type="file" accept="image/*" className="text-sm text-gray-500 w-full"
                  onChange={e => setPhoto(e.target.files[0] || null)} />
                {photo && <p className="text-xs text-green-600 mt-1">✅ {photo.name}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800
                             hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50">
                  {saving ? <span className="spinner" /> : modal === 'add' ? 'Add Candidate' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setModal(null)} disabled={saving}
                  className="flex-1 btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router  = useRouter();
  const [tab, setTab] = useState('results');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/admin/login');
  }, []);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  }

  const tabs = [
    { key: 'results',    label: '📊 Results'    },
    { key: 'voters',     label: '👥 Voters'     },
    { key: 'candidates', label: '🧑 Candidates' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gray-900 text-white px-4 py-3 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-base">🔐</div>
            <span className="font-bold text-sm">SecureVote — Admin</span>
          </div>
          <button onClick={handleLogout}
            className="text-xs border border-gray-600 hover:border-red-500 text-gray-300
                       hover:text-red-400 px-3 py-1.5 rounded-lg transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mb-6">Manage the election — results, voters, and candidates.</p>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-8 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'results'    && <ResultsTab    />}
        {tab === 'voters'     && <VotersTab     />}
        {tab === 'candidates' && <CandidatesTab />}
      </div>
    </div>
  );
}
