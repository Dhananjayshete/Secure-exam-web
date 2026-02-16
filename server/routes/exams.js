const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// POST /api/exams — Create an exam
// ============================================
// ============================================
// POST /api/exams — Create an exam
// ============================================
router.post('/', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        // Extract groupIds from request body
        const { title, subject, scheduledAt, durationMinutes, securityLevel, groupIds } = req.body;

        if (!title || !subject) {
            return res.status(400).json({ error: 'Title and subject are required.' });
        }

        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Exam
            const { title, subject, durationMinutes, securityLevel, groupIds } = req.body;

            // Handle Dates: Frontend sends 'YYYY-MM-DDTHH:mm' (local time)
            let startTimeVal = req.body.startTime;
            let endTimeVal = req.body.endTime;

            // Simple validation helper
            const isValidDate = (d) => d && !isNaN(new Date(d).getTime());

            if (!isValidDate(startTimeVal)) {
                // Default to NOW
                startTimeVal = new Date().toISOString().slice(0, 16);
            }

            // If end time is missing or invalid, default to Start + Duration
            if (!isValidDate(endTimeVal)) {
                const startObj = new Date(startTimeVal);
                const duration = parseInt(durationMinutes || '60', 10);
                const endObj = new Date(startObj.getTime() + duration * 60000);
                endTimeVal = endObj.toISOString().slice(0, 16);
            }

            // Determine initial status based on LOCAL time comparison
            let initStatus = 'Scheduled';
            const now = new Date();
            const start = new Date(startTimeVal);
            const end = new Date(endTimeVal);

            if (now > end) initStatus = 'Completed';
            else if (now >= start) initStatus = 'Live';
            else initStatus = 'Scheduled';

            const result = await client.query(
                `INSERT INTO exams (title, subject, scheduled_at, duration_minutes, security_level, created_by, status, start_time, end_time)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    title,
                    subject,
                    startTimeVal,
                    durationMinutes || 60,
                    securityLevel || 'High',
                    req.user.id,
                    initStatus,
                    startTimeVal,
                    endTimeVal
                ]
            );

            const exam = result.rows[0];

            // 2. Assign to Groups (if provided)
            let assignedGroups = 0;
            if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
                const groupValues = groupIds.map((gid, i) => `($1, $${i + 2})`).join(', ');
                const groupParams = [exam.id, ...groupIds];

                await client.query(
                    `INSERT INTO exam_groups (exam_id, group_id) VALUES ${groupValues} ON CONFLICT DO NOTHING`,
                    groupParams
                );
                assignedGroups = groupIds.length;
            }

            await client.query('COMMIT');

            res.status(201).json({
                ...exam,
                assignedGroupsCount: assignedGroups,
                message: 'Exam created and assigned to groups successfully.'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

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
        const params = [];
        // Use TO_CHAR to force "YYYY-MM-DDTHH:MI:SS" format (Local Time representation)
        // This avoids Postgres/Node adding 'Z' which shifts the time for the text viewer
        let query = `SELECT e.id, e.title, e.subject, e.duration_minutes, e.status, e.security_level,
            TO_CHAR(e.scheduled_at, 'YYYY-MM-DD"T"HH24:MI:SS') as scheduled_at,
            TO_CHAR(e.start_time, 'YYYY-MM-DD"T"HH24:MI:SS') as start_time,
            TO_CHAR(e.end_time, 'YYYY-MM-DD"T"HH24:MI:SS') as end_time,
            e.created_at,
            u.name as creator_name,
            (SELECT COUNT(*)::int FROM exam_candidates ec WHERE ec.exam_id = e.id) as candidate_count
            FROM exams e
            LEFT JOIN users u ON e.created_by = u.id `;

        // For Students: Show ALL non-draft exams (Global Visibility)
        if (req.user.role === 'student') {
            // Simplified logic: If it's not Draft, they can see it.
            // We ignore group assignments for visibility purposes as requested.
            query += ` WHERE e.status IN ('Scheduled', 'Live', 'Completed') `;
        } else {
            query += ` WHERE 1=1 `;
        }

        if (status) {
            query += ` AND e.status = $${params.length + 1}`;
            params.push(status);
        }

        // Removed DISTINCT/GROUP BY as we are no longer joining with groups for filtering


        query += ' ORDER BY e.created_at DESC';

        const result = await pool.query(query, params);

        const exams = result.rows.map(e => ({
            id: e.id,
            title: e.title,
            subject: e.subject,
            date: e.scheduled_at, // Keep for compat
            startTime: e.start_time,
            endTime: e.end_time,
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
// POST /api/exams/:id/start — Start exam (Student)
// ============================================
router.post('/:id/start', requireRole('student'), async (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.user.id;

        // 0. Check Exam Window (Time)
        // 0. Check Exam Window (Time)
        // Retrieve times as strict strings to compare locally
        const examData = await pool.query(`
            SELECT status, 
                   TO_CHAR(start_time, 'YYYY-MM-DD"T"HH24:MI:SS') as start_time, 
                   TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS') as end_time 
            FROM exams WHERE id = $1`, [examId]);

        if (examData.rows.length === 0) return res.status(404).json({ error: 'Exam not found.' });

        const { start_time, end_time, status } = examData.rows[0];
        const now = new Date(); // Server Local Time (assumed same timezone as teacher/student)

        // Strict comparison
        if (start_time) {
            const startDate = new Date(start_time); // Parses as Local
            if (now < startDate) {
                const diff = (startDate.getTime() - now.getTime()) / 1000;
                return res.status(403).json({ error: 'Exam has not started yet.', startsInSeconds: diff, code: 'NOT_STARTED_YET' });
            }
        }
        if (end_time) {
            const endDate = new Date(end_time); // Parses as Local
            if (now > endDate) {
                return res.status(403).json({ error: 'Exam has ended.', code: 'EXAM_EXPIRED' });
            }
        }
        if (status === 'Draft') { // Should not happen if filtered, but safety
            return res.status(403).json({ error: 'Exam is not visible.' });
        }

        // 1. Verify access
        // logic: 
        // a. Count explicitly assigned candidates and groups for this exam.
        // b. If total assignments == 0, it's a GLOBAL EXAM, allow start.
        // c. If assignments > 0, check if this student is explicitly assigned OR in an assigned group.

        const assignmentCountResult = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM exam_candidates WHERE exam_id = $1) +
                (SELECT COUNT(*) FROM exam_groups WHERE exam_id = $1) as total_assignments`,
            [examId]
        );
        const totalAssignments = parseInt(assignmentCountResult.rows[0].total_assignments, 10);

        if (totalAssignments > 0) {
            // Check direct assignment
            const candidateCheck = await pool.query(
                `SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND student_id = $2`,
                [examId, studentId]
            );

            // Check group-based assignment
            const groupCheck = await pool.query(
                `SELECT 1 
                 FROM exam_groups eg
                 JOIN group_members gm ON eg.group_id = gm.group_id
                 WHERE eg.exam_id = $1 AND gm.user_id = $2`,
                [examId, studentId]
            );

            if (candidateCheck.rowCount === 0 && groupCheck.rowCount === 0) {
                return res.status(403).json({ error: 'You are not assigned to this exam.' });
            }
        }

        // 2. Create or Update entry in exam_candidates
        // We use ON CONFLICT to avoiding error if they already started.
        // If they already started, we just return the existing record.
        const result = await pool.query(
            `INSERT INTO exam_candidates (exam_id, student_id, status)
             VALUES ($1, $2, 'In-Progress')
             ON CONFLICT (exam_id, student_id) 
             DO UPDATE SET status = CASE WHEN exam_candidates.status = 'Completed' THEN 'Completed' ELSE 'In-Progress' END
             RETURNING *`,
            [examId, studentId]
        );

        const candidate = result.rows[0];

        if (candidate.status === 'Completed') {
            return res.status(400).json({ error: 'You have already completed this exam.', candidate });
        }

        res.json({ message: 'Exam started successfully.', candidate });

    } catch (err) {
        console.error('Start Exam Error:', err);
        res.status(500).json({ error: 'Server error starting exam.' });
    }
});

// ============================================
// GET /api/exams/:id — Get exam detail
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const examResult = await pool.query(`
            SELECT id, title, subject, duration_minutes, status, security_level, created_by,
            TO_CHAR(scheduled_at, 'YYYY-MM-DD"T"HH24:MI:SS') as scheduled_at,
            TO_CHAR(start_time, 'YYYY-MM-DD"T"HH24:MI:SS') as start_time,
            TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS') as end_time
            FROM exams WHERE id = $1`, [req.params.id]);

        if (examResult.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found.' });
        }

        const exam = examResult.rows[0];

        // Security check for students: must be assigned
        if (req.user.role === 'student') {
            const accessCheck = await pool.query(
                `SELECT 1 
                 FROM exam_groups eg
                 JOIN group_members gm ON eg.group_id = gm.group_id
                 WHERE eg.exam_id = $1 AND gm.user_id = $2`,
                [exam.id, req.user.id]
            );
            if (accessCheck.rowCount === 0) {
                return res.status(403).json({ error: 'Access denied.' });
            }
        }

        const response = {
            id: exam.id,
            title: exam.title,
            subject: exam.subject,
            scheduledAt: exam.scheduled_at,
            startTime: exam.start_time,
            endTime: exam.end_time,
            durationMinutes: exam.duration_minutes,
            status: exam.status,
            securityLevel: exam.security_level
        };

        // If teacher/admin, include candidates
        if (req.user.role !== 'student') {
            const candidatesResult = await pool.query(
                `SELECT ec.*, u.name, u.email, u.special_id, u.photo_url
                 FROM exam_candidates ec
                 JOIN users u ON ec.student_id = u.id
                 WHERE ec.exam_id = $1`,
                [req.params.id]
            );
            response.candidates = candidatesResult.rows.map(c => ({
                id: c.student_id,
                name: c.name,
                email: c.email,
                specialId: c.special_id,
                photo: c.photo_url,
                examStatus: c.status,
                score: c.score,
                grade: c.grade
            }));
        }

        res.json(response);
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
        if (req.body.startTime) { updates.push(`start_time = $${paramIndex++}`); params.push(req.body.startTime); }
        if (req.body.endTime) { updates.push(`end_time = $${paramIndex++}`); params.push(req.body.endTime); }
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
            `SELECT ec.*, e.title as exam_name, e.subject, e.scheduled_at, e.start_time, e.end_time
       FROM exam_candidates ec
       JOIN exams e ON ec.exam_id = e.id
       WHERE ec.student_id = $1
       ORDER BY e.scheduled_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get Student Results Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/teacher/analytics — Teacher summary stats
// ============================================
router.get('/teacher/analytics', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const teacherId = req.user.id;

        // Count totals
        const countsResult = await pool.query(
            `SELECT 
                COUNT(*)::int as total_exams,
                COUNT(*) FILTER (WHERE start_time > NOW())::int as upcoming_exams,
                COUNT(*) FILTER (WHERE end_time < NOW())::int as completed_exams
             FROM exams 
             ${req.user.role === 'admin' ? '' : 'WHERE created_by = $1'}`,
            req.user.role === 'admin' ? [] : [teacherId]
        );

        // Average score per exam
        const avgScoresResult = await pool.query(
            `SELECT e.title, ROUND(AVG(ec.score))::int as average_score
             FROM exams e
             JOIN exam_candidates ec ON e.id = ec.exam_id
             WHERE ec.status = 'Completed'
             ${req.user.role === 'admin' ? '' : 'AND e.created_by = $1'}
             GROUP BY e.id, e.title
             LIMIT 10`,
            req.user.role === 'admin' ? [] : [teacherId]
        );

        res.json({
            summary: countsResult.rows[0],
            avgScores: avgScoresResult.rows
        });
    } catch (err) {
        console.error('Teacher Analytics Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/teacher/grading — List exams for grading
// ============================================
router.get('/teacher/grading', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const teacherId = req.user.id;

        const result = await pool.query(
            `SELECT 
                e.id, e.title, e.subject,
                TO_CHAR(e.start_time, 'DD Mon YYYY') as date,
                COUNT(ec.id)::int as candidates_count,
                ROUND(AVG(ec.score) FILTER (WHERE ec.status = 'Completed'))::int as avg_score
             FROM exams e
             LEFT JOIN exam_candidates ec ON e.id = ec.exam_id
             ${req.user.role === 'admin' ? '' : 'WHERE e.created_by = $1'}
             GROUP BY e.id, e.title, e.subject, e.start_time
             ORDER BY e.start_time DESC`,
            req.user.role === 'admin' ? [] : [teacherId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Teacher Grading Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/admin/exams — List all exams (Admin only)
// ============================================
router.get('/admin/all', requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, u.name as teacher_name,
                    COUNT(ec.id)::int as candidates_count
             FROM exams e
             LEFT JOIN users u ON e.created_by = u.id
             LEFT JOIN exam_candidates ec ON e.id = ec.exam_id
             GROUP BY e.id, u.name
             ORDER BY e.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Admin All Exams Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// DELETE /api/exams/:id — Delete exam (Teacher/Admin)
// ============================================
router.delete('/:id', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM exams WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Exam not found.' });
        res.json({ message: 'Exam deleted successfully.' });
    } catch (err) {
        console.error('Delete Exam Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
