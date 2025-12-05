// Express routes for comments with CRUD operations using PostgreSQL
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
 * POST /api/comments
 * Create a new comment on a post
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { post_id, content } = req.body;

    // Validate input
    if (!post_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and content are required'
      });
    }

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT post_id FROM posts WHERE post_id = $1',
      [post_id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Insert new comment
    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, content, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING comment_id, post_id, user_id, content, created_at, updated_at',
      [post_id, req.userId, content]
    );

    const comment = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: {
        id: comment.comment_id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      }
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating comment'
    });
  }
});

/**
 * GET /api/comments/post/:postId
 * Get all comments for a post
 */
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if post exists
    const postCheck = await pool.query(
      'SELECT post_id FROM posts WHERE post_id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const result = await pool.query(
      'SELECT c.comment_id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at, u.first_name, u.last_name, u.email FROM comments c JOIN users u ON c.user_id = u.user_id WHERE c.post_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
      [postId, limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM comments WHERE post_id = $1', [postId]);
    const totalComments = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      comments: result.rows.map(comment => ({
        id: comment.comment_id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          firstName: comment.first_name,
          lastName: comment.last_name,
          email: comment.email
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments: totalComments,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comments'
    });
  }
});

/**
 * GET /api/comments/:id
 * Get a single comment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT c.comment_id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at, u.first_name, u.last_name, u.email FROM comments c JOIN users u ON c.user_id = u.user_id WHERE c.comment_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = result.rows[0];

    res.status(200).json({
      success: true,
      comment: {
        id: comment.comment_id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          firstName: comment.first_name,
          lastName: comment.last_name,
          email: comment.email
        }
      }
    });
  } catch (error) {
    console.error('Comment fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comment'
    });
  }
});

/**
 * PUT /api/comments/:id
 * Update a comment (only by owner)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const commentCheck = await pool.query(
      'SELECT user_id FROM comments WHERE comment_id = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (commentCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this comment'
      });
    }

    const result = await pool.query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE comment_id = $2 RETURNING comment_id, post_id, user_id, content, created_at, updated_at',
      [content, id]
    );

    const comment = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        id: comment.comment_id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      }
    });
  } catch (error) {
    console.error('Comment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating comment'
    });
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (only by owner)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const commentCheck = await pool.query(
      'SELECT user_id FROM comments WHERE comment_id = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (commentCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this comment'
      });
    }

    await pool.query('DELETE FROM reactions WHERE comment_id = $1', [id]);
    await pool.query('DELETE FROM comments WHERE comment_id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Comment deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    });
  }
});

/**
 * GET /api/comments/user/:userId
 * Get all comments by a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT c.comment_id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at, u.first_name, u.last_name, u.email FROM comments c JOIN users u ON c.user_id = u.user_id WHERE c.user_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM comments WHERE user_id = $1', [userId]);
    const totalComments = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      comments: result.rows.map(comment => ({
        id: comment.comment_id,
        postId: comment.post_id,
        userId: comment.user_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        author: {
          firstName: comment.first_name,
          lastName: comment.last_name,
          email: comment.email
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments: totalComments,
        limit: limit
      }
    });
  } catch (error) {
    console.error('User comments fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user comments'
    });
  }
});

module.exports = router;