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
    // Get all coaches with outreach counts
    const { rows: coaches } = await pool.query(`
      SELECT r.first_name, r.last_name, r.referral_code,
             COUNT(DISTINCT col.id) AS outreach_count
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN coach_outreach_log col ON col.coach_id = r.id
      GROUP BY ca.id, r.id
    `);

    if (coaches.length === 0) return res.status(200).json([]);

    // Pull live referral data
    let refData = null;
    try {
      refData = await fetchReferralData();
    } catch (err) {
      console.error('Could not fetch referral data for leaderboard:', err.message);
    }

    // Build ranked list — primary sort: referral_count DESC, secondary: outreach_count DESC
    const ranked = coaches
      .map((coach) => {
        const stats = refData ? getReferrerStats(refData, coach.referral_code) : null;
        return {
          first_name:     coach.first_name,
          last_name:      coach.last_name,
          referral_code:  coach.referral_code,
          referral_count: stats?.stats.redemption_count ?? 0,
          outreach_count: parseInt(coach.outreach_count, 10),
        };
      })
      .sort((a, b) =>
        b.referral_count - a.referral_count ||
        b.outreach_count - a.outreach_count
      );

    return res.status(200).json(ranked);
  } catch (err) {
    console.error('GET /coach/leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
