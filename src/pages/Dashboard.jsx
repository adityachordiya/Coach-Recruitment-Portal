import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const CONTACT_METHODS = ['Instagram DM', 'Text', 'Email', 'In Person'];
const STATUSES        = ['Reached Out', 'Interested', 'Enrolled'];
const GRADES          = ['9th', '10th', '11th', '12th', 'Other'];

const EMPTY_FORM = {
  contact_name: '', contact_method: 'Instagram DM',
  status: 'Reached Out', notes: '', grade: '', school: '', follow_up_date: '',
};

function todayPlus7() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function isOverdue(follow_up_date, status) {
  if (!follow_up_date || status === 'Enrolled') return false;
  return new Date(follow_up_date) < new Date(new Date().toDateString());
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group flat interaction rows into prospects
function groupByProspect(rows) {
  const map = new Map();
  for (const row of rows) {
    const pid = row.prospect_id || row.id;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid).push(row);
  }
  // Return sorted: most recent interaction first
  return Array.from(map.entries())
    .map(([pid, interactions]) => {
      const sorted = [...interactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const latest = sorted[sorted.length - 1];
      return { prospect_id: pid, interactions: sorted, latest };
    })
    .sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at));
}

export default function Dashboard() {
  const { user } = useAuth();

  const [referrals,   setReferrals]   = useState(null);
  const [outreach,    setOutreach]    = useState([]);
  const [leader,      setLeader]      = useState(undefined);
  const [loadingData, setLoadingData] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

  const [expandedId,   setExpandedId]   = useState(null);
  const [followUpFor,  setFollowUpFor]  = useState(null); // prospect being followed up
  const [followUpForm, setFollowUpForm] = useState({});
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  const [editingId,   setEditingId]   = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGrade,  setFilterGrade]  = useState('');

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

  const prospects = useMemo(() => {
    let grouped = groupByProspect(outreach);
    if (filterStatus) grouped = grouped.filter((p) => p.latest.status === filterStatus);
    if (filterGrade)  grouped = grouped.filter((p) => p.latest.grade  === filterGrade);
    return grouped;
  }, [outreach, filterStatus, filterGrade]);

  const overdueCount = useMemo(() =>
    prospects.filter((p) => isOverdue(p.latest.follow_up_date, p.latest.status)).length,
    [prospects]
  );

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
      const entry = await api.post('/api/coach/outreach', {
        ...form,
        follow_up_date: form.follow_up_date || todayPlus7(),
      });
      setOutreach((prev) => [...prev, entry]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openFollowUp(prospect) {
    setFollowUpFor(prospect.prospect_id);
    setExpandedId(prospect.prospect_id);
    setFollowUpForm({
      contact_name:   prospect.latest.contact_name,
      contact_method: 'Instagram DM',
      status:         prospect.latest.status,
      notes:          '',
      grade:          prospect.latest.grade  || '',
      school:         prospect.latest.school || '',
      follow_up_date: todayPlus7(),
      prospect_id:    prospect.prospect_id,
    });
  }

  async function handleFollowUpSubmit(e) {
    e.preventDefault();
    setFollowUpSubmitting(true);
    try {
      const entry = await api.post('/api/coach/outreach', followUpForm);
      setOutreach((prev) => [...prev, entry]);
      setFollowUpFor(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setFollowUpSubmitting(false);
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditForm({
      status:         entry.status,
      notes:          entry.notes          || '',
      grade:          entry.grade          || '',
      school:         entry.school         || '',
      follow_up_date: entry.follow_up_date ? entry.follow_up_date.split('T')[0] : '',
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hey, {user?.first_name}!</h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's your recruiting overview.</p>
      </div>

      {/* Leaderboard Banner */}
      {leader && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-crimson to-crimson-light p-px">
          <div className="rounded-2xl bg-gradient-to-r from-crimson-50 to-gold-50 px-6 py-4 flex items-center gap-4">
            <span className="text-2xl">🏆</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Current Leader</p>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-wide text-crimson">{user?.referral_code || '—'}</span>
            <button onClick={copyCode}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this code so referrals are tracked to you.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Total Conversions</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gold">{loadingData ? '—' : referrals?.total ?? 0}</span>
            <span className="text-gray-400 text-sm mb-1">enrolled</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Students who signed up using your referral code.</p>
        </div>

        <div className={`rounded-2xl border p-6 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Follow-ups Overdue</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
              {loadingData ? '—' : overdueCount}
            </span>
            <span className="text-gray-400 text-sm mb-1">prospects</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {overdueCount > 0 ? 'Check below for overdue follow-ups.' : "You're all caught up!"}
          </p>
        </div>
      </div>

      {/* Prospects / Outreach Log */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Prospects</h2>
          <button
            onClick={() => { setShowAddForm((v) => !v); setFormError(''); }}
            className="text-sm font-medium bg-crimson text-white px-4 py-2 rounded-lg hover:bg-crimson-dark transition">
            {showAddForm ? 'Cancel' : '+ Add Prospect'}
          </button>
        </div>

        {/* Add Prospect Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
                <input type="text" required autoFocus value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="e.g. Jordan Smith" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
                <input type="text" value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="e.g. Lincoln High School" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white">
                  <option value="">— Select grade —</option>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Method *</label>
                <select value={form.contact_method} onChange={(e) => setForm({ ...form, contact_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white">
                  {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Follow-up Date <span className="text-gray-400 font-normal">(auto: +7 days)</span>
                </label>
                <input type="date" value={form.follow_up_date}
                  onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="Optional notes…" />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="bg-crimson text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60">
              {submitting ? 'Saving…' : 'Add Prospect'}
            </button>
          </form>
        )}

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center bg-gray-50">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson">
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          {(filterStatus || filterGrade) && (
            <button onClick={() => { setFilterStatus(''); setFilterGrade(''); }}
              className="text-xs text-gray-400 hover:text-crimson transition">Clear filters</button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {prospects.length} {prospects.length === 1 ? 'prospect' : 'prospects'}
          </span>
        </div>

        {/* Prospect List */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">{outreach.length === 0 ? 'No prospects yet.' : 'No prospects match your filters.'}</p>
            {outreach.length === 0 && <p className="text-xs mt-1">Click "+ Add Prospect" to get started.</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prospects.map((prospect) => {
              const { prospect_id, interactions, latest } = prospect;
              const overdue = isOverdue(latest.follow_up_date, latest.status);
              const isExpanded = expandedId === prospect_id;

              return (
                <div key={prospect_id}>
                  {/* Prospect Row */}
                  <div
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition ${overdue ? 'bg-red-50 hover:bg-red-100' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : prospect_id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{latest.contact_name}</span>
                        {latest.grade && <span className="badge bg-gray-100 text-gray-600">{latest.grade}</span>}
                        <StatusBadge status={latest.status} />
                        {overdue && <span className="badge bg-red-100 text-red-600">⚠ Follow-up overdue</span>}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {latest.school && <span>{latest.school}</span>}
                        <span>{interactions.length} {interactions.length === 1 ? 'interaction' : 'interactions'}</span>
                        {latest.follow_up_date && (
                          <span className={overdue ? 'text-red-500 font-medium' : ''}>
                            Follow up {formatDate(latest.follow_up_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openFollowUp(prospect); }}
                        className="text-xs font-medium text-crimson border border-crimson px-3 py-1.5 rounded-lg hover:bg-crimson hover:text-white transition"
                      >
                        Log Follow-up
                      </button>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded: Interaction Timeline */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 mb-3">
                        Interaction History
                      </h4>
                      <div className="space-y-2 mb-4">
                        {interactions.map((entry, idx) => (
                          <div key={entry.id}>
                            {editingId === entry.id ? (
                              <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                    <select value={editForm.status}
                                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white">
                                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Date</label>
                                    <input type="date" value={editForm.follow_up_date}
                                      onChange={(e) => setEditForm({ ...editForm, follow_up_date: e.target.value })}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson" />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                    <input type="text" value={editForm.notes}
                                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                                      placeholder="Notes…" />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditSave(entry.id)} disabled={editLoading}
                                    className="text-xs bg-crimson text-white font-medium px-3 py-1.5 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60">
                                    Save
                                  </button>
                                  <button onClick={() => setEditingId(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center mt-1 shrink-0">
                                  <div className={`w-2.5 h-2.5 rounded-full ${idx === interactions.length - 1 ? 'bg-crimson' : 'bg-gray-300'}`} />
                                  {idx < interactions.length - 1 && <div className="w-px h-full min-h-6 bg-gray-200 mt-1" />}
                                </div>
                                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <StatusBadge status={entry.status} />
                                      <span className="text-xs text-gray-500">{entry.contact_method}</span>
                                      <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                                    </div>
                                    <button onClick={() => startEdit(entry)}
                                      className="text-xs text-gray-400 hover:text-crimson transition">Edit</button>
                                  </div>
                                  {entry.notes && (
                                    <p className="text-sm text-gray-600 mt-1.5">{entry.notes}</p>
                                  )}
                                  {entry.follow_up_date && (
                                    <p className={`text-xs mt-1 ${isOverdue(entry.follow_up_date, entry.status) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                      Follow up {formatDate(entry.follow_up_date)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Log Follow-up Form */}
                      {followUpFor === prospect_id && (
                        <form onSubmit={handleFollowUpSubmit} className="bg-white rounded-xl border border-gray-200 p-4 mt-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">New Interaction</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Contact Method</label>
                              <select value={followUpForm.contact_method}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, contact_method: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white">
                                {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">New Status</label>
                              <select value={followUpForm.status}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white">
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Follow-up Date <span className="text-gray-400 font-normal">(auto: +7 days)</span>
                              </label>
                              <input type="date" value={followUpForm.follow_up_date}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_date: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                              <input type="text" autoFocus value={followUpForm.notes}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                                placeholder="What happened?" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={followUpSubmitting}
                              className="text-xs bg-crimson text-white font-medium px-4 py-1.5 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60">
                              {followUpSubmitting ? 'Saving…' : 'Log Interaction'}
                            </button>
                            <button type="button" onClick={() => setFollowUpFor(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
