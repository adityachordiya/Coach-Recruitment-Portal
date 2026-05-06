const { getPool } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT
         hr.id,
         hr.created_at,
         r.first_name AS referred_first_name,
         r.last_name  AS referred_last_name,
         r.email      AS referred_email
       FROM hub_referrals hr
       LEFT JOIN referrers r ON hr.referred_id = r.id
       WHERE hr.referrer_id = $1
       ORDER BY hr.created_at DESC`,
      [payload.referrerId]
    );

    return res.status(200).json({ total: rows.length, referrals: rows });
  } catch (err) {
    console.error('GET /coach/referrals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
