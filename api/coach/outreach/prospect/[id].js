const { getPool } = require('../../../_lib/db');
const { requireAuth } = require('../../../_lib/auth');
const { handleCors } = require('../../../_lib/cors');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { id: prospectId } = req.query;
  if (!prospectId) return res.status(400).json({ error: 'Prospect ID is required' });

  const pool = getPool();
  try {
    // Verify the prospect belongs to this coach (or user is owner)
    const check = await pool.query(
      `SELECT id FROM coach_outreach_log WHERE prospect_id = $1 AND coach_id = $2 LIMIT 1`,
      [prospectId, payload.referrerId]
    );

    if (!check.rows[0] && payload.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query(
      `DELETE FROM coach_outreach_log WHERE prospect_id = $1`,
      [prospectId]
    );

    return res.status(200).json({ message: 'Prospect deleted' });
  } catch (err) {
    console.error('DELETE /coach/outreach/prospect/[id] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
