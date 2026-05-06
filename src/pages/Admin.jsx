import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';

export default function Admin() {
  const [coaches,     setCoaches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState(null);

  const [showInvite,  setShowInvite]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('coach');
  const [inviteMsg,   setInviteMsg]   = useState('');
  const [inviteErr,   setInviteErr]   = useState('');
  const [inviting,    setInviting]    = useState(false);

  const loadCoaches = useCallback(async () => {
    try {
      const data = await api.get('/api/admin/coaches');
      setCoaches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoaches(); }, [loadCoaches]);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteErr('');
    setInviteMsg('');
    setInviting(true);
    try {
      const { message } = await api.post('/api/auth/invite', { email: inviteEmail, role: inviteRole });
      setInviteMsg(message);
      setInviteEmail('');
      setInviteRole('coach');
      loadCoaches();
    } catch (err) {
      setInviteErr(err.message);
    } finally {
      setInviting(false);
    }
  }

  const totalOutreach  = coaches.reduce((s, c) => s + c.outreach_count,  0);
  const totalReferrals = coaches.reduce((s, c) => s + c.referral_count, 0);

  return (
    <Layout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">All coaches and their recruiting activity.</p>
        </div>
        <button
          onClick={() => { setShowInvite((v) => !v); setInviteMsg(''); setInviteErr(''); }}
          className="self-start sm:self-auto bg-crimson text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-crimson-dark transition"
        >
          {showInvite ? 'Cancel' : '+ Invite Coach'}
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Invite a Coach</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-start">
            <input
              type="email"
              required
              autoFocus
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="coach@example.com"
              className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white"
            >
              <option value="coach">Coach</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="bg-crimson text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60 whitespace-nowrap"
            >
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteMsg && <p className="text-green-600 text-sm mt-3">{inviteMsg}</p>}
          {inviteErr && <p className="text-red-600 text-sm mt-3">{inviteErr}</p>}
          <p className="text-xs text-gray-400 mt-2">
            The coach must already exist in the referrers table. They'll receive an email with a setup link.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && coaches.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Coaches" value={coaches.length} />
          <StatCard label="Total Outreach" value={totalOutreach} color="text-crimson" />
          <StatCard label="Total Referrals" value={totalReferrals} color="text-gold" />
        </div>
      )}

      {/* Coaches Table */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Coaches</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No coaches yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {coaches.map((coach) => (
              <CoachRow
                key={coach.account_id}
                coach={coach}
                expanded={expandedId === coach.account_id}
                onToggle={() =>
                  setExpandedId((id) => (id === coach.account_id ? null : coach.account_id))
                }
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function CoachRow({ coach, expanded, onToggle }) {
  const lastActive = coach.last_active
    ? new Date(coach.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-4">
          {/* Name & code */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {coach.first_name} {coach.last_name}
              </span>
              {coach.role === 'owner' && (
                <span className="badge bg-crimson-100 text-crimson text-xs">Owner</span>
              )}
            </div>
            <span className="text-xs font-mono text-crimson">{coach.referral_code}</span>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Stat label="Referrals" value={coach.referral_count} />
            <Stat label="Outreach"  value={coach.outreach_count} />
            <Stat label="Last Active" value={lastActive} mono={false} />
          </div>

          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden flex gap-4 mt-2 text-sm">
          <Stat label="Referrals" value={coach.referral_count} />
          <Stat label="Outreach"  value={coach.outreach_count} />
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 mb-3">
            Outreach Log
          </h3>
          {coach.outreach_log.length === 0 ? (
            <p className="text-sm text-gray-400">No outreach entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="pb-2 text-left font-medium">Contact</th>
                    <th className="pb-2 text-left font-medium">Method</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium hidden md:table-cell">Notes</th>
                    <th className="pb-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coach.outreach_log.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{entry.contact_name}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{entry.contact_method}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={entry.status} /></td>
                      <td className="py-2.5 pr-4 text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {entry.notes || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, mono = true }) {
  return (
    <div className="text-center">
      <div className={`font-semibold text-gray-900 ${mono ? 'tabular-nums' : ''}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
