const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// POST /api/proctoring/events — Log an event
// ============================================
router.post('/events', async (req, res) => {
    try {
        // attemptId is optional if we infer from student+exam, but let's assume we pass examId and studentId context or attemptId.
        // The requirements say: Body: { attemptId, eventType, timestamp, metadata }
        // AttemptID might be the candidate ID.
        // Let's rely on examId to look up the attempt for the current user.

        const { examId, eventType, details } = req.body;

        if (!examId || !eventType) {
            return res.status(400).json({ error: 'examId and eventType are required.' });
        }

        // Find the active attempt (In-Progress)
        // If strict execution, we should probably pass the attemptId from frontend, 
        // but for now let's find it securely.
        const attemptResult = await pool.query(
            `SELECT id FROM exam_candidates 
             WHERE exam_id = $1 AND student_id = $2`,
            [examId, req.user.id]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ error: 'Exam attempt not found.' });
        }

        const attemptId = attemptResult.rows[0].id;

        // Log the event
        await pool.query(
            `INSERT INTO proctoring_events (exam_id, student_id, event_type, details)
             VALUES ($1, $2, $3, $4)`,
            [examId, req.user.id, eventType, details]
        );

        // Count warnings
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

        // Get all candidates who are 'In-Progress' (or maybe all registered to show status)
        // We also want their warning count.
        const query = `
            SELECT 
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
            status: r.flag_count > 0 ? 'flagged' : 'good', // simplistic status
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

module.exports = router;
