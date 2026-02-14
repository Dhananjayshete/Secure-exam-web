const express = require('express');
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================
// POST /api/tickets — Create a support ticket
// ============================================
router.post('/', async (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required.' });
        }

        const result = await pool.query(
            `INSERT INTO support_tickets (user_id, subject, message) 
       VALUES ($1, $2, $3) RETURNING *`,
            [req.user.id, subject, message]
        );

        const ticket = result.rows[0];
        res.status(201).json({
            id: ticket.id,
            subject: ticket.subject,
            message: ticket.message,
            status: ticket.status,
            createdAt: ticket.created_at
        });
    } catch (err) {
        console.error('Create Ticket Error:', err);
        res.status(500).json({ error: 'Server error creating ticket.' });
    }
});

// ============================================
// GET /api/tickets — List tickets
// Admins see all. Others see only their own.
// ============================================
router.get('/', async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'admin') {
            query = `
        SELECT st.*, u.name as user_name, u.email as user_email
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        ORDER BY st.created_at DESC
      `;
            params = [];
        } else {
            query = `
        SELECT * FROM support_tickets 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Tickets Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// PATCH /api/tickets/:id — Resolve a ticket (admin only)
// ============================================
router.patch('/:id', requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE support_tickets SET status = 'Resolved', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        res.json({ message: 'Ticket resolved.', ticket: result.rows[0] });
    } catch (err) {
        console.error('Resolve Ticket Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// POST /api/tickets/:id/replies — Add a reply to a ticket
// ============================================
router.post('/:id/replies', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // Verify ticket exists
        const ticketCheck = await pool.query('SELECT id FROM support_tickets WHERE id = $1', [req.params.id]);
        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        const result = await pool.query(
            `INSERT INTO ticket_replies (ticket_id, user_id, message)
             VALUES ($1, $2, $3) RETURNING *`,
            [req.params.id, req.user.id, message]
        );

        // Update ticket's updated_at
        await pool.query('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [req.params.id]);

        const reply = result.rows[0];
        res.status(201).json({
            id: reply.id,
            ticketId: reply.ticket_id,
            userId: reply.user_id,
            message: reply.message,
            createdAt: reply.created_at
        });
    } catch (err) {
        console.error('Add Reply Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// ============================================
// GET /api/tickets/:id/replies — List replies for a ticket
// ============================================
router.get('/:id/replies', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tr.*, u.name as user_name, u.role as user_role, u.photo_url
             FROM ticket_replies tr
             JOIN users u ON tr.user_id = u.id
             WHERE tr.ticket_id = $1
             ORDER BY tr.created_at ASC`,
            [req.params.id]
        );

        res.json(result.rows.map(r => ({
            id: r.id,
            ticketId: r.ticket_id,
            userId: r.user_id,
            userName: r.user_name,
            userRole: r.user_role,
            userPhoto: r.photo_url,
            message: r.message,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error('Get Replies Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
