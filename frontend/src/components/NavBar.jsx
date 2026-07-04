import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <Link to="/" className="text-xl font-bold tracking-tight">
        Fairway<span className="text-emerald">Impact</span>
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link to="/charities" className="hover:text-emerald">Charities</Link>
        <Link to="/draws" className="hover:text-emerald">Draws</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="hover:text-emerald">Dashboard</Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="hover:text-gold">Admin</Link>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-emerald">Log in</Link>
            <Link
              to="/subscribe"
              className="bg-emerald text-ink font-semibold px-4 py-1.5 rounded-full hover:opacity-90"
            >
              Join Now
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
