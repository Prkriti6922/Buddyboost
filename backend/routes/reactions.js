const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

// PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "buddyboost",
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
 * POST /api/reactions
 * Create OR toggle a reaction
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { post_id, reaction_type } = req.body;

    if (!post_id || !reaction_type)
      return res.status(400).json({ success: false, message: "Missing fields" });

    // Check existing reaction
    const existing = await pool.query(
      "SELECT reaction_id, reaction_type FROM reactions WHERE post_id = $1 AND user_id = $2",
      [post_id, req.userId]
    );

    if (existing.rows.length > 0) {
      // If clicking same reaction → remove it ("unlike")
      if (existing.rows[0].reaction_type === reaction_type) {
        await pool.query("DELETE FROM reactions WHERE reaction_id = $1", [
          existing.rows[0].reaction_id,
        ]);

        return res.json({
          success: true,
          message: "Reaction removed",
          removed: true,
        });
      }

      // Otherwise update
      const updated = await pool.query(
        `UPDATE reactions 
         SET reaction_type = $1, created_at = NOW()
         WHERE reaction_id = $2
         RETURNING reaction_id, post_id, user_id, reaction_type`,
        [reaction_type, existing.rows[0].reaction_id]
      );

      return res.json({
        success: true,
        message: "Reaction updated",
        reaction: updated.rows[0],
      });
    }

    // Insert new
    const inserted = await pool.query(
      `INSERT INTO reactions (post_id, user_id, reaction_type, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING reaction_id, post_id, user_id, reaction_type`,
      [post_id, req.userId, reaction_type]
    );

    res.status(201).json({
      success: true,
      message: "Reaction added",
      reaction: inserted.rows[0],
    });
  } catch (err) {
    console.error("Reaction error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
