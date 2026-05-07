import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const CONTACT_METHODS = ['Instagram DM', 'Text', 'Email', 'In Person'];
const STATUSES = ['Reached Out', 'Interested', 'Enrolled'];

const EMPTY_FORM = { contact_name: '', contact_method: 'Instagram DM', status: 'Reached Out', notes: '' };

export default function Dashboard() {
  const { user } = useAuth();

  const [referrals,  setReferrals]  = useState(null);
  const [outreach,   setOutreach]   = useState([]);
  const [leader,     setLeader]     = useState(undefined); // undefined = loading, null = no data
  const [loadingData, setLoadingData] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

  const [editingId,   setEditingId]   = useState(null);
  const [editForm,    setEditForm]    = useState({ status: '', notes: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [refData, outData, leaderData] = await Promise.all([
        api.get('/api/coach/referrals'),
        api.get('/api/coach/outreach'),
        api.get('/api/coach/leaderboard'),
      ]);
      setReferrals(refData);
      setOutreach(outData);
      setLeader(leaderData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function copyCode() {
    navigator.clipboard.writeText(user?.referral_code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.contact_name.trim()) { setFormError('Contact name is required.'); return; }
    setSubmitting(true);
    try {
      const entry = await api.post('/api/coach/outreach', form);
      setOutreach((prev) => [entry, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditForm({ status: entry.status, notes: entry.notes || '' });
  }

  async function handleEditSave(id) {
    setEditLoading(true);
    try {
      const updated = await api.patch(`/api/coach/outreach/${id}`, editForm);
      setOutreach((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey, {user?.first_name}!
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's your recruiting overview.</p>
      </div>

      {/* Leaderboard Banner */}
      {leader && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-crimson to-crimson-light p-px">
          <div className="rounded-2xl bg-gradient-to-r from-crimson-50 to-gold-50 px-6 py-4 flex items-center gap-4">
            <span className="text-2xl">🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                Current Leader
              </p>
              <p className="font-bold text-gray-900 text-lg leading-tight">
                {leader.first_name} {leader.last_name}
                {user?.referral_code === leader.referral_code && (
                  <span className="ml-2 text-sm font-medium text-crimson">— That's you! 🎉</span>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-crimson tabular-nums">{leader.referral_count}</p>
              <p className="text-xs text-gray-400">referrals</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Referral Code Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Your Referral Code
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-wide text-crimson">
              {user?.referral_code || '—'}
            </span>
            <button
              onClick={copyCode}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Share this code so referrals are tracked to you.
          </p>
        </div>

        {/* Conversions Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Total Conversions
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gold">
              {loadingData ? '—' : referrals?.total ?? 0}
            </span>
            <span className="text-gray-400 text-sm mb-1">referrals enrolled</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Students who signed up using your referral code.
          </p>
        </div>
      </div>

      {/* Outreach Log */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Outreach Log</h2>
          <button
            onClick={() => { setShowAddForm((v) => !v); setFormError(''); }}
            className="text-sm font-medium bg-crimson text-white px-4 py-2 rounded-lg hover:bg-crimson-dark transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Entry'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            {formError && (
              <p className="text-red-600 text-sm mb-3">{formError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="e.g. Jordan Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Method *</label>
                <select
                  value={form.contact_method}
                  onChange={(e) => setForm({ ...form, contact_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white"
                >
                  {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white"
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="Optional notes…"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-crimson text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save Entry'}
            </button>
          </form>
        )}

        {/* Table */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
          </div>
        ) : outreach.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No outreach logged yet.</p>
            <p className="text-xs mt-1">Click "+ Add Entry" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-medium">Contact</th>
                  <th className="px-6 py-3 text-left font-medium">Method</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium hidden md:table-cell">Notes</th>
                  <th className="px-6 py-3 text-left font-medium hidden sm:table-cell">Date</th>
                  <th className="px-6 py-3 text-left font-medium">Edit</th>
                </tr>
              </thead>
              <tbody>
                {outreach.map((entry) =>
                  editingId === entry.id ? (
                    <tr key={entry.id} className="border-b border-gray-100 bg-gold-50">
                      <td className="px-6 py-3 font-medium">{entry.contact_name}</td>
                      <td className="px-6 py-3 text-gray-500">{entry.contact_method}</td>
                      <td className="px-6 py-3">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white"
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <input
                          type="text"
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                          placeholder="Notes…"
                        />
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(entry.id)}
                            disabled={editLoading}
                            className="text-xs text-crimson font-medium hover:underline disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{entry.contact_name}</td>
                      <td className="px-6 py-3 text-gray-500">{entry.contact_method}</td>
                      <td className="px-6 py-3"><StatusBadge status={entry.status} /></td>
                      <td className="px-6 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {entry.notes || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-xs text-gray-400 hover:text-crimson transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
