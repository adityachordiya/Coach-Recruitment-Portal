const { getPool } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query(`
      SELECT
        r.first_name,
        r.last_name,
        r.referral_code,
        COUNT(hr.id) AS referral_count
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN hub_referrals hr ON hr.referrer_id = r.id
      WHERE ca.role = 'coach'
      GROUP BY r.id
      ORDER BY referral_count DESC
      LIMIT 1
    `);

    if (rows.length === 0) return res.status(200).json(null);

    return res.status(200).json({
      first_name: rows[0].first_name,
      last_name: rows[0].last_name,
      referral_code: rows[0].referral_code,
      referral_count: parseInt(rows[0].referral_count, 10),
    });
  } catch (err) {
    console.error('GET /coach/leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
