import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import api from '../utils/api';

export default function VotePage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [voterId,    setVoterId]     = useState('');
  const [hasVoted,   setHasVoted]    = useState(false);
  const [loading,    setLoading]     = useState(true);
  const [submitting, setSubmitting]  = useState(false);
  const [error,      setError]       = useState('');
  const [showModal,  setShowModal]   = useState(false);
  const [toast,      setToast]       = useState(null);

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
      if (res.data.has_voted) setHasVoted(true);
    } catch {
      setError('Failed to load candidates. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(c) {
    if (hasVoted) return;
    setSelected(c);
    setToast({ message: `You selected ${c.name}`, type: 'warning' });
  }

  async function handleVote() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/vote/cast', { candidate_id: selected.id });
      setShowModal(false);
      router.push({
        pathname: '/confirmation',
        query: {
          candidate: selected.name,
          txHash:    res.data.txHash   || '',
          voteHash:  res.data.voteHash || '',
        },
      });
    } catch (err) {
      setShowModal(false);
      const msg = err.response?.data?.message || 'Vote submission failed.';
      if (msg.toLowerCase().includes('already')) {
        setHasVoted(true);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar voterId={voterId} />
        <div className="flex justify-center items-center pt-32">
          <span className="spinner-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar voterId={voterId} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Cast Your Vote</h1>
          <p className="text-gray-500 text-sm">Select one candidate. You can only vote once, <strong>choose carefully!</strong></p>
        </div>

        {/* Already voted warning */}
        {hasVoted && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-5 mb-8 text-center">
            <p className="text-2xl mb-2">🚫</p>
            <p className="text-red-700 font-bold text-lg">You cannot make another vote.</p>
            <p className="text-red-500 text-sm mt-1">Your vote has already been recorded on the blockchain.</p>
          </div>
        )}

        {error && !hasVoted && <div className="alert-error mb-6">⚠️ {error}</div>}

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
                  onClick={() => handleSelect(c)}
                  className={`relative bg-white rounded-2xl border-2 p-6 text-center transition-all duration-200
                    ${hasVoted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected && !hasVoted
                      ? 'border-green-500 bg-green-50 shadow-md -translate-y-1'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                  {isSelected && !hasVoted && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                  )}
                  {/* Candidate photo or avatar */}
                  {c.photo ? (
                    <img src={c.photo} alt={c.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-green-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-base mb-1">{c.name}</h3>
                  {c.party    && <p className="text-green-600 text-xs font-semibold mb-1">{c.party}</p>}
                  {c.position && <p className="text-gray-400 text-xs">{c.position}</p>}
                  {c.bio      && <p className="text-gray-500 text-xs mt-2 line-clamp-2">{c.bio}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        {selected && !hasVoted && (
          <div className="mt-8 max-w-sm">
            <div className="alert-warning mb-4">
              ⚠️ You selected: <strong>{selected.name}</strong>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit Vote →'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold text-gray-900">Confirm Your Vote</h2>
            </div>
            <p className="text-gray-600 text-sm mb-2 text-center">
              Are you sure you want to vote for
            </p>
            <p className="text-green-700 font-bold text-lg text-center mb-4">{selected?.name}?</p>
            <p className="text-red-500 text-xs text-center font-semibold mb-6">
              ⚠️ This action cannot be reversed. You can only vote once.
            </p>
            <div className="flex gap-3">
              <button className="btn-primary flex-1" onClick={handleVote} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Yes, Submit Vote'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
