import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const CONTACT_METHODS = ['Instagram DM', 'Text', 'Phone Call', 'Email', 'In Person'];
const STATUSES        = ['Reached Out', 'No Response', 'Interested', 'Connected with Ascend Admin', 'Enrolled', 'Not Interested'];
const GRADES          = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Other'];

const EMPTY_FORM = {
  contact_name: '', contact_method: 'Instagram DM',
  status: 'Reached Out', notes: '', grade: '', school: '',
};

const INACTIVE_STATUSES = ['Enrolled', 'Not Interested'];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function followUpIndicator(days, status) {
  if (days === null || INACTIVE_STATUSES.includes(status)) return null;
  if (days <= 3)  return { label: `${days}d ago`, color: 'bg-green-50 text-green-700 ring-1 ring-green-200' };
  if (days <= 6)  return { label: `${days}d ago`, color: 'bg-gold-50 text-yellow-700 ring-1 ring-yellow-200' };
  return { label: `${days}d — follow up!`, color: 'bg-red-50 text-red-600 ring-1 ring-red-200' };
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateStreak(outreach) {
  if (!outreach.length) return 0;
  const dates = new Set(outreach.map((o) => o.created_at.split('T')[0]));
  const today = new Date().toISOString().split('T')[0];
  const startOffset = dates.has(today) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) streak++;
    else break;
  }
  return streak;
}

function fireConfetti(type = 'default') {
  if (type === 'referral') {
    // Gold burst for referral
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
      colors: ['#D4A017', '#E8B420', '#FAF1CC', '#fff', '#A51C30'] });
  } else {
    // Crimson + gold shower for milestone
    confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 },
      colors: ['#A51C30', '#D4A017', '#fff'] });
    confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 },
      colors: ['#A51C30', '#D4A017', '#fff'] });
  }
}

function groupByProspect(rows) {
  const map = new Map();
  for (const row of rows) {
    const pid = row.prospect_id || row.id;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid).push(row);
  }
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

  const [expandedId,         setExpandedId]         = useState(null);
  const [followUpFor,        setFollowUpFor]        = useState(null);
  const [followUpForm,       setFollowUpForm]       = useState({});
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  const [editingId,   setEditingId]   = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [copied,         setCopied]         = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterGrade,    setFilterGrade]     = useState('');
  const [milestone,      setMilestone]      = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // { prospect_id, name }
  const [deleting,       setDeleting]       = useState(false);

  const prevReferralCount = useRef(null);
  const milestoneShown    = useRef(false);

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

  // Confetti: first time reaching 5 unique prospects
  const prospectCount = useMemo(() => groupByProspect(outreach).length, [outreach]);
  useEffect(() => {
    if (loadingData) return;
    const key = `milestone_5_prospects_${user?.referral_code}`;
    if (prospectCount >= 5 && !milestoneShown.current && !localStorage.getItem(key)) {
      milestoneShown.current = true;
      localStorage.setItem(key, '1');
      setTimeout(() => {
        fireConfetti('milestone');
        setMilestone('🎉 5 prospects reached! Keep it up!');
        setTimeout(() => setMilestone(null), 4000);
      }, 500);
    }
  }, [prospectCount, loadingData, user]);

  // Confetti: new referral enrolled
  useEffect(() => {
    if (loadingData || referrals === null) return;
    const current = referrals.total ?? 0;
    if (prevReferralCount.current !== null && current > prevReferralCount.current) {
      fireConfetti('referral');
      setMilestone(`🏆 New referral enrolled! You're on fire!`);
      setTimeout(() => setMilestone(null), 4000);
    }
    prevReferralCount.current = current;
  }, [referrals, loadingData]);

  const streak = useMemo(() => calculateStreak(outreach), [outreach]);

  const prospects = useMemo(() => {
    let grouped = groupByProspect(outreach);
    if (filterStatus) grouped = grouped.filter((p) => p.latest.status === filterStatus);
    if (filterGrade)  grouped = grouped.filter((p) => p.latest.grade  === filterGrade);
    return grouped;
  }, [outreach, filterStatus, filterGrade]);

  const needFollowUpCount = useMemo(() =>
    prospects.filter((p) => {
      if (INACTIVE_STATUSES.includes(p.latest.status)) return false;
      const days = daysSince(p.latest.created_at);
      return days !== null && days >= 7;
    }).length,
    [prospects]
  );

  async function handleDeleteProspect() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/coach/outreach/prospect/${confirmDelete.prospect_id}`);
      setOutreach((prev) => prev.filter((e) => e.prospect_id !== confirmDelete.prospect_id));
      setConfirmDelete(null);
      setExpandedId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  }

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
      setOutreach((prev) => [...prev, entry]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      fireConfetti('milestone');
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
    setEditForm({ status: entry.status, notes: entry.notes || '', grade: entry.grade || '', school: entry.school || '' });
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

  const isLeader = leader && user?.referral_code === leader.referral_code;

  return (
    <Layout>
      {/* Milestone Toast */}
      {milestone && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          {milestone}
        </div>
      )}

      {/* Delete Prospect Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg text-center mb-1">Delete prospect?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <span className="font-semibold text-gray-800">{confirmDelete.name}</span> and all their interaction history.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDeleteProspect} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src="/mascot.png" alt="Ascend" className="w-16 h-16 object-contain animate-float hidden sm:block" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hey, {user?.first_name}! {isLeader ? '🏆' : '👋'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Here's your recruiting overview.</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl shrink-0">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-sm font-bold text-orange-700">{streak} day streak</p>
              <p className="text-xs text-orange-400">Keep logging outreach!</p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Banner */}
      {leader && (
        <div className={`mb-6 rounded-2xl p-5 flex items-center gap-4 shadow-sm ${
          isLeader
            ? 'bg-gradient-to-r from-crimson to-crimson-light text-white'
            : 'bg-white border border-gray-100'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
            isLeader ? 'bg-white/20' : 'bg-gold-50'
          }`}>
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${isLeader ? 'text-white/60' : 'text-gray-400'}`}>
              {isLeader ? 'You\'re the leader!' : 'Current Leader'}
            </p>
            <p className={`font-bold text-lg leading-tight ${isLeader ? 'text-white' : 'text-gray-900'}`}>
              {leader.first_name} {leader.last_name}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-3xl font-bold tabular-nums ${isLeader ? 'text-white' : 'text-crimson'}`}>
              {leader.referral_count}
            </p>
            <p className={`text-xs ${isLeader ? 'text-white/60' : 'text-gray-400'}`}>referrals enrolled</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {/* Referral Code */}
        <div className="card p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Referral Code</p>
            <div className="w-8 h-8 rounded-lg bg-crimson-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold tracking-widest text-crimson font-mono mb-1">{user?.referral_code || '—'}</p>
          <p className="text-xs text-gray-400 mb-3">Students save $50 when they use this code.</p>
          <button onClick={copyCode}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              copied
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {copied ? '✓ Copied!' : 'Copy code'}
          </button>
        </div>

        {/* Conversions */}
        <div className="card p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enrolled</p>
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-3xl font-bold text-gold tabular-nums">{loadingData ? '—' : referrals?.total ?? 0}</span>
            <span className="text-gray-400 text-sm mb-1">students</span>
          </div>
          <p className="text-xs text-gray-400">Signed up using your referral code.</p>
        </div>

        {/* Follow-up */}
        <div className={`card p-5 shadow-sm ${needFollowUpCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Need Follow-up</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              needFollowUpCount > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <svg className={`w-4 h-4 ${needFollowUpCount > 0 ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div className="flex items-end gap-1.5 mb-1">
            <span className={`text-3xl font-bold tabular-nums ${needFollowUpCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
              {loadingData ? '—' : needFollowUpCount}
            </span>
            <span className="text-gray-400 text-sm mb-1">prospects</span>
          </div>
          <p className="text-xs text-gray-400">
            {needFollowUpCount > 0 ? 'No contact in 7+ days.' : "You're all caught up! 🎉"}
          </p>
        </div>
      </div>

      {/* Prospects Panel */}
      <div className="card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Prospects</h2>
            <p className="text-xs text-gray-400 mt-0.5">{outreach.length === 0 ? 'No prospects yet' : `${groupByProspect(outreach).length} total`}</p>
          </div>
          <button
            onClick={() => { setShowAddForm((v) => !v); setFormError(''); }}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
              showAddForm
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-crimson text-white hover:bg-crimson-dark shadow-sm'
            }`}>
            {showAddForm ? '✕ Cancel' : '+ Add Prospect'}
          </button>
        </div>

        {/* Add Prospect Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            {formError && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{formError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <FormField label="Contact Name *">
                <input type="text" required autoFocus value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="input" placeholder="e.g. Jordan Smith" />
              </FormField>
              <FormField label="School">
                <input type="text" value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="input" placeholder="e.g. Lincoln High School" />
              </FormField>
              <FormField label="Grade">
                <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="input">
                  <option value="">— Select grade —</option>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </FormField>
              <FormField label="Contact Method *">
                <select value={form.contact_method} onChange={(e) => setForm({ ...form, contact_method: e.target.value })} className="input">
                  {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Notes">
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input" placeholder="Optional notes…" />
              </FormField>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 text-sm">
              {submitting ? 'Saving…' : 'Add Prospect'}
            </button>
          </form>
        )}

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center bg-gray-50/50">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 text-gray-600">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20 text-gray-600">
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          {(filterStatus || filterGrade) && (
            <button onClick={() => { setFilterStatus(''); setFilterGrade(''); }}
              className="text-xs text-gray-400 hover:text-crimson transition px-2 py-1.5 rounded-lg hover:bg-crimson-50">
              × Clear
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto font-medium">
            {prospects.length} {prospects.length === 1 ? 'prospect' : 'prospects'}
          </span>
        </div>

        {/* Prospect List */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading prospects…</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-2xl">
              {outreach.length === 0 ? '📋' : '🔍'}
            </div>
            <p className="font-medium text-gray-700">
              {outreach.length === 0 ? 'No prospects yet' : 'No prospects match your filters'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {outreach.length === 0 ? 'Click "+ Add Prospect" to start tracking your outreach.' : 'Try clearing your filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prospects.map((prospect) => {
              const { prospect_id, interactions, latest } = prospect;
              const days      = daysSince(latest.created_at);
              const indicator = followUpIndicator(days, latest.status);
              const needsFollowUp = indicator?.color.includes('red');
              const isExpanded = expandedId === prospect_id;

              return (
                <div key={prospect_id} className={needsFollowUp ? 'bg-red-50/40' : ''}>
                  <div
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : prospect_id)}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-gray-500">
                        {latest.contact_name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{latest.contact_name}</span>
                        {latest.grade && (
                          <span className="badge bg-gray-100 text-gray-500 ring-1 ring-gray-200">{latest.grade}</span>
                        )}
                        <StatusBadge status={latest.status} />
                        {indicator && (
                          <span className={`badge ${indicator.color}`}>{indicator.label}</span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                        {latest.school && <span>{latest.school}</span>}
                        <span>{interactions.length} {interactions.length === 1 ? 'interaction' : 'interactions'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!INACTIVE_STATUSES.includes(latest.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openFollowUp(prospect); }}
                          className="text-xs font-semibold text-crimson border border-crimson/30 bg-crimson-50 px-3 py-1.5 rounded-lg hover:bg-crimson hover:text-white transition-all">
                          Log Follow-up
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ prospect_id, name: latest.contact_name }); }}
                        className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 transition rounded-lg"
                        title="Delete prospect">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Timeline */}
                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50/70 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 mb-4">
                        Interaction History
                      </p>
                      <div className="space-y-2 mb-4">
                        {interactions.map((entry, idx) => (
                          <div key={entry.id}>
                            {editingId === entry.id ? (
                              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                  <FormField label="Status">
                                    <select value={editForm.status}
                                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                      className="input text-sm py-2">
                                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                  </FormField>
                                  <FormField label="Notes">
                                    <input type="text" value={editForm.notes}
                                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                      className="input text-sm py-2" placeholder="Notes…" />
                                  </FormField>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditSave(entry.id)} disabled={editLoading}
                                    className="btn-primary text-xs px-4 py-1.5">
                                    {editLoading ? 'Saving…' : 'Save'}
                                  </button>
                                  <button onClick={() => setEditingId(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center mt-2 shrink-0">
                                  <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                                    idx === interactions.length - 1 ? 'bg-crimson' : 'bg-gray-300'
                                  }`} />
                                  {idx < interactions.length - 1 && (
                                    <div className="w-px flex-1 min-h-6 bg-gray-200 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <StatusBadge status={entry.status} />
                                      <span className="text-xs text-gray-400 font-medium">{entry.contact_method}</span>
                                      <span className="text-xs text-gray-300">·</span>
                                      <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                                    </div>
                                    <button onClick={() => startEdit(entry)}
                                      className="text-xs text-gray-300 hover:text-crimson transition font-medium">
                                      Edit
                                    </button>
                                  </div>
                                  {entry.notes && (
                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{entry.notes}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Log Follow-up Form */}
                      {followUpFor === prospect_id && (
                        <form onSubmit={handleFollowUpSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">New Interaction</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <FormField label="Contact Method">
                              <select value={followUpForm.contact_method}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, contact_method: e.target.value })}
                                className="input text-sm py-2">
                                {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
                              </select>
                            </FormField>
                            <FormField label="New Status">
                              <select value={followUpForm.status}
                                onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
                                className="input text-sm py-2">
                                {STATUSES.map((s) => <option key={s}>{s}</option>)}
                              </select>
                            </FormField>
                            <div className="sm:col-span-2">
                              <FormField label="Notes">
                                <input type="text" autoFocus value={followUpForm.notes}
                                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                                  className="input text-sm py-2" placeholder="What happened in this interaction?" />
                              </FormField>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={followUpSubmitting}
                              className="btn-primary text-xs px-4 py-1.5">
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

function FormField({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
