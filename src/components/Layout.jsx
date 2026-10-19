import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Icon from './Icon';

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
    ? (`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` || user.email?.[0] || '?').toUpperCase()
    : '?';

  function launchMascot() {
    if (flying) return;
    setFlying(true);

    // Massive confetti party
    const colors = ['#BD1F2E', '#15171B', '#fff', '#FBE4E6', '#B8892B'];
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
    <div className="min-h-screen bg-paper">

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
            filter: 'drop-shadow(0 8px 24px rgba(189,31,46,0.4))',
          }}
        />
      )}

      <nav className="bg-white/95 backdrop-blur border-b border-black/[0.07] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={launchMascot} className="rounded-full" title="Click me!" aria-label="Ascend mascot">
              <img
                src="/mascot.png"
                alt=""
                className={`w-9 h-9 object-contain ${flying ? 'opacity-0' : 'hover:scale-110'}`}
                style={{ transition: 'transform 0.15s, opacity 0.2s' }}
              />
            </button>
            <Link to={user?.referral_code ? '/dashboard' : '/admin'} className="flex items-baseline gap-2">
              <span className="font-display text-[21px] font-semibold text-ink leading-none tracking-tight">Ascend</span>
              <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-[0.12em] text-crimson">Coach Portal</span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="hidden sm:flex items-stretch gap-1 h-full">
            {user?.referral_code && <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>Dashboard</NavLink>}
            <NavLink to="/resources" active={location.pathname === '/resources'}>Playbook</NavLink>
            {user?.role === 'owner' && (
              <NavLink to="/admin" active={location.pathname === '/admin'}>Admin</NavLink>
            )}
          </div>

          {/* Account */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                <span className="text-white text-[11px] font-bold tracking-wide">{initials}</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">{user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : user?.email}</p>
                <p className="text-[11px] text-ink-muted font-mono">{user?.referral_code || 'Owner'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-crimson transition-colors px-2.5 py-1.5 rounded-lg hover:bg-crimson-50"
              title="Sign out"
            >
              <Icon name="logout" className="w-4 h-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              <Icon name={menuOpen ? 'x' : 'menu'} className="w-5 h-5 text-ink-soft" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-black/[0.07] bg-white px-4 py-3 space-y-1">
            <div className="flex items-center gap-2.5 px-3 pb-3 mb-1 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">{initials}</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">{user?.first_name ? `${user.first_name} ${user.last_name ?? ''}` : user?.email}</p>
                <p className="text-[11px] text-ink-muted font-mono">{user?.referral_code || 'Owner'}</p>
              </div>
            </div>
            {user?.referral_code && <MobileNavLink to="/dashboard" active={location.pathname === '/dashboard'} onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>}
            <MobileNavLink to="/resources" active={location.pathname === '/resources'} onClick={() => setMenuOpen(false)}>Playbook</MobileNavLink>
            {user?.role === 'owner' && (
              <MobileNavLink to="/admin" active={location.pathname === '/admin'} onClick={() => setMenuOpen(false)}>Admin</MobileNavLink>
            )}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-ink-muted hover:bg-gray-50">
              Sign out
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center px-3.5 text-sm font-medium transition-colors duration-150 ${
        active
          ? 'text-ink after:absolute after:left-3 after:right-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-crimson'
          : 'text-ink-muted hover:text-ink'
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
        active ? 'bg-crimson-50 text-crimson' : 'text-ink-soft hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}
