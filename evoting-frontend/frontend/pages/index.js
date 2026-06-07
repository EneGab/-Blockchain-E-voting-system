import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL;
const ABI              = ['function getTotalVotes() external view returns (uint256)'];

export default function WelcomePage() {
  const router = useRouter();
  const [voteCount,    setVoteCount]    = useState(null);
  const [chainLoading, setChainLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { router.push('/vote'); return; }
    fetchVoteCount();
  }, []);

  async function fetchVoteCount() {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const total    = await contract.getTotalVotes();
      setVoteCount(Number(total));
    } catch {
      setVoteCount(null);
    } finally {
      setChainLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col items-center justify-center p-6">

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 w-full max-w-lg text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-md">
            🗳️
          </div>
          <span className="font-extrabold text-3xl text-gray-900 tracking-tight">SecureVote</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
          Welcome to SecureVote
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          A transparent, tamper-proof e-voting platform powered by blockchain technology.
          Your vote is secure and verifiable!
        </p>

        {/* Live on-chain vote counter */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <span className="text-3xl">⛓️</span>
          <div className="text-left flex-1">
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Live · Ethereum Sepolia</p>
            {chainLoading ? (
              <div className="flex items-center gap-2">
                <span className="spinner" />
                <span className="text-gray-400 text-sm">Connecting to blockchain…</span>
              </div>
            ) : voteCount !== null ? (
              <>
                <p className="text-white text-3xl font-extrabold tracking-tight">{voteCount.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-0.5">votes recorded on-chain · immutable &amp; verifiable</p>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Could not reach blockchain</p>
            )}
          </div>
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-green-400 transition underline whitespace-nowrap"
          >
            View contract ↗
          </a>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center gap-2">
            <span className="text-2xl">🔒</span>
            <p className="text-xs font-semibold text-green-800">Secure</p>
            <p className="text-xs text-gray-500">End-to-end encrypted</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center gap-2">
            <span className="text-2xl">⛓️</span>
            <p className="text-xs font-semibold text-green-800">Blockchain</p>
            <p className="text-xs text-gray-500">Immutable records</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center gap-2">
            <span className="text-2xl">✅</span>
            <p className="text-xs font-semibold text-green-800">Verifiable</p>
            <p className="text-xs text-gray-500">Audit your vote</p>
          </div>
        </div>

        {/* CTA */}
        <button
          className="btn-primary w-full text-base py-3 mb-3"
          onClick={() => router.push('/register')}
        >
          Get Started →
        </button>

        {/* Login link */}
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>

      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-6 text-xs text-gray-400">
        <span>Powered by Ethereum Sepolia</span>
        <span>·</span>
        <Link href="/verify" className="hover:text-green-600 transition underline">
          Verify a vote
        </Link>
      </div>

    </div>
  );
}
