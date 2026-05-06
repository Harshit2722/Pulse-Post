const express = require('express');
const router = express.Router();
const { createPost, getAllPosts } = require('../controllers/postController');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/',getAllPosts); 
router.post('/create', verifyJWT, createPost);

module.exports = router;
