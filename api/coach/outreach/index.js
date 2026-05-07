const { getPool } = require('../../_lib/db');
const { requireAuth } = require('../../_lib/auth');
const { handleCors } = require('../../_lib/cors');

const VALID_METHODS  = ['Instagram DM', 'Text', 'Email', 'In Person'];
const VALID_STATUSES = ['Reached Out', 'Interested', 'Enrolled'];
const VALID_GRADES   = ['9th', '10th', '11th', '12th', 'Other'];

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  let payload;
  try {
    payload = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const pool = getPool();

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT id, contact_name, contact_method, status, notes,
                grade, school, follow_up_date, created_at
         FROM coach_outreach_log
         WHERE coach_id = $1
         ORDER BY created_at DESC`,
        [payload.referrerId]
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /coach/outreach error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const {
      contact_name,
      contact_method,
      status = 'Reached Out',
      notes,
      grade,
      school,
      follow_up_date,
    } = req.body || {};

    if (!contact_name?.trim()) {
      return res.status(400).json({ error: 'Contact name is required' });
    }
    if (!VALID_METHODS.includes(contact_method)) {
      return res.status(400).json({ error: `contact_method must be one of: ${VALID_METHODS.join(', ')}` });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (grade && !VALID_GRADES.includes(grade)) {
      return res.status(400).json({ error: `grade must be one of: ${VALID_GRADES.join(', ')}` });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO coach_outreach_log
           (coach_id, contact_name, contact_method, status, notes, grade, school, follow_up_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          payload.referrerId,
          contact_name.trim(),
          contact_method,
          status,
          notes?.trim() || null,
          grade || null,
          school?.trim() || null,
          follow_up_date || null,
        ]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /coach/outreach error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
