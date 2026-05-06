const { getPool } = require('../../_lib/db');
const { requireAuth } = require('../../_lib/auth');
const { handleCors } = require('../../_lib/cors');

const VALID_STATUSES = ['Reached Out', 'Interested', 'Enrolled'];

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Entry ID is required' });

  const { status, notes } = req.body || {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const pool = getPool();
  try {
    // Verify ownership — coaches can only edit their own entries; owners can edit any
    const existing = await pool.query(
      `SELECT coach_id FROM coach_outreach_log WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Entry not found' });

    if (
      payload.role !== 'owner' &&
      existing.rows[0].coach_id !== payload.referrerId
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (status !== undefined) { fields.push(`status = $${i++}`); values.push(status); }
    if (notes !== undefined)  { fields.push(`notes = $${i++}`);  values.push(notes?.trim() || null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update (status, notes)' });
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE coach_outreach_log SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('PATCH /coach/outreach/[id] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
