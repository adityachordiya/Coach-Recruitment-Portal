const { getPool } = require('../../_lib/db');
const { requireAuth } = require('../../_lib/auth');
const { handleCors } = require('../../_lib/cors');
const { v4: uuidv4 } = require('uuid');

const VALID_METHODS  = ['Instagram DM', 'Text', 'Phone Call', 'Email', 'In Person'];
const VALID_STATUSES = ['Reached Out', 'No Response', 'Interested', 'Connected with Ascend Admin', 'Enrolled', 'Not Interested'];
const VALID_GRADES   = ['6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Other'];

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
        `SELECT id, prospect_id, contact_name, contact_method, status, notes,
                grade, school, follow_up_date, created_at,
                student_email, student_phone,
                parent_name, parent_email, parent_phone
         FROM coach_outreach_log
         WHERE coach_id = $1
         ORDER BY created_at ASC`,
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
      prospect_id,
      student_email,
      student_phone,
      parent_name,
      parent_email,
      parent_phone,
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

    const resolvedProspectId = prospect_id || uuidv4();

    const resolvedFollowUpDate = follow_up_date || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })();

    try {
      const { rows } = await pool.query(
        `INSERT INTO coach_outreach_log
           (coach_id, prospect_id, contact_name, contact_method, status, notes,
            grade, school, follow_up_date,
            student_email, student_phone, parent_name, parent_email, parent_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          payload.referrerId,
          resolvedProspectId,
          contact_name.trim(),
          contact_method,
          status,
          notes?.trim()         || null,
          grade                  || null,
          school?.trim()         || null,
          resolvedFollowUpDate,
          student_email?.trim()  || null,
          student_phone?.trim()  || null,
          parent_name?.trim()    || null,
          parent_email?.trim()   || null,
          parent_phone?.trim()   || null,
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
