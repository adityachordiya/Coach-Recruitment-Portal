const { getPool } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');
const { fetchReferralData, getReferrerStats } = require('../_lib/referralData');

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
    // Get all coaches with their referral codes
    const { rows: coaches } = await pool.query(`
      SELECT r.first_name, r.last_name, r.referral_code
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      WHERE ca.role = 'coach'
    `);

    if (coaches.length === 0) return res.status(200).json(null);

    // Pull live referral data
    const data = await fetchReferralData();

    // Find the coach with the most conversions
    let leader = null;
    let maxCount = 0;

    for (const coach of coaches) {
      const stats = getReferrerStats(data, coach.referral_code);
      const count = stats?.stats.redemption_count ?? 0;
      if (count > maxCount) {
        maxCount = count;
        leader = {
          first_name: coach.first_name,
          last_name: coach.last_name,
          referral_code: coach.referral_code,
          referral_count: count,
        };
      }
    }

    // Only show a leader if at least one coach has a conversion
    if (!leader || leader.referral_count === 0) return res.status(200).json(null);

    return res.status(200).json(leader);
  } catch (err) {
    console.error('GET /coach/leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
