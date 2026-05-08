import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center shadow-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900">Invalid invite link</p>
          <p className="text-gray-500 text-sm mt-1">Ask an owner to resend your invite.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { token: jwt, role } = await api.post('/api/auth/setup-password', { token, password });
      await login(jwt);
      navigate(role === 'owner' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-crimson flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Ascend</p>
            <p className="text-white/60 text-xs mt-0.5">Coach Portal</p>
          </div>
        </div>
        <div className="relative">
          <div className="mb-6 flex justify-center">
            <img src="/mascot.png" alt="Ascend mascot" className="w-32 h-32 object-contain animate-float drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">You're almost in.</h1>
          <p className="text-white/70 mt-4 text-lg leading-relaxed">
            Set up your password to start tracking your recruiting and earning referral credits.
          </p>
        </div>
        <p className="relative text-white/40 text-xs">© 2026 Ascend Speech & Debate</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F4F5F7]">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-crimson flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">A</span>
          </div>
          <p className="font-bold text-gray-900 text-sm">Ascend Coach Portal</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Set your password</h2>
            <p className="text-gray-500 text-sm mt-1">Choose a password to activate your account</p>
          </div>

          <div className="card p-8 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <div>
                <label className="label">New Password</label>
                <input type="password" required autoFocus value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" required value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Setting up…
                  </span>
                ) : 'Set Password & Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
