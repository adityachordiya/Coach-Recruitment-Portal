const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { signToken } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT id, referrer_id, role, invite_token_expires_at
       FROM coach_accounts
       WHERE invite_token = $1`,
      [token]
    );

    const account = rows[0];
    if (!account) {
      return res.status(400).json({ error: 'Invalid or expired invite link' });
    }
    if (new Date(account.invite_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite link has expired. Ask an owner to resend it.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE coach_accounts
       SET password_hash = $1, invite_token = NULL, invite_token_expires_at = NULL,
           last_login_at = NOW()
       WHERE id = $2`,
      [passwordHash, account.id]
    );

    const jwt = signToken({
      accountId: account.id,
      referrerId: account.referrer_id,
      role: account.role,
    });

    return res.status(200).json({ token: jwt, role: account.role });
  } catch (err) {
    console.error('Setup password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
