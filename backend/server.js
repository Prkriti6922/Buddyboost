// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const reactionRoutes = require('./routes/reactions');
const deleteAccountRoutes = require("./routes/deleteAccount");

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use("/api/users/delete", deleteAccountRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('BuddyBoost Backend is Running ');
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
