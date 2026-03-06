const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// ALLOWED EVENT TYPES — must match DB CHECK constraint exactly:
// CHECK (event_type IN ('tab_switch','focus_loss','face_warning',
//                       'copy_attempt','right_click','devtools'))
//
// FIX 3: 'camera_off' was being logged from frontend but is NOT
// in the DB constraint → causes 500 errors on every camera check.
// Map it to 'face_warning' here as a safe fallback.
// ============================================
const ALLOWED_EVENT_TYPES = new Set([
  'tab_switch',
  'focus_loss',
  'face_warning',
  'copy_attempt',
  'right_click',
  'devtools'
]);

const normalizeEventType = (eventType) => {
  // Map legacy/incorrect event types to valid DB values
  if (eventType === 'camera_off') return 'face_warning';
  return ALLOWED_EVENT_TYPES.has(eventType) ? eventType : null;
};

// ============================================
// POST /api/proctoring/events — Log an event
// ============================================
router.post('/events', async (req, res) => {
  try {
    const { examId, eventType, details } = req.body;

    if (!examId || !eventType) {
      return res.status(400).json({ error: 'examId and eventType are required.' });
    }

    // FIX 3: Normalize and validate event type before inserting
    const safeEventType = normalizeEventType(eventType);
    if (!safeEventType) {
      console.warn(`Unknown proctoring event type ignored: ${eventType}`);
      return res.status(400).json({ error: `Invalid event type: ${eventType}` });
    }

    // Find the active attempt for this student
    const attemptResult = await pool.query(
      `SELECT id FROM exam_candidates 
       WHERE exam_id = $1 AND student_id = $2`,
      [examId, req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam attempt not found.' });
    }

    // Log the event using the normalized/safe event type
    await pool.query(
      `INSERT INTO proctoring_events (exam_id, student_id, event_type, details)
       VALUES ($1, $2, $3, $4)`,
      [examId, req.user.id, safeEventType, details]
    );

    // Count total warnings for this student in this exam
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM proctoring_events 
       WHERE exam_id = $1 AND student_id = $2 
       AND event_type IN ('tab_switch', 'focus_loss', 'face_warning', 'copy_attempt', 'right_click', 'devtools')`,
      [examId, req.user.id]
    );

    const warningCount = parseInt(countResult.rows[0].count, 10);

    res.json({ message: 'Event logged.', warningCount });

  } catch (err) {
    console.error('Proctoring Log Error:', err);
    res.status(500).json({ error: 'Server error logging event.' });
  }
});

// ============================================
// GET /api/proctoring/monitor/:examId — Live Monitor
// ============================================
router.get('/monitor/:examId', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { examId } = req.params;

    const query = `
      SELECT 
        u.id as student_id,
        u.name, u.email, u.photo_url,
        ec.status, ec.score,
        (SELECT COUNT(*) FROM proctoring_events pe 
         WHERE pe.exam_id = ec.exam_id AND pe.student_id = ec.student_id
         AND pe.event_type IN ('tab_switch', 'focus_loss', 'face_warning', 'copy_attempt', 'right_click', 'devtools')
        ) as flag_count,
        (SELECT MAX(created_at) FROM proctoring_events pe 
         WHERE pe.exam_id = ec.exam_id AND pe.student_id = ec.student_id
        ) as last_event_at
      FROM exam_candidates ec
      JOIN users u ON ec.student_id = u.id
      WHERE ec.exam_id = $1
      ORDER BY flag_count DESC, ec.status
    `;

    const result = await pool.query(query, [examId]);

    const students = result.rows.map(r => ({
      name: r.name,
      email: r.email,
      photo: r.photo_url,
      status: r.flag_count > 0 ? 'flagged' : 'good',
      examStatus: r.status,
      flagCount: parseInt(r.flag_count, 10),
      lastActivity: r.last_event_at
    }));

    res.json(students);

  } catch (err) {
    console.error('Monitor Error:', err);
    res.status(500).json({ error: 'Server error fetching monitor data.' });
  }
});

// ============================================
// GET /api/proctoring/events/:examId — Get all events (admin/teacher)
// ============================================
router.get('/events/:examId', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pe.*, u.name as student_name
       FROM proctoring_events pe
       JOIN users u ON pe.student_id = u.id
       WHERE pe.exam_id = $1
       ORDER BY pe.created_at DESC`,
      [req.params.examId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;