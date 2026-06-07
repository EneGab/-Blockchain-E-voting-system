import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ConfirmationPage() {
  const router = useRouter();
  const { candidate, txHash, voteHash } = router.query;
  const sepoliaUrl = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 w-full max-w-lg text-center">

        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
        <h1 className="text-2xl font-bold text-green-700 mb-2">Vote Successfully Recorded!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your vote for <strong className="text-gray-800">{candidate || 'your candidate'}</strong> has been
          permanently recorded on the Sepolia blockchain.
        </p>

        {/* Blockchain badge */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">⛓️</span>
          <div className="text-left">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">On-Chain Confirmation</p>
            <p className="text-xs text-green-600 mt-0.5">Your vote is permanently sealed on the Ethereum blockchain and cannot be altered or deleted.</p>
          </div>
        </div>

        {/* Vote hash */}
        {voteHash && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vote Hash</p>
            <p className="text-xs font-mono text-gray-600 break-all mb-2">{voteHash}</p>
            <p className="text-xs text-gray-400">Save this hash — you can use it to independently verify your vote was recorded.</p>
          </div>
        )}

        {/* Transaction hash */}
        {txHash && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction Hash</p>
            <p className="text-xs font-mono text-gray-600 break-all">{txHash}</p>
          </div>
        )}

        {/* Etherscan CTA — prominent */}
        {sepoliaUrl && (
          <a
            href={sepoliaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 mb-3
                       bg-gray-900 hover:bg-gray-700 text-white font-semibold rounded-lg
                       transition text-sm"
          >
            <span>🔗</span>
            View Transaction on Etherscan
            <span className="text-gray-400 text-xs">↗</span>
          </a>
        )}

        {/* Verify vote hash link */}
        {voteHash && (
          <Link
            href={`/verify?hash=${encodeURIComponent(voteHash)}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 mb-5
                       border-2 border-green-600 text-green-700 hover:bg-green-50
                       font-semibold rounded-lg transition text-sm"
          >
            <span>✅</span>
            Verify My Vote On-Chain
          </Link>
        )}

        {/* Cannot revote warning */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-bold text-sm">🚫 You cannot make another vote.</p>
          <p className="text-red-500 text-xs mt-1">Your voting rights have been used for this election.</p>
        </div>

        <Link href="/login">
          <button className="btn-primary">Back to Home</button>
        </Link>

      </div>
    </div>
  );
}
