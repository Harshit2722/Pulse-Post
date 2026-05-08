const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, deletePost, toggleLike, addComment, incrementViews } = require('../controllers/postController');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/', getAllPosts);
router.post('/create', verifyJWT, createPost);
router.delete("/:id", verifyJWT, deletePost);
router.post("/:id/like", verifyJWT, toggleLike);
router.post("/:id/comment", verifyJWT, addComment);
router.post("/:id/view", incrementViews);

module.exports = router;
