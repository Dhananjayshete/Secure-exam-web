const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/notifications — Fetch unread notifications for current user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, message, is_read, created_at
             FROM notifications
             WHERE user_id = $1 AND is_read = FALSE
             ORDER BY created_at DESC
             LIMIT 20`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Notifications Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH /api/notifications/:id/read — Mark a notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error('Mark Read Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// PATCH /api/notifications/read-all — Mark all as read
router.patch('/read-all', async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Mark All Read Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
