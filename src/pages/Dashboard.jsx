import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const CONTACT_METHODS = ['Instagram DM', 'Text', 'Email', 'In Person'];
const STATUSES        = ['Reached Out', 'Interested', 'Enrolled'];
const GRADES          = ['9th', '10th', '11th', '12th', 'Other'];

const EMPTY_FORM = {
  contact_name: '',
  contact_method: 'Instagram DM',
  status: 'Reached Out',
  notes: '',
  grade: '',
  school: '',
  follow_up_date: '',
};

function isOverdue(follow_up_date, status) {
  if (!follow_up_date || status === 'Enrolled') return false;
  return new Date(follow_up_date) < new Date(new Date().toDateString());
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

  const [editingId,   setEditingId]   = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  // Sort & filter state
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGrade,  setFilterGrade]  = useState('');
  const [sortBy,       setSortBy]       = useState('created_at');
  const [sortDir,      setSortDir]      = useState('desc');

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

  // Filtered + sorted outreach
  const displayedOutreach = useMemo(() => {
    let rows = [...outreach];
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    if (filterGrade)  rows = rows.filter((r) => r.grade  === filterGrade);
    rows.sort((a, b) => {
      let aVal = a[sortBy] ?? '';
      let bVal = b[sortBy] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [outreach, filterStatus, filterGrade, sortBy, sortDir]);

  function toggleSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-crimson ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
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
    setEditForm({
      status:         entry.status,
      notes:          entry.notes         || '',
      grade:          entry.grade         || '',
      school:         entry.school        || '',
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

  const overdueCount = outreach.filter((e) => isOverdue(e.follow_up_date, e.status)).length;

  return (
    <Layout>
      {/* Header */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Referral Code</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-wide text-crimson">{user?.referral_code || '—'}</span>
            <button
              onClick={copyCode}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
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
            <span className="text-gray-400 text-sm mb-1">contacts</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {overdueCount > 0 ? 'Check below for overdue follow-ups.' : 'You\'re all caught up!'}
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
            {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
                <input
                  type="text" required autoFocus
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="e.g. Jordan Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                  placeholder="e.g. Lincoln High School"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent bg-white"
                >
                  <option value="">— Select grade —</option>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
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
              type="submit" disabled={submitting}
              className="bg-crimson text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-crimson-dark transition disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save Entry'}
            </button>
          </form>
        )}

        {/* Sort & Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center bg-gray-50">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-crimson"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          {(filterStatus || filterGrade) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterGrade(''); }}
              className="text-xs text-gray-400 hover:text-crimson transition"
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {displayedOutreach.length} {displayedOutreach.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Table */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedOutreach.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">{outreach.length === 0 ? 'No outreach logged yet.' : 'No entries match your filters.'}</p>
            {outreach.length === 0 && <p className="text-xs mt-1">Click "+ Add Entry" to get started.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-600" onClick={() => toggleSort('contact_name')}>
                    Contact <SortIcon col="contact_name" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">School</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Grade</th>
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gray-600" onClick={() => toggleSort('status')}>
                    Status <SortIcon col="status" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell cursor-pointer hover:text-gray-600" onClick={() => toggleSort('follow_up_date')}>
                    Follow-up <SortIcon col="follow_up_date" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell cursor-pointer hover:text-gray-600" onClick={() => toggleSort('created_at')}>
                    Added <SortIcon col="created_at" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Edit</th>
                </tr>
              </thead>
              <tbody>
                {displayedOutreach.map((entry) => {
                  const overdue = isOverdue(entry.follow_up_date, entry.status);
                  return editingId === entry.id ? (
                    <tr key={entry.id} className="border-b border-gray-100 bg-gold-50">
                      <td className="px-4 py-3 font-medium">{entry.contact_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input
                          type="text" value={editForm.school}
                          onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                          placeholder="School…"
                        />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <select
                          value={editForm.grade}
                          onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white"
                        >
                          <option value="">—</option>
                          {GRADES.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{entry.contact_method}</td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson bg-white"
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <input
                          type="text" value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                          placeholder="Notes…"
                        />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input
                          type="date" value={editForm.follow_up_date}
                          onChange={(e) => setEditForm({ ...editForm, follow_up_date: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                        />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSave(entry.id)} disabled={editLoading}
                            className="text-xs text-crimson font-medium hover:underline disabled:opacity-60">Save</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${overdue ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.contact_name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{entry.school || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {entry.grade
                          ? <span className="badge bg-gray-100 text-gray-600">{entry.grade}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{entry.contact_method}</td>
                      <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell max-w-xs truncate">
                        {entry.notes || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {entry.follow_up_date ? (
                          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                            {overdue && '⚠ '}{new Date(entry.follow_up_date).toLocaleDateString()}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(entry)}
                          className="text-xs text-gray-400 hover:text-crimson transition">Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
