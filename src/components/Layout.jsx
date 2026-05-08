import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [flying,   setFlying]   = useState(false);
  const [pos,      setPos]      = useState({ x: 40, y: 40 });
  const [rotation, setRotation] = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const intervalRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  function launchMascot() {
    if (flying) return;
    setFlying(true);

    // Massive confetti party
    const colors = ['#A51C30', '#D4A017', '#fff', '#FAE4E8', '#FAF1CC'];
    confetti({ particleCount: 150, spread: 120, origin: { y: 0.3 }, colors });
    setTimeout(() => confetti({ particleCount: 100, angle: 60,  spread: 80, origin: { x: 0,   y: 0.5 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 80, origin: { x: 1,   y: 0.5 }, colors }), 400);
    setTimeout(() => confetti({ particleCount: 80,  spread: 100, origin: { y: 0.7 }, colors }), 700);
    setTimeout(() => confetti({ particleCount: 60,  spread: 140, origin: { y: 0.2 }, colors }), 1000);

    // Fly to random positions around the screen
    const positions = Array.from({ length: 10 }, () => ({
      x: Math.random() * (window.innerWidth  - 140),
      y: Math.random() * (window.innerHeight - 140),
    }));

    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i >= positions.length) {
        clearInterval(intervalRef.current);
        setFlying(false);
        // Final confetti burst when it lands
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 }, colors });
        return;
      }
      const next = positions[i];
      const prev = i > 0 ? positions[i - 1] : { x: 40, y: 40 };
      setFlipped(next.x < prev.x);
      setRotation((Math.random() - 0.5) * 40);
      setPos(next);
      i++;
    }, 420);
  }

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* Flying mascot overlay */}
      {flying && (
        <img
          src="/mascot.png"
          alt=""
          style={{
            position: 'fixed',
            left: pos.x,
            top:  pos.y,
            width: 120,
            height: 120,
            objectFit: 'contain',
            zIndex: 9999,
            transition: 'left 0.38s cubic-bezier(.68,-0.55,.27,1.55), top 0.38s cubic-bezier(.68,-0.55,.27,1.55)',
            transform: `rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 8px 24px rgba(165,28,48,0.4))',
          }}
        />
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-15" style={{ height: '3.75rem' }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={launchMascot}
              className="focus:outline-none"
              title="Click me!"
            >
              <img
                src="/mascot.png"
                alt="Ascend"
                className={`w-9 h-9 object-contain transition-transform ${flying ? 'opacity-0' : 'animate-wiggle hover:scale-125'}`}
                style={{ transition: 'transform 0.15s, opacity 0.2s' }}
              />
            </button>
            <Link to="/dashboard" className="hidden sm:block">
              <span className="font-bold text-gray-900 text-sm leading-none">Ascend</span>
              <span className="text-gray-400 text-sm font-normal"> Coach Portal</span>
            </Link>
          </div>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>Dashboard</NavLink>
            <NavLink to="/resources" active={location.pathname === '/resources'}>Resources</NavLink>
            {user?.role === 'owner' && (
              <NavLink to="/admin" active={location.pathname === '/admin'}>Admin</NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-crimson-100 flex items-center justify-center">
                <span className="text-crimson text-xs font-bold">{initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.first_name}</span>
            </div>
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-crimson transition-colors px-2 py-1 rounded-lg hover:bg-crimson-50"
            >
              Sign out
            </button>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <MobileNavLink to="/dashboard" active={location.pathname === '/dashboard'} onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
            <MobileNavLink to="/resources" active={location.pathname === '/resources'} onClick={() => setMenuOpen(false)}>Resources</MobileNavLink>
            {user?.role === 'owner' && (
              <MobileNavLink to="/admin" active={location.pathname === '/admin'} onClick={() => setMenuOpen(false)}>Admin</MobileNavLink>
            )}
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-crimson text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, active, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-crimson-50 text-crimson' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}
