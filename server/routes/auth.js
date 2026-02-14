const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, specialId } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required.' });
        }

        // 2. Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Generate avatar URL
        const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca`;

        // 5. Insert into DB
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, special_id, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, special_id, status, photo_url, created_at`,
            [name, email, passwordHash, role, specialId || null, photoUrl]
        );

        const user = result.rows[0];

        // 6. Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialId: user.special_id,
                status: user.status,
                photoUrl: user.photo_url
            }
        });
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Validate
        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required.' });
        }

        // 2. Find user by email AND role
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2',
            [email, role]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];

        // 3. Check if user is blocked
        if (user.status === 'Blocked') {
            return res.status(403).json({ error: 'Your account has been blocked. Contact admin.' });
        }

        // 4. Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 5. Create JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialId: user.special_id,
                batch: user.batch,
                department: user.department,
                status: user.status,
                photoUrl: user.photo_url
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// ============================================
// GET /api/auth/me — Get current user profile
// ============================================
const { authMiddleware } = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, special_id, batch, department, status, photo_url, created_at
       FROM users WHERE id = $1`,
            [req.user.id]
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
            department: u.department,
            status: u.status,
            photoUrl: u.photo_url,
            createdAt: u.created_at
        });
    } catch (err) {
        console.error('Get Profile Error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
