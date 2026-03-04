const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// GET /api/questions — List all questions globally (Admin only)
// ============================================
router.get('/', requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT q.*, e.title as exam_title, e.subject as exam_subject, u.name as teacher_name
             FROM exam_questions q
             JOIN exams e ON q.exam_id = e.id
             LEFT JOIN users u ON e.created_by = u.id
             ORDER BY q.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get All Questions Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/exams/:examId/questions — List questions for an exam
// Teachers/admins see is_correct; students do not
// ============================================
router.get('/exams/:examId/questions', async (req, res) => {
    try {
        const { examId } = req.params;

        // Verify exam exists
        const examCheck = await pool.query('SELECT id FROM exams WHERE id = $1', [examId]);
        if (examCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found.' });
        }

        // Get questions
        const questionsResult = await pool.query(
            `SELECT id, exam_id, question_text, question_type, points, sort_order, model_answer, created_at
             FROM exam_questions WHERE exam_id = $1 ORDER BY sort_order ASC`,
            [examId]
        );

        // Get options for each question
        const questions = [];
        for (const q of questionsResult.rows) {
            let optionsQuery = 'SELECT id, option_text';
            // Only show is_correct to teachers/admins
            if (req.user.role === 'teacher' || req.user.role === 'admin') {
                optionsQuery += ', is_correct';
            }
            optionsQuery += ' FROM question_options WHERE question_id = $1 ORDER BY id';

            const optionsResult = await pool.query(optionsQuery, [q.id]);

            questions.push({
                id: q.id,
                examId: q.exam_id,
                questionText: q.question_text,
                questionType: q.question_type,
                points: q.points,
                sortOrder: q.sort_order,
                modelAnswer: (req.user.role === 'teacher' || req.user.role === 'admin') ? q.model_answer : undefined,
                options: optionsResult.rows.map(o => ({
                    id: o.id,
                    optionText: o.option_text,
                    ...(o.is_correct !== undefined ? { isCorrect: o.is_correct } : {})
                }))
            });
        }

        res.json(questions);
    } catch (err) {
        console.error('Get Questions Error:', err);
        res.status(500).json({ error: 'Server error fetching questions.' });
    }
});

// ============================================
// POST /api/exams/:examId/questions — Create a question (with options)
// ============================================
router.post('/exams/:examId/questions', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { examId } = req.params;
        const { questionText, questionType, points, sortOrder, options, modelAnswer } = req.body;

        if (!questionText) {
            return res.status(400).json({ error: 'questionText is required.' });
        }

        // Insert question
        const qResult = await pool.query(
            `INSERT INTO exam_questions (exam_id, question_text, question_type, points, sort_order, model_answer)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [examId, questionText, questionType || 'MCQ', points || 1, sortOrder || 0, modelAnswer || null]
        );

        const question = qResult.rows[0];

        // Insert options if provided (for MCQ)
        const insertedOptions = [];
        if (options && Array.isArray(options) && options.length > 0) {
            for (const opt of options) {
                const optResult = await pool.query(
                    `INSERT INTO question_options (question_id, option_text, is_correct)
                     VALUES ($1, $2, $3) RETURNING *`,
                    [question.id, opt.optionText, opt.isCorrect || false]
                );
                insertedOptions.push({
                    id: optResult.rows[0].id,
                    optionText: optResult.rows[0].option_text,
                    isCorrect: optResult.rows[0].is_correct
                });
            }
        }

        res.status(201).json({
            id: question.id,
            examId: question.exam_id,
            questionText: question.question_text,
            questionType: question.question_type,
            points: question.points,
            sortOrder: question.sort_order,
            options: insertedOptions
        });
    } catch (err) {
        console.error('Create Question Error:', err);
        res.status(500).json({ error: 'Server error creating question.' });
    }
});

// ============================================
// PATCH /api/questions/:id — Update a question
// ============================================
router.patch('/questions/:id', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { questionText, questionType, points, sortOrder } = req.body;

        const updates = [];
        const params = [];
        let idx = 1;

        if (questionText) { updates.push(`question_text = $${idx++}`); params.push(questionText); }
        if (questionType) { updates.push(`question_type = $${idx++}`); params.push(questionType); }
        if (points !== undefined) { updates.push(`points = $${idx++}`); params.push(points); }
        if (sortOrder !== undefined) { updates.push(`sort_order = $${idx++}`); params.push(sortOrder); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        params.push(req.params.id);
        const result = await pool.query(
            `UPDATE exam_questions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        res.json({ message: 'Question updated.', question: result.rows[0] });
    } catch (err) {
        console.error('Update Question Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// DELETE /api/questions/:id — Delete a question (cascades to options & answers)
// ============================================
router.delete('/questions/:id', requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM exam_questions WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        res.json({ message: 'Question deleted.' });
    } catch (err) {
        console.error('Delete Question Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Helper for text similarity (Jaccard)
function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const v1 = s1.toLowerCase().trim().split(/\s+/);
    const v2 = s2.toLowerCase().trim().split(/\s+/);
    const set1 = new Set(v1);
    const set2 = new Set(v2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

// ============================================
// POST /api/exams/:examId/answers — Submit answers (student)
// Expects: { answers: [{ questionId, selectedOptionId?, textAnswer? }] }
// ============================================
router.post('/exams/:examId/answers', async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: 'answers array is required.' });
        }

        const results = [];
        let totalScore = 0;

        // Get total points from ALL questions in the exam (not just answered ones)
        const allQuestionsResult = await pool.query(
            'SELECT COALESCE(SUM(points), 0)::int as total_points FROM exam_questions WHERE exam_id = $1',
            [examId]
        );
        const totalPoints = allQuestionsResult.rows[0].total_points;

        for (const ans of answers) {
            let isCorrect = null;

            // For MCQ, auto-grade
            if (ans.selectedOptionId) {
                const optCheck = await pool.query(
                    'SELECT is_correct FROM question_options WHERE id = $1',
                    [ans.selectedOptionId]
                );
                if (optCheck.rows.length > 0) {
                    isCorrect = optCheck.rows[0].is_correct;
                }
            }
            // For Short Answer, auto-grade based on similarity
            else if (ans.textAnswer) {
                const qCheck = await pool.query(
                    'SELECT question_type, model_answer FROM exam_questions WHERE id = $1',
                    [ans.questionId]
                );
                if (qCheck.rows.length > 0 && qCheck.rows[0].question_type === 'short_answer') {
                    const model = qCheck.rows[0].model_answer;
                    if (model) {
                        const similarity = getSimilarity(ans.textAnswer, model);
                        isCorrect = similarity >= 0.6; // 60% threshold
                    }
                }
            }

            // Get question points for scoring
            if (isCorrect) {
                const qResult = await pool.query('SELECT points FROM exam_questions WHERE id = $1', [ans.questionId]);
                if (qResult.rows.length > 0) totalScore += qResult.rows[0].points;
            }

            const result = await pool.query(
                `INSERT INTO student_answers (exam_id, student_id, question_id, selected_option_id, text_answer, is_correct)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (exam_id, student_id, question_id)
                 DO UPDATE SET selected_option_id = $4, text_answer = $5, is_correct = $6
                 RETURNING *`,
                [examId, req.user.id, ans.questionId, ans.selectedOptionId || null, ans.textAnswer || null, isCorrect]
            );
            results.push(result.rows[0]);
        }

        // Update exam_candidates with score
        const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
        let grade = 'Pending';
        if (totalPoints > 0) {
            if (percentage >= 90) grade = 'A+';
            else if (percentage >= 80) grade = 'A';
            else if (percentage >= 70) grade = 'B';
            else if (percentage >= 60) grade = 'C';
            else if (percentage >= 50) grade = 'D';
            else grade = 'F';
        }

        await pool.query(
            `UPDATE exam_candidates SET status = 'Completed', score = $1, grade = $2
             WHERE exam_id = $3 AND student_id = $4`,
            [percentage, grade, examId, req.user.id]
        );

        res.json({
            message: 'Answers submitted.',
            totalScore,
            totalPoints,
            percentage,
            grade,
            answersCount: results.length
        });
    } catch (err) {
        console.error('Submit Answers Error:', err);
        res.status(500).json({ error: 'Server error submitting answers.' });
    }
});

// ============================================
// GET /api/exams/:examId/answers — Get student's answers for an exam
// ============================================
router.get('/exams/:examId/answers', async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

        if (!studentId) {
            return res.status(400).json({ error: 'studentId query param required for non-students.' });
        }

        const result = await pool.query(
            `SELECT sa.*, eq.question_text, eq.question_type, eq.points,
                    qo.option_text as selected_option_text
             FROM student_answers sa
             JOIN exam_questions eq ON sa.question_id = eq.id
             LEFT JOIN question_options qo ON sa.selected_option_id = qo.id
             WHERE sa.exam_id = $1 AND sa.student_id = $2
             ORDER BY eq.sort_order`,
            [examId, studentId]
        );

        res.json(result.rows.map(r => ({
            questionId: r.question_id,
            questionText: r.question_text,
            questionType: r.question_type,
            points: r.points,
            selectedOptionId: r.selected_option_id,
            selectedOptionText: r.selected_option_text,
            textAnswer: r.text_answer,
            isCorrect: r.is_correct
        })));
    } catch (err) {
        console.error('Get Answers Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
