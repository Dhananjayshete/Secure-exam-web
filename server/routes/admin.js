const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/admin/results - fetch all exam results
router.get('/results', authMiddleware, async (req, res) => {
    try {
        const results = await db.query(`
            SELECT 
                ea.id,
                u.name as student_name,
                e.title as exam_title,
                e.id as exam_id,
                ea.score,
                e.total_marks,
                ROUND((ea.score / e.total_marks) * 100) as percentage,
                CASE WHEN ROUND((ea.score / e.total_marks) * 100) >= 50 
                    THEN true ELSE false END as passed,
                ea.submitted_at
            FROM exam_attempts ea
            JOIN users u ON ea.student_id = u.id
            JOIN exams e ON ea.exam_id = e.id
            WHERE ea.submitted_at IS NOT NULL
            ORDER BY ea.submitted_at DESC
        `);
        res.json(results.rows || results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// GET /api/admin/logs - fetch security/activity logs
router.get('/logs', authMiddleware, async (req, res) => {
    try {
        const logs = await db.query(`
            SELECT 
                pe.id,
                u.name as user_name,
                pe.event_type,
                pe.details,
                pe.ip_address,
                pe.timestamp
            FROM proctoring_events pe
            LEFT JOIN users u ON pe.student_id = u.id
            ORDER BY pe.timestamp DESC
            LIMIT 200
        `);
        res.json(logs.rows || logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;