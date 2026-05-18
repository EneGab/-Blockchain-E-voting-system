import { useRouter } from 'next/router';

export default function Navbar({ voterId }) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('voterId');
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b-2 border-green-600 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white text-lg">🗳️</div>
          <span className="font-bold text-gray-900 text-lg">SecureVote</span>
        </div>
        <div className="flex items-center gap-3">
          {voterId && (
            <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
              ID: {voterId}
            </span>
          )}
          <button onClick={handleLogout} className="btn-ghost text-xs px-3 py-1.5">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
