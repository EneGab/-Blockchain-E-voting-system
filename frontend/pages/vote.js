import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function VotePage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [voterId,    setVoterId]     = useState('');
  const [loading,    setLoading]     = useState(true);
  const [submitting, setSubmitting]  = useState(false);
  const [error,      setError]       = useState('');
  const [showModal,  setShowModal]   = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const id    = localStorage.getItem('voterId');
    if (!token) { router.push('/login'); return; }
    setVoterId(id || '');
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      const res = await api.get('/api/candidates');
      setCandidates(res.data.candidates);
    } catch {
      setError('Failed to load candidates. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/vote/cast', { candidate_id: selected.id });
      router.push({
        pathname: '/confirmation',
        query: {
          candidate: selected.name,
          txHash:    res.data.txHash   || '',
          voteHash:  res.data.voteHash || '',
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Vote submission failed. Try again.');
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar voterId={voterId} />
        <div className="flex justify-center items-center pt-32">
          <div className="spinner" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366F1', width: 36, height: 36 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar voterId={voterId} />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Cast Your Vote</h1>
          <p className="text-gray-500 text-sm">Select one candidate. You can only vote once — choose carefully.</p>
        </div>

        {error && <div className="alert-error mb-6">⚠️ {error}</div>}

        {/* Candidate grid */}
        {candidates.length === 0 ? (
          <div className="alert-info">No candidates available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((c) => {
              const isSelected = selected?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelected(c); setError(''); }}
                  className={`relative bg-white rounded-2xl border-2 p-6 text-center cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md -translate-y-1'
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                  {/* Check badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {c.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{c.name}</h3>
                  {c.party && <p className="text-gray-400 text-xs">{c.party}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        {selected && (
          <div className="mt-8 max-w-sm">
            <div className="alert-info mb-4">
              You selected: <strong className="ml-1">{selected.name}</strong>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit Vote →'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Confirm your vote</h2>
            <p className="text-gray-500 text-sm mb-6">
              You are about to vote for <strong className="text-gray-800">{selected.name}</strong>.
              This action is <strong>irreversible</strong> and will be recorded on the blockchain.
            </p>
            <div className="flex gap-3">
              <button className="btn-primary flex-1" onClick={handleVote} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Yes, submit'}
              </button>
              <button
                className="btn-outline flex-1"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
