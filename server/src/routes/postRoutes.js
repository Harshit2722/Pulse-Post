const express = require('express');
const router = express.Router();
const { createPost, getAllPosts,deletePost,toggleLike } = require('../controllers/postController');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/',getAllPosts); 
router.post('/create', verifyJWT, createPost);
router.delete("/:id",verifyJWT,deletePost);
router.post("/:id/like",verifyJWT,toggleLike);


module.exports = router;
