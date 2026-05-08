const crypto = require('crypto');
const { getPool } = require('../_lib/db');
const { requireOwner } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireOwner(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { email, role = 'coach' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!['coach', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Role must be coach or owner' });
  }

  const pool = getPool();
  try {
    const referrerResult = await pool.query(
      `SELECT id, first_name, last_name FROM referrers WHERE email = $1 AND active = true`,
      [email.toLowerCase().trim()]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No active referrer found with that email. Add them to the referrers table first.',
      });
    }

    const referrer = referrerResult.rows[0];

    const existingResult = await pool.query(
      `SELECT id, password_hash FROM coach_accounts WHERE referrer_id = $1`,
      [referrer.id]
    );

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.password_hash) {
        return res.status(409).json({ error: 'This coach already has an active account.' });
      }
      await pool.query(
        `UPDATE coach_accounts
         SET invite_token = $1, invite_token_expires_at = $2, role = $3
         WHERE id = $4`,
        [inviteToken, expiresAt, role, existing.id]
      );
    } else {
      await pool.query(
        `INSERT INTO coach_accounts (referrer_id, email, role, invite_token, invite_token_expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [referrer.id, email.toLowerCase().trim(), role, inviteToken, expiresAt]
      );
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const setupLink = `${protocol}://${host}/setup-password?token=${inviteToken}`;

    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Ascend Speech & Debate', email: 'noreply@ascendspeech.org' },
        to: [{ email, name: `${referrer.first_name} ${referrer.last_name}` }],
        subject: "You're invited to the Ascend Coach Portal",
        htmlContent: `
          <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
            <div style="margin-bottom: 32px;">
              <span style="font-size: 20px; font-weight: 700; color: #A51C30;">Ascend</span>
              <span style="font-size: 20px; font-weight: 400; color: #111;"> Coach Portal</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 12px;">Hey ${referrer.first_name}!</h2>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #444;">
              You've been invited to join the Ascend Coach Portal, where you can track your referrals and outreach activity.
            </p>
            <a href="${setupLink}" style="display: inline-block; background: #A51C30; color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
              Set Up Your Account
            </a>
            <p style="font-size: 13px; color: #888; margin: 24px 0 0;">
              This link expires in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.json().catch(() => ({}));
      console.error('Brevo error:', errBody);
      throw new Error(`Email failed: ${errBody.message || emailRes.status}`);
    }

    return res.status(200).json({ message: `Invite sent to ${email}` });
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
