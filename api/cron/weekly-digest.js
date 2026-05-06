const { getPool } = require('../_lib/db');
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // Vercel cron jobs are protected by default — only Vercel's infrastructure can call this.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = getPool();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const ownerEmails = (process.env.OWNER_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);

  if (ownerEmails.length === 0) {
    console.error('OWNER_EMAILS not configured');
    return res.status(500).json({ error: 'OWNER_EMAILS not configured' });
  }

  try {
    const { rows: coaches } = await pool.query(`
      SELECT
        r.first_name,
        r.last_name,
        r.email,
        r.referral_code,
        COUNT(DISTINCT col_week.id)  AS outreach_this_week,
        COUNT(DISTINCT hr_week.id)   AS referrals_this_week,
        COUNT(DISTINCT col_all.id)   AS outreach_total,
        MAX(col_all.created_at)      AS last_active
      FROM coach_accounts ca
      JOIN referrers r ON ca.referrer_id = r.id
      LEFT JOIN coach_outreach_log col_all  ON col_all.coach_id = r.id
      LEFT JOIN coach_outreach_log col_week ON col_week.coach_id = r.id
            AND col_week.created_at > NOW() - INTERVAL '7 days'
      LEFT JOIN hub_referrals hr_week ON hr_week.referrer_id = r.id
            AND hr_week.created_at > NOW() - INTERVAL '7 days'
      WHERE ca.role = 'coach'
      GROUP BY r.id
      ORDER BY r.last_name, r.first_name
    `);

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

    const totalOutreachWeek = coaches.reduce((s, c) => s + parseInt(c.outreach_this_week, 10), 0);
    const totalReferralsWeek = coaches.reduce((s, c) => s + parseInt(c.referrals_this_week, 10), 0);

    const coachRows = coaches
      .map((c) => {
        const outW = parseInt(c.outreach_this_week, 10);
        const refW = parseInt(c.referrals_this_week, 10);
        const rowBg = outW > 0 || refW > 0 ? '#fff' : '#fafafa';
        return `
          <tr style="background:${rowBg}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 16px; font-weight: 500;">${c.first_name} ${c.last_name}</td>
            <td style="padding: 12px 16px; font-family: monospace; color: #A51C30;">${c.referral_code}</td>
            <td style="padding: 12px 16px; text-align: center;">
              <span style="font-size: 16px; font-weight: 700; color: ${outW > 0 ? '#A51C30' : '#6b7280'};">${outW}</span>
            </td>
            <td style="padding: 12px 16px; text-align: center;">
              <span style="font-size: 16px; font-weight: 700; color: ${refW > 0 ? '#D4A017' : '#6b7280'};">${refW}</span>
            </td>
            <td style="padding: 12px 16px; color: #6b7280; font-size: 13px;">${formatDate(c.last_active)}</td>
          </tr>`;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="margin:0; padding:0; background:#f9fafb; font-family: Inter, system-ui, sans-serif;">
        <div style="max-width: 680px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background: #A51C30; padding: 24px 32px;">
            <div style="font-size: 22px; font-weight: 700; color: #fff;">Ascend Coach Portal</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 4px;">
              Weekly Digest — ${formatDate(weekStart)} to ${formatDate(now)}
            </div>
          </div>

          <!-- Summary cards -->
          <div style="display: flex; gap: 0; border-bottom: 1px solid #e5e7eb;">
            <div style="flex: 1; padding: 20px 32px; border-right: 1px solid #e5e7eb;">
              <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Outreach This Week</div>
              <div style="font-size: 32px; font-weight: 700; color: #A51C30; margin-top: 4px;">${totalOutreachWeek}</div>
            </div>
            <div style="flex: 1; padding: 20px 32px;">
              <div style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Referrals This Week</div>
              <div style="font-size: 32px; font-weight: 700; color: #D4A017; margin-top: 4px;">${totalReferralsWeek}</div>
            </div>
          </div>

          <!-- Coach table -->
          <div style="padding: 24px 32px 32px;">
            <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #111;">Coach Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px 16px; text-align: left; font-weight: 600; color: #374151;">Coach</th>
                  <th style="padding: 10px 16px; text-align: left; font-weight: 600; color: #374151;">Code</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Outreach</th>
                  <th style="padding: 10px 16px; text-align: center; font-weight: 600; color: #374151;">Referrals</th>
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
      subject: `Coach Weekly Digest — ${formatDate(weekStart)} to ${formatDate(now)}`,
      html,
    });

    console.log(`Weekly digest sent to: ${ownerEmails.join(', ')}`);
    return res.status(200).json({ message: 'Digest sent', coaches: coaches.length });
  } catch (err) {
    console.error('Weekly digest error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
