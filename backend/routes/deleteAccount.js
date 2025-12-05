const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'buddyboost'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// AUTH
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token)
        return res.status(401).json({ success: false, message: "Token missing" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
            return res.status(403).json({ success: false, message: "Invalid token" });

        req.userId = decoded.userId;
        next();
    });
}

/**
 * DELETE /api/users/delete
 * Deletes:
 * - posts
 * - comments
 * - reactions
 * - user
 */
router.delete("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        await pool.query("BEGIN");

        await pool.query("DELETE FROM reactions WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM comments WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM posts WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

        await pool.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (err) {
        await pool.query("ROLLBACK");
        console.error("Delete account error:", err);
        res.status(500).json({
            success: false,
            message: "Server error deleting account"
        });
    }
});

module.exports = router;
