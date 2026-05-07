const { getPool } = require('../../_lib/db');
const { requireAuth } = require('../../_lib/auth');
const { handleCors } = require('../../_lib/cors');

const VALID_STATUSES = ['Reached Out', 'No Response', 'Interested', 'Connected with Ascend Admin', 'Enrolled', 'Not Interested'];
const VALID_GRADES   = ['9th', '10th', '11th', '12th', 'Other'];

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

  const { status, notes, grade, school, follow_up_date } = req.body || {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (grade !== undefined && grade !== null && !VALID_GRADES.includes(grade)) {
    return res.status(400).json({ error: `grade must be one of: ${VALID_GRADES.join(', ')}` });
  }

  const pool = getPool();
  try {
    const existing = await pool.query(
      `SELECT coach_id FROM coach_outreach_log WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Entry not found' });

    if (payload.role !== 'owner' && existing.rows[0].coach_id !== payload.referrerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (status !== undefined)       { fields.push(`status = $${i++}`);         values.push(status); }
    if (notes !== undefined)        { fields.push(`notes = $${i++}`);           values.push(notes?.trim() || null); }
    if (grade !== undefined)        { fields.push(`grade = $${i++}`);           values.push(grade || null); }
    if (school !== undefined)       { fields.push(`school = $${i++}`);          values.push(school?.trim() || null); }
    if (follow_up_date !== undefined) { fields.push(`follow_up_date = $${i++}`); values.push(follow_up_date || null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
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
