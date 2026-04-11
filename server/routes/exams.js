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
    if (!title || !subject) return res.status(400).json({ error: 'Title and subject are required.' });

    const examStatus = scheduledAt ? 'Scheduled' : 'Draft';
    const result = await pool.query(
      `INSERT INTO exams (title, subject, scheduled_at, duration_minutes, security_level, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, subject, scheduledAt || null, durationMinutes || 60, securityLevel || 'High', req.user.id, examStatus]
    );

    const exam = result.rows[0];
    res.status(201).json({
      id: exam.id, title: exam.title, subject: exam.subject,
      scheduledAt: exam.scheduled_at, durationMinutes: exam.duration_minutes,
      status: exam.status, securityLevel: exam.security_level, createdAt: exam.created_at
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

    if (status) { query += ` AND e.status = $1`; params.push(status); }

    if (req.user.role === 'student') {
      query += ` AND e.status IN ('Live', 'Scheduled', 'Completed')`;
    }

    query += ' ORDER BY e.created_at DESC';
    const result = await pool.query(query, params);

    res.json(result.rows.map(e => ({
      id: e.id, title: e.title, subject: e.subject,
      date: e.scheduled_at, startTime: e.start_time, endTime: e.end_time,
      durationMinutes: e.duration_minutes,
      candidates: `${e.candidate_count}`,
      status: e.status, security: e.security_level,
      creatorName: e.creator_name, createdAt: e.created_at
    })));
  } catch (err) {
    console.error('Get Exams Error:', err);
    res.status(500).json({ error: 'Server error fetching exams.' });
  }
});

// ============================================
// GET /api/exams/teacher/analytics
// ============================================
router.get('/teacher/analytics', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const totalExams = await pool.query(
      `SELECT COUNT(*)::int as count FROM exams WHERE created_by = $1`, [req.user.id]
    );
    const avgScore = await pool.query(
      `SELECT COALESCE(AVG(ec.score), 0) as avg_score
       FROM exam_candidates ec JOIN exams e ON ec.exam_id = e.id
       WHERE e.created_by = $1 AND ec.status = 'Completed'`, [req.user.id]
    );
    const statusBreakdown = await pool.query(
      `SELECT e.status, COUNT(*)::int as count FROM exams e WHERE e.created_by = $1 GROUP BY e.status`, [req.user.id]
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
// GET /api/exams/teacher/grading
// ============================================
router.get('/teacher/grading', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ec.*, e.title as exam_name, e.subject, u.name as student_name, u.email as student_email
       FROM exam_candidates ec
       JOIN exams e ON ec.exam_id = e.id
       JOIN users u ON ec.student_id = u.id
       WHERE e.created_by = $1 AND ec.status = 'Completed'
       ORDER BY ec.created_at DESC`, [req.user.id]
    );
    res.json(result.rows.map(r => ({
      examId: r.exam_id, examName: r.exam_name, subject: r.subject,
      studentName: r.student_name, studentEmail: r.student_email,
      score: r.score, grade: r.grade, submittedAt: r.created_at
    })));
  } catch (err) {
    console.error('Teacher Grading Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// POST /api/exams/:id/start-session
// ============================================
router.post('/:id/start-session', async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examResult.rows.length === 0) return res.status(404).json({ error: 'Exam not found.' });

    const exam = examResult.rows[0];
    const candidateResult = await pool.query(
      `SELECT * FROM exam_candidates WHERE exam_id = $1 AND student_id = $2`, [examId, studentId]
    );

    if (candidateResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO exam_candidates (exam_id, student_id, status) VALUES ($1, $2, 'In-Progress')`,
        [examId, studentId]
      );
    } else {
      await pool.query(
        `UPDATE exam_candidates SET status = 'In-Progress' WHERE exam_id = $1 AND student_id = $2`,
        [examId, studentId]
      );
    }

    res.json({
      message: 'Exam session started.',
      candidate: { exam_id: examId, student_id: studentId, duration_minutes: exam.duration_minutes }
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
    if (examResult.rows.length === 0) return res.status(404).json({ error: 'Exam not found.' });
    const exam = examResult.rows[0];

    const candidatesResult = await pool.query(
      `SELECT ec.*, u.name, u.email, u.special_id, u.photo_url
       FROM exam_candidates ec JOIN users u ON ec.student_id = u.id WHERE ec.exam_id = $1`,
      [req.params.id]
    );

    res.json({
      id: exam.id, title: exam.title, subject: exam.subject,
      scheduledAt: exam.scheduled_at, startTime: exam.start_time, endTime: exam.end_time,
      durationMinutes: exam.duration_minutes, status: exam.status, securityLevel: exam.security_level,
      candidates: candidatesResult.rows.map(c => ({
        id: c.student_id, name: c.name, email: c.email,
        specialId: c.special_id, photo: c.photo_url, examStatus: c.status, score: c.score, grade: c.grade
      }))
    });
  } catch (err) {
    console.error('Get Exam Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// PATCH /api/exams/:id — Update exam
// ============================================
router.patch('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { status, title, subject, scheduledAt, durationMinutes, securityLevel } = req.body;
    const updates = []; const params = []; let i = 1;

    if (status) { updates.push(`status = $${i++}`); params.push(status); }
    if (title) { updates.push(`title = $${i++}`); params.push(title); }
    if (subject) { updates.push(`subject = $${i++}`); params.push(subject); }
    if (scheduledAt) { updates.push(`scheduled_at = $${i++}`); params.push(scheduledAt); }
    if (durationMinutes) { updates.push(`duration_minutes = $${i++}`); params.push(durationMinutes); }
    if (securityLevel) { updates.push(`security_level = $${i++}`); params.push(securityLevel); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE exams SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`, params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Exam not found.' });
    res.json({ message: 'Exam updated.', exam: result.rows[0] });
  } catch (err) {
    console.error('Update Exam Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// POST /api/exams/:id/submit — Submit exam
// ============================================
router.post('/:id/submit', async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    // Get all questions with their correct option from question_options table
    const questionsResult = await pool.query(
      `SELECT eq.id, eq.points,
              (SELECT qo.id FROM question_options qo 
               WHERE qo.question_id = eq.id AND qo.is_correct = TRUE LIMIT 1) as correct_option_id
       FROM exam_questions eq WHERE eq.exam_id = $1`,
      [examId]
    );
    const questions = questionsResult.rows;

    // Get student's answers
    const answersResult = await pool.query(
      `SELECT question_id, selected_option_id FROM student_answers
       WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId]
    );
    const answers = answersResult.rows;

    // Mark each answer as correct or incorrect
    for (const ans of answers) {
      const question = questions.find(q => q.id === ans.question_id);
      if (question) {
        const isCorrect = ans.selected_option_id === question.correct_option_id;
        await pool.query(
          `UPDATE student_answers SET is_correct = $1
           WHERE exam_id = $2 AND student_id = $3 AND question_id = $4`,
          [isCorrect, examId, studentId, ans.question_id]
        );
      }
    }

    // Calculate score
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    let earnedPoints = 0;
    for (const ans of answers) {
      const question = questions.find(q => q.id === ans.question_id);
      if (question && ans.selected_option_id === question.correct_option_id) {
        earnedPoints += question.points || 1;
      }
    }
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Calculate grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    // Save final result
    const result = await pool.query(
      `UPDATE exam_candidates SET status = 'Completed', score = $1, grade = $2
       WHERE exam_id = $3 AND student_id = $4 RETURNING *`,
      [percentage, grade, examId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'You are not registered for this exam.' });
    }

    res.json({
      message: 'Exam submitted successfully.',
      percentage,
      grade,
      score: percentage,
      earnedPoints,
      totalPoints,
      result: result.rows[0]
    });
  } catch (err) {
    console.error('Submit Exam Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// GET /api/exams/student/results
// ============================================
router.get('/student/results', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ec.*, e.title as exam_name, e.subject, e.scheduled_at as start_time
       FROM exam_candidates ec JOIN exams e ON ec.exam_id = e.id
       WHERE ec.student_id = $1 AND ec.status = 'Completed'
       ORDER BY ec.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(r => ({
      examId: r.exam_id,
      exam_name: r.exam_name,
      subject: r.subject,
      start_time: r.start_time,
      status: r.status,
      score: r.score,
      grade: r.grade
    })));
  } catch (err) {
    console.error('Get Results Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// POST /api/exams/:examId/autosave — FEATURE 2: Auto-save answers
// ============================================
router.post('/:examId/autosave', async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required.' });
    }

    // Store in a simple key-value using exam_id + student_id as key
    // We upsert into student_answers without marking as final
    for (const ans of answers) {
      await pool.query(
        `INSERT INTO student_answers (exam_id, student_id, question_id, selected_option_id, text_answer, is_correct)
         VALUES ($1, $2, $3, $4, $5, NULL)
         ON CONFLICT (exam_id, student_id, question_id)
         DO UPDATE SET selected_option_id = $4, text_answer = $5`,
        [examId, req.user.id, ans.questionId, ans.selectedOptionId || null, ans.textAnswer || null]
      );
    }

    res.json({ message: 'Auto-saved.', count: answers.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Auto-save Error:', err);
    res.status(500).json({ error: 'Server error during auto-save.' });
  }
});

// ============================================
// GET /api/exams/:examId/autosave — FEATURE 2: Load auto-saved answers
// ============================================
router.get('/:examId/autosave', async (req, res) => {
  try {
    const { examId } = req.params;

    // Check if candidate is still In-Progress (not yet submitted)
    const candidate = await pool.query(
      `SELECT status FROM exam_candidates WHERE exam_id = $1 AND student_id = $2`,
      [examId, req.user.id]
    );

    // Only restore if exam was in progress (crashed/disconnected)
    if (candidate.rows.length === 0 || candidate.rows[0].status === 'Completed') {
      return res.json({ answers: [] });
    }

    const result = await pool.query(
      `SELECT question_id, selected_option_id, text_answer
       FROM student_answers
       WHERE exam_id = $1 AND student_id = $2`,
      [examId, req.user.id]
    );

    res.json({
      answers: result.rows.map(r => ({
        questionId: r.question_id,
        selectedOptionId: r.selected_option_id,
        textAnswer: r.text_answer
      }))
    });
  } catch (err) {
    console.error('Load Auto-save Error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// GET /api/exams/:examId/analytics — FEATURE 7: Per-exam analytics
// ============================================
router.get('/:examId/analytics', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { examId } = req.params;

    // Score distribution
    const scoreDistribution = await pool.query(
      `SELECT
         COUNT(CASE WHEN score >= 90 THEN 1 END)::int as a_plus,
         COUNT(CASE WHEN score >= 80 AND score < 90 THEN 1 END)::int as a,
         COUNT(CASE WHEN score >= 70 AND score < 80 THEN 1 END)::int as b,
         COUNT(CASE WHEN score >= 60 AND score < 70 THEN 1 END)::int as c,
         COUNT(CASE WHEN score >= 50 AND score < 60 THEN 1 END)::int as d,
         COUNT(CASE WHEN score < 50 THEN 1 END)::int as f,
         AVG(score)::numeric(5,1) as average,
         MAX(score)::int as highest,
         MIN(score)::int as lowest,
         COUNT(*)::int as total_students
       FROM exam_candidates WHERE exam_id = $1 AND status = 'Completed'`,
      [examId]
    );

    // Per-question stats: how many got it right vs wrong
    const questionStats = await pool.query(
      `SELECT
         eq.question_text,
         eq.points,
         COUNT(sa.id)::int as total_answers,
         COUNT(CASE WHEN sa.is_correct = true THEN 1 END)::int as correct_count,
         COUNT(CASE WHEN sa.is_correct = false THEN 1 END)::int as wrong_count
       FROM exam_questions eq
       LEFT JOIN student_answers sa ON sa.question_id = eq.id AND sa.exam_id = eq.exam_id
       WHERE eq.exam_id = $1
       GROUP BY eq.id, eq.question_text, eq.points, eq.sort_order
       ORDER BY eq.sort_order`,
      [examId]
    );

    // Security events summary
    const securitySummary = await pool.query(
      `SELECT event_type, COUNT(*)::int as count
       FROM proctoring_events WHERE exam_id = $1
       GROUP BY event_type ORDER BY count DESC`,
      [examId]
    );

    res.json({
      scoreDistribution: scoreDistribution.rows[0],
      questionStats: questionStats.rows.map(q => ({
        questionText: q.question_text.substring(0, 60) + (q.question_text.length > 60 ? '...' : ''),
        points: q.points,
        totalAnswers: q.total_answers,
        correctCount: q.correct_count,
        wrongCount: q.wrong_count,
        successRate: q.total_answers > 0 ? Math.round((q.correct_count / q.total_answers) * 100) : 0
      })),
      securitySummary: securitySummary.rows
    });
  } catch (err) {
    console.error('Exam Analytics Error:', err);
    res.status(500).json({ error: 'Server error fetching analytics.' });
  }
});

module.exports = router;