const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// POST /api/exams — Create an exam
// ============================================
router.post('/', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { title, subject, scheduledAt, durationMinutes, securityLevel } = req.body;

        if (!title || !subject) {
            return res.status(400).json({ error: 'Title and subject are required.' });
        }

        const result = await pool.query(
            `INSERT INTO exams (title, subject, scheduled_at, duration_minutes, security_level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [
                title,
                subject,
                scheduledAt || null,
                durationMinutes || 60,
                securityLevel || 'High',
                req.user.id
            ]
        );

        const exam = result.rows[0];
        res.status(201).json({
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            scheduledAt: exam.scheduled_at,
            durationMinutes: exam.duration_minutes,
            status: exam.status,
            securityLevel: exam.security_level,
            createdAt: exam.created_at
        });
    } catch (err) {
        console.error('Create Exam Error:', err);
        res.status(500).json({ error: 'Server error creating exam.' });
    }
});

// ============================================
// GET /api/exams — List exams
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
      SELECT e.*, u.name as creator_name,
        (SELECT COUNT(*)::int FROM exam_candidates ec WHERE ec.exam_id = e.id) as candidate_count
      FROM exams e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            query += ` AND e.status = $1`;
            params.push(status);
        }

        // Students only see exams they are assigned to or that are Live/Scheduled
        if (req.user.role === 'student') {
            query += ` AND (e.status IN ('Live', 'Scheduled', 'Completed') OR EXISTS (SELECT 1 FROM exam_candidates ec WHERE ec.exam_id = e.id AND ec.student_id = $${params.length + 1}))`;
            params.push(req.user.id);
        }

        query += ' ORDER BY e.created_at DESC';

        const result = await pool.query(query, params);

        const exams = result.rows.map(e => ({
            id: e.id,
            title: e.title,
            subject: e.subject,
            date: e.scheduled_at,
            durationMinutes: e.duration_minutes,
            candidates: `${e.candidate_count}`,
            status: e.status,
            security: e.security_level,
            creatorName: e.creator_name,
            createdAt: e.created_at
        }));

        res.json(exams);
    } catch (err) {
        console.error('Get Exams Error:', err);
        res.status(500).json({ error: 'Server error fetching exams.' });
    }
});

// ============================================
// GET /api/exams/teacher/analytics — Teacher analytics
// ============================================
router.get('/teacher/analytics', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const totalExams = await pool.query(
            `SELECT COUNT(*)::int as count FROM exams WHERE created_by = $1`,
            [req.user.id]
        );

        const avgScore = await pool.query(
            `SELECT COALESCE(AVG(ec.score), 0) as avg_score
             FROM exam_candidates ec
             JOIN exams e ON ec.exam_id = e.id
             WHERE e.created_by = $1 AND ec.status = 'Completed'`,
            [req.user.id]
        );

        const statusBreakdown = await pool.query(
            `SELECT e.status, COUNT(*)::int as count
             FROM exams e WHERE e.created_by = $1
             GROUP BY e.status`,
            [req.user.id]
        );

        res.json({
            totalExams: totalExams.rows[0].count,
            averageScore: parseFloat(avgScore.rows[0].avg_score).toFixed(1),
            statusBreakdown: statusBreakdown.rows
        });
    } catch (err) {
        console.error('Teacher Analytics Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/teacher/grading — Submissions for grading
// ============================================
router.get('/teacher/grading', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ec.*, e.title as exam_name, e.subject, u.name as student_name, u.email as student_email
             FROM exam_candidates ec
             JOIN exams e ON ec.exam_id = e.id
             JOIN users u ON ec.student_id = u.id
             WHERE e.created_by = $1 AND ec.status = 'Completed'
             ORDER BY ec.created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows.map(r => ({
            examId: r.exam_id,
            examName: r.exam_name,
            subject: r.subject,
            studentName: r.student_name,
            studentEmail: r.student_email,
            score: r.score,
            grade: r.grade,
            submittedAt: r.created_at
        })));
    } catch (err) {
        console.error('Teacher Grading Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/exams/:id/start-session — Start exam session (student)
// ============================================
router.post('/:id/start-session', async (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.user.id;

        // Check exam exists
        const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
        if (examResult.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found.' });
        }

        const exam = examResult.rows[0];

        // Check if student is registered as a candidate
        const candidateResult = await pool.query(
            `SELECT * FROM exam_candidates WHERE exam_id = $1 AND student_id = $2`,
            [examId, studentId]
        );

        if (candidateResult.rows.length === 0) {
            // Auto-register the student
            await pool.query(
                `INSERT INTO exam_candidates (exam_id, student_id, status) VALUES ($1, $2, 'In-Progress')`,
                [examId, studentId]
            );
        } else {
            // Update status to In-Progress
            await pool.query(
                `UPDATE exam_candidates SET status = 'In-Progress' WHERE exam_id = $1 AND student_id = $2`,
                [examId, studentId]
            );
        }

        res.json({
            message: 'Exam session started.',
            candidate: {
                exam_id: examId,
                student_id: studentId,
                duration_minutes: exam.duration_minutes
            }
        });
    } catch (err) {
        console.error('Start Session Error:', err);
        res.status(500).json({ error: 'Server error starting exam session.' });
    }
});

// ============================================
// GET /api/exams/:id — Get exam detail
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
        if (examResult.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found.' });
        }

        const exam = examResult.rows[0];

        // Get candidates for this exam
        const candidatesResult = await pool.query(
            `SELECT ec.*, u.name, u.email, u.special_id, u.photo_url
       FROM exam_candidates ec
       JOIN users u ON ec.student_id = u.id
       WHERE ec.exam_id = $1`,
            [req.params.id]
        );

        res.json({
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            scheduledAt: exam.scheduled_at,
            durationMinutes: exam.duration_minutes,
            status: exam.status,
            securityLevel: exam.security_level,
            candidates: candidatesResult.rows.map(c => ({
                id: c.student_id,
                name: c.name,
                email: c.email,
                specialId: c.special_id,
                photo: c.photo_url,
                examStatus: c.status,
                score: c.score,
                grade: c.grade
            }))
        });
    } catch (err) {
        console.error('Get Exam Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// PATCH /api/exams/:id — Update exam status
// ============================================
router.patch('/:id', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { status, title, subject, scheduledAt, durationMinutes, securityLevel } = req.body;

        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (status) { updates.push(`status = $${paramIndex++}`); params.push(status); }
        if (title) { updates.push(`title = $${paramIndex++}`); params.push(title); }
        if (subject) { updates.push(`subject = $${paramIndex++}`); params.push(subject); }
        if (scheduledAt) { updates.push(`scheduled_at = $${paramIndex++}`); params.push(scheduledAt); }
        if (durationMinutes) { updates.push(`duration_minutes = $${paramIndex++}`); params.push(durationMinutes); }
        if (securityLevel) { updates.push(`security_level = $${paramIndex++}`); params.push(securityLevel); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        params.push(req.params.id);
        const result = await pool.query(
            `UPDATE exams SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found.' });
        }

        res.json({ message: 'Exam updated.', exam: result.rows[0] });
    } catch (err) {
        console.error('Update Exam Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/exams/:id/submit — Submit exam (student)
// ============================================
router.post('/:id/submit', async (req, res) => {
    try {
        const { score, grade } = req.body;

        const result = await pool.query(
            `UPDATE exam_candidates 
       SET status = 'Completed', score = $1, grade = $2
       WHERE exam_id = $3 AND student_id = $4
       RETURNING *`,
            [score || 0, grade || 'Pending', req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'You are not registered for this exam.' });
        }

        res.json({ message: 'Exam submitted successfully.', result: result.rows[0] });
    } catch (err) {
        console.error('Submit Exam Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/student/results — Get student's exam results
// ============================================
router.get('/student/results', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ec.*, e.title as exam_name, e.subject, e.scheduled_at
       FROM exam_candidates ec
       JOIN exams e ON ec.exam_id = e.id
       WHERE ec.student_id = $1
       ORDER BY e.scheduled_at DESC`,
            [req.user.id]
        );

        res.json(result.rows.map(r => ({
            examId: r.exam_id,
            examName: r.exam_name,
            subject: r.subject,
            date: r.scheduled_at,
            status: r.status,
            score: r.score,
            grade: r.grade
        })));
    } catch (err) {
        console.error('Get Results Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
