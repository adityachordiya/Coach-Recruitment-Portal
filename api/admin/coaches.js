const { getPool } = require('../_lib/db');
const { requireOwner } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');
const { fetchReferralData, getReferrerStats } = require('../_lib/referralData');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireOwner(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const pool = getPool();
  try {
    // Get all coaches with outreach stats
    const { rows: coaches } = await pool.query(`
      SELECT
        ca.id            AS account_id,
        ca.role,
        ca.last_login_at,
        r.id             AS referrer_id,
        r.first_name,
        r.last_name,
        r.email,
        r.referral_code,
        COUNT(DISTINCT col.id) AS outreach_count,
        MAX(col.created_at)    AS last_active
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN coach_outreach_log col ON col.coach_id = r.id
      GROUP BY ca.id, r.id
      ORDER BY r.last_name, r.first_name
    `);

    // Get all outreach logs
    const coachIds = coaches.map((c) => c.referrer_id);
    let outreachByCoach = {};
    if (coachIds.length > 0) {
      const { rows: outreach } = await pool.query(
        `SELECT id, coach_id, prospect_id, contact_name, contact_method, status, notes,
                grade, school, follow_up_date, created_at
         FROM coach_outreach_log
         WHERE coach_id = ANY($1::uuid[])
         ORDER BY created_at DESC`,
        [coachIds]
      );
      for (const entry of outreach) {
        if (!outreachByCoach[entry.coach_id]) outreachByCoach[entry.coach_id] = [];
        outreachByCoach[entry.coach_id].push(entry);
      }
    }

    // Pull live referral counts from Ascend OS
    let refData = null;
    try {
      refData = await fetchReferralData();
    } catch (err) {
      console.error('Could not fetch referral data:', err.message);
      // Continue without referral data — don't fail the whole request
    }

    const result = coaches.map((c) => {
      const stats = refData ? getReferrerStats(refData, c.referral_code) : null;
      return {
        ...c,
        outreach_count: parseInt(c.outreach_count, 10),
        referral_count: stats?.stats.redemption_count ?? 0,
        earned_dollars: stats ? stats.stats.earned_cents / 100 : 0,
        balance_dollars: stats ? stats.stats.balance_cents / 100 : 0,
        outreach_log: outreachByCoach[c.referrer_id] || [],
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('GET /admin/coaches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
