const { getPool } = require('../_lib/db');
const { requireAuth } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');
const { fetchReferralData, getReferrerStats, getRedemptions } = require('../_lib/referralData');

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
    // Get the coach's referral code from our DB
    const { rows } = await pool.query(
      `SELECT referral_code FROM referrers WHERE id = $1`,
      [payload.referrerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Referrer not found' });

    const referralCode = rows[0].referral_code;

    // Pull live data from the Ascend OS referral API
    const data = await fetchReferralData();
    const referrerStats = getReferrerStats(data, referralCode);
    const redemptions = getRedemptions(data, referralCode);

    return res.status(200).json({
      total: referrerStats?.stats.redemption_count ?? 0,
      earned_dollars: referrerStats ? referrerStats.stats.earned_cents / 100 : 0,
      balance_dollars: referrerStats ? referrerStats.stats.balance_cents / 100 : 0,
      referrals: redemptions.map((r) => ({
        id: r.id,
        student_name: `${r.student_first} ${r.student_last}`,
        product: r.product,
        payment_date: r.payment_date,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('GET /coach/referrals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
