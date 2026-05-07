const { getPool } = require('../_lib/db');
const { Resend } = require('resend');
const { fetchReferralData, getReferrerStats } = require('../_lib/referralData');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = getPool();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const ownerEmails = (process.env.OWNER_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);

  if (ownerEmails.length === 0) {
    return res.status(500).json({ error: 'OWNER_EMAILS not configured' });
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all coaches + their outreach activity this week
    const { rows: coaches } = await pool.query(`
      SELECT
        r.first_name,
        r.last_name,
        r.email,
        r.referral_code,
        COUNT(DISTINCT col_all.id)  AS outreach_total,
        COUNT(DISTINCT col_week.id) AS outreach_this_week,
        MAX(col_all.created_at)     AS last_active
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN coach_outreach_log col_all  ON col_all.coach_id  = r.id
      LEFT JOIN coach_outreach_log col_week ON col_week.coach_id = r.id
            AND col_week.created_at > NOW() - INTERVAL '7 days'
      WHERE ca.role = 'coach'
      GROUP BY r.id
      ORDER BY r.last_name, r.first_name
    `);

    // Pull live referral data from Ascend OS
    let refData = null;
    try {
      refData = await fetchReferralData();
    } catch (err) {
      console.error('Could not fetch referral data for digest:', err.message);
    }

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
    const formatDollars = (cents) => `$${(cents / 100).toFixed(0)}`;

    const totalOutreachWeek  = coaches.reduce((s, c) => s + parseInt(c.outreach_this_week, 10), 0);
    const totalReferralsWeek = refData
      ? coaches.reduce((s, c) => {
          const stats = getReferrerStats(refData, c.referral_code);
          // We don't have per-week referral data from the API, so show total
          return s + (stats?.stats.redemption_count ?? 0);
        }, 0)
      : 0;

    const coachRows = coaches.map((c) => {
      const outW = parseInt(c.outreach_this_week, 10);
      const stats = refData ? getReferrerStats(refData, c.referral_code) : null;
      const refTotal = stats?.stats.redemption_count ?? 0;
      const earned   = stats ? formatDollars(stats.stats.earned_cents) : '—';
      const balance  = stats ? formatDollars(stats.stats.balance_cents) : '—';
      const rowBg    = outW > 0 ? '#fff' : '#fafafa';

      return `
        <tr style="background:${rowBg}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; font-weight: 500;">${c.first_name} ${c.last_name}</td>
          <td style="padding: 12px 16px; font-family: monospace; color: #A51C30;">${c.referral_code}</td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="font-size: 16px; font-weight: 700; color: ${outW > 0 ? '#A51C30' : '#6b7280'};">${outW}</span>
          </td>
          <td style="padding: 12px 16px; text-align: center;">
            <span style="font-size: 16px; font-weight: 700; color: ${refTotal > 0 ? '#D4A017' : '#6b7280'};">${refTotal}</span>
          </td>
          <td style="padding: 12px 16px; text-align: center; color: #374151;">${earned}</td>
          <td style="padding: 12px 16px; text-align: center; color: ${balance !== '—' && balance !== '$0' ? '#A51C30' : '#6b7280'};">${balance}</td>
          <td style="padding: 12px 16px; color: #6b7280; font-size: 13px;">${formatDate(c.last_active)}</td>
        </tr>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8" /></head>
      <body style="margin:0; padding:0; background:#f9fafb; font-family: Inter, system-ui, sans-serif;">
        <div style="max-width: 720px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
          <div style="background: #A51C30; padding: 24px 32px;">
            <div style="font-size: 22px; font-weight: 700; color: #fff;">Ascend Coach Portal</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 4px;">
              Weekly Digest — ${formatDate(weekAgo)} to ${formatDate(now)}
            </div>
          </div>

          <div style="display: flex; border-bottom: 1px solid #e5e7eb;">
            <div style="flex: 1; padding: 20px 32px; border-right: 1px solid #e5e7eb;">
              <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Outreach This Week</div>
              <div style="font-size: 32px; font-weight: 700; color: #A51C30; margin-top: 4px;">${totalOutreachWeek}</div>
            </div>
            <div style="flex: 1; padding: 20px 32px;">
              <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Total Conversions</div>
              <div style="font-size: 32px; font-weight: 700; color: #D4A017; margin-top: 4px;">${totalReferralsWeek}</div>
            </div>
          </div>

          <div style="padding: 24px 32px 32px;">
            <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #111;">Coach Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px 16px; text-align: left; font-weight: 600; color: #374151;">Coach</th>
                  <th style="padding: 10px 16px; text-align: left; font-weight: 600; color: #374151;">Code</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Outreach</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Referrals</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Earned</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Owed</th>
                  <th style="padding: 10px 16px; text-align: left; font-weight: 600; color: #374151;">Last Active</th>
                </tr>
              </thead>
              <tbody>${coachRows}</tbody>
            </table>
            ${coaches.length === 0 ? '<p style="color:#6b7280; text-align:center; padding: 24px 0;">No coaches yet.</p>' : ''}
          </div>

          <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              Sent every Monday at 8am PT · Ascend Speech &amp; Debate Coach Portal
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'Ascend Coach Portal <noreply@ascendspeech.org>',
      to: ownerEmails,
      subject: `Coach Weekly Digest — ${formatDate(weekAgo)} to ${formatDate(now)}`,
      html,
    });

    return res.status(200).json({ message: 'Digest sent', coaches: coaches.length });
  } catch (err) {
    console.error('Weekly digest error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
