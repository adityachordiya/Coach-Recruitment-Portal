const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { signToken } = require('../_lib/auth');
const { handleCors } = require('../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT ca.id, ca.email, ca.password_hash, ca.role, ca.referrer_id
       FROM coach_accounts ca
       WHERE ca.email = $1`,
      [email.toLowerCase().trim()]
    );

    const account = rows[0];
    if (!account || !account.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Stamp last login time
    await pool.query(
      `UPDATE coach_accounts SET last_login_at = NOW() WHERE id = $1`,
      [account.id]
    );

    const token = signToken({
      accountId: account.id,
      referrerId: account.referrer_id,
      role: account.role,
    });

    return res.status(200).json({ token, role: account.role });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
