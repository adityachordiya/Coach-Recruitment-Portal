const { getPool } = require('../../_lib/db');
const { requireOwner } = require('../../_lib/auth');
const { handleCors } = require('../../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    requireOwner(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Account ID is required' });

  const pool = getPool();
  try {
    // Get the referrer_id before deleting so we can clean up outreach log
    const { rows } = await pool.query(
      `SELECT referrer_id FROM coach_accounts WHERE id = $1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Coach not found' });

    const referrerId = rows[0].referrer_id;

    // Delete outreach log entries for this coach
    await pool.query(`DELETE FROM coach_outreach_log WHERE coach_id = $1`, [referrerId]);

    // Delete the coach account
    await pool.query(`DELETE FROM coach_accounts WHERE id = $1`, [id]);

    return res.status(200).json({ message: 'Coach deleted' });
  } catch (err) {
    console.error('DELETE /admin/coaches/[id] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
