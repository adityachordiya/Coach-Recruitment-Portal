import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, role } = await api.post('/api/auth/login', { email, password });
      await login(token);
      navigate(role === 'owner' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-crimson flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.03]" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">Ascend</p>
              <p className="text-white/60 text-xs mt-0.5">Coach Portal</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <div className="mb-6 flex justify-center">
              <img src="/mascot.png" alt="Ascend mascot" className="w-36 h-36 object-contain animate-float drop-shadow-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight text-balance">
              The #1 Congress camp in the country
            </h1>
            <p className="text-white/70 mt-4 text-lg leading-relaxed">
              Every TOC winner this decade has been part of Team Ascend. Track your recruiting, grow your impact.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Track every prospect and interaction',
              'See your referral earnings in real time',
              'Access scripts, pricing, and talking points',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-white/40 text-xs">
            © 2026 Ascend Speech & Debate · University of the Pacific, Stockton CA · July 12–26
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F4F5F7]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-crimson flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Ascend Coach Portal</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your coach account</p>
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
                <label className="label">Email</label>
                <input
                  type="email" required autoFocus
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="••••••••"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full py-2.5 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Don't have an account? Ask an owner to invite you.
          </p>
        </div>
      </div>
    </div>
  );
}
