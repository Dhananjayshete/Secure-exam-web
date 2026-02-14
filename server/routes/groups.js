const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// GET /api/groups — List all groups
// ============================================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.*, 
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as member_count,
        u.name as creator_name
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       ORDER BY g.created_at DESC`
        );

        res.json(result.rows.map(g => ({
            id: g.id,
            name: g.name,
            batchYear: g.batch_year,
            memberCount: g.member_count,
            creatorName: g.creator_name,
            createdAt: g.created_at
        })));
    } catch (err) {
        console.error('Get Groups Error:', err);
        res.status(500).json({ error: 'Server error fetching groups.' });
    }
});

// ============================================
// POST /api/groups — Create a group
// ============================================
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { name, batchYear } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required.' });
        }

        const result = await pool.query(
            `INSERT INTO groups (name, batch_year, created_by) VALUES ($1, $2, $3) RETURNING *`,
            [name, batchYear || null, req.user.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create Group Error:', err);
        res.status(500).json({ error: 'Server error creating group.' });
    }
});

// ============================================
// GET /api/groups/:id/members — Get group members
// ============================================
router.get('/:id/members', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.special_id, u.batch, u.department, u.status, u.photo_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
            [req.params.id]
        );

        res.json(result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            specialId: u.special_id,
            batch: u.batch,
            dept: u.department,
            status: u.status,
            photo: u.photo_url
        })));
    } catch (err) {
        console.error('Get Members Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/groups/:id/members — Add members
// ============================================
router.post('/:id/members', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { userIds } = req.body; // Array of user IDs

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds array is required.' });
        }

        // Bulk insert with ON CONFLICT DO NOTHING
        const values = userIds.map((uid, i) => `($1, $${i + 2})`).join(', ');
        const params = [req.params.id, ...userIds];

        await pool.query(
            `INSERT INTO group_members (group_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            params
        );

        res.json({ message: `${userIds.length} member(s) added.` });
    } catch (err) {
        console.error('Add Members Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/groups/:groupId/assign-exam — Assign all group members to an exam
// ============================================
router.post('/:groupId/assign-exam', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { groupId } = req.params;
        const { examId } = req.body;

        if (!examId) {
            return res.status(400).json({ error: 'examId is required.' });
        }

        // Link exam to group
        await pool.query(
            `INSERT INTO exam_groups (exam_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [examId, groupId]
        );

        // Get all group members
        const members = await pool.query(
            'SELECT user_id FROM group_members WHERE group_id = $1',
            [groupId]
        );

        if (members.rows.length === 0) {
            return res.json({ message: 'Group has no members. Exam linked but no candidates added.', candidatesAdded: 0 });
        }

        // Bulk insert into exam_candidates
        const values = members.rows.map((m, i) => `($1, $${i + 2})`).join(', ');
        const params = [examId, ...members.rows.map(m => m.user_id)];

        await pool.query(
            `INSERT INTO exam_candidates (exam_id, student_id) VALUES ${values} ON CONFLICT DO NOTHING`,
            params
        );

        res.json({
            message: `${members.rows.length} member(s) assigned to exam.`,
            candidatesAdded: members.rows.length
        });
    } catch (err) {
        console.error('Assign Exam Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
