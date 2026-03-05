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
// PATCH /api/users/:id — Update user profile
// ============================================
router.patch('/:id', async (req, res) => {
    try {
        // Users can only update their own profile
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const { name, phone, batch, department, photo_url } = req.body;
        const updates = [];
        const params = [];
        let idx = 1;

        if (name) { updates.push(`name = $${idx++}`); params.push(name); }
        if (phone) { updates.push(`phone = $${idx++}`); params.push(phone); }
        if (batch) { updates.push(`batch = $${idx++}`); params.push(batch); }
        if (department) { updates.push(`department = $${idx++}`); params.push(department); }
        if (photo_url) { updates.push(`photo_url = $${idx++}`); params.push(photo_url); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        params.push(req.params.id);
        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const u = result.rows[0];
        res.json({
            message: 'Profile updated.',
            user: {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                specialId: u.special_id,
                batch: u.batch,
                dept: u.department,
                phone: u.phone,
                photo: u.photo_url
            }
        });
    } catch (err) {
        console.error('Update Profile Error:', err);
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

// ============================================
// PATCH /api/users/:id/role — Change user role (Admin only)
// ============================================
router.patch('/:id/role', requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role',
            [role, req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: 'Role updated.', user: result.rows[0] });
    } catch (err) {
        console.error('Update Role Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/users/:id/reset-password — Reset password (Admin only)
// ============================================
router.post('/:id/reset-password', requireRole('admin'), async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ error: 'New password required.' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name',
            [hash, req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: 'Password reset successfully for ' + result.rows[0].name });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/users/admin/logs — System activity logs (Admin only, mock data)
// ============================================
router.get('/admin/logs', requireRole('admin'), async (req, res) => {
    try {
        // Fetch recent real user registrations & status changes as base
        const recentUsers = await pool.query(
            `SELECT name, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 10`
        );

        // Build a mix of real + mock log entries
        const realLogs = recentUsers.rows.map(u => ({
            action: `User Registered`,
            detail: `${u.name} (${u.role})`,
            timestamp: u.created_at,
            status: 'Success',
            icon: 'user-plus'
        }));

        const mockLogs = [
            { action: 'Admin Login', detail: 'admin@exam.com logged in', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), status: 'Success', icon: 'shield' },
            { action: 'Exam Created', detail: '"Final Mathematics Exam" scheduled', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), status: 'Success', icon: 'file-text' },
            { action: 'Failed Login', detail: 'unknown@user.com — 3 attempts', timestamp: new Date(Date.now() - 32 * 60000).toISOString(), status: 'Warning', icon: 'alert-triangle' },
            { action: 'Exam Started', detail: '"Physics Mid-Term" went Live', timestamp: new Date(Date.now() - 55 * 60000).toISOString(), status: 'Success', icon: 'play' },
            { action: 'User Blocked', detail: 'student27@college.edu blocked by admin', timestamp: new Date(Date.now() - 80 * 60000).toISOString(), status: 'Warning', icon: 'user-x' },
            { action: 'Password Reset', detail: 'teacher@school.com reset password', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), status: 'Success', icon: 'key' },
            { action: 'Failed Login', detail: 'brute-force attempt on /auth/login', timestamp: new Date(Date.now() - 150 * 60000).toISOString(), status: 'Danger', icon: 'alert-octagon' },
            { action: 'Exam Submitted', detail: '12 students submitted "Chemistry Quiz"', timestamp: new Date(Date.now() - 200 * 60000).toISOString(), status: 'Success', icon: 'check-circle' },
            { action: 'Group Created', detail: 'Group "Batch 2024-A" added', timestamp: new Date(Date.now() - 250 * 60000).toISOString(), status: 'Success', icon: 'users' },
            { action: 'System Notice', detail: 'Server uptime > 99.9% this month', timestamp: new Date(Date.now() - 300 * 60000).toISOString(), status: 'Info', icon: 'info' },
        ];

        // Merge real + mock, sort by timestamp desc
        const combined = [...mockLogs, ...realLogs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        res.json(combined);
    } catch (err) {
        console.error('Admin Logs Error:', err);
        res.status(500).json({ error: 'Server error fetching logs.' });
    }
});

module.exports = router;

