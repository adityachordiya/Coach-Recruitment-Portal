const REFERRAL_API_URL = 'https://jbiqzdavkwioxhtwchiy.supabase.co/functions/v1/referral-data';

/**
 * Fetches live referral data from the Ascend OS referral API.
 * Returns the full response: { referrers, redemptions, payouts, orphan_redemptions, totals }
 */
async function fetchReferralData() {
  const apiKey = process.env.ASCEND_REFERRAL_API_KEY;
  if (!apiKey) throw new Error('ASCEND_REFERRAL_API_KEY env var is not set');

  const res = await fetch(REFERRAL_API_URL, {
    headers: { 'x-api-key': apiKey },
  });

  if (!res.ok) {
    throw new Error(`Referral data API returned ${res.status}`);
  }

  return res.json();
}

/**
 * Given referral API data and a referral_code, returns the stats for that referrer.
 * Returns null if not found.
 */
function getReferrerStats(data, referralCode) {
  if (!referralCode) return null;
  const code = referralCode.toUpperCase();
  return data.referrers.find((r) => r.referral_code.toUpperCase() === code) || null;
}

/**
 * Given referral API data and a referral_code, returns the redemptions for that code.
 */
function getRedemptions(data, referralCode) {
  if (!referralCode) return [];
  const code = referralCode.toUpperCase();
  return data.redemptions.filter((r) => r.referral_code.toUpperCase() === code);
}

module.exports = { fetchReferralData, getReferrerStats, getRedemptions };
