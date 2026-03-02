const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// GET /api/admin/logs — Fetch system logs (Mock Data for Dashboard)
// ============================================
router.get('/logs', requireRole('admin'), async (req, res) => {
    try {
        // In a real application, you might query a logs table or read an audit file.
        // For the dashboard UI overhaul, we'll return structured mock data.
        const mockLogs = [
            { id: 1, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'SUCCESS', message: 'User admin@example.com logged in.', ip: '192.168.1.10' },
            { id: 2, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'INFO', message: 'Exam "Math Finals" created by teacher.', ip: '192.168.1.15' },
            { id: 3, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'WARNING', message: 'Failed login attempt for user john@example.com', ip: '10.0.0.5' },
            { id: 4, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'ERROR', message: 'Database connection timeout during report generation.', ip: 'localhost' },
            { id: 5, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'SUCCESS', message: 'System backup completed successfully.', ip: 'System' }
        ];

        res.json({ logs: mockLogs });
    } catch (err) {
        console.error('Fetch Logs Error:', err);
        res.status(500).json({ error: 'Server error fetching logs.' });
    }
});

module.exports = router;
