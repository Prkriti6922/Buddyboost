// Create Express routes for user registration and login using PostgreSQL
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// PostgreSQL Pool Configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'buddyboost'
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/users/register
 * Register a new user with email and password
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const userExists = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (email, password, first_name, last_name, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING user_id, email, first_name, last_name',
            [email, hashedPassword, firstName, lastName]
        );

        const user = result.rows[0];

        // Create JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

/**
 * POST /api/users/login
 * Authenticate user with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const result = await pool.query(
            'SELECT user_id, email, password, first_name, last_name FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login timestamp
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                userId: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

/**
 * POST /api/users/logout
 * Logout user (client-side token removal recommended)
 */
router.post('/logout', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * GET /api/users/profile
 * Get current user profile (requires authentication)
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        console.log("Decoded userId from token:", req.userId);
        const result = await pool.query(
            'SELECT user_id, email, first_name, last_name, created_at, last_login FROM users WHERE user_id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result.rows[0];
        res.status(200).json({
            success: true,
            user: {
                user_id: user.user_id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile'
        });
    }
});

/**
 * Middleware: Verify JWT Token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.userId = decoded.userId;
        next();
    });
}

/**
 * DELETE /api/users/delete
 * Fully delete user + posts + reactions + comments
 */
router.delete('/delete', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Delete reactions on user's posts
        await pool.query(`
            DELETE FROM reactions 
            WHERE post_id IN (SELECT post_id FROM posts WHERE user_id = $1)
        `, [userId]);

        // Delete reactions created by the user
        await pool.query(`DELETE FROM reactions WHERE user_id = $1`, [userId]);

        // Delete comments on user's posts
        await pool.query(`
            DELETE FROM comments 
            WHERE post_id IN (SELECT post_id FROM posts WHERE user_id = $1)
        `, [userId]);

        // Delete user's own comments
        await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);

        // Delete user's posts
        await pool.query(`DELETE FROM posts WHERE user_id = $1`, [userId]);

        // Delete user
        await pool.query(`DELETE FROM users WHERE user_id = $1`, [userId]);

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            success: false,
            message: "Server error deleting account"
        });
    }
});

module.exports = router;    