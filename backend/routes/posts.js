// Express routes for posts with CRUD operations using PostgreSQL
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
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
 * POST /api/posts
 * Create a new post
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, image_url } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    // Insert new post
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, image_url, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING post_id, user_id, content, image_url, created_at, updated_at',
      [req.userId, content, image_url || null]
    );

    const post = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: post.post_id,
        userId: post.user_id,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    });
  }
});

/**
 * GET /api/posts
 * Get all posts with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
          p.post_id,
          p.user_id,
          p.content,
          p.image_url,
          p.created_at,
          p.updated_at,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(r.reaction_id) AS reaction_count
        FROM posts p
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN reactions r ON r.post_id = p.post_id
        GROUP BY p.post_id, u.user_id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM posts`);
    const totalPosts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      posts: result.rows.map(post => ({
        id: post.post_id,
        userId: post.user_id,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        reaction_count: Number(post.reaction_count),  // 🔥 IMPORTANT
        author: {
          firstName: post.first_name,
          lastName: post.last_name,
          email: post.email
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts: totalPosts,
        limit: limit
      }
    });

  } catch (error) {
    console.error("Posts fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching posts"
    });
  }
});


/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT p.post_id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at, u.first_name, u.last_name, u.email FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.post_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = result.rows[0];

    res.status(200).json({
      success: true,
      post: {
        id: post.post_id,
        userId: post.user_id,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          firstName: post.first_name,
          lastName: post.last_name,
          email: post.email
        }
      }
    });
  } catch (error) {
    console.error('Post fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching post'
    });
  }
});

/**
 * PUT /api/posts/:id
 * Update a post (only by owner)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image_url } = req.body;

    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    // Check if post exists and user is owner
    const postCheck = await pool.query(
      'SELECT user_id FROM posts WHERE post_id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (postCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this post'
      });
    }

    // Update post
    const result = await pool.query(
      'UPDATE posts SET content = $1, image_url = $2, updated_at = NOW() WHERE post_id = $3 RETURNING post_id, user_id, content, image_url, created_at, updated_at',
      [content, image_url || null, id]
    );

    const post = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: {
        id: post.post_id,
        userId: post.user_id,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }
    });
  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post'
    });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post (only by owner)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists and user is owner
    const postCheck = await pool.query(
      'SELECT user_id FROM posts WHERE post_id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (postCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this post'
      });
    }

    // Delete associated comments and reactions first
    await pool.query('DELETE FROM reactions WHERE post_id = $1', [id]);
    await pool.query('DELETE FROM comments WHERE post_id = $1', [id]);

    // Delete the post
    await pool.query('DELETE FROM posts WHERE post_id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    });
  }
});

/**
 * GET /api/posts/user/:userId
 * Get all posts by a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT p.post_id, p.user_id, p.content, p.image_url, p.created_at, p.updated_at, u.first_name, u.last_name, u.email FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]);
    const totalPosts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      posts: result.rows.map(post => ({
        id: post.post_id,
        userId: post.user_id,
        content: post.content,
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          firstName: post.first_name,
          lastName: post.last_name,
          email: post.email
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts: totalPosts,
        limit: limit
      }
    });
  } catch (error) {
    console.error('User posts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts'
    });
  }
});

module.exports = router;
