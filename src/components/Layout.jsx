import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-crimson font-bold text-lg leading-none">Ascend</span>
              <span className="text-gray-400 text-sm hidden sm:inline">Coach Portal</span>
            </Link>
            {user?.role === 'owner' && (
              <div className="flex items-center gap-1">
                <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                  My Dashboard
                </NavLink>
                <NavLink to="/admin" active={location.pathname === '/admin'}>
                  Admin
                </NavLink>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-500 hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-crimson transition-colors px-3 py-1.5 rounded-md hover:bg-crimson-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-crimson-50 text-crimson'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}
