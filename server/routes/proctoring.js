const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// POST /api/exams/:examId/proctoring — Log a proctoring event
// Called by the student's browser during an active exam
// ============================================
router.post('/exams/:examId/proctoring', async (req, res) => {
    try {
        const { examId } = req.params;
        const { eventType, details } = req.body;

        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required.' });
        }

        const result = await pool.query(
            `INSERT INTO proctoring_events (exam_id, student_id, event_type, details)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [examId, req.user.id, eventType, details || null]
        );

        res.status(201).json({
            id: result.rows[0].id,
            eventType: result.rows[0].event_type,
            createdAt: result.rows[0].created_at
        });
    } catch (err) {
        console.error('Log Proctoring Event Error:', err);
        res.status(500).json({ error: 'Server error logging proctoring event.' });
    }
});

// ============================================
// GET /api/exams/:examId/proctoring — List proctoring events
// Teacher/admin only — see all events for an exam
// ============================================
router.get('/exams/:examId/proctoring', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { examId } = req.params;
        const { studentId } = req.query;

        let query = `
            SELECT pe.*, u.name as student_name, u.email as student_email, u.photo_url
            FROM proctoring_events pe
            JOIN users u ON pe.student_id = u.id
            WHERE pe.exam_id = $1
        `;
        const params = [examId];

        if (studentId) {
            query += ' AND pe.student_id = $2';
            params.push(studentId);
        }

        query += ' ORDER BY pe.created_at DESC';

        const result = await pool.query(query, params);

        res.json(result.rows.map(e => ({
            id: e.id,
            examId: e.exam_id,
            studentId: e.student_id,
            studentName: e.student_name,
            studentEmail: e.student_email,
            studentPhoto: e.photo_url,
            eventType: e.event_type,
            details: e.details,
            createdAt: e.created_at
        })));
    } catch (err) {
        console.error('Get Proctoring Events Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/:examId/proctoring/summary — Summary per student
// Returns flag counts per student for the live monitoring view
// ============================================
router.get('/exams/:examId/proctoring/summary', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { examId } = req.params;

        const result = await pool.query(
            `SELECT pe.student_id, u.name, u.photo_url,
                    COUNT(*)::int as total_events,
                    COUNT(*) FILTER (WHERE pe.event_type IN ('tab_switch', 'focus_loss', 'copy_attempt', 'devtools'))::int as flag_count
             FROM proctoring_events pe
             JOIN users u ON pe.student_id = u.id
             WHERE pe.exam_id = $1
             GROUP BY pe.student_id, u.name, u.photo_url
             ORDER BY flag_count DESC`,
            [examId]
        );

        res.json(result.rows.map(r => ({
            studentId: r.student_id,
            name: r.name,
            photo: r.photo_url,
            totalEvents: r.total_events,
            flagCount: r.flag_count,
            status: r.flag_count > 3 ? 'flagged' : 'good'
        })));
    } catch (err) {
        console.error('Get Proctoring Summary Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
