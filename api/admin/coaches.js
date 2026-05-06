const { getPool } = require('../_lib/db');
const { requireOwner } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

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
    // Get all coaches with aggregate stats
    const { rows: coaches } = await pool.query(`
      SELECT
        ca.id          AS account_id,
        ca.role,
        r.id           AS referrer_id,
        r.first_name,
        r.last_name,
        r.email,
        r.referral_code,
        COUNT(DISTINCT hr.id)  AS referral_count,
        COUNT(DISTINCT col.id) AS outreach_count,
        MAX(col.created_at)    AS last_active
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN hub_referrals hr ON hr.referrer_id = r.id
      LEFT JOIN coach_outreach_log col ON col.coach_id = r.id
      GROUP BY ca.id, r.id
      ORDER BY r.last_name, r.first_name
    `);

    // For each coach, fetch their full outreach log
    const coachIds = coaches.map((c) => c.referrer_id);
    let outreachByCoach = {};

    if (coachIds.length > 0) {
      const { rows: outreach } = await pool.query(
        `SELECT id, coach_id, contact_name, contact_method, status, notes, created_at
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

    const result = coaches.map((c) => ({
      ...c,
      referral_count: parseInt(c.referral_count, 10),
      outreach_count: parseInt(c.outreach_count, 10),
      outreach_log: outreachByCoach[c.referrer_id] || [],
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('GET /admin/coaches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
