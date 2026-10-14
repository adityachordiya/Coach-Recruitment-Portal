import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import Icon from '../components/Icon';

const CONTACT_METHODS = ['Instagram DM', 'Text', 'Phone Call', 'Email', 'In Person'];
const STATUSES        = ['Reached Out', 'No Response', 'Interested', 'Connected with Ascend Admin', 'Enrolled', 'Not Interested'];
const GRADES          = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Other'];

const EMPTY_FORM = {
  contact_name: '', contact_method: 'Instagram DM',
  status: 'Reached Out', notes: '', grade: '', school: '',
  student_email: '', student_phone: '',
  parent_name: '', parent_email: '', parent_phone: '',
};

const CAMP_DATE = new Date('2026-07-12T09:00:00');

const BADGES = [
  // Outreach volume
  { id: 'first_contact',    emoji: '🌱', label: 'First Contact',    desc: 'Log your first prospect',       color: 'bg-navy-50 ring-navy-100',  check: ({ p }) => p >= 1  },
  { id: 'on_the_board',     emoji: '📣', label: 'On the Board',     desc: 'Reach 5 prospects',             color: 'bg-navy-50 ring-navy-100',   check: ({ p }) => p >= 5  },
  { id: 'hustler',          emoji: '💪', label: 'Hustler',          desc: 'Reach 15 prospects',            color: 'bg-navy-50 ring-navy-100', check: ({ p }) => p >= 15 },
  { id: 'all_star',         emoji: '🌟', label: 'All-Star',         desc: 'Reach 25 prospects',            color: 'bg-navy-50 ring-navy-100', check: ({ p }) => p >= 25 },
  // Streak
  { id: 'on_fire',          emoji: '🔥', label: 'On Fire',          desc: '7-day outreach streak',         color: 'bg-crimson-50 ring-crimson-100', check: ({ s }) => s >= 7  },
  { id: 'inferno',          emoji: '🌋', label: 'Inferno',          desc: '14-day outreach streak',        color: 'bg-crimson-50 ring-crimson-100',    check: ({ s }) => s >= 14 },
  // Enrollments
  { id: 'closer',           emoji: '🏅', label: 'Closer',           desc: 'Get your first enrollment',     color: 'bg-gold-50 ring-gold-100',  check: ({ r }) => r >= 1  },
  { id: 'double_down',      emoji: '✌️',  label: 'Double Down',      desc: 'Get 2 enrollments',             color: 'bg-gold-50 ring-gold-100',  check: ({ r }) => r >= 2  },
  { id: 'champion',         emoji: '🏆', label: 'Champion',         desc: 'Get 5 enrollments',             color: 'bg-gold-50 ring-gold-100', check: ({ r }) => r >= 5  },
  { id: 'legend',           emoji: '👑', label: 'Legend',           desc: 'Get 10 enrollments',            color: 'bg-gold-50 ring-gold-100',check: ({ r }) => r >= 10 },
  // Methods
  { id: 'email_master',     emoji: '📧', label: 'Email Master',     desc: 'Send your first email follow-up', color: 'bg-violet-50 ring-violet-100',    check: ({ emails }) => emails >= 1 },
  { id: 'social_butterfly', emoji: '🦋', label: 'Social Butterfly', desc: '10+ Instagram DMs sent',        color: 'bg-violet-50 ring-violet-100',   check: ({ dms }) => dms >= 10 },
];

const RANKS = [
  { label: 'Rookie',  emoji: '🥉', min: 0,  max: 4,        color: 'text-amber-600'  },
  { label: 'Scout',   emoji: '🥈', min: 5,  max: 9,        color: 'text-slate-500'  },
  { label: 'Veteran', emoji: '🥇', min: 10, max: 19,       color: 'text-yellow-500' },
  { label: 'Elite',   emoji: '💎', min: 20, max: 34,       color: 'text-sky-500'    },
  { label: 'Legend',  emoji: '👑', min: 35, max: Infinity, color: 'text-crimson'    },
];

function getRank(count)     { return RANKS.find(r => count <= r.max) ?? RANKS[RANKS.length - 1]; }
function getNextRank(count) { const i = RANKS.findIndex(r => count <= r.max); return i >= 0 && i < RANKS.length - 1 ? RANKS[i + 1] : null; }
function getRankProgress(count) {
  const r = getRank(count);
  if (!getNextRank(count)) return 100;
  const range = r.max - r.min + 1;
  return Math.min(100, Math.round(((count - r.min) / range) * 100));
}

// Pre-computed bristle angles & lengths for the broomstick — deterministic so no flicker on re-render
const BRISTLES = [
  { a: -58, l: 22 }, { a: -46, l: 27 }, { a: -34, l: 30 }, { a: -22, l: 28 },
  { a: -11, l: 32 }, { a:  -2, l: 26 }, { a:   7, l: 31 }, { a:  18, l: 29 },
  { a:  29, l: 32 }, { a:  41, l: 27 }, { a:  52, l: 24 }, { a:  61, l: 20 },
];

const INACTIVE_STATUSES = ['Enrolled', 'Not Interested'];

// The funnel in the order a prospect moves through it (the pipeline strip).
const FUNNEL = ['Reached Out', 'No Response', 'Interested', 'Connected with Ascend Admin', 'Enrolled'];

// Enrollment milestones (goal gradient: the next rung always shows "N to go").
const MILESTONES = [1, 3, 5, 10, 15];

// When a prospect at each stage is due a follow-up, in days since last touch,
// and what to say about it. Interested and Connected go cold fastest.
const FOLLOW_UP_RULES = {
  'Interested':                  { after: 3, priority: 0, say: (n, d) => `${n} said they were interested ${d} days ago. A quick text keeps it warm.` },
  'Connected with Ascend Admin': { after: 4, priority: 1, say: (n, d) => `Check in with ${n}: see if they have questions after talking with Ascend (${d} days).` },
  'Reached Out':                 { after: 5, priority: 2, say: (n, d) => `No reply from ${n} in ${d} days. Try a different channel, or reach a parent.` },
  'No Response':                 { after: 7, priority: 3, say: (n, d) => `${n} hasn't replied in ${d} days. One more friendly nudge?` },
};

const STORE_URL = 'https://www.ascendspeech.org/ascend-store';

// Ready-to-send messages for the share kit. Each leads with what the family
// gets (the $50), not what the coach earns.
function shareTemplates(user) {
  const me = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  const code = user?.referral_code ?? '';
  return [
    { id: 'dm', label: 'Instagram DM', icon: 'send', text:
      `Hey! I'm coaching at Ascend this summer, the Congress camp I'd recommend to anyone serious about debate. If you're thinking about camp, my code ${code} saves your family $50: ${STORE_URL}\n\nHappy to answer anything!` },
    { id: 'text', label: 'Text to a parent', icon: 'phone', text:
      `Hi, this is ${me}. I coach Congressional Debate at Ascend Speech & Debate. I think your student would get a lot out of our summer camp, and the code ${code} saves your family $50 when you register: ${STORE_URL}\n\nGlad to answer any questions.` },
    { id: 'email', label: 'Email to a parent', icon: 'mail', subject: 'Ascend Speech & Debate this summer', text:
      `Hi,\n\nI'm ${me}, a coach at Ascend Speech & Debate. Ascend is the largest Congressional Debate camp in the country, and every TOC Congress champion this decade has been part of the program.\n\nIf your student is thinking about camp this summer, my code ${code} saves your family $50 at registration: ${STORE_URL}\n\nI'm happy to answer any questions, just reply here.\n\n${me}\nAscend Speech & Debate` },
  ];
}

// Monday of the week a date falls in, as YYYY-MM-DD (local time).
function weekKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
}

// Consecutive weeks with at least one logged interaction. This week counts
// once something is logged; until then the run is measured to last week, so
// a quiet Monday never shows a broken streak.
function calculateWeeklyStreak(outreach) {
  if (!outreach.length) return 0;
  const weeks = new Set(outreach.map((o) => weekKey(o.created_at)));
  const cursor = new Date();
  if (!weeks.has(weekKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  let n = 0;
  while (weeks.has(weekKey(cursor)) && n < 60) { n++; cursor.setDate(cursor.getDate() - 7); }
  return n;
}

function shortStudent(full) {
  const parts = String(full || '').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] || 'Student';
}

// Fill of the milestone line: each gap between rungs is an equal share.
function milestoneProgress(n) {
  if (n <= MILESTONES[0]) return n >= MILESTONES[0] ? 0 : 0;
  if (n >= MILESTONES[MILESTONES.length - 1]) return 1;
  const i = MILESTONES.findIndex((m, k) => n >= m && n < MILESTONES[k + 1]);
  const within = (n - MILESTONES[i]) / (MILESTONES[i + 1] - MILESTONES[i]);
  return (i + within) / (MILESTONES.length - 1);
}

function shortName(first, last) {
  return `${first ?? ''}${last ? ` ${last[0]}.` : ''}`.trim();
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function followUpIndicator(days, status) {
  if (days === null || INACTIVE_STATUSES.includes(status)) return null;
  const ago = days === 0 ? 'today' : `${days}d ago`;
  if (days <= 3)  return { level: 'fresh', label: ago, color: 'bg-white text-ink-muted ring-gray-200' };
  if (days <= 6)  return { level: 'soon',  label: ago, color: 'bg-amber-50 text-amber-700 ring-amber-200' };
  return { level: 'due', label: `${days}d · follow up`, color: 'bg-crimson-50 text-crimson ring-crimson-200' };
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const fmtUsd = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
      colors: ['#B8892B', '#D4A63F', '#F4EAD2', '#fff', '#BD1F2E'] });
  } else {
    // Crimson + gold shower for milestone
    confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 },
      colors: ['#BD1F2E', '#B8892B', '#fff'] });
    confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 },
      colors: ['#BD1F2E', '#B8892B', '#fff'] });
  }
}

function buildGmailUrl(prospect, user) {
  const { latest } = prospect;
  const emails = [latest.student_email, latest.parent_email].filter(Boolean).join(',');
  if (!emails) return null;

  const greeting = [latest.contact_name, latest.parent_name].filter(Boolean).join(' and ');

  const subject = encodeURIComponent('Following up — Ascend Speech & Debate 2026');

  const body = encodeURIComponent(
    `Hi ${greeting},\n\n` +
    `My name is ${user.first_name} ${user.last_name}, and I'm a coach at Ascend Speech & Debate. ` +
    `I wanted to personally follow up about our summer camp at the University of the Pacific, July 12–26, 2026.\n\n` +
    `Ascend is the #1 Congressional Debate camp in the country — every TOC winner this decade has been part of our program. ` +
    `I genuinely think you'd thrive here.\n\n` +
    `You can use my referral code ${user.referral_code} at checkout to save $50:\n` +
    `https://www.ascendspeech.org/ascend-store\n\n` +
    `Happy to answer any questions — just reply to this email!\n\n` +
    `${user.first_name} ${user.last_name}\n` +
    `Ascend Speech & Debate Coach`
  );

  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emails)}&su=${subject}&body=${body}`;
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

  const [referrals,    setReferrals]    = useState(null);
  const [outreach,     setOutreach]     = useState([]);
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);

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
  const [shareOpen,      setShareOpen]      = useState(false);
  const [sharedCopy,     setSharedCopy]     = useState(null);
  const [hasShared,      setHasShared]      = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterGrade,    setFilterGrade]     = useState('');
  const [milestone,      setMilestone]      = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  // Bird flight state
  const [birdFlying,  setBirdFlying]  = useState(false);
  const [birdDisplay, setBirdDisplay] = useState({ x: 0, y: 0, angle: 0, flipped: false, speed: 0 });
  const birdPosRef    = useRef({ x: 0, y: 0 });
  const birdTargetRef = useRef({ x: 0, y: 0 });
  const birdRafRef    = useRef(null);
  const birdTimerRef  = useRef(null);
  const birdStopRef   = useRef(null);
  const prevBirdPos   = useRef({ x: 0, y: 0 });

  const prevReferralCount = useRef(null);
  const milestoneShown    = useRef(false);
  const prevEarnedBadges  = useRef(null);

  // Camp countdown
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    function tick() {
      const diff = CAMP_DATE - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      setCountdown({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [refData, outData, leaderData] = await Promise.all([
        api.get('/api/coach/referrals'),
        api.get('/api/coach/outreach'),
        api.get('/api/coach/leaderboard'),
      ]);
      setReferrals(refData);
      setOutreach(outData);
      setLeaderboard(Array.isArray(leaderData) ? leaderData : []);
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

  const badgeStats = useMemo(() => ({
    p:      groupByProspect(outreach).length,
    r:      referrals?.total ?? 0,
    s:      streak,
    emails: outreach.filter(e => e.contact_method === 'Email' && e.notes === 'Follow-up email sent').length,
    dms:    outreach.filter(e => e.contact_method === 'Instagram DM').length,
  }), [outreach, referrals, streak]);

  const earnedBadges = useMemo(() =>
    BADGES.filter(b => b.check(badgeStats)).map(b => b.id),
    [badgeStats]
  );

  // Fire confetti on new badge unlock
  useEffect(() => {
    if (loadingData) return;
    if (prevEarnedBadges.current === null) { prevEarnedBadges.current = earnedBadges; return; }
    const newOnes = earnedBadges.filter(id => !prevEarnedBadges.current.includes(id));
    if (newOnes.length > 0) {
      const badge = BADGES.find(b => b.id === newOnes[0]);
      confetti({ particleCount: 160, spread: 120, origin: { y: 0.4 }, colors: ['#BD1F2E', '#B8892B', '#fff'] });
      setMilestone(`${badge.emoji} Badge unlocked: ${badge.label}!`);
      setTimeout(() => setMilestone(null), 4000);
    }
    prevEarnedBadges.current = earnedBadges;
  }, [earnedBadges, loadingData]);

  const prospects = useMemo(() => {
    let grouped = groupByProspect(outreach);
    if (filterStatus) grouped = grouped.filter((p) => p.latest.status === filterStatus);
    if (filterGrade)  grouped = grouped.filter((p) => p.latest.grade  === filterGrade);
    return grouped;
  }, [outreach, filterStatus, filterGrade]);

  const allProspects = useMemo(() => groupByProspect(outreach), [outreach]);
  const statusCounts = useMemo(() => {
    const c = {};
    for (const p of allProspects) c[p.latest.status] = (c[p.latest.status] || 0) + 1;
    return c;
  }, [allProspects]);

  const needFollowUpCount = useMemo(() =>
    allProspects.filter((p) => {
      if (INACTIVE_STATUSES.includes(p.latest.status)) return false;
      const days = daysSince(p.latest.created_at);
      return days !== null && days >= 7;
    }).length,
    [allProspects]
  );

  function handleEmailFollowUp(prospect) {
    const mailto = buildGmailUrl(prospect, user);
    if (!mailto) return;
    // Open Gmail compose in a new tab
    window.open(mailto, '_blank');
  }

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

  function launchBird() {
    if (birdFlying) return;
    setBirdFlying(true);

    const colors = ['#BD1F2E', '#B8892B', '#fff', '#FBE4E6'];
    confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors });

    const W = window.innerWidth, H = window.innerHeight;
    const startX = W / 2, startY = H / 2;
    birdPosRef.current  = { x: startX, y: startY };
    prevBirdPos.current = { x: startX, y: startY };

    function newTarget() {
      birdTargetRef.current = {
        x: 100 + Math.random() * (W - 240),
        y: 80  + Math.random() * (H - 200),
      };
    }
    newTarget();
    birdTimerRef.current = setInterval(newTarget, 1400);

    function animate() {
      const cur = birdPosRef.current;
      const tgt = birdTargetRef.current;

      // Smooth lerp — gives natural curved arcs between waypoints
      const lerp = 0.055;
      const nx = cur.x + (tgt.x - cur.x) * lerp;
      const ny = cur.y + (tgt.y - cur.y) * lerp;

      const vx = nx - prevBirdPos.current.x;
      const vy = ny - prevBirdPos.current.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      // Angle of travel → rotate image to match (Harry Potter lean)
      // Clamp tilt so it doesn't go upside down
      const rawAngle = Math.atan2(vy, Math.abs(vx)) * (180 / Math.PI);
      const tiltAngle = Math.max(-35, Math.min(35, rawAngle));
      const flipped   = vx < 0;

      birdPosRef.current  = { x: nx, y: ny };
      prevBirdPos.current = { x: nx, y: ny };

      setBirdDisplay({ x: nx, y: ny, angle: tiltAngle, flipped, speed });
      birdRafRef.current = requestAnimationFrame(animate);
    }

    birdRafRef.current = requestAnimationFrame(animate);

    birdStopRef.current = setTimeout(() => {
      clearInterval(birdTimerRef.current);
      cancelAnimationFrame(birdRafRef.current);
      setBirdFlying(false);
      confetti({ particleCount: 120, spread: 120, origin: { y: 0.5 }, colors });
    }, 6000);
  }

  // Cleanup bird on unmount
  useEffect(() => () => {
    clearInterval(birdTimerRef.current);
    cancelAnimationFrame(birdRafRef.current);
    clearTimeout(birdStopRef.current);
  }, []);

  const sharedKey = `shared_code_${user?.referral_code}`;
  useEffect(() => { if (user?.referral_code) setHasShared(!!localStorage.getItem(sharedKey)); }, [sharedKey, user]);
  function markShared() {
    localStorage.setItem(sharedKey, '1');
    setHasShared(true);
  }

  function copyCode() {
    navigator.clipboard.writeText(user?.referral_code || '').then(() => {
      setCopied(true);
      markShared();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyTemplate(t) {
    navigator.clipboard.writeText(t.text).then(() => {
      setSharedCopy(t.id);
      markShared();
      setTimeout(() => setSharedCopy(null), 2000);
    });
  }

  function jumpToFollowUp(prospect) {
    setFilterStatus('');
    setFilterGrade('');
    openFollowUp(prospect);
    setTimeout(() => document.getElementById(`p-${prospect.prospect_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  useEffect(() => {
    if (!shareOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setShareOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shareOpen]);

  function openAddProspect() {
    setShowAddForm(true);
    setFormError('');
    setTimeout(() => document.getElementById('prospects')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
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
    setEditForm({
      status: entry.status, notes: entry.notes || '',
      grade: entry.grade || '', school: entry.school || '',
      student_email: entry.student_email || '', student_phone: entry.student_phone || '',
      parent_name: entry.parent_name || '', parent_email: entry.parent_email || '', parent_phone: entry.parent_phone || '',
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

  const todayStr    = new Date().toISOString().split('T')[0];
  const loggedToday = outreach.some((e) => e.created_at?.split('T')[0] === todayStr);

  const topCoach  = leaderboard[0];
  const isLeader  = topCoach && topCoach.referral_count > 0 && user?.referral_code === topCoach.referral_code;
  const myRank    = leaderboard.findIndex((c) => c.referral_code === user?.referral_code) + 1;

  const rank        = getRank(prospectCount);
  const nextRank    = getNextRank(prospectCount);
  const rankProgress = getRankProgress(prospectCount);
  const motivation  = (() => {
    if (isLeader && (referrals?.total ?? 0) > 0) return "You're the #1 recruiter right now. Don't let anyone catch you! 👑";
    if (myRank > 1 && leaderboard.length > 1) {
      const ahead = leaderboard[myRank - 2];
      const gap   = ahead.referral_count - (referrals?.total ?? 0);
      if (gap <= 2 && gap > 0) return `Only ${gap} enrollment${gap !== 1 ? 's' : ''} behind #${myRank - 1}. Push! 🔥`;
    }
    if (streak >= 7)        return `${streak}-day streak — you're absolutely on fire 🔥`;
    if (needFollowUpCount >= 4) return `${needFollowUpCount} prospects need a follow-up. Strike while it's hot! 📣`;
    if (!loggedToday)       return "You haven't logged anyone today. One prospect can change everything! 🎯";
    if (nextRank) {
      const n = nextRank.min - prospectCount;
      return `${n} more prospect${n !== 1 ? 's' : ''} to reach ${nextRank.emoji} ${nextRank.label}!`;
    }
    return rank.label === 'Legend'
      ? "You've hit Legend status. You're what Ascend is built on. 🏆"
      : "Every conversation could change a student's summer. Keep going!";
  })();

  const weeklyStreak = useMemo(() => calculateWeeklyStreak(outreach), [outreach]);
  const enrolled     = referrals?.total ?? 0;
  const earned       = referrals?.earned_dollars ?? 0;
  const owed         = referrals?.balance_dollars ?? 0;
  const paid         = Math.max(0, earned - owed);

  // Today: the follow-ups worth doing now, most valuable first.
  const todayQueue = useMemo(() => allProspects
    .map((p) => {
      const rule = FOLLOW_UP_RULES[p.latest.status];
      const d = daysSince(p.latest.created_at);
      return rule && d !== null && d >= rule.after ? { prospect: p, days: d, rule } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.rule.priority - b.rule.priority || b.days - a.days), [allProspects]);

  const hasFollowUp = allProspects.some((p) => p.interactions.length > 1);
  const gettingStarted = [
    { label: 'Account set up',   done: true },
    { label: 'Code ready',       done: true },
    { label: 'Share your code',  done: hasShared || enrolled > 0, action: () => setShareOpen(true) },
    { label: 'Log 3 prospects',  done: prospectCount >= 3, action: openAddProspect },
    { label: 'Log a follow-up',  done: hasFollowUp },
  ];
  const startedDone = gettingStarted.filter((g) => g.done).length;

  const nextMilestone = MILESTONES.find((m) => m > enrolled);

  // Team board ranked on effort (outreach logged), not enrollments: the top
  // three plus the coaches either side of you, never the whole list.
  const team = useMemo(() => {
    const byEffort = [...leaderboard].sort((a, b) =>
      (b.outreach_count ?? 0) - (a.outreach_count ?? 0) || (b.referral_count ?? 0) - (a.referral_count ?? 0));
    const meIdx = byEffort.findIndex((c) => c.referral_code === user?.referral_code);
    const keep = new Set([0, 1, 2, meIdx - 1, meIdx, meIdx + 1].filter((i) => i >= 0 && i < byEffort.length));
    const rows = [];
    let last = -1;
    [...keep].sort((a, b) => a - b).forEach((i) => {
      if (last >= 0 && i > last + 1) rows.push({ gap: true, key: `gap-${i}` });
      rows.push({ ...byEffort[i], place: i + 1, me: i === meIdx, key: byEffort[i].referral_code });
      last = i;
    });
    return { rows, size: byEffort.length };
  }, [leaderboard, user]);

  const templates = shareTemplates(user);
  const nextBadge = BADGES.find((b) => !earnedBadges.includes(b.id));

  return (
    <Layout>
      {/* Flying broomstick + mascot overlay */}
      {birdFlying && (
        <div
          style={{
            position: 'fixed',
            left: birdDisplay.x - 20,
            top:  birdDisplay.y - 10,
            width: 210,
            height: 120,
            zIndex: 9999,
            pointerEvents: 'none',
            transformOrigin: '140px 52px',
            transform: `scaleX(${birdDisplay.flipped ? -1 : 1}) rotate(${birdDisplay.angle}deg)`,
          }}
        >
          {/* Sparkle trail — these sit at the bristle/tail end so they trail correctly */}
          <span className="broom-sparkle-1" style={{ position: 'absolute', left: -14, top: 55, fontSize: 13, userSelect: 'none' }}>✨</span>
          <span className="broom-sparkle-2" style={{ position: 'absolute', left: -28, top: 72, fontSize: 10, userSelect: 'none' }}>⭐</span>
          <span className="broom-sparkle-3" style={{ position: 'absolute', left:  -6, top: 82, fontSize: 9,  userSelect: 'none' }}>✨</span>

          {/* Broomstick SVG */}
          <svg
            style={{ position: 'absolute', left: 0, top: 58 }}
            width="210" height="65"
            viewBox="0 0 210 65"
            overflow="visible"
          >
            {/* Bristles — fanning out from the tail end */}
            {BRISTLES.map(({ a, l }, i) => {
              const rad = a * Math.PI / 180;
              return (
                <line key={i}
                  x1="30" y1="22"
                  x2={30 + Math.cos(rad) * l}
                  y2={22 + Math.sin(rad) * l}
                  stroke={i % 2 === 0 ? '#7B4A24' : '#4E2C0A'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Shaft — subtle shadow layer first */}
            <path d="M30 23 L200 16" stroke="#2D1005" strokeWidth="11" strokeLinecap="round" opacity="0.2"/>
            {/* Shaft — base wood colour */}
            <path d="M30 22 L200 15" stroke="#9B6535" strokeWidth="8"  strokeLinecap="round"/>
            {/* Shaft — highlight */}
            <path d="M35 19 L200 12" stroke="#C89A56" strokeWidth="3"  strokeLinecap="round" opacity="0.55"/>

            {/* Leather grip bindings */}
            {[98, 110, 122].map((x, i) => (
              <rect key={i}
                x={x} y="12" width="4" height="13" rx="2"
                fill="#1F0A00" opacity="0.6"
                transform={`rotate(-3 ${x + 2} 18)`}
              />
            ))}

            {/* Gold accent ring */}
            <ellipse cx="150" cy="17" rx="2.5" ry="6" fill="#D4A017" opacity="0.8" transform="rotate(-4 150 17)"/>

            {/* Tip knot */}
            <circle cx="198" cy="14" r="5" fill="#7B4A24" opacity="0.9"/>
            <circle cx="198" cy="14" r="2.5" fill="#C89A56" opacity="0.7"/>
          </svg>

          {/* Mascot riding on the broom */}
          <img
            src="/mascot.png"
            alt=""
            style={{
              position: 'absolute',
              left: 95,
              top: 0,
              width: 95,
              height: 95,
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 18px rgba(189,31,46,0.4))',
            }}
          />
        </div>
      )}

      {/* Milestone toast */}
      {milestone && (
        <div role="status" className="fixed top-20 left-1/2 z-50 animate-toast bg-ink text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lift flex items-center gap-2 max-w-[92vw]">
          {milestone}
        </div>
      )}

      {/* Delete Prospect Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-label="Delete prospect" className="bg-white rounded-2xl shadow-lift p-6 max-w-sm w-full">
            <div className="w-11 h-11 rounded-full bg-crimson-50 text-crimson flex items-center justify-center mb-4">
              <Icon name="trash" className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-semibold text-ink mb-1">Delete this prospect?</h3>
            <p className="text-sm text-ink-muted mb-6">
              <span className="font-semibold text-ink">{confirmDelete.name}</span> and their whole interaction history will be deleted. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 px-4 py-2.5 text-sm">Cancel</button>
              <button onClick={handleDeleteProspect} disabled={deleting} className="btn-primary flex-1 px-4 py-2.5 text-sm">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Greeting band */}
      <section className="relative overflow-hidden rounded-2xl bg-ink text-white mb-5 shadow-lift">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(110% 150% at 100% 0%, rgba(189,31,46,0.62) 0%, rgba(189,31,46,0.14) 42%, rgba(189,31,46,0) 66%)' }} />
        <div className="relative px-5 sm:px-8 py-6 sm:py-7 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <img
              src="/mascot.png"
              alt="Ascend"
              onClick={launchBird}
              className={`w-14 h-14 object-contain hidden sm:block cursor-pointer shrink-0 hover:scale-110 transition-transform ${birdFlying ? 'opacity-0' : ''}`}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{greeting()}</p>
              <h1 className="font-display text-[30px] sm:text-[36px] font-semibold leading-[1.1] tracking-tight mt-1">
                Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
              </h1>
              <p className="text-white/80 text-sm sm:text-[15px] mt-2 max-w-xl leading-relaxed">
                {enrolled > 0
                  ? `You've brought ${enrolled} student${enrolled === 1 ? '' : 's'} to Ascend so far. `
                  : 'Your first enrollment earns you $100, and that family saves $50. '}
                <span className="text-white/55">{motivation}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 lg:w-[420px] shrink-0">
            <HeroStat label="Today" icon={loggedToday ? 'check' : 'target'} good={loggedToday}
              value={loggedToday ? 'Done' : '0 / 1'} sub="Log one prospect" />
            <HeroStat label="Streak" icon="flame"
              value={`${weeklyStreak} wk${weeklyStreak === 1 ? '' : 's'}`} sub={weeklyStreak ? 'Active weeks in a row' : 'Log one to start'} />
            <HeroStat label="Rank" emoji={rank.emoji}
              value={rank.label} sub={nextRank ? `${nextRank.min - prospectCount} to ${nextRank.label}` : 'Top rank'} />
          </div>
        </div>
        {countdown && (
          <div className="relative border-t border-white/10 px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-white/60 inline-flex items-center gap-2"><Icon name="calendar" className="w-4 h-4" />Ascend California 2026 · July 12–26 · University of the Pacific</span>
            <span className="num text-white font-semibold">{countdown.days} days to go</span>
          </div>
        )}
      </section>

      {/* Getting started: two steps already done (endowed progress) */}
      {!loadingData && startedDone < gettingStarted.length && (
        <section className="card p-4 sm:p-5 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Getting started</h2>
              <p className="text-xs text-ink-muted mt-0.5">{startedDone} of {gettingStarted.length} done. Finish these and you're set for the season.</p>
            </div>
            <div className="w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-crimson rounded-full transition-all duration-700" style={{ width: `${Math.round((startedDone / gettingStarted.length) * 100)}%` }} />
            </div>
          </div>
          <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {gettingStarted.map((g, i) => (
              <li key={g.label}>
                <button
                  type="button"
                  disabled={g.done || !g.action}
                  onClick={g.action}
                  className={`w-full h-full flex items-center gap-2 text-left text-[13px] px-3 py-2.5 rounded-lg border transition-colors ${
                    g.done
                      ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
                      : g.action ? 'bg-white border-gray-200 text-ink hover:border-crimson/40' : 'bg-white border-gray-200 text-ink'
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${g.done ? 'bg-emerald-500 text-white' : 'border border-gray-300 text-ink-muted text-[10px] font-bold'}`}>
                    {g.done ? <Icon name="check" className="w-3 h-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="truncate">{g.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] gap-5 lg:gap-6 items-start">

        {/* Today: the follow-ups worth doing now */}
        <section className="card overflow-hidden min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Today</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {loadingData ? '…' : todayQueue.length ? `${todayQueue.length} follow-up${todayQueue.length === 1 ? '' : 's'} due` : 'Nothing overdue'}
              </p>
            </div>
            <span className={`badge ${loggedToday ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-ink-muted ring-gray-200'}`}>
              <Icon name={loggedToday ? 'check' : 'target'} className="w-3 h-3" />
              {loggedToday ? 'Daily goal done' : 'Daily goal: log 1 prospect'}
            </span>
          </div>
          {loadingData ? (
            <div className="px-6 py-8 text-sm text-ink-muted">Loading…</div>
          ) : todayQueue.length === 0 ? (
            <div className="px-5 sm:px-6 py-5 flex flex-wrap items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="check" className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <p className="text-sm text-ink-soft flex-1 min-w-[12rem]">
                You're all caught up. Nice work.{!loggedToday && ' Log one new prospect to keep your week going.'}
              </p>
              {!loggedToday && (
                <button onClick={openAddProspect} className="btn-soft"><Icon name="plus" className="w-3.5 h-3.5" />Add prospect</button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todayQueue.slice(0, 5).map(({ prospect, days, rule }) => (
                <li key={prospect.prospect_id} className="flex items-center gap-3 px-5 sm:px-6 py-3">
                  <div className="w-8 h-8 rounded-full bg-crimson-50 text-crimson flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold">{initialsOf(prospect.latest.contact_name)}</span>
                  </div>
                  <p className="flex-1 min-w-0 text-sm text-ink-soft">
                    {rule.say(String(prospect.latest.contact_name || '').split(' ')[0], days)}
                  </p>
                  <div className="flex gap-1.5 shrink-0">
                    {(prospect.latest.student_email || prospect.latest.parent_email) && (
                      <button className="btn-soft" onClick={() => handleEmailFollowUp(prospect)} title="Email (opens Gmail)" aria-label="Email">
                        <Icon name="mail" className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button className="btn-soft" onClick={() => jumpToFollowUp(prospect)}>
                      <Icon name="reply" className="w-3.5 h-3.5" /><span className="hidden sm:inline">Log</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {todayQueue.length > 5 && (
            <p className="px-5 sm:px-6 py-2.5 text-xs text-ink-muted border-t border-gray-100">
              {todayQueue.length - 5} more in your pipeline below.
            </p>
          )}
        </section>

      {/* Prospects Panel */}
        <section id="prospects" className="card overflow-hidden min-w-0 scroll-mt-20 lg:col-start-1 lg:row-start-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Your pipeline</h2>
            <p className="text-xs text-ink-muted mt-0.5">{allProspects.length === 0 ? 'No prospects yet' : `${allProspects.length} prospect${allProspects.length === 1 ? '' : 's'} · ${enrolled} enrolled with your code`}</p>
          </div>
          <button
            onClick={() => { setShowAddForm((v) => !v); setFormError(''); }}
            className={`text-sm px-3.5 py-2 ${showAddForm ? 'btn-outline' : 'btn-primary hidden sm:inline-flex'}`}>
            <Icon name={showAddForm ? 'x' : 'plus'} className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'Add prospect'}
          </button>
        </div>

        {/* Add Prospect Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="px-5 sm:px-6 py-5 border-b border-gray-100 bg-paper/60">
            {formError && (
              <div className="mb-4 bg-crimson-50 border border-crimson-100 text-crimson-dark text-sm px-4 py-3 rounded-lg">{formError}</div>
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

            {/* Contact Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="eyebrow mb-3">Student Contact <span className="font-normal normal-case text-gray-300">(optional)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField label="Student Email">
                  <input type="email" value={form.student_email}
                    onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                    className="input" placeholder="student@email.com" />
                </FormField>
                <FormField label="Student Phone">
                  <input type="tel" value={form.student_phone}
                    onChange={(e) => setForm({ ...form, student_phone: e.target.value })}
                    className="input" placeholder="(555) 123-4567" />
                </FormField>
              </div>
            </div>

            {/* Parent Info */}
            <div className="pt-4 border-t border-gray-100">
              <p className="eyebrow mb-3">Parent / Guardian <span className="font-normal normal-case text-gray-300">(optional)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <FormField label="Parent Name">
                  <input type="text" value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    className="input" placeholder="Jane Smith" />
                </FormField>
                <FormField label="Parent Email">
                  <input type="email" value={form.parent_email}
                    onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                    className="input" placeholder="parent@email.com" />
                </FormField>
                <FormField label="Parent Phone">
                  <input type="tel" value={form.parent_phone}
                    onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                    className="input" placeholder="(555) 987-6543" />
                </FormField>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 text-sm">
              {submitting ? 'Saving…' : 'Add Prospect'}
            </button>
          </form>
        )}

        {/* Pipeline strip: a count per stage; a stage filters the list */}
        <div className="px-5 sm:px-6 py-3 border-b border-gray-100 bg-paper/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <StageChip label="All" count={allProspects.length} active={!filterStatus} onClick={() => setFilterStatus('')} />
            {FUNNEL.map((st) => (
              <StageChip key={st} label={st === 'Connected with Ascend Admin' ? 'Connected' : st} count={statusCounts[st] || 0}
                active={filterStatus === st} onClick={() => setFilterStatus(filterStatus === st ? '' : st)} tone={st === 'Enrolled' ? 'win' : undefined} />
            ))}
            {(statusCounts['Not Interested'] || 0) > 0 && (
              <StageChip label="Not interested" count={statusCounts['Not Interested']} active={filterStatus === 'Not Interested'}
                onClick={() => setFilterStatus(filterStatus === 'Not Interested' ? '' : 'Not Interested')} muted />
            )}
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} aria-label="Filter by grade"
              className="ml-auto px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-4 focus:ring-crimson/10 text-ink-soft">
              <option value="">All grades</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          {statusCounts['Interested'] > 0 && (statusCounts['Connected with Ascend Admin'] || 0) === 0 && (
            <p className="text-xs text-ink-muted mt-2">
              {statusCounts['Interested']} of your prospects {statusCounts['Interested'] === 1 ? 'is' : 'are'} interested but not yet connected with Ascend. Introducing them is the step that turns interest into an enrollment.
            </p>
          )}
        </div>

        {/* Prospect List */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ink-muted">Loading your pipeline…</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
              <Icon name={outreach.length === 0 ? 'users' : 'filter'} className="w-5 h-5" />
            </div>
            <p className="font-semibold text-ink">
              {outreach.length === 0 ? 'No prospects yet' : 'Nobody at this stage'}
            </p>
            <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
              {outreach.length === 0
                ? "Start with someone you already know: a former teammate's younger sibling, or a student from your old club. Log them here and we'll remind you when to follow up."
                : 'Pick another stage, or show all.'}
            </p>
            {outreach.length === 0 && (
              <button onClick={openAddProspect} className="btn-primary text-sm px-4 py-2 mt-4"><Icon name="plus" className="w-4 h-4" />Add your first prospect</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prospects.map((prospect) => {
              const { prospect_id, interactions, latest } = prospect;
              const days      = daysSince(latest.created_at);
              const indicator = followUpIndicator(days, latest.status);
              const needsFollowUp = indicator?.level === 'due';
              const isExpanded = expandedId === prospect_id;

              return (
                <div key={prospect_id} id={`p-${prospect_id}`} className={`group scroll-mt-24 ${needsFollowUp ? 'bg-crimson-50/30' : ''}`}>
                  <div
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 cursor-pointer hover:bg-paper/70 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : prospect_id)}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${latest.status === 'Enrolled' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy'}`}>
                      <span className="text-xs font-bold">{initialsOf(latest.contact_name)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-ink">{latest.contact_name}</span>
                        <StatusBadge status={latest.status} short />
                        {indicator && (
                          <span className={`badge ${indicator.color}`}>{indicator.label}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted truncate">
                        {[latest.grade && (latest.grade === 'Other' ? null : `${latest.grade} grade`), latest.school, `${interactions.length} ${interactions.length === 1 ? 'interaction' : 'interactions'}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {!INACTIVE_STATUSES.includes(latest.status) && (latest.student_email || latest.parent_email) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEmailFollowUp(prospect); }}
                          className="btn-soft"
                          title="Email a follow-up (opens Gmail)">
                          <Icon name="mail" className="w-3.5 h-3.5" /><span className="hidden md:inline">Email</span>
                        </button>
                      )}
                      {!INACTIVE_STATUSES.includes(latest.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openFollowUp(prospect); }}
                          className="btn-soft" title="Log a follow-up">
                          <Icon name="reply" className="w-3.5 h-3.5" /><span className="hidden md:inline">Log follow-up</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ prospect_id, name: latest.contact_name }); }}
                        className="p-1.5 text-gray-300 hover:text-crimson hover:bg-crimson-50 transition rounded-lg md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                        title="Delete prospect" aria-label="Delete prospect">
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                      <Icon name="chevron" className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <Icon name="chevron" className={`sm:hidden w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded Timeline */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-5 bg-paper/70 border-t border-gray-100">

                      {/* Phone: the row's actions live here */}
                      <div className="sm:hidden flex gap-2 pt-4">
                        {!INACTIVE_STATUSES.includes(latest.status) && (latest.student_email || latest.parent_email) && (
                          <button onClick={() => handleEmailFollowUp(prospect)} className="btn-outline flex-1 text-sm py-2"><Icon name="mail" className="w-4 h-4" />Email</button>
                        )}
                        {!INACTIVE_STATUSES.includes(latest.status) && (
                          <button onClick={() => openFollowUp(prospect)} className="btn-outline flex-1 text-sm py-2"><Icon name="reply" className="w-4 h-4" />Log follow-up</button>
                        )}
                        <button onClick={() => setConfirmDelete({ prospect_id, name: latest.contact_name })} className="btn-outline px-3 py-2 text-ink-muted" aria-label="Delete prospect"><Icon name="trash" className="w-4 h-4" /></button>
                      </div>

                      {/* Contact details card */}
                      {(latest.student_email || latest.student_phone || latest.parent_name || latest.parent_email || latest.parent_phone) && (
                        <div className="mt-4 mb-4 bg-white rounded-xl border border-black/[0.07] p-4 shadow-card">
                          <p className="eyebrow mb-3">Contact Details</p>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            {latest.student_email && (
                              <a href={`mailto:${latest.student_email}`} className="flex items-center gap-1.5 text-ink-soft hover:text-crimson transition">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                {latest.student_email}
                              </a>
                            )}
                            {latest.student_phone && (
                              <a href={`tel:${latest.student_phone}`} className="flex items-center gap-1.5 text-ink-soft hover:text-crimson transition">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                {latest.student_phone}
                              </a>
                            )}
                          </div>
                          {(latest.parent_name || latest.parent_email || latest.parent_phone) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="eyebrow mb-2">Parent / Guardian</p>
                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                {latest.parent_name && (
                                  <span className="font-medium text-gray-700">{latest.parent_name}</span>
                                )}
                                {latest.parent_email && (
                                  <a href={`mailto:${latest.parent_email}`} className="flex items-center gap-1.5 text-ink-soft hover:text-crimson transition">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    {latest.parent_email}
                                  </a>
                                )}
                                {latest.parent_phone && (
                                  <a href={`tel:${latest.parent_phone}`} className="flex items-center gap-1.5 text-ink-soft hover:text-crimson transition">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    {latest.parent_phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="eyebrow pt-2 mb-4">
                        Interaction History
                      </p>
                      <div className="space-y-2 mb-4">
                        {interactions.map((entry, idx) => (
                          <div key={entry.id}>
                            {editingId === entry.id ? (
                              <div className="bg-white rounded-xl border border-black/[0.07] p-4 shadow-card">
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
                                <div className="border-t border-gray-100 pt-3 mt-1 mb-3">
                                  <p className="eyebrow mb-2">Student Contact</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormField label="Student Email">
                                      <input type="email" value={editForm.student_email}
                                        onChange={(e) => setEditForm({ ...editForm, student_email: e.target.value })}
                                        className="input text-sm py-2" placeholder="student@email.com" />
                                    </FormField>
                                    <FormField label="Student Phone">
                                      <input type="tel" value={editForm.student_phone}
                                        onChange={(e) => setEditForm({ ...editForm, student_phone: e.target.value })}
                                        className="input text-sm py-2" placeholder="(555) 123-4567" />
                                    </FormField>
                                  </div>
                                </div>
                                <div className="border-t border-gray-100 pt-3 mb-3">
                                  <p className="eyebrow mb-2">Parent / Guardian</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FormField label="Parent Name">
                                      <input type="text" value={editForm.parent_name}
                                        onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                                        className="input text-sm py-2" placeholder="Jane Smith" />
                                    </FormField>
                                    <FormField label="Parent Email">
                                      <input type="email" value={editForm.parent_email}
                                        onChange={(e) => setEditForm({ ...editForm, parent_email: e.target.value })}
                                        className="input text-sm py-2" placeholder="parent@email.com" />
                                    </FormField>
                                    <FormField label="Parent Phone">
                                      <input type="tel" value={editForm.parent_phone}
                                        onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })}
                                        className="input text-sm py-2" placeholder="(555) 987-6543" />
                                    </FormField>
                                  </div>
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
                                <div className="flex-1 bg-white rounded-xl border border-black/[0.07] p-3 shadow-card">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <StatusBadge status={entry.status} />
                                      <span className="text-xs text-gray-400 font-medium">{entry.contact_method}</span>
                                      <span className="text-xs text-gray-300">·</span>
                                      <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                                    </div>
                                    <button onClick={() => startEdit(entry)}
                                      className="text-xs text-ink-muted hover:text-crimson transition font-medium inline-flex items-center gap-1">
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
                        <form onSubmit={handleFollowUpSubmit} className="bg-white rounded-xl border border-black/[0.07] p-4 shadow-card">
                          <p className="eyebrow mb-3">New Interaction</p>
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
      </section>

        {/* Side rail */}
        <aside className="space-y-5 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">

          {/* Code + share kit */}
          <section className="relative overflow-hidden rounded-2xl bg-ink text-white p-5 shadow-lift">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(100% 120% at 100% 0%, rgba(189,31,46,0.55) 0%, rgba(189,31,46,0) 60%)' }} />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">Your referral code</p>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span className="font-mono text-[26px] font-bold tracking-[0.14em]">{user?.referral_code || '—'}</span>
                <button onClick={copyCode}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />{copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-white/60 text-xs mt-1">Families save $50 at checkout, and you get the credit.</p>
              <button onClick={() => setShareOpen(true)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-crimson hover:bg-crimson-light text-white text-sm font-semibold rounded-lg py-2.5 transition-colors">
                <Icon name="send" className="w-4 h-4" />Share kit
              </button>
            </div>
          </section>

          {/* Commission: the coach's own money only, never camp revenue */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Your commission</p>
              <Icon name="dollar" className="w-4 h-4 text-ink-muted" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Money label="Owed" value={owed} strong={owed > 0} loading={loadingData} />
              <Money label="Paid" value={paid} loading={loadingData} />
              <Money label="Earned" value={earned} loading={loadingData} />
            </div>
            <p className="text-xs text-ink-muted mt-3 leading-relaxed">
              {owed > 0
                ? "Owed means a family enrolled with your code and your payment hasn't gone out yet. Ascend pays by Zelle."
                : earned > 0
                  ? 'All paid up. Thank you for bringing families to Ascend.'
                  : 'Your first enrollment earns you $100, and their family saves $50.'}
            </p>
            {referrals?.referrals?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="eyebrow mb-2">Students you've brought</p>
                <ul className="space-y-2">
                  {referrals.referrals.map((r) => (
                    <li key={r.id} className="flex items-center gap-2.5 text-sm">
                      <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                      </span>
                      <span className="font-medium text-ink truncate flex-1">{shortStudent(r.student_name)}</span>
                      <span className="text-xs text-ink-muted shrink-0">{r.product}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Enrollment milestones (goal gradient) */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Enrollment milestones</p>
              <span className="text-xs font-semibold text-ink">{enrolled} enrolled</span>
            </div>
            <div className="relative mt-4">
              <div className="absolute left-3 right-3 top-3 h-[3px] bg-gray-100 rounded-full" />
              <div className="absolute left-3 top-3 h-[3px] bg-crimson rounded-full transition-all duration-700"
                style={{ width: `calc((100% - 1.5rem) * ${milestoneProgress(enrolled)})` }} />
              <ol className="relative flex justify-between">
                {MILESTONES.map((m) => (
                  <li key={m}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ring-4 ring-white ${
                      enrolled >= m ? 'bg-crimson text-white'
                        : m === nextMilestone ? 'bg-white text-crimson border-2 border-crimson'
                          : 'bg-gray-100 text-ink-muted'}`}>
                      {m}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-sm text-ink-soft mt-4">
              {!nextMilestone
                ? "You've passed every milestone. Legendary."
                : enrolled === 0
                  ? 'Your first enrollment is the big one.'
                  : <><strong className="text-ink">{nextMilestone - enrolled}</strong> more to reach {nextMilestone} enrollments.</>}
            </p>
          </section>

          {/* Team board: effort, top three and your neighbours */}
          {team.size > 1 && (
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Team board</p>
                <span className="text-[11px] text-ink-muted">by outreach logged</span>
              </div>
              <ol className="mt-3 space-y-1">
                {team.rows.map((r) => r.gap ? (
                  <li key={r.key} className="text-center text-gray-300 text-xs leading-3 select-none" aria-hidden="true">···</li>
                ) : (
                  <li key={r.key} className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${r.me ? 'bg-crimson-50 ring-1 ring-inset ring-crimson-100' : ''}`}>
                    <span className={`w-5 text-center num text-sm font-semibold ${r.place <= 3 ? 'text-ink' : 'text-ink-muted'}`}>{r.place}</span>
                    <span className={`flex-1 min-w-0 text-sm truncate ${r.me ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                      {r.me ? 'You' : shortName(r.first_name, r.last_name)}
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">{r.outreach_count ?? 0} logged</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Badges */}
          {!loadingData && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow">Badges</p>
                <span className="text-xs text-ink-muted">{earnedBadges.length} of {BADGES.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                {BADGES.map((badge) => {
                  const isEarned = earnedBadges.includes(badge.id);
                  return (
                    <div key={badge.id} className="group relative flex flex-col items-center text-center">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ring-1 ring-inset ${isEarned ? badge.color : 'bg-gray-50 ring-gray-200'}`}>
                        <span style={{ filter: isEarned ? '' : 'grayscale(1)', opacity: isEarned ? 1 : 0.3 }}>{badge.emoji}</span>
                      </div>
                      <p className={`text-[10px] leading-tight mt-1.5 font-medium ${isEarned ? 'text-ink' : 'text-gray-400'}`}>{badge.label}</p>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:flex flex-col items-center">
                        <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lift text-center">
                          {isEarned ? <span className="text-emerald-300 font-semibold">Earned</span> : <span>{badge.desc}</span>}
                        </div>
                        <div className="w-2 h-2 bg-ink rotate-45 -mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {nextBadge && (
                <p className="text-xs text-ink-muted mt-4 pt-3 border-t border-gray-100">
                  Next up: <span className="font-semibold text-ink">{nextBadge.label}</span>. {nextBadge.desc}.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Share kit */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false); }}>
          <div role="dialog" aria-label="Share kit" className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-lift max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Share kit</h2>
                <p className="text-xs text-ink-muted mt-0.5">Copy, make it yours, send. Messages to parents tend to work best.</p>
              </div>
              <button onClick={() => setShareOpen(false)} className="p-1.5 rounded-lg text-ink-muted hover:bg-gray-100" aria-label="Close">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5 space-y-4">
              {templates.map((t) => (
                <div key={t.id} className="rounded-xl border border-black/[0.08] overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-paper/70 border-b border-black/[0.06]">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Icon name={t.icon} className="w-4 h-4 text-ink-muted" />{t.label}</span>
                    <div className="flex gap-1.5">
                      {t.id === 'email' && (
                        <a className="btn-soft" target="_blank" rel="noreferrer"
                          href={`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.text)}`}
                          onClick={markShared}>
                          <Icon name="mail" className="w-3.5 h-3.5" />Gmail
                        </a>
                      )}
                      <button className="btn-soft" onClick={() => copyTemplate(t)}>
                        <Icon name={sharedCopy === t.id ? 'check' : 'copy'} className="w-3.5 h-3.5" />{sharedCopy === t.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="px-4 py-3 text-sm text-ink-soft whitespace-pre-line leading-relaxed">{t.text}</p>
                </div>
              ))}
              <p className="text-xs text-ink-muted">More scripts and talking points live in the <a href="/resources" className="text-crimson font-medium hover:underline">Playbook</a>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Phone: add a prospect from anywhere */}
      <button onClick={openAddProspect} aria-label="Add prospect"
        className="sm:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-crimson text-white shadow-lift flex items-center justify-center active:scale-95 transition-transform">
        <Icon name="plus" className="w-6 h-6" strokeWidth={2.5} />
      </button>
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

function StageChip({ label, count, active, onClick, tone, muted }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-ink text-white' : `bg-white border border-gray-200 hover:border-gray-300 ${muted ? 'text-gray-400' : 'text-ink-soft'}`
      }`}>
      {label}
      <span className={`min-w-[18px] px-1 rounded text-[11px] font-bold tabular-nums text-center ${
        active ? 'bg-white/20 text-white' : tone === 'win' && count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-ink-muted'
      }`}>{count}</span>
    </button>
  );
}

function HeroStat({ label, value, sub, icon, emoji, good }) {
  return (
    <div className={`rounded-xl px-3 py-3 border ${good ? 'bg-emerald-400/10 border-emerald-300/25' : 'bg-white/[0.06] border-white/10'}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
        {emoji ? <span className="text-xs">{emoji}</span> : <Icon name={icon} className={`w-3 h-3 ${good ? 'text-emerald-300' : ''}`} />}
        {label}
      </p>
      <p className="num text-white text-lg sm:text-xl font-semibold mt-1 leading-tight truncate">{value}</p>
      <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{sub}</p>
    </div>
  );
}

function Money({ label, value, strong, loading }) {
  return (
    <div className={`rounded-lg px-2.5 py-2.5 ${strong ? 'bg-crimson-50 ring-1 ring-inset ring-crimson-100' : 'bg-paper/80'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${strong ? 'text-crimson' : 'text-ink-muted'}`}>{label}</p>
      <p className={`num text-xl font-semibold mt-0.5 ${strong ? 'text-crimson' : 'text-ink'}`}>{loading ? '—' : fmtUsd(value)}</p>
    </div>
  );
}
