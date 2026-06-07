import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL;
const ABI = [
  'function verifyVote(string memory voteHash) external view returns (bool)',
  'function getTotalVotes() external view returns (uint256)',
];

export default function VerifyPage() {
  const router   = useRouter();
  const [hash,   setHash]   = useState('');
  const [result, setResult] = useState(null); // true | false | null
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [total,   setTotal]   = useState(null);

  // Pre-fill hash from query param (?hash=...)
  useEffect(() => {
    if (router.query.hash) setHash(router.query.hash);
    fetchTotal();
  }, [router.query.hash]);

  async function fetchTotal() {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const t = await contract.getTotalVotes();
      setTotal(Number(t));
    } catch { /* silent */ }
  }

  async function handleVerify(e) {
    e.preventDefault();
    const trimmed = hash.trim();
    if (!trimmed) return setError('Please enter a vote hash.');
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const found    = await contract.verifyVote(trimmed);
      setResult(found);
    } catch {
      setError('Could not reach the blockchain. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl">🗳️</div>
          <span className="font-bold text-xl text-gray-900">SecureVote</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Verify Your Vote</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Paste your vote hash below to confirm it exists permanently on the Ethereum blockchain.
          No account required — this is fully public.
        </p>

        {/* Stats bar */}
        <div className="bg-gray-900 rounded-xl px-5 py-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span>⛓️</span>
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Sepolia Network</span>
          </div>
          <div className="text-right">
            {total !== null
              ? <span className="text-white text-sm font-bold">{total.toLocaleString()} votes on-chain</span>
              : <span className="text-gray-500 text-xs">Loading…</span>
            }
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="form-label">Vote Hash</label>
            <textarea
              className="form-input font-mono text-xs resize-none"
              rows={3}
              placeholder="Paste your vote hash here…"
              value={hash}
              onChange={e => { setHash(e.target.value); setResult(null); setError(''); }}
            />
          </div>

          {error && <div className="alert-error">⚠️ {error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading
              ? <><span className="spinner" /> Querying blockchain…</>
              : '🔍 Verify on Blockchain'}
          </button>
        </form>

        {/* Result */}
        {result === true && (
          <div className="mt-6 bg-green-50 border-2 border-green-500 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-green-700 font-bold text-lg">Vote Confirmed On-Chain</p>
            <p className="text-green-600 text-sm mt-1">
              This vote hash exists on the Ethereum Sepolia blockchain.
              It was recorded permanently and cannot be tampered with.
            </p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-4 text-xs text-gray-500 hover:text-green-700 underline transition"
            >
              View contract on Etherscan ↗
            </a>
          </div>
        )}

        {result === false && (
          <div className="mt-6 bg-red-50 border-2 border-red-400 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-red-700 font-bold text-lg">Vote Not Found</p>
            <p className="text-red-500 text-sm mt-1">
              This hash was not found on the blockchain. Double-check the hash and try again.
            </p>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-center gap-4 mt-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-green-600 transition">← Home</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-green-600 transition">Log in</Link>
          <span>·</span>
          <Link href="/register" className="hover:text-green-600 transition">Register</Link>
        </div>

      </div>
    </div>
  );
}
