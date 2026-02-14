const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// ============================================
// GET /api/users — List users (filtered by role)
// ============================================
router.get('/', async (req, res) => {
    try {
        const { role, search, batch, department, status } = req.query;

        let query = 'SELECT id, name, email, role, special_id, batch, department, status, photo_url, created_at FROM users WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (role) {
            query += ` AND role = $${paramIndex++}`;
            params.push(role);
        }

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (batch) {
            query += ` AND batch = $${paramIndex++}`;
            params.push(batch);
        }

        if (department) {
            query += ` AND department = $${paramIndex++}`;
            params.push(department);
        }

        if (search) {
            query += ` AND (name ILIKE $${paramIndex} OR special_id ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            specialId: u.special_id,
            batch: u.batch,
            dept: u.department,
            status: u.status,
            photo: u.photo_url,
            createdAt: u.created_at
        }));

        res.json(users);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ error: 'Server error fetching users.' });
    }
});

// ============================================
// GET /api/users/stats — Counts by role (for charts)
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT role, COUNT(*)::int as count FROM users GROUP BY role`
        );

        const stats = { student: 0, teacher: 0, admin: 0, total: 0 };
        result.rows.forEach(row => {
            stats[row.role] = row.count;
            stats.total += row.count;
        });

        // Monthly registration trend (last 5 months)
        const trendResult = await pool.query(
            `SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*)::int as count
       FROM users
       WHERE created_at > NOW() - INTERVAL '5 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
        );

        res.json({
            counts: stats,
            registrationTrend: trendResult.rows
        });
    } catch (err) {
        console.error('Get Stats Error:', err);
        res.status(500).json({ error: 'Server error fetching stats.' });
    }
});

// ============================================
// GET /api/users/:id — Get single user
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, special_id, batch, department, status, photo_url, created_at
       FROM users WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const u = result.rows[0];
        res.json({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            specialId: u.special_id,
            batch: u.batch,
            dept: u.department,
            status: u.status,
            photo: u.photo_url,
            createdAt: u.created_at
        });
    } catch (err) {
        console.error('Get User Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// PATCH /api/users/:id/status — Update user status
// ============================================
router.patch('/:id/status', requireRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Active', 'Examining', 'Blocked'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Active, Examining, or Blocked.' });
        }

        const result = await pool.query(
            `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, status`,
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'Status updated.', user: result.rows[0] });
    } catch (err) {
        console.error('Update Status Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// PATCH /api/users/:id/password — Update password
// ============================================
const bcrypt = require('bcryptjs');

router.patch('/:id/password', async (req, res) => {
    try {
        // Users can only update their own password
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'You can only change your own password.' });
        }

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old and new passwords are required.' });
        }

        // Verify old password
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.params.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Old password is incorrect.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.params.id]);

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Update Password Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
