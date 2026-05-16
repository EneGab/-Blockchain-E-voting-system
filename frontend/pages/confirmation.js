import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ConfirmationPage() {
  const router = useRouter();
  const { candidate, txHash, voteHash } = router.query;

  const sepoliaUrl = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-lg text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center text-4xl mx-auto mb-6">
          ✅
        </div>

        <h1 className="text-2xl font-bold text-green-700 mb-2">Vote Recorded!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your vote for <strong className="text-gray-800">{candidate || 'your candidate'}</strong> has been
          securely recorded on the blockchain.
        </p>

        {/* Vote hash */}
        {voteHash && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vote Hash (keep for audit)</p>
            <p className="text-xs font-mono text-gray-600 break-all">{voteHash}</p>
          </div>
        )}

        {/* Etherscan link */}
        {sepoliaUrl && (
          <a
            href={sepoliaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full mb-4"
          >
            🔗 View on Sepolia Etherscan
          </a>
        )}

        <div className="alert-info text-left mb-6">
          You have used your one vote for this election. Thank you for participating!
        </div>

        <Link href="/login">
          <button className="btn-primary">Back to Home</button>
        </Link>
      </div>
    </div>
  );
}
