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

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

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

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/coaches/${confirmDelete.account_id}`);
      setConfirmDelete(null);
      loadCoaches();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

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
      {/* Header */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage coaches and track recruiting activity.</p>
        </div>
        <button
          onClick={() => { setShowInvite((v) => !v); setInviteMsg(''); setInviteErr(''); }}
          className={`self-start sm:self-auto text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm ${
            showInvite ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-crimson text-white hover:bg-crimson-dark'
          }`}
        >
          {showInvite ? '✕ Cancel' : '+ Invite Coach'}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg text-center mb-1">Remove coach?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently remove <span className="font-semibold text-gray-800">{confirmDelete.name}</span> and all their outreach entries.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60">
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="card p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Invite a Coach</h2>
          <p className="text-xs text-gray-400 mb-4">The coach must already exist in the referrers table.</p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-start">
            <input
              type="email" required autoFocus value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="coach@example.com"
              className="input flex-1"
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input sm:w-36">
              <option value="coach">Coach</option>
              <option value="owner">Owner</option>
            </select>
            <button type="submit" disabled={inviting}
              className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteMsg && (
            <div className="mt-3 flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {inviteMsg}
            </div>
          )}
          {inviteErr && (
            <div className="mt-3 text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">{inviteErr}</div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && coaches.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Coaches" value={coaches.length} icon="👥" />
          <StatCard label="Total Outreach" value={totalOutreach} icon="📤" color="text-crimson" />
          <StatCard label="Total Conversions" value={totalReferrals} icon="🏆" color="text-gold" />
        </div>
      )}

      {/* Coaches Table */}
      <div className="card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Coaches</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading coaches…</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium text-gray-700">No coaches yet</p>
            <p className="text-sm text-gray-400 mt-1">Invite a coach to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {coaches.map((coach) => (
              <CoachRow
                key={coach.account_id}
                coach={coach}
                expanded={expandedId === coach.account_id}
                onToggle={() => setExpandedId((id) => (id === coach.account_id ? null : coach.account_id))}
                onDelete={() => setConfirmDelete({ account_id: coach.account_id, name: `${coach.first_name} ${coach.last_name}` })}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon, color = 'text-gray-900' }) {
  return (
    <div className="card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function CoachRow({ coach, expanded, onToggle, onDelete }) {
  const lastActive = coach.last_active
    ? new Date(coach.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
  const lastLogin = coach.last_login_at
    ? new Date(coach.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const initials = `${coach.first_name?.[0] ?? ''}${coach.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-crimson-50 flex items-center justify-center shrink-0">
          <span className="text-crimson text-xs font-bold">{initials}</span>
        </div>

        {/* Name & info — clickable to expand */}
        <button onClick={onToggle} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{coach.first_name} {coach.last_name}</span>
            {coach.role === 'owner' && (
              <span className="badge bg-crimson-50 text-crimson ring-1 ring-crimson-100">Owner</span>
            )}
            <span className="text-xs font-mono text-crimson bg-crimson-50 px-2 py-0.5 rounded-md">{coach.referral_code}</span>
          </div>
        </button>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
          <Stat label="Referrals"     value={coach.referral_count} color={coach.referral_count > 0 ? 'text-gold font-bold' : ''} />
          <Stat label="Outreach"      value={coach.outreach_count} color={coach.outreach_count > 0 ? 'text-crimson font-bold' : ''} />
          <Stat label="Last Login"    value={lastLogin}   mono={false} />
          <Stat label="Last Outreach" value={lastActive}  mono={false} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 transition rounded-lg"
            title="Remove coach"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button onClick={onToggle} className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition rounded-lg">
            <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile stats */}
      <div className={`sm:hidden px-6 pb-3 flex gap-4 text-sm -mt-2 ${expanded ? 'hidden' : ''}`}>
        <Stat label="Referrals" value={coach.referral_count} />
        <Stat label="Outreach" value={coach.outreach_count} />
      </div>

      {/* Expanded outreach log */}
      {expanded && (
        <div className="px-6 pb-6 bg-gray-50/60 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 mb-3">Outreach Log</h3>
          {coach.outreach_log.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No outreach entries yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coach.outreach_log.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{entry.contact_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{entry.contact_method}</td>
                      <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-xs truncate text-xs">
                        {entry.notes || <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

function Stat({ label, value, mono = true, color = '' }) {
  return (
    <div className="text-center">
      <div className={`text-gray-900 ${mono ? 'tabular-nums' : ''} ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
