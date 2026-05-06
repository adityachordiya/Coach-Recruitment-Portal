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
         ca.id AS account_id,
         ca.role,
         r.id AS referrer_id,
         r.first_name,
         r.last_name,
         r.email,
         r.referral_code
       FROM coach_accounts ca
       JOIN referrers r ON ca.referrer_id = r.id
       WHERE ca.id = $1`,
      [payload.accountId]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Account not found' });

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('GET /coach/me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
